import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import ContentEditor from '../components/ContentEditor';
import ImageUploader from '../components/ImageUploader';
import AdminSidebar from '../../../../components/AdminSidebar';
import Home from '../../../HomePage/Home';

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
  const [content, setContent] = useState<PageContentState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

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
      setError(err.message || 'Failed to load content');
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
      setError(null);
      setSuccessMessage(null);

      const token = await getToken();

      const updates = Object.entries(content).map(([key, item]) => ({
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

      setSuccessMessage('Changes saved successfully!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error saving:', err);
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchContent();
    setSuccessMessage(null);
    setError(null);
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

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <ImageUploader
                label='Image 1'
                currentImageUrl={content['working_image1']?.value}
                onChange={val => handleContentChange('working_image1', val)}
              />
              <ImageUploader
                label='Image 2'
                currentImageUrl={content['working_image2']?.value}
                onChange={val => handleContentChange('working_image2', val)}
              />
              <ImageUploader
                label='Image 3'
                currentImageUrl={content['working_image3']?.value}
                onChange={val => handleContentChange('working_image3', val)}
              />
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
            <h2 className='text-xl font-semibold text-gray-800 mb-4'>How We Work Section</h2>

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
    </div>
  );
};

export default HomePageEdit;
