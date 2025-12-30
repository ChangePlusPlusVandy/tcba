import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useQueryClient } from '@tanstack/react-query';
import ContentEditor from '../components/ContentEditor';
import ImageUploader from '../components/ImageUploader';
import AdminSidebar from '../../../../components/AdminSidebar';
import Home from '../../../HomePage/Home';
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

const HomePageEdit = () => {
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
      const response = await fetch(`${API_BASE_URL}/api/page-content/home`);

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

  const handleContentChange = (key: string, value: string, type?: string) => {
    setContent({
      ...content,
      [key]: {
        ...content[key],
        value,
        type: type || content[key]?.type || 'text',
      },
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const token = await getToken();
      const existingItems: any[] = [];
      const newItems: any[] = [];

      Object.entries(content).forEach(([key, item]) => {
        if (item.id) {
          existingItems.push({
            id: item.id,
            contentValue: item.value,
          });
        } else if (item.value) {
          const parts = key.split('_');
          const section = parts[0];
          const contentKey = parts.slice(1).join('_');

          newItems.push({
            page: 'home',
            section,
            contentKey,
            contentValue: item.value,
            contentType: item.type || 'text',
          });
        }
      });

      for (const newItem of newItems) {
        const createResponse = await fetch(`${API_BASE_URL}/api/page-content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newItem),
        });

        if (!createResponse.ok) {
          throw new Error(`Failed to create ${newItem.contentKey}`);
        }
      }

      if (existingItems.length > 0) {
        const response = await fetch(`${API_BASE_URL}/api/page-content/bulk`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ updates: existingItems }),
        });

        if (!response.ok) {
          throw new Error('Failed to save changes');
        }
      }

      await fetchContent();

      queryClient.invalidateQueries({ queryKey: ['page-content', 'home'] });

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
        <div className='max-w-6xl mx-auto'>
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>Edit Home Page</h1>
            <p className='text-gray-600'>Manage the content displayed on the homepage</p>
          </div>

          <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
            <h2 className='text-xl font-semibold text-gray-800 mb-4'>Hero Section</h2>

            <ContentEditor
              label='Title'
              value={content['hero_title']?.value || ''}
              onChange={val => handleContentChange('hero_title', val)}
              type='text'
              placeholder='Tennessee Coalition for Better Aging'
            />

            <ContentEditor
              label='Description'
              value={content['hero_description']?.value || ''}
              onChange={val => handleContentChange('hero_description', val)}
              type='richtext'
              placeholder='Enter hero description...'
            />

            <ContentEditor
              label='Button Text'
              value={content['hero_button_text']?.value || ''}
              onChange={val => handleContentChange('hero_button_text', val)}
              type='text'
              placeholder='Stay Connected'
            />

            <ImageUploader
              label='Hero Background Image'
              currentImageUrl={content['hero_image']?.value}
              onChange={val => handleContentChange('hero_image', val)}
              folder='pages/homepage'
            />
          </div>

          <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
            <h2 className='text-xl font-semibold text-gray-800 mb-4'>
              Working Towards a Better Tomorrow Section
            </h2>

            <ContentEditor
              label='Section Title'
              value={content['working_title']?.value || ''}
              onChange={val => handleContentChange('working_title', val)}
              type='text'
              placeholder='Working Towards a Better Tomorrow'
            />

            <ContentEditor
              label='Paragraph 1'
              value={content['working_paragraph1']?.value || ''}
              onChange={val => handleContentChange('working_paragraph1', val)}
              type='richtext'
            />

            <ContentEditor
              label='Paragraph 2'
              value={content['working_paragraph2']?.value || ''}
              onChange={val => handleContentChange('working_paragraph2', val)}
              type='richtext'
            />

            <div className='space-y-6'>
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-gray-700'>Image 1</h3>
                <ImageUploader
                  label='Image'
                  currentImageUrl={content['working_image1']?.value}
                  onChange={val => handleContentChange('working_image1', val)}
                  folder='pages/homepage'
                />
                <ContentEditor
                  label='Hover Text'
                  value={content['working_image1_hover']?.value || ''}
                  onChange={val => handleContentChange('working_image1_hover', val)}
                  type='richtext'
                  placeholder='Enter hover text for image 1...'
                />
              </div>

              <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-gray-700'>Image 2</h3>
                <ImageUploader
                  label='Image'
                  currentImageUrl={content['working_image2']?.value}
                  onChange={val => handleContentChange('working_image2', val)}
                  folder='pages/homepage'
                />
                <ContentEditor
                  label='Hover Text'
                  value={content['working_image2_hover']?.value || ''}
                  onChange={val => handleContentChange('working_image2_hover', val)}
                  type='richtext'
                  placeholder='Enter hover text for image 2...'
                />
              </div>
            </div>

            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-gray-700'>Section 1</h3>
              <ContentEditor
                label='Section Title'
                value={content['working_text_title']?.value || ''}
                onChange={val => handleContentChange('working_text_title', val)}
                type='text'
                placeholder='Our Vision'
              />
              <ContentEditor
                label='Paragraph 1'
                value={content['working_text_paragraph1']?.value || ''}
                onChange={val => handleContentChange('working_text_paragraph1', val)}
                type='richtext'
              />
              <ContentEditor
                label='Paragraph 2'
                value={content['working_text_paragraph2']?.value || ''}
                onChange={val => handleContentChange('working_text_paragraph2', val)}
                type='richtext'
              />
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
            <h2 className='text-xl font-semibold text-gray-800 mb-4'>Section 2</h2>

            <ContentEditor
              label='Quote'
              value={content['how_we_work_quote']?.value || ''}
              onChange={val => handleContentChange('how_we_work_quote', val)}
              type='richtext'
            />

            <ContentEditor
              label='Title 1'
              value={content['how_we_work_partnership_title']?.value || ''}
              onChange={val => handleContentChange('how_we_work_partnership_title', val)}
              type='text'
            />

            <ContentEditor
              label='Description 1'
              value={content['how_we_work_partnership_desc']?.value || ''}
              onChange={val => handleContentChange('how_we_work_partnership_desc', val)}
              type='richtext'
            />

            <ContentEditor
              label='Title 2'
              value={content['how_we_work_advocacy_title']?.value || ''}
              onChange={val => handleContentChange('how_we_work_advocacy_title', val)}
              type='text'
            />

            <ContentEditor
              label='Description 2'
              value={content['how_we_work_advocacy_desc']?.value || ''}
              onChange={val => handleContentChange('how_we_work_advocacy_desc', val)}
              type='richtext'
            />

            <ContentEditor
              label='Title 3'
              value={content['how_we_work_outreach_title']?.value || ''}
              onChange={val => handleContentChange('how_we_work_outreach_title', val)}
              type='text'
            />

            <ContentEditor
              label='Description 3'
              value={content['how_we_work_outreach_desc']?.value || ''}
              onChange={val => handleContentChange('how_we_work_outreach_desc', val)}
              type='richtext'
            />
          </div>

          <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
            <h2 className='text-xl font-semibold text-gray-800 mb-4'>
              Why We Work Together Section
            </h2>

            <ContentEditor
              label='Quote'
              value={content['why_we_work_quote']?.value || ''}
              onChange={val => handleContentChange('why_we_work_quote', val)}
              type='richtext'
            />

            <ContentEditor
              label='Title 1'
              value={content['why_we_work_age_title']?.value || ''}
              onChange={val => handleContentChange('why_we_work_age_title', val)}
              type='text'
            />

            <ContentEditor
              label='Description 1'
              value={content['why_we_work_age_desc']?.value || ''}
              onChange={val => handleContentChange('why_we_work_age_desc', val)}
              type='richtext'
            />

            <ContentEditor
              label='Title 2'
              value={content['why_we_work_ltss_title']?.value || ''}
              onChange={val => handleContentChange('why_we_work_ltss_title', val)}
              type='text'
            />

            <ContentEditor
              label='Description 2'
              value={content['why_we_work_ltss_desc']?.value || ''}
              onChange={val => handleContentChange('why_we_work_ltss_desc', val)}
              type='richtext'
            />

            <ContentEditor
              label='Title 3'
              value={content['why_we_work_caregiver_title']?.value || ''}
              onChange={val => handleContentChange('why_we_work_caregiver_title', val)}
              type='text'
            />

            <ContentEditor
              label='Description 3'
              value={content['why_we_work_caregiver_desc']?.value || ''}
              onChange={val => handleContentChange('why_we_work_caregiver_desc', val)}
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

          {/* Preview Modal */}
          {showPreview && (
            <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4'>
              <div className='bg-white rounded-lg w-full h-full overflow-hidden flex flex-col'>
                <div className='flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10'>
                  <h2 className='text-xl font-bold text-gray-900'>Preview: Home Page</h2>
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
                  <Home previewContent={content} />
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

export default HomePageEdit;
