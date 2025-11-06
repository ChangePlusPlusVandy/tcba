import { type FormEvent, useState } from 'react';

const SignupPage = () => {
  return (
    <div>
      <RegisterForm />
    </div>
  );
};

const RegisterForm = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const labels = ['Email Address', 'Phone Number'];
  const regions = ['East', 'Middle', 'West'];
  const placeholders = ['example@example.com', '(000) 000-0000'];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitted(true);
      if (isSubmitted) {
        return <div>Form submitted successfully!</div>;
      }
    } catch (err) {
      console.error('Error submitting form:', err);
    }
  };

  return (
    <div className='w-full p-8 md:px-52 '>
      <div className='grid md:grid-cols-2 gap-8 mb-12'>
        <div>
          <h1 className='text-3xl font-bold text-gray-700 mb-6  leading-10'>
            Please fill out this form for General Information, Questions or Media Inquiries 
          </h1>

          <p className='text-gray-700 mb-6'>
            The Tennessee Coalition for Better Aging exists to promote the general welfare of older
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

        {labels.map((label, index) => (
          <div key={index} className='flex flex-col space-y-2'>
            <label>{label}</label>
            <input
              type='text'
              required
              placeholder={placeholders[index]}
              className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px]'
            />
          </div>
        ))}

        <div className='flex flex-col space-y-2'>
          <label>Organization / Affiliation name (optional)</label>
          <div className='relative inline-block'>
            <input className='text-gray-900 appearance-none box-border w-full h-auto px-4 py-4 bg-white border-[1px] border-gray rounded-[10px]'></input>
          </div>
        </div>

        <div className='flex flex-col space-y-2'>
          <label>Organization / Affiliation region (optional)</label>
          <div className='relative inline-block'>
            <input
              className='text-gray-900 appearance-none box-border w-full h-auto px-4 py-4 bg-white border-[1px] border-gray rounded-[10px]'
              placeholder={regions.map(region => region).join(' / ') + ' Tennessee'}
            ></input>
          </div>
        </div>

        <div className='flex flex-col space-y-2'>
          <label>Your question or interview request:</label>
          <textarea
            required
            rows={6}
            className='box-border w-full px-4 py-4 bg-white border-[1px] border-[#848482] rounded-[10px] resize-none'
          />
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
