import { useState, useEffect, type FormEvent } from 'react';
import Toast from '../../components/Toast';
import { API_BASE_URL } from '../../config/api';

interface PageContent {
  [key: string]: { id: string; value: string; type: string };
}

interface ContactPageProps {
  previewContent?: PageContent;
}

const ContactPage = ({ previewContent }: ContactPageProps = {}) => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [content, setContent] = useState<PageContent>({});
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (previewContent) {
      setContent(previewContent);
      setPageLoading(false);
      return;
    }

    const loadContent = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/page-content/contact`);
        if (!response.ok) throw new Error('Failed to fetch page content');
        const data = await response.json();
        setContent(data);
      } catch (error) {
        console.error('Error loading page content:', error);
      } finally {
        setPageLoading(false);
      }
    };

    loadContent();
  }, [previewContent]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          message: formData.message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      setToast({
        message: "Message sent successfully! We'll get back to you as soon as possible.",
        type: 'success',
      });
      setFormData({
        title: '',
        message: '',
      });
    } catch (err: any) {
      setToast({
        message: err.message || 'Failed to send message. Please try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-lg'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='mt-8 bg-white px-20 py-16'>
      <div className='mb-12'>
        <h1 className='font-[Open_Sans] text-[40px] font-bold leading-[100%] text-gray-800 mb-6'>
          {content['header_title']?.value || 'Contact Us'}
        </h1>
        <p
          className='font-[Open_Sans] text-[18px] font-normal leading-[150%] text-gray-800 max-w-2xl'
          dangerouslySetInnerHTML={{
            __html:
              content['header_description']?.value ||
              "Have a general inquiry or a request? Use this form to reach out to us. This form is for general inquiries and requests from other organizations that do not require membership. If you're interested in becoming a member organization, please visit our <a href='/register' class='text-[#D54242] underline hover:text-[#b53a3a]'>registration page</a>.",
          }}
        />
      </div>

      <form onSubmit={handleSubmit} className='flex flex-col space-y-8 w-full mx-auto'>
        <div className='flex flex-col space-y-2'>
          <label className='text-base font-semibold text-slate-900'>Subject</label>
          <input
            type='text'
            name='title'
            value={formData.title}
            onChange={handleInputChange}
            required
            disabled={loading}
            placeholder='Enter the subject of your inquiry'
            className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed'
          />
        </div>

        <div className='flex flex-col space-y-2'>
          <label className='text-base font-semibold text-slate-900'>Message</label>
          <textarea
            name='message'
            value={formData.message}
            onChange={handleInputChange}
            required
            disabled={loading}
            rows={8}
            placeholder='Enter your message here...'
            className='box-border w-full px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px] resize-none disabled:bg-gray-100 disabled:cursor-not-allowed'
          />
        </div>

        <div className='flex flex-col items-center'>
          <button
            type='submit'
            disabled={loading}
            className='w-[110px] h-[50px] rounded-[15px] bg-[#D54242] text-white font-semibold hover:bg-[#b53a3a] transition disabled:bg-gray-400 disabled:cursor-not-allowed'
          >
            {loading ? 'Sending...' : 'Submit'}
          </button>
        </div>
      </form>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ContactPage;
