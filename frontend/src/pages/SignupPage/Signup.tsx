import { type FormEvent, useState, useEffect } from 'react';

interface PageContent {
  [key: string]: { id: string; value: string; type: string };
}

interface SignupPageProps {
  previewContent?: PageContent;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

const SignupPage = ({ previewContent }: SignupPageProps = {}) => {
  return (
    <div>
      <SignupForm previewContent={previewContent} />
    </div>
  );
};

interface SignupFormProps {
  previewContent?: PageContent;
}

const SignupForm = ({ previewContent }: SignupFormProps = {}) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [announcements, setAnnouncements] = useState(false);
  const [blogs, setBlogs] = useState(false);
  const [content, setContent] = useState<PageContent>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (previewContent) {
      setContent(previewContent);
      setLoading(false);
      return;
    }

    const loadContent = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/page-content/signup`);
        if (!response.ok) throw new Error('Failed to fetch page content');
        const data = await response.json();
        setContent(data);
      } catch (error) {
        console.error('Error loading page content:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [previewContent]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    console.log('Form submitted!', { announcements, blogs });
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-lg'>Loading...</div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className='w-full flex flex-col items-center justify-center text-center min-h-screen mt-8 bg-white px-20 py-16'>
        <div className='bg-gray-300 h-40 w-40 flex items-center justify-center mb-6'>
          <span className='text-gray-500'></span>
        </div>
        <h1 className='font-[Open_Sans] text-[40px] font-bold leading-[100%] text-gray-800 mb-6'>
          {content['success_title']?.value || 'Form submitted!'}
        </h1>
        <div
          className='font-[Open_Sans] text-[18px] font-normal leading-[150%] text-gray-800 text-center max-w-2xl mb-6'
          dangerouslySetInnerHTML={{
            __html:
              content['success_message']?.value ||
              'The Tennessee Coalition for Better Aging exists to promote the general welfare of older Tennesseans and their families through partnerships that mobilize resources to educate and advocate for important policies and programs.',
          }}
        />
      </div>
    );
  }

  return (
    <div className='mt-8 bg-white px-20 py-16'>
      <div className='grid md:grid-cols-2 gap-8 mb-12'>
        <div>
          <h1 className='font-[Open_Sans] text-[40px] font-bold leading-[100%] text-gray-800 mb-6'>
            {content['header_title']?.value || 'Subscribe to Email Notifications'}
          </h1>

          <div
            className='font-[Open_Sans] text-[18px] font-normal leading-[150%] text-gray-800 mb-6'
            dangerouslySetInnerHTML={{
              __html:
                content['header_description']?.value ||
                'Please fill out this form to be notified of our latest posts and service updates. The Tennessee Coalition for Better Aging exists to promote the general welfare of older Tennesseans and their families through partnerships that mobilize resources to educate and advocate for important policies and programs.',
            }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className='flex flex-col space-y-8 w-full mx-auto'>
        <label className='text-base font-semibold text-gray-800 mb-2'>Name</label>
        <div className='flex gap-4'>
          <input
            type='text'
            required
            placeholder='First name'
            className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px]'
          />

          <input
            type='text'
            required
            placeholder='Last name'
            className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px]'
          />
        </div>

        <div className='flex flex-col space-y-2'>
          <label className='text-base font-semibold text-gray-800'>Email Address</label>
          <input
            type='email'
            required
            placeholder='example@example.com'
            className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px]'
          />
        </div>

        <div className='flex flex-col space-y-4'>
          <label className='text-base font-semibold text-gray-800'>Subscribe to:</label>
          <div className='flex items-center space-x-3'>
            <input
              type='checkbox'
              id='announcements'
              checked={announcements}
              onChange={e => setAnnouncements(e.target.checked)}
              className='w-5 h-5 text-[#D54242] border-gray-500 rounded focus:ring-[#D54242]'
            />
            <label htmlFor='announcements' className='cursor-pointer'>
              Announcements
            </label>
          </div>
          <div className='flex items-center space-x-3'>
            <input
              type='checkbox'
              id='blogs'
              checked={blogs}
              onChange={e => setBlogs(e.target.checked)}
              className='w-5 h-5 text-[#D54242] border-gray-500 rounded focus:ring-[#D54242]'
            />
            <label htmlFor='blogs' className='cursor-pointer'>
              Blogs
            </label>
          </div>
        </div>

        <div className='flex flex-col items-center'>
          <button
            type='submit'
            className='w-[110px] h-[50px] rounded-[15px] bg-[#D54242] text-white hover:bg-[#b53a3a] transition'
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default SignupPage;
