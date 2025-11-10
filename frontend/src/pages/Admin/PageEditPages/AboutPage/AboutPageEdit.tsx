import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import ContentEditor from '../components/ContentEditor';
import ImageUploader from '../components/ImageUploader';
import AdminSidebar from '../../../../components/AdminSidebar';
import About from '../../../AboutPage/About';

interface ContentItem {
  id: string;
  value: string;
  type: string;
}

interface PageContentState {
  [key: string]: ContentItem;
}

const AboutPageEdit = () => {
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
      const response = await fetch(`${API_BASE_URL}/api/page-content/about`);

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
    setContent(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        value,
      },
    }));
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

      setSuccessMessage('Changes saved successfully!');
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
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>Edit About Page</h1>
            <p className='text-gray-600'>Manage the content displayed on the About page</p>
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
            <h2 className='text-xl font-semibold text-gray-800 mb-4'>Mission Section</h2>

            <ContentEditor
              label='Title'
              value={content['mission_title']?.value || ''}
              onChange={val => handleContentChange('mission_title', val)}
              type='text'
              placeholder='The Mission'
            />

            <ContentEditor
              label='Description'
              value={content['mission_description']?.value || ''}
              onChange={val => handleContentChange('mission_description', val)}
              type='richtext'
            />

            <ImageUploader
              label='Mission Image'
              currentImageUrl={content['mission_image']?.value}
              onChange={val => handleContentChange('mission_image', val)}
            />
          </div>

          <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
            <h2 className='text-xl font-semibold text-gray-800 mb-4'>Current Priorities Section</h2>

            <ContentEditor
              label='Section Title'
              value={content['priorities_title']?.value || ''}
              onChange={val => handleContentChange('priorities_title', val)}
              type='text'
            />

            <ContentEditor
              label='Learn More Button Text'
              value={content['priorities_button_text']?.value || ''}
              onChange={val => handleContentChange('priorities_button_text', val)}
              type='text'
              placeholder='Learn more about our advocacy'
            />

            {[1, 2, 3, 4].map(num => (
              <div key={num}>
                <ContentEditor
                  label={`Title ${num}`}
                  value={content[`priority${num}_title`]?.value || ''}
                  onChange={val => handleContentChange(`priority${num}_title`, val)}
                  type='text'
                />
                <ContentEditor
                  label={`Description ${num}`}
                  value={content[`priority${num}_desc`]?.value || ''}
                  onChange={val => handleContentChange(`priority${num}_desc`, val)}
                  type='richtext'
                />
              </div>
            ))}
          </div>

          <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
            <h2 className='text-xl font-semibold text-gray-800 mb-4'>TCBA Officers Section</h2>

            <ContentEditor
              label='Section Title'
              value={content['officers_title']?.value || ''}
              onChange={val => handleContentChange('officers_title', val)}
              type='text'
              placeholder='TCBA Officers'
            />

            <ContentEditor
              label='Co-Chair 1'
              value={content['officers_cochair1']?.value || ''}
              onChange={val => handleContentChange('officers_cochair1', val)}
              type='richtext'
            />

            <ContentEditor
              label='Co-Chair 2'
              value={content['officers_cochair2']?.value || ''}
              onChange={val => handleContentChange('officers_cochair2', val)}
              type='richtext'
            />

            <ContentEditor
              label='Secretary'
              value={content['officers_secretary']?.value || ''}
              onChange={val => handleContentChange('officers_secretary', val)}
              type='richtext'
            />

            <ContentEditor
              label='Join Button Text'
              value={content['officers_button_text']?.value || ''}
              onChange={val => handleContentChange('officers_button_text', val)}
              type='text'
              placeholder='Join us'
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
            <div className='fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-30 p-4'>
              <div className='bg-white rounded-lg w-full h-full overflow-hidden flex flex-col'>
                <div className='flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10'>
                  <h2 className='text-xl font-bold text-gray-900'>Preview: About Page</h2>
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
                  <About previewContent={content} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AboutPageEdit;
