import { useState, type FormEvent } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

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

      setSuccess(true);
      setFormData({
        title: '',
        message: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='mt-8 bg-white px-20 py-16'>
      <div className='mb-12'>
        <h1 className='font-[Open_Sans] text-[40px] font-bold leading-[100%] text-gray-800 mb-6'>
          Contact Us
        </h1>
        <p className='font-[Open_Sans] text-[18px] font-normal leading-[150%] text-gray-800 max-w-2xl'>
          Have a general inquiry or a request? Use this form to reach out to us. This form is for
          general inquiries and requests from other organizations that do not require membership. If
          you're interested in becoming a member organization, please visit our{' '}
          <a href='/register' className='text-[#D54242] underline hover:text-[#b53a3a]'>
            registration page
          </a>
          .
        </p>
      </div>

      <form onSubmit={handleSubmit} className='flex flex-col space-y-8 w-full mx-auto'>
        {success && (
          <div className='bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg'>
            <p className='font-semibold'>Message Sent Successfully!</p>
            <p className='text-sm mt-1'>
              Thank you for contacting us. We'll get back to you as soon as possible.
            </p>
          </div>
        )}

        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg'>
            {error}
          </div>
        )}

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
    </div>
  );
};

export default ContactPage;
