import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from '../../components/Toast';
import getInvolvedImage from '../../assets/getInvolved.png';
import S3Image from '../../components/S3Image';
import { usePageContent } from '../../hooks/queries/usePageContent';
import { API_BASE_URL } from '../../config/api';

interface PageContent {
  [key: string]: { id: string; value: string; type: string };
}

interface RegisterPageProps {
  previewContent?: PageContent;
}

const RegisterPage = ({ previewContent }: RegisterPageProps = {}) => {
  useEffect(() => {
    document.title = 'Get Involved - Tennessee Coalition For Better Aging';
    window.scrollTo(0, 0);
  }, []);

  return (
    <main>
      <RegisterForm previewContent={previewContent} />
    </main>
  );
};

interface RegisterFormProps {
  previewContent?: PageContent;
}

const RegisterForm = ({ previewContent }: RegisterFormProps = {}) => {
  const regions = ['East', 'Middle', 'West'];
  const membershipSectionRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    email: '',
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    secondaryContactName: '',
    secondaryContactEmail: '',
    website: '',
    region: '',
    organizationType: '',
    organizationSize: '',
    additionalNotes: '',
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const { data: pageContent } = usePageContent('register');

  const content = previewContent || pageContent || {};

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/organizations/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state || undefined,
          zipCode: formData.zipCode,
          primaryContactName: formData.primaryContactName,
          primaryContactEmail: formData.primaryContactEmail,
          primaryContactPhone: formData.primaryContactPhone,
          secondaryContactName: formData.secondaryContactName || undefined,
          secondaryContactEmail: formData.secondaryContactEmail || undefined,
          website: formData.website,
          region: formData.region,
          organizationType: formData.organizationType || undefined,
          organizationSize: formData.organizationSize || undefined,
          additionalNotes: formData.additionalNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit application');
      }

      setToast({
        message:
          'Application Submitted Successfully! A TCBA administrator will review your request and contact you via email.',
        type: 'success',
      });
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        email: '',
        primaryContactName: '',
        primaryContactEmail: '',
        primaryContactPhone: '',
        secondaryContactName: '',
        secondaryContactEmail: '',
        website: '',
        region: '',
        organizationType: '',
        organizationSize: '',
        additionalNotes: '',
      });
    } catch (err: any) {
      setToast({
        message: err.message || 'Failed to submit application. Please try again.',
        type: 'error',
      });
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

  const heroImageSrc = content['hero_image']?.value || '';

  return (
    <div className='mt-8'>
      <section>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          <div className='bg-white px-6 sm:px-8 lg:px-12 py-10 sm:py-16 lg:py-20 flex items-center'>
            <div className='p-4 sm:p-6 lg:p-8'>
              <h1 className='font-[Open_Sans] text-2xl sm:text-3xl lg:text-[40px] font-bold leading-[110%] text-gray-800 mb-4 sm:mb-6'>
                {content['hero_title']?.value || 'Get Involved'}
              </h1>
              <ul className='space-y-2 text-gray-700 mb-6'>
                <li className='list-disc ml-6'>
                  {content['hero_bullet1']?.value ||
                    'Opt in to the mail list to stay up to date with TCBA'}
                </li>
                <li className='list-disc ml-6'>
                  {content['hero_bullet2']?.value ||
                    'Share your story as an older adult or family caregiver'}
                </li>
                <li className='list-disc ml-6'>
                  {content['hero_bullet3']?.value ||
                    'Receive help reaching out to and advocating to public officials'}
                </li>
              </ul>

              <div className='flex flex-col sm:flex-row gap-4 mt-8'>
                <button
                  onClick={scrollToMembershipSection}
                  className='bg-[#D54242] text-white px-6 py-3 rounded-[18px] text-sm font-semibold shadow-lg hover:bg-[#b53a3a] transition cursor-pointer'
                >
                  {content['hero_join_button']?.value || 'Join the Coalition'}
                </button>
                <button
                  onClick={handleEmailSignup}
                  className='bg-[#D54242] text-white px-6 py-3 rounded-[18px] text-sm font-semibold shadow-lg hover:bg-[#b53a3a] transition cursor-pointer'
                >
                  {content['hero_subscribe_button']?.value || 'Subscribe to Emails'}
                </button>
                <button
                  onClick={handleContactInquiry}
                  className='bg-[#D54242] text-white px-6 py-3 rounded-[18px] text-sm font-semibold shadow-lg hover:bg-[#b53a3a] transition cursor-pointer'
                >
                  {content['hero_contact_button']?.value || 'Contact Us'}
                </button>
              </div>
            </div>
          </div>

          <div className='h-[300px] sm:h-[400px] bg-slate-200 lg:mr-12 overflow-hidden rounded-lg'>
            <S3Image
              src={heroImageSrc}
              fallbackSrc={getInvolvedImage}
              alt='Get Involved with TCBA'
              className='w-full h-full object-cover'
            />
          </div>
        </div>
      </section>

      <div className='bg-white px-4 sm:px-8 lg:px-20 py-8 sm:py-12 lg:py-16'>
        <div ref={membershipSectionRef} className='mb-12'>
          <h2 className='text-2xl sm:text-3xl font-bold text-gray-800 text-center mb-6 sm:mb-8'>
            {content['membership_title']?.value || 'Membership Information'}
          </h2>

          <div className='grid md:grid-cols-2 gap-6 sm:gap-8 mb-8'>
            <div>
              <h3 className='text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4'>
                {content['eligibility_title']?.value || 'Eligibility'}
              </h3>
              <div
                className='text-gray-700 leading-relaxed mb-4'
                dangerouslySetInnerHTML={{
                  __html:
                    content['eligibility_para1']?.value ||
                    'Membership in the Coalition is open to any organization, agency or department, private or public, profit or non-profit, or individual which subscribes to and actively supports the mission and vision of the Coalition.',
                }}
              />
              <div
                className='text-gray-700 leading-relaxed'
                dangerouslySetInnerHTML={{
                  __html:
                    content['eligibility_para2']?.value ||
                    'We welcome organizations who are committed to improving the lives of older Tennesseans and their families. Members gain access to collaborative opportunities, advocacy resources, and a network of like-minded organizations working toward positive change for aging populations across Tennessee.',
                }}
              />
            </div>

            <div>
              <h3 className='text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4'>
                {content['requirements_title']?.value || 'Membership Requirements'}
              </h3>
              <div
                className='text-gray-700 leading-relaxed mb-4'
                dangerouslySetInnerHTML={{
                  __html:
                    content['requirements_para1']?.value ||
                    "Organizational applicants must complete and sign a Coalition membership application, including the commitment to the Coalition's mission, goals, and conflict of interest statement. The Steering Committee must approve all applications for membership.",
                }}
              />
              <div
                className='text-gray-700 leading-relaxed'
                dangerouslySetInnerHTML={{
                  __html:
                    content['requirements_para2']?.value ||
                    "Individuals may actively participate on the Coalition. They do not have a vote because only incorporated organizations have a vote on Coalition matters. Individuals must complete a membership application and agree to act in the best interest of the Coalition's vision, mission, and goals.",
                }}
              />
            </div>
          </div>

          <div
            className='text-center text-gray-500 mb-12'
            dangerouslySetInnerHTML={{
              __html:
                content['form_description']?.value ||
                'Please complete the form below if you are interested in joining the coalition. A TCBA steering committee member will be in touch after receiving your application.',
            }}
          />
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className='flex flex-col space-y-8 w-full mx-auto'
        >
          <div className='flex flex-col space-y-2'>
            <label htmlFor='name'>
              Organization Name <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              id='name'
              name='name'
              value={formData.name}
              onChange={handleInputChange}
              required
              aria-required='true'
              disabled={loading}
              className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed'
            />
          </div>

          <div className='flex flex-col space-y-2'>
            <label htmlFor='address'>
              Street Address <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              id='address'
              name='address'
              value={formData.address}
              onChange={handleInputChange}
              required
              aria-required='true'
              disabled={loading}
              className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed'
            />
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            <div className='flex flex-col space-y-2'>
              <label htmlFor='city'>
                City <span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                id='city'
                name='city'
                value={formData.city}
                onChange={handleInputChange}
                required
                aria-required='true'
                disabled={loading}
                className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed'
              />
            </div>

            <div className='flex flex-col space-y-2'>
              <label htmlFor='state'>
                State <span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                id='state'
                name='state'
                value={formData.state}
                onChange={handleInputChange}
                required
                aria-required='true'
                disabled={loading}
                placeholder='TN'
                className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed'
              />
            </div>

            <div className='flex flex-col space-y-2'>
              <label htmlFor='zipCode'>
                Zip Code <span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                id='zipCode'
                name='zipCode'
                value={formData.zipCode}
                onChange={handleInputChange}
                required
                aria-required='true'
                disabled={loading}
                className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed'
              />
            </div>
          </div>

          <div className='flex flex-col space-y-2'>
            <label htmlFor='email'>
              Organization Contact Email <span className='text-red-500'>*</span>
            </label>
            <input
              type='email'
              id='email'
              name='email'
              value={formData.email}
              onChange={handleInputChange}
              required
              aria-required='true'
              disabled={loading}
              className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed'
            />
          </div>

          <div className='flex flex-col space-y-2'>
            <label htmlFor='primaryContactName'>
              Primary Contact Name <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              id='primaryContactName'
              name='primaryContactName'
              value={formData.primaryContactName}
              onChange={handleInputChange}
              required
              aria-required='true'
              disabled={loading}
              className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed'
            />
          </div>

          <div className='flex flex-col space-y-2'>
            <label htmlFor='primaryContactEmail'>
              Primary Contact Email <span className='text-red-500'>*</span>
            </label>
            <input
              type='email'
              id='primaryContactEmail'
              name='primaryContactEmail'
              value={formData.primaryContactEmail}
              onChange={handleInputChange}
              required
              aria-required='true'
              disabled={loading}
              className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed'
            />
          </div>

          <div className='flex flex-col space-y-2'>
            <label htmlFor='primaryContactPhone'>
              Primary Contact Phone Number <span className='text-red-500'>*</span>
            </label>
            <input
              type='tel'
              id='primaryContactPhone'
              name='primaryContactPhone'
              value={formData.primaryContactPhone}
              onChange={handleInputChange}
              required
              aria-required='true'
              disabled={loading}
              className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed'
            />
          </div>

          <div className='flex flex-col space-y-2'>
            <label htmlFor='secondaryContactName'>Secondary Contact Name</label>
            <input
              type='text'
              id='secondaryContactName'
              name='secondaryContactName'
              value={formData.secondaryContactName}
              onChange={handleInputChange}
              disabled={loading}
              className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed'
            />
          </div>

          <div className='flex flex-col space-y-2'>
            <label htmlFor='secondaryContactEmail'>Secondary Contact Email</label>
            <input
              type='email'
              id='secondaryContactEmail'
              name='secondaryContactEmail'
              value={formData.secondaryContactEmail}
              onChange={handleInputChange}
              disabled={loading}
              className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed'
            />
          </div>

          <div className='flex flex-col space-y-2'>
            <label htmlFor='website'>Website URL</label>
            <input
              type='url'
              id='website'
              name='website'
              value={formData.website}
              onChange={handleInputChange}
              disabled={loading}
              className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed'
            />
          </div>

          <div className='flex flex-col space-y-2'>
            <label htmlFor='region'>
              Region <span className='text-red-500'>*</span>
            </label>
            <div className='relative inline-block'>
              <select
                id='region'
                name='region'
                value={formData.region}
                onChange={handleInputChange}
                required
                aria-required='true'
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
            <label htmlFor='organizationType'>
              Organization Type <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              id='organizationType'
              name='organizationType'
              value={formData.organizationType}
              onChange={handleInputChange}
              required
              aria-required='true'
              disabled={loading}
              placeholder='Non-profit, Government, Healthcare, etc.'
              className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed'
            />
          </div>

          <div className='flex flex-col space-y-2'>
            <label htmlFor='organizationSize'>
              Organization Size <span className='text-red-500'>*</span>
            </label>
            <div className='relative inline-block'>
              <select
                id='organizationSize'
                name='organizationSize'
                value={formData.organizationSize}
                onChange={handleInputChange}
                required
                aria-required='true'
                disabled={loading}
                className='text-gray-900 appearance-none box-border w-full h-auto px-4 py-4 bg-white border-[1px] border-gray rounded-[10px] disabled:bg-gray-100 disabled:cursor-not-allowed'
              >
                <option value='' hidden className='text-gray-900'>
                  Select organization size
                </option>
                <option value='SMALL'>Small (1-50 employees)</option>
                <option value='MEDIUM'>Medium (51-200 employees)</option>
                <option value='LARGE'>Large (201-1000 employees)</option>
                <option value='EXTRA_LARGE'>Extra Large (1000+ employees)</option>
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
            <label>Description</label>
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
              className='w-[110px] h-[50px] rounded-[15px] bg-[#D54242] text-white hover:bg-[#b53a3a] transition disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer'
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default RegisterPage;
