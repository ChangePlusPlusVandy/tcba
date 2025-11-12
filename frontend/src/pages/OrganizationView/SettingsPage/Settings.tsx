import { useState, useEffect } from 'react';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import OrganizationSidebar from '../../../components/OrganizationSidebar';

interface Organization {
  id: string;
  name: string;
  notifyAnnouncements: boolean;
  notifySurveys: boolean;
  notifyAlerts: boolean;
  notifyBlogs: boolean;
}

const OrgSettingsPage = () => {
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const [notificationSettings, setNotificationSettings] = useState({
    notifyAnnouncements: true,
    notifySurveys: true,
    notifyAlerts: true,
    notifyBlogs: true,
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

  useEffect(() => {
    fetchOrganizationSettings();
  }, []);

  const fetchOrganizationSettings = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const response = await fetch(`${API_BASE_URL}/api/organizations/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch organization settings');
      }

      const data = await response.json();
      setOrganization(data);

      setNotificationSettings({
        notifyAnnouncements: data.notifyAnnouncements ?? true,
        notifySurveys: data.notifySurveys ?? true,
        notifyAlerts: data.notifyAlerts ?? true,
        notifyBlogs: data.notifyBlogs ?? true,
      });
    } catch (err: any) {
      console.error('Error fetching organization settings:', err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const token = await getToken();

      const response = await fetch(`${API_BASE_URL}/api/organizations/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(notificationSettings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update settings');
      }

      const updatedData = await response.json();
      setOrganization(updatedData);
      setSuccessMessage('Settings updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error updating settings:', err);
      setError(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivateAccount = async () => {
    try {
      setDeactivating(true);
      const token = await getToken();

      const response = await fetch(`${API_BASE_URL}/api/organizations/profile/deactivate`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to deactivate account');
      }

      await signOut();
      navigate('/');
    } catch (err: any) {
      console.error('Error deactivating account:', err);
      setError(err.message || 'Failed to deactivate account');
      setDeactivating(false);
      setShowDeactivateModal(false);
    }
  };

  if (loading) {
    return (
      <div className='flex min-h-screen bg-gray-50'>
        <OrganizationSidebar />
        <div className='flex-1 flex items-center justify-center'>
          <div className='text-lg'>Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <OrganizationSidebar />
      <div className='flex-1 p-8'>
        <div className='max-w-6xl mx-auto'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>Settings</h1>
          <p className='text-gray-600 mb-8'>Manage your notification preferences and account</p>

          {successMessage && (
            <div className='mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md'>
              {successMessage}
            </div>
          )}

          {error && (
            <div className='mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md'>
              {error}
            </div>
          )}

          <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
            <h2 className='text-xl font-semibold text-gray-800 mb-2'>Notification Preferences</h2>
            <p className='text-sm text-gray-600 mb-4'>
              Choose which email notifications you'd like to receive
            </p>

            <div className='space-y-4'>
              <label className='flex items-center gap-3 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={notificationSettings.notifyAnnouncements}
                  onChange={() => handleNotificationChange('notifyAnnouncements')}
                  className='w-5 h-5 text-[#D54242] border-gray-300 rounded focus:ring-[#D54242] focus:ring-2'
                />
                <div>
                  <div className='font-medium text-gray-900'>Announcements</div>
                  <div className='text-sm text-gray-500'>
                    Receive notifications about new announcements
                  </div>
                </div>
              </label>

              <label className='flex items-center gap-3 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={notificationSettings.notifySurveys}
                  onChange={() => handleNotificationChange('notifySurveys')}
                  className='w-5 h-5 text-[#D54242] border-gray-300 rounded focus:ring-[#D54242] focus:ring-2'
                />
                <div>
                  <div className='font-medium text-gray-900'>Surveys</div>
                  <div className='text-sm text-gray-500'>
                    Receive notifications about new surveys
                  </div>
                </div>
              </label>

              <label className='flex items-center gap-3 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={notificationSettings.notifyAlerts}
                  onChange={() => handleNotificationChange('notifyAlerts')}
                  className='w-5 h-5 text-[#D54242] border-gray-300 rounded focus:ring-[#D54242] focus:ring-2'
                />
                <div>
                  <div className='font-medium text-gray-900'>Alerts</div>
                  <div className='text-sm text-gray-500'>
                    Receive notifications about important alerts
                  </div>
                </div>
              </label>

              <label className='flex items-center gap-3 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={notificationSettings.notifyBlogs}
                  onChange={() => handleNotificationChange('notifyBlogs')}
                  className='w-5 h-5 text-[#D54242] border-gray-300 rounded focus:ring-[#D54242] focus:ring-2'
                />
                <div>
                  <div className='font-medium text-gray-900'>Blog Posts</div>
                  <div className='text-sm text-gray-500'>
                    Receive notifications about new blog posts
                  </div>
                </div>
              </label>
            </div>

            <div className='mt-6 flex justify-end'>
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className='px-6 py-2 bg-[#D54242] text-white rounded-md hover:bg-[#b53a3a] disabled:opacity-50'
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-md p-6 border-l-4 border-[#D54242]'>
            <h2 className='text-xl font-semibold text-gray-800 mb-2'>Danger Zone</h2>
            <p className='text-sm text-gray-600 mb-4'>
              Permanently delete your organization account and all associated data
            </p>

            <div className='bg-red-50 border border-red-200 rounded-md p-4 mb-4'>
              <h3 className='font-semibold text-red-900 mb-2'>This action cannot be undone</h3>
              <p className='text-sm text-red-700'>Deactivating your account will:</p>
              <ul className='list-disc list-inside text-sm text-red-700 mt-2 space-y-1'>
                <li>Permanently delete your organization profile</li>
                <li>Remove all survey responses</li>
                <li>Delete your authentication account</li>
                <li>Remove you from all coalition communications</li>
              </ul>
            </div>

            <button
              onClick={() => setShowDeactivateModal(true)}
              className='px-6 py-2 bg-[#D54242] text-white rounded-md hover:bg-[#b53a3a] transition'
            >
              Deactivate Account
            </button>
          </div>
        </div>
      </div>

      {showDeactivateModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4'>
          <div className='bg-white rounded-lg max-w-md w-full p-6'>
            <h2 className='text-2xl font-bold text-gray-900 mb-4'>Are You Sure?</h2>
            <p className='text-gray-700 mb-6'>
              This will permanently delete your organization account from the coalition and delete
              all associated data. To join again, reapplication will be required and admission is
              not guaranteed.
            </p>

            <div className='flex justify-end gap-3'>
              <button
                onClick={() => setShowDeactivateModal(false)}
                disabled={deactivating}
                className='px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivateAccount}
                disabled={deactivating}
                className='px-4 py-2 bg-[#D54242] text-white rounded-md hover:bg-[#b53a3a] disabled:opacity-50'
              >
                {deactivating ? 'Deactivating...' : 'Yes, Deactivate My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgSettingsPage;
