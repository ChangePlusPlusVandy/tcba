import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  return (
    <main>
      <RegisterForm />
    </main>
  );
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

const RegisterForm = () => {
  const regions = ['East', 'Middle', 'West'];
  const membershipSectionRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    zipCode: '',
    email: '',
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    secondaryContactName: '',
    secondaryContactEmail: '',
    website: '',
    region: '',
    additionalNotes: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/organizations/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          zipCode: formData.zipCode,
          primaryContactName: formData.primaryContactName,
          primaryContactEmail: formData.primaryContactEmail,
          primaryContactPhone: formData.primaryContactPhone,
          secondaryContactName: formData.secondaryContactName || undefined,
          secondaryContactEmail: formData.secondaryContactEmail || undefined,
          website: formData.website,
          region: formData.region,
          additionalNotes: formData.additionalNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit application');
      }

      setSuccess(true);
      setFormData({
        name: '',
        address: '',
        city: '',
        zipCode: '',
        email: '',
        primaryContactName: '',
        primaryContactEmail: '',
        primaryContactPhone: '',
        secondaryContactName: '',
        secondaryContactEmail: '',
        website: '',
        region: '',
        additionalNotes: '',
      });

      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err: any) {
      setError(err.message || 'Failed to submit application. Please try again.');

      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } finally {
      setLoading(false);
    }
  };

  const scrollToMembershipSection = () => {
    membershipSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleEmailSignup = () => {
    navigate('/email-signup');
  };

  const handleContactInquiry = () => {
    navigate('/contact');
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
              Join the Coalition
            </button>
            <button
              onClick={handleEmailSignup}
              className='bg-[#D54242] text-white px-6 py-3 rounded-[18px] text-sm font-semibold shadow-lg hover:bg-[#b53a3a] transition'
            >
              Subscribe to Emails
            </button>
            <button
              onClick={handleContactInquiry}
              className='bg-[#D54242] text-white px-6 py-3 rounded-[18px] text-sm font-semibold shadow-lg hover:bg-[#b53a3a] transition'
            >
              Contact Us
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

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className='flex flex-col space-y-8 w-full mx-auto'
      >
        {success && (
          <div className='bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg'>
            <p className='font-semibold'>Application Submitted Successfully!</p>
            <p className='text-sm mt-1'>
              A TCBA administrator will review your request and contact you via email.
            </p>
          </div>
        )}

        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg'>
            {error}
          </div>
        )}

        <div className='flex flex-col space-y-2'>
          <label>Organization Name</label>
          <input
            type='text'
            name='name'
            value={formData.name}
            onChange={handleInputChange}
            required
            disabled={loading}
            className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed'
          />
        </div>

        <div className='flex flex-col space-y-2'>
          <label>Street Address</label>
          <input
            type='text'
            name='address'
            value={formData.address}
            onChange={handleInputChange}
            required
            disabled={loading}
            className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed'
          />
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div className='flex flex-col space-y-2'>
            <label>City</label>
            <input
              type='text'
              name='city'
              value={formData.city}
              onChange={handleInputChange}
              required
              disabled={loading}
              className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed'
            />
          </div>

          <div className='flex flex-col space-y-2'>
            <label>Zip Code</label>
            <input
              type='text'
              name='zipCode'
              value={formData.zipCode}
              onChange={handleInputChange}
              required
              disabled={loading}
              className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed'
            />
          </div>
        </div>

        <div className='flex flex-col space-y-2'>
          <label>Organization Contact Email</label>
          <input
            type='email'
            name='email'
            value={formData.email}
            onChange={handleInputChange}
            required
            disabled={loading}
            className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed'
          />
        </div>

        <div className='flex flex-col space-y-2'>
          <label>Primary Contact Name</label>
          <input
            type='text'
            name='primaryContactName'
            value={formData.primaryContactName}
            onChange={handleInputChange}
            required
            disabled={loading}
            className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed'
          />
        </div>

        <div className='flex flex-col space-y-2'>
          <label>Primary Contact Email</label>
          <input
            type='email'
            name='primaryContactEmail'
            value={formData.primaryContactEmail}
            onChange={handleInputChange}
            required
            disabled={loading}
            className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed'
          />
        </div>

        <div className='flex flex-col space-y-2'>
          <label>Primary Contact Phone Number</label>
          <input
            type='tel'
            name='primaryContactPhone'
            value={formData.primaryContactPhone}
            onChange={handleInputChange}
            required
            disabled={loading}
            className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed'
          />
        </div>

        <div className='flex flex-col space-y-2'>
          <label>Secondary Contact Name (optional)</label>
          <input
            type='text'
            name='secondaryContactName'
            value={formData.secondaryContactName}
            onChange={handleInputChange}
            disabled={loading}
            className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed'
          />
        </div>

        <div className='flex flex-col space-y-2'>
          <label>Secondary Contact Email (optional)</label>
          <input
            type='email'
            name='secondaryContactEmail'
            value={formData.secondaryContactEmail}
            onChange={handleInputChange}
            disabled={loading}
            className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed'
          />
        </div>

        <div className='flex flex-col space-y-2'>
          <label>Website URL (optional)</label>
          <input
            type='url'
            name='website'
            value={formData.website}
            onChange={handleInputChange}
            disabled={loading}
            className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed'
          />
        </div>

        <div className='flex flex-col space-y-2'>
          <label>Region</label>
          <div className='relative inline-block'>
            <select
              name='region'
              value={formData.region}
              onChange={handleInputChange}
              required
              disabled={loading}
              className='text-gray-900 appearance-none box-border w-full h-auto px-4 py-4 bg-white border-[1px] border-gray rounded-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed'
            >
              <option value='' hidden className='text-gray-900'>
                Select a region
              </option>
              {regions.map(region => (
                <option key={region} value={region.toUpperCase()}>
                  {region}
                </option>
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
          <label>Description (optional)</label>
          <textarea
            name='additionalNotes'
            value={formData.additionalNotes}
            onChange={handleInputChange}
            disabled={loading}
            rows={6}
            className='box-border w-full px-4 py-4 bg-white border-[1px] border-[#848482] rounded-[10px] resize-none disabled:bg-gray-100 disabled:cursor-not-allowed'
          />
        </div>

        <div className='flex flex-col items-center'>
          <button
            type='submit'
            disabled={loading}
            className='w-[110px] h-[50px] rounded-[15px] bg-[#D54242] text-white hover:bg-[#b53a3a] transition disabled:bg-gray-400 disabled:cursor-not-allowed'
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;
