import { useState, type FormEvent } from 'react';

const RegisterPage = () => {
  return (
    <main>
      <h1>Register Page</h1>
      <RegisterForm />
    </main>
  );
};

const RegisterForm = () => {
  const labels = [
    'Organization Name',
    'Address (street, city, state, zip)',
    'Main Phone Number',
    'Website URL',
  ];
  const regions = ['East', 'Middle', 'West'];

  const handleSubmit = async (e: FormEvent) => {
    //TODO: handle missing fields
    e.preventDefault();

    try {
      //TODO: submit registration data to backend
    } catch (err) {
      //TODO: handle errors
    }
  };

  return (
    <div className='w-full p-8 md:px-52 '>
      <form onSubmit={handleSubmit} className='flex flex-col space-y-8 w-full mx-auto'>
        {labels.map((label, index) => (
          <div key={index} className='flex flex-col space-y-2'>
            <label>{label}</label>
            <input
              type='text'
              required
              className='box-border w-full h-12 py-4 bg-white border-[1px] border-gray-500 rounded-[10px]'
            />
          </div>
        ))}

        <div className='flex flex-col space-y-2'>
          <label>Region</label>
          <div className='relative inline-block'>
            <select
              required
              className='text-gray-900 appearance-none box-border w-full h-auto p-4 bg-white border-[1px] border-gray rounded-[10px]'
            >
              <option value='' hidden className='text-gray-900'>
                Select a region
              </option>
              {regions.map(region => (
                <option value={region}>{region}</option>
              ))}
            </select>
            <div className='pointer-events-none absolute inset-y-0 right-2 flex items-center px-3'>
              <svg
                width='14'
                height='9'
                viewBox='0 0 15 11'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path d='M0.388183 0.315431L7.70162 9.31543L14.3882 0.31543' stroke='#848482' />
              </svg>
            </div>
          </div>
        </div>

        <div className='flex flex-col space-y-4'>
          <label>Additional Notes</label>
          <input
            type='text'
            required
            className='box-border w-full h-46 py-4 bg-white border-[1px] border-[#848482] rounded-[10px]'
          />
        </div>

        <div className='flex flex-col items-center'>
          <button
            type='submit'
            className='w-[100px] h-[25px] w-[110px] h-[50px] rounded-[15px] bg-red-700 text-white'
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;
