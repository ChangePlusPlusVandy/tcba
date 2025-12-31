import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useQueryClient } from '@tanstack/react-query';
import { MutatingDots } from 'react-loader-spinner';
import ContentEditor from '../components/ContentEditor';
import ImageUploader from '../components/ImageUploader';
import AdminSidebar from '../../../../components/AdminSidebar';
import Register from '../../../RegisterPage/Register';
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

const RegisterPageEdit = () => {
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
      const response = await fetch(`${API_BASE_URL}/api/page-content/register`);

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

      queryClient.invalidateQueries({ queryKey: ['page-content', 'register'] });

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
          <MutatingDots
            visible={true}
            height='100'
            width='100'
            color='#D54242'
            secondaryColor='#D54242'
            radius='12.5'
            ariaLabel='mutating-dots-loading'
          />
        </div>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <AdminSidebar />
      <div className='flex-1 p-8'>
        <div className='max-w-6xl mx-auto'>
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>Edit Get Involved Page</h1>
            <p className='text-gray-600'>
              Manage the content displayed on the Get Involved (Register) page
            </p>
          </div>

          <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
            <h2 className='text-xl font-semibold text-gray-800 mb-4'>Hero Section</h2>

            <ContentEditor
              label='Page Title'
              value={content['hero_title']?.value || ''}
              onChange={val => handleContentChange('hero_title', val)}
              type='text'
              placeholder='Get Involved'
            />

            <ContentEditor
              label='Bullet Point 1'
              value={content['hero_bullet1']?.value || ''}
              onChange={val => handleContentChange('hero_bullet1', val)}
              type='text'
            />

            <ContentEditor
              label='Bullet Point 2'
              value={content['hero_bullet2']?.value || ''}
              onChange={val => handleContentChange('hero_bullet2', val)}
              type='text'
            />

            <ContentEditor
              label='Bullet Point 3'
              value={content['hero_bullet3']?.value || ''}
              onChange={val => handleContentChange('hero_bullet3', val)}
              type='text'
            />

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <ContentEditor
                label='Join Coalition Button'
                value={content['hero_join_button']?.value || ''}
                onChange={val => handleContentChange('hero_join_button', val)}
                type='text'
                placeholder='Join the Coalition'
              />

              <ContentEditor
                label='Subscribe Button'
                value={content['hero_subscribe_button']?.value || ''}
                onChange={val => handleContentChange('hero_subscribe_button', val)}
                type='text'
                placeholder='Subscribe to Emails'
              />

              <ContentEditor
                label='Contact Button'
                value={content['hero_contact_button']?.value || ''}
                onChange={val => handleContentChange('hero_contact_button', val)}
                type='text'
                placeholder='Contact Us'
              />
            </div>

            <ImageUploader
              label='Hero Image'
              currentImageUrl={content['hero_image']?.value}
              onChange={val => handleContentChange('hero_image', val)}
              folder='pages/getinvolved'
            />
          </div>

          <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
            <h2 className='text-xl font-semibold text-gray-800 mb-4'>Membership Information</h2>

            <ContentEditor
              label='Section Title'
              value={content['membership_title']?.value || ''}
              onChange={val => handleContentChange('membership_title', val)}
              type='text'
              placeholder='Membership Information'
            />

            <ContentEditor
              label='Title 1'
              value={content['eligibility_title']?.value || ''}
              onChange={val => handleContentChange('eligibility_title', val)}
              type='text'
            />

            <ContentEditor
              label='Paragraph 1'
              value={content['eligibility_para1']?.value || ''}
              onChange={val => handleContentChange('eligibility_para1', val)}
              type='richtext'
            />

            <ContentEditor
              label='Paragraph 2'
              value={content['eligibility_para2']?.value || ''}
              onChange={val => handleContentChange('eligibility_para2', val)}
              type='richtext'
            />

            <ContentEditor
              label='Title 2'
              value={content['requirements_title']?.value || ''}
              onChange={val => handleContentChange('requirements_title', val)}
              type='text'
            />

            <ContentEditor
              label='Paragraph 3'
              value={content['requirements_para1']?.value || ''}
              onChange={val => handleContentChange('requirements_para1', val)}
              type='richtext'
            />

            <ContentEditor
              label='Paragraph 4'
              value={content['requirements_para2']?.value || ''}
              onChange={val => handleContentChange('requirements_para2', val)}
              type='richtext'
            />

            <ContentEditor
              label='Form Description Text'
              value={content['form_description']?.value || ''}
              onChange={val => handleContentChange('form_description', val)}
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
                  <h2 className='text-xl font-bold text-gray-900'>Preview: Get Involved Page</h2>
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
                  <Register previewContent={content} />
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

export default RegisterPageEdit;
