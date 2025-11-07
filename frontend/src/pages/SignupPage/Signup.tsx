import { type FormEvent, useState } from 'react';

const SignupPage = () => {
  return (
    <div className='min-h-screen flex'>
      <SignupForm />
    </div>
  );
};

const SignupForm = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [announcements, setAnnouncements] = useState(false);
  const [blogs, setBlogs] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    console.log('Form submitted!', { announcements, blogs });
  };

  if (isSubmitted) {
    return (
      <div className='w-full flex flex-col items-center justify-center text-center min-h-screen p-8 md:px-52'>
        <div className='bg-gray-300 h-40 w-40 flex items-center justify-center mb-6'>
          <span className='text-gray-500'></span>
        </div>
        <h1 className='text-3xl text-gray-700 mb-6'>Form submitted!</h1>
        <p className='text-center text-gray-700 max-w-2xl mb-6'>
          The Tennessee Coalition for Better Aging exists to promote the general welfare of older
          Tennesseans and their families through partnerships that mobilize resources to educate and
          advocate for important policies and programs.
        </p>
      </div>
    );
  }

  return (
    <div className='w-full p-8 md:px-52 '>
      <div className='grid md:grid-cols-2 gap-8 mb-12'>
        <div>
          <h1 className='text-3xl font-bold text-gray-700 mb-6  leading-10'>
            Subscribe to Email Notifications
          </h1>

          <p className='text-gray-700 mb-6'>
            Please fill out this form to be notified of our latest posts and service updates. The Tennessee Coalition for Better Aging exists to promote the general welfare of older
            Tennesseans and their families through partnerships that mobilize resources to educate
            and advocate for important policies and programs.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className='flex flex-col space-y-8 w-full mx-auto'>
        <label className='mb-2'>Name</label>
        <div className='flex gap-4'>
          <input
            type='text'
            required
            placeholder='First name'
            className='box-border w-xl h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px]'
          />

          <input
            type='text'
            required
            placeholder='Last name'
            className='box-border w-xl h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px]'
          />
        </div>

        <div className='flex flex-col space-y-2'>
          <label>Email Address</label>
          <input
            type='email'
            required
            placeholder='example@example.com'
            className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px]'
          />
        </div>

        <div className='flex flex-col space-y-4'>
          <label className='font-semibold'>Subscribe to:</label>
          <div className='flex items-center space-x-3'>
            <input
              type='checkbox'
              id='announcements'
              checked={announcements}
              onChange={(e) => setAnnouncements(e.target.checked)}
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
              onChange={(e) => setBlogs(e.target.checked)}
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
