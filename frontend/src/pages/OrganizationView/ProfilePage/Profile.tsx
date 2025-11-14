import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import OrganizationSidebar from '../../../components/OrganizationSidebar';
import Toast from '../../../components/Toast';

interface Tag {
  id: string;
  name: string;
}

interface Organization {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  description: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  latitude: number | null;
  longitude: number | null;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  secondaryContactName: string | null;
  secondaryContactEmail: string | null;
  region: 'EAST' | 'MIDDLE' | 'WEST' | null;
  organizationType: string | null;
  organizationSize: 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA_LARGE' | null;
  tags: string[];
  membershipActive: boolean;
  membershipDate: string | null;
  membershipRenewalDate: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const ProfilePage = () => {
  const { getToken } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    secondaryContactName: '',
    secondaryContactEmail: '',
    region: '' as 'EAST' | 'MIDDLE' | 'WEST' | '',
    organizationType: '',
    organizationSize: '' as 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA_LARGE' | '',
    tags: [] as string[],
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

  useEffect(() => {
    fetchOrganizationData();
    fetchTags();
  }, []);

  const fetchOrganizationData = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const response = await fetch(`${API_BASE_URL}/api/organizations/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch organization data');
      }

      const data = await response.json();
      setOrganization(data);

      setFormData({
        name: data.name || '',
        description: data.description || '',
        website: data.website || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zipCode: data.zipCode || '',
        primaryContactName: data.primaryContactName || '',
        primaryContactEmail: data.primaryContactEmail || '',
        primaryContactPhone: data.primaryContactPhone || '',
        secondaryContactName: data.secondaryContactName || '',
        secondaryContactEmail: data.secondaryContactEmail || '',
        region: data.region || '',
        organizationType: data.organizationType || '',
        organizationSize: data.organizationSize || '',
        tags: data.tags || [],
      });
    } catch (err: any) {
      console.error('Error fetching organization data:', err);
      setToast({ message: err.message || 'Failed to load organization data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tags`);
      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }
      const data = await response.json();
      setAvailableTags(data);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagToggle = (tagName: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagName)
        ? prev.tags.filter(t => t !== tagName)
        : [...prev.tags, tagName],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      const token = await getToken();

      const response = await fetch(`${API_BASE_URL}/api/organizations/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update organization');
      }

      const updatedData = await response.json();
      setOrganization(updatedData);
      setToast({ message: 'Organization profile updated successfully!', type: 'success' });
    } catch (err: any) {
      console.error('Error updating organization:', err);
      setToast({ message: err.message || 'Failed to update organization', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='flex min-h-screen bg-gray-50'>
        <OrganizationSidebar />
        <div className='flex-1 flex items-center justify-center'>
          <div className='text-lg'>Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <OrganizationSidebar />
      <div className='flex-1 p-8'>
        <div className='max-w-6xl mx-auto'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>Organization Profile</h1>
          <p className='text-gray-600 mb-8'>
            Manage your organization's information and preferences
          </p>

          <form onSubmit={handleSubmit}>
            <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
              <h2 className='text-xl font-semibold text-gray-800 mb-4'>Basic Information</h2>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Organization Name <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='name'
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D54242]'
                  />
                </div>

                <div className='col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Description
                  </label>
                  <textarea
                    name='description'
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D54242]'
                    placeholder='Tell us about your organization...'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Website</label>
                  <input
                    type='url'
                    name='website'
                    value={formData.website}
                    onChange={handleInputChange}
                    className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D54242]'
                    placeholder='https://example.org'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Organization Type
                  </label>
                  <input
                    type='text'
                    name='organizationType'
                    value={formData.organizationType}
                    onChange={handleInputChange}
                    className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D54242]'
                    placeholder='e.g., Non-profit, Healthcare, Education'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Organization Size
                  </label>
                  <select
                    name='organizationSize'
                    value={formData.organizationSize}
                    onChange={handleInputChange}
                    className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D54242]'
                  >
                    <option value=''>Select size</option>
                    <option value='SMALL'>Small (1-50 employees)</option>
                    <option value='MEDIUM'>Medium (51-200 employees)</option>
                    <option value='LARGE'>Large (201-1000 employees)</option>
                    <option value='EXTRA_LARGE'>Extra Large (1000+ employees)</option>
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Region</label>
                  <select
                    name='region'
                    value={formData.region}
                    onChange={handleInputChange}
                    className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D54242]'
                  >
                    <option value=''>Select region</option>
                    <option value='EAST'>East Tennessee</option>
                    <option value='MIDDLE'>Middle Tennessee</option>
                    <option value='WEST'>West Tennessee</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
              <h2 className='text-xl font-semibold text-gray-800 mb-4'>Address Information</h2>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Street Address
                  </label>
                  <input
                    type='text'
                    name='address'
                    value={formData.address}
                    onChange={handleInputChange}
                    className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D54242]'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>City</label>
                  <input
                    type='text'
                    name='city'
                    value={formData.city}
                    onChange={handleInputChange}
                    className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D54242]'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>State</label>
                  <input
                    type='text'
                    name='state'
                    value={formData.state}
                    onChange={handleInputChange}
                    className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D54242]'
                    placeholder='TN'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Zip Code</label>
                  <input
                    type='text'
                    name='zipCode'
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D54242]'
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
              <h2 className='text-xl font-semibold text-gray-800 mb-4'>Contact Information</h2>

              <h3 className='text-lg font-medium text-gray-700 mb-3'>Primary Contact</h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Name <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='primaryContactName'
                    value={formData.primaryContactName}
                    onChange={handleInputChange}
                    required
                    className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D54242]'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Email <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='email'
                    name='primaryContactEmail'
                    value={formData.primaryContactEmail}
                    onChange={handleInputChange}
                    required
                    className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D54242]'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Phone <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='tel'
                    name='primaryContactPhone'
                    value={formData.primaryContactPhone}
                    onChange={handleInputChange}
                    required
                    className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D54242]'
                  />
                </div>
              </div>

              <h3 className='text-lg font-medium text-gray-700 mb-3'>Secondary Contact</h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Name</label>
                  <input
                    type='text'
                    name='secondaryContactName'
                    value={formData.secondaryContactName}
                    onChange={handleInputChange}
                    className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D54242]'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Email</label>
                  <input
                    type='email'
                    name='secondaryContactEmail'
                    value={formData.secondaryContactEmail}
                    onChange={handleInputChange}
                    className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D54242]'
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
              <h2 className='text-xl font-semibold text-gray-800 mb-2'>Tags</h2>
              <p className='text-sm text-gray-600 mb-4'>
                Select tags that describe your organization's focus areas. This helps you receive
                relevant announcements and updates.
              </p>

              <div className='flex flex-wrap gap-2'>
                {availableTags.map(tag => (
                  <button
                    key={tag.id}
                    type='button'
                    onClick={() => handleTagToggle(tag.name)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      formData.tags.includes(tag.name)
                        ? 'bg-[#D54242] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>

              {formData.tags.length === 0 && (
                <p className='text-sm text-gray-500 mt-3 italic'>No tags selected</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className='flex justify-end space-x-4'>
              <button
                type='button'
                onClick={fetchOrganizationData}
                disabled={saving}
                className='px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50'
              >
                Reset
              </button>
              <button
                type='submit'
                disabled={saving}
                className='px-6 py-2 bg-[#D54242] text-white rounded-md hover:bg-[#b53a3a] disabled:opacity-50'
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ProfilePage;
