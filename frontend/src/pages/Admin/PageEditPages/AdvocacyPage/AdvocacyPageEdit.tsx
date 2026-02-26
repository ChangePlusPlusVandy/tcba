import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { MutatingDots } from 'react-loader-spinner';
import ContentEditor from '../components/ContentEditor';
import ImageUploader from '../components/ImageUploader';
import AdminSidebar from '../../../../components/AdminSidebar';
import AdvocacyPage from '../../../AdvocacyPage/Advocacy';
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

const AdvocacyPageEdit = () => {
  const { getToken } = useAuth();
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
      const response = await fetch(`${API_BASE_URL}/api/page-content/advocacy`);

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
            page: 'advocacy',
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
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>Edit Advocacy Page</h1>
            <p className='text-gray-600'>Manage public-facing advocacy text and images</p>
          </div>

          <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
            <h2 className='text-xl font-semibold text-gray-800 mb-4'>Header Section</h2>
            <ContentEditor
              label='Page Title'
              value={content['header_title']?.value || ''}
              onChange={val => handleContentChange('header_title', val, 'text')}
              type='text'
              placeholder='Advocacy'
            />
            <ContentEditor
              label='Description'
              value={content['header_description']?.value || ''}
              onChange={val => handleContentChange('header_description', val, 'richtext')}
              type='richtext'
            />
            <ImageUploader
              label='Header Image'
              currentImageUrl={content['header_image']?.value}
              onChange={val => handleContentChange('header_image', val, 'image')}
              folder='pages/advocacy'
            />
          </div>

          <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
            <h2 className='text-xl font-semibold text-gray-800 mb-4'>Advocacy Focus Section</h2>
            <ContentEditor
              label='Section Title'
              value={content['focus_title']?.value || ''}
              onChange={val => handleContentChange('focus_title', val, 'text')}
              type='text'
            />
            <ContentEditor
              label='Section Description'
              value={content['focus_description']?.value || ''}
              onChange={val => handleContentChange('focus_description', val, 'richtext')}
              type='richtext'
            />
            <ImageUploader
              label='Focus Image'
              currentImageUrl={content['focus_image']?.value}
              onChange={val => handleContentChange('focus_image', val, 'image')}
              folder='pages/advocacy'
            />
          </div>

          <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
            <h2 className='text-xl font-semibold text-gray-800 mb-4'>Feature Cards</h2>
            <ContentEditor
              label='Policy Card Title'
              value={content['cards_policy_title']?.value || ''}
              onChange={val => handleContentChange('cards_policy_title', val, 'text')}
              type='text'
            />
            <ContentEditor
              label='Coalition Card Title'
              value={content['cards_coalition_title']?.value || ''}
              onChange={val => handleContentChange('cards_coalition_title', val, 'text')}
              type='text'
            />
            <ContentEditor
              label='Public Awareness Card Title'
              value={content['cards_public_title']?.value || ''}
              onChange={val => handleContentChange('cards_public_title', val, 'text')}
              type='text'
            />
          </div>

          <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
            <h2 className='text-xl font-semibold text-gray-800 mb-4'>Call To Action</h2>
            <ContentEditor
              label='CTA Title'
              value={content['cta_title']?.value || ''}
              onChange={val => handleContentChange('cta_title', val, 'text')}
              type='text'
            />
            <ContentEditor
              label='CTA Description'
              value={content['cta_description']?.value || ''}
              onChange={val => handleContentChange('cta_description', val, 'richtext')}
              type='richtext'
            />
            <ContentEditor
              label='CTA Button Text'
              value={content['cta_button_text']?.value || ''}
              onChange={val => handleContentChange('cta_button_text', val, 'text')}
              type='text'
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
                  <h2 className='text-xl font-bold text-gray-900'>Preview: Advocacy Page</h2>
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
                  <AdvocacyPage previewContent={content} />
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

export default AdvocacyPageEdit;
