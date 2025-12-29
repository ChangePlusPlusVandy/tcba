import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useQueryClient } from '@tanstack/react-query';
import ContentEditor from '../components/ContentEditor';
import AdminSidebar from '../../../../components/AdminSidebar';
import Signup from '../../../SignupPage/Signup';
import Toast from '../../../../components/Toast';
import { API_BASE_URL } from '../../../../config/api';

interface ContentItem {
  id: string;
  value: string;
  type: string;
}

interface PageContentState {
  [key: string]: ContentItem;
}

const EmailSignupPageEdit = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState<PageContentState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/page-content/signup`);

      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }

      const data = await response.json();
      setContent(data);
    } catch (err: any) {
      console.error('Error fetching content:', err);
      setToast({ message: err.message || 'Failed to load content', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (key: string, value: string) => {
    setContent({
      ...content,
      [key]: {
        ...content[key],
        value,
      },
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const token = await getToken();

      const updates = Object.entries(content).map(([, item]) => ({
        id: item.id,
        contentValue: item.value,
      }));

      const response = await fetch(`${API_BASE_URL}/api/page-content/bulk`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      await fetchContent();

      queryClient.invalidateQueries({ queryKey: ['page-content', 'signup'] });

      setToast({ message: 'Changes saved successfully!', type: 'success' });
    } catch (err: any) {
      console.error('Error saving:', err);
      setToast({ message: err.message || 'Failed to save changes', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchContent();
  };

  if (loading) {
    return (
      <div className='flex min-h-screen bg-gray-50'>
        <AdminSidebar />
        <div className='flex-1 flex items-center justify-center'>
          <div className='text-lg'>Loading content...</div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <AdminSidebar />
      <div className='flex-1 p-8'>
        <div className='max-w-4xl mx-auto'>
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>Edit Email Signup Page</h1>
            <p className='text-gray-600'>
              Manage the content displayed on the Email Subscription page
            </p>
          </div>

          <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
            <h2 className='text-xl font-semibold text-gray-800 mb-4'>Page Header</h2>

            <ContentEditor
              label='Page Title'
              value={content['header_title']?.value || ''}
              onChange={val => handleContentChange('header_title', val)}
              type='text'
              placeholder='Subscribe to Email Notifications'
            />

            <ContentEditor
              label='Description'
              value={content['header_description']?.value || ''}
              onChange={val => handleContentChange('header_description', val)}
              type='richtext'
            />
          </div>

          <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
            <h2 className='text-xl font-semibold text-gray-800 mb-4'>Success Message</h2>

            <ContentEditor
              label='Success Title'
              value={content['success_title']?.value || ''}
              onChange={val => handleContentChange('success_title', val)}
              type='text'
              placeholder='Form submitted!'
            />

            <ContentEditor
              label='Success Message'
              value={content['success_message']?.value || ''}
              onChange={val => handleContentChange('success_message', val)}
              type='richtext'
            />
          </div>

          <div className='flex justify-end space-x-4 mt-8'>
            <button
              onClick={handleReset}
              disabled={saving}
              className='px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50'
            >
              Reset
            </button>
            <button
              onClick={() => setShowPreview(true)}
              disabled={saving}
              className='px-6 py-2 border border-[#D54242] text-[#D54242] rounded-md hover:bg-[#D54242] hover:text-white transition disabled:opacity-50'
            >
              Preview
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className='px-6 py-2 bg-[#D54242] text-white rounded-md hover:bg-[#b53a3a] disabled:opacity-50'
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {showPreview && (
            <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4'>
              <div className='bg-white rounded-lg w-full h-full overflow-hidden flex flex-col'>
                <div className='flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10'>
                  <h2 className='text-xl font-bold text-gray-900'>Preview: Email Signup Page</h2>
                  <button
                    onClick={() => setShowPreview(false)}
                    className='text-gray-500 hover:text-gray-700'
                  >
                    <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M6 18L18 6M6 6l12 12'
                      />
                    </svg>
                  </button>
                </div>
                <div className='overflow-y-auto overflow-x-hidden flex-1 bg-white'>
                  <Signup previewContent={content} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default EmailSignupPageEdit;
