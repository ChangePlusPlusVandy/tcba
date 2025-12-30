import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import Toast from '../../components/Toast';
import { usePageContent } from '../../hooks/queries/usePageContent';
import { API_BASE_URL } from '../../config/api';

interface PageContent {
  [key: string]: { id: string; value: string; type: string };
}

interface ContactPageProps {
  previewContent?: PageContent;
}

const ContactPage = ({ previewContent }: ContactPageProps = {}) => {
  const [formData, setFormData] = useState({
    email: '',
    title: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const { data: pageContent, isLoading: contentLoading } = usePageContent('contact');

  const content = previewContent || pageContent || {};
  const pageLoading = !previewContent && contentLoading;

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
          email: formData.email,
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
        email: '',
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
      <Link
        to='/register'
        className='inline-flex items-center gap-2 text-[#3C3C3C] hover:text-black font-medium mb-6'
      >
        <IoArrowBack size={20} />
        Back to Get Involved
      </Link>
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
          <label className='text-base font-semibold text-slate-900'>
            Your Email <span className='text-red-500'>*</span>
          </label>
          <input
            type='email'
            name='email'
            value={formData.email}
            onChange={handleInputChange}
            required
            disabled={loading}
            placeholder='Enter your email address'
            className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed'
          />
        </div>

        <div className='flex flex-col space-y-2'>
          <label className='text-base font-semibold text-slate-900'>
            Subject <span className='text-red-500'>*</span>
          </label>
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
          <label className='text-base font-semibold text-slate-900'>
            Message <span className='text-red-500'>*</span>
          </label>
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
