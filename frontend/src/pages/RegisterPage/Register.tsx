import { useState, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  return (
    <main>
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
  const membershipSectionRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
    } catch (err) {}
  };

  const scrollToMembershipSection = () => {
    membershipSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleEmailSignup = () => {
    navigate('/email-signup');
  };

  return (
    <div className='w-full p-8 md:px-52 '>
      <div className='grid md:grid-cols-2 gap-8 mb-12'>
        <div>
          <h1 className='text-4xl font-bold text-gray-800 mb-6'>Get Involved</h1>
          <ul className='space-y-2 text-gray-700 mb-6'>
            <li className='list-disc ml-6'>Opt in to the mail list to stay up to date with TCBA</li>
            <li className='list-disc ml-6'>
              Share your story as an older adult or family caregiver
            </li>
            <li className='list-disc ml-6'>
              Receive help reaching out to and advocating to public officials
            </li>
          </ul>

          <div className='flex flex-col sm:flex-row gap-4 mt-8'>
            <button
              onClick={scrollToMembershipSection}
              className='bg-[#D54242] text-white px-6 py-3 rounded-[18px] text-sm font-semibold shadow-lg hover:bg-[#b53a3a] transition'
            >
              Join as an Organization
            </button>
            <button
              onClick={handleEmailSignup}
              className='bg-[#D54242] text-white px-6 py-3 rounded-[18px] text-sm font-semibold shadow-lg hover:bg-[#b53a3a] transition'
            >
              Register for Email Subscriptions
            </button>
          </div>
        </div>

        <div className='bg-gray-300 rounded-lg min-h-[300px] flex items-center justify-center'>
          <span className='text-gray-500'></span>
        </div>
      </div>

      <div ref={membershipSectionRef} className='mb-12'>
        <h2 className='text-3xl font-bold text-gray-800 mb-8'>Membership Information</h2>

        <div className='grid md:grid-cols-2 gap-8 mb-8'>
          <div>
            <h3 className='text-xl font-semibold text-gray-800 mb-4'>Eligibility</h3>
            <p className='text-gray-700 leading-relaxed'>
              Membership in the Coalition is open to any organization, agency or department, private
              or public, profit or non-profit, or individual which subscribes to and actively
              supports the mission and vision of the Coalition.
            </p>
          </div>

          <div>
            <h3 className='text-xl font-semibold text-gray-800 mb-4'>Membership Requirements</h3>
            <p className='text-gray-700 leading-relaxed mb-4'>
              Organizational applicants must complete and sign a Coalition membership application,
              including the commitment to the Coalition's mission, goals, and conflict of interest
              statement. The Steering Committee must approve all applications for membership.
            </p>
            <p className='text-gray-700 leading-relaxed'>
              Individuals may actively participate on the Coalition. They do not have a vote because
              only incorporated organizations have a vote on Coalition matters. Individuals must
              complete a membership application and agree to act in the best interest of the
              Coalition's vision, mission, and goals.
            </p>
          </div>
        </div>

        <p className='text-center text-gray-500 mb-12'>
          Please complete the form below if you are interested in joining the coalition. A TCBA
          steering committee member will be in touch after receiving your application.
        </p>
      </div>

      <form onSubmit={handleSubmit} className='flex flex-col space-y-8 w-full mx-auto'>
        {labels.map((label, index) => (
          <div key={index} className='flex flex-col space-y-2'>
            <label>{label}</label>
            <input
              type='text'
              required
              className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px]'
            />
          </div>
        ))}

        <div className='flex flex-col space-y-2'>
          <label>Region</label>
          <div className='relative inline-block'>
            <select
              required
              className='text-gray-900 appearance-none box-border w-full h-auto px-4 py-4 bg-white border-[1px] border-gray rounded-[10px]'
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

        <div className='flex flex-col space-y-2'>
          <label>Additional Notes</label>
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

export default RegisterPage;
