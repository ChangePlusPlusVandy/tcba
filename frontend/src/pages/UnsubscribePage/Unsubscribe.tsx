import { type FormEvent, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Toast from '../../components/Toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

const UnsubscribePage = () => {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email');

  const [email, setEmail] = useState(emailParam || '');
  const [, setSubscriptionTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  const [announcements, setAnnouncements] = useState(false);
  const [blogs, setBlogs] = useState(false);

  useEffect(() => {
    if (emailParam) {
      fetchSubscriptionData(emailParam);
    }
  }, [emailParam]);

  const fetchSubscriptionData = async (emailAddress: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/subscriptions/by-email?email=${encodeURIComponent(emailAddress)}`
      );

      if (!response.ok) {
        throw new Error('Subscription not found');
      }

      const data = await response.json();
      setSubscriptionData(data);
      setSubscriptionTypes(data.subscriptionTypes || []);
      setAnnouncements(data.subscriptionTypes?.includes('ANNOUNCEMENT') || false);
      setBlogs(data.subscriptionTypes?.includes('BLOG') || false);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setToast({
        message: 'Could not find subscription with this email address',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await fetchSubscriptionData(email);
  };

  const handleUnsubscribe = async (e: FormEvent) => {
    e.preventDefault();
    setToast(null);
    setSubmitting(true);

    const newSubscriptionTypes: string[] = [];
    if (announcements) newSubscriptionTypes.push('ANNOUNCEMENT');
    if (blogs) newSubscriptionTypes.push('BLOG');

    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/${subscriptionData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionTypes: newSubscriptionTypes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update subscription');
      }

      setToast({ message: 'Successfully unsubscribed!', type: 'success' });
      setSubscriptionTypes(newSubscriptionTypes);
    } catch (err) {
      console.error('Error unsubscribing:', err);
      setToast({
        message: err instanceof Error ? err.message : 'Failed to unsubscribe. Please try again.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className='mt-8 bg-white px-20 py-16 min-h-screen'>
        <div className='max-w-2xl mx-auto'>
          <h1 className='font-[Open_Sans] text-[40px] font-bold leading-[100%] text-gray-800 mb-6'>
            Manage Email Subscriptions
          </h1>

          <p className='font-[Open_Sans] text-[18px] font-normal leading-[150%] text-gray-800 mb-8'>
            Update your email notification preferences below. You can choose which types of updates
            you'd like to receive from the Tennessee Coalition for Better Aging.
          </p>

          {!subscriptionData ? (
            <form onSubmit={handleEmailSubmit} className='flex flex-col space-y-6'>
              <div className='flex flex-col space-y-2'>
                <label className='text-base font-semibold text-gray-800'>
                  Enter your email address
                </label>
                <input
                  type='email'
                  required
                  placeholder='example@example.com'
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className='box-border w-full h-12 px-4 py-4 bg-white border-[1px] border-gray-500 rounded-[10px]'
                />
              </div>

              <button
                type='submit'
                disabled={loading}
                className='w-full h-[50px] rounded-[15px] bg-[#D54242] text-white hover:bg-[#b53a3a] transition disabled:bg-gray-400 disabled:cursor-not-allowed'
              >
                {loading ? 'Finding Subscription...' : 'Continue'}
              </button>
            </form>
          ) : (
            <div className='bg-gray-50 rounded-lg p-6 border border-gray-200'>
              <div className='mb-6'>
                <p className='text-sm text-gray-600 mb-1'>Managing subscriptions for:</p>
                <p className='text-lg font-semibold text-gray-900'>{subscriptionData.email}</p>
                {subscriptionData.name && (
                  <p className='text-sm text-gray-600'>{subscriptionData.name}</p>
                )}
              </div>

              <form onSubmit={handleUnsubscribe} className='flex flex-col space-y-6'>
                <div className='flex flex-col space-y-4'>
                  <label className='text-base font-semibold text-gray-800'>
                    I want to receive:
                  </label>

                  <label className='flex items-center space-x-3 cursor-pointer'>
                    <input
                      type='checkbox'
                      id='announcements'
                      checked={announcements}
                      onChange={e => setAnnouncements(e.target.checked)}
                      className='w-5 h-5 text-[#D54242] border-gray-500 rounded focus:ring-[#D54242]'
                    />
                    <div>
                      <div className='font-medium text-gray-900'>Announcements</div>
                      <div className='text-sm text-gray-500'>
                        Updates about coalition announcements
                      </div>
                    </div>
                  </label>

                  <label className='flex items-center space-x-3 cursor-pointer'>
                    <input
                      type='checkbox'
                      id='blogs'
                      checked={blogs}
                      onChange={e => setBlogs(e.target.checked)}
                      className='w-5 h-5 text-[#D54242] border-gray-500 rounded focus:ring-[#D54242]'
                    />
                    <div>
                      <div className='font-medium text-gray-900'>Blog Posts</div>
                      <div className='text-sm text-gray-500'>
                        Notifications about new blog content
                      </div>
                    </div>
                  </label>

                  {!announcements && !blogs && (
                    <div className='bg-yellow-50 border border-yellow-200 rounded-md p-3'>
                      <p className='text-sm text-yellow-800'>
                        You will be unsubscribed from all email notifications
                      </p>
                    </div>
                  )}
                </div>

                <div className='flex gap-3'>
                  <button
                    type='button'
                    onClick={() => {
                      setSubscriptionData(null);
                      setEmail('');
                    }}
                    className='flex-1 h-[50px] rounded-[15px] border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={submitting}
                    className='flex-1 h-[50px] rounded-[15px] bg-[#D54242] text-white hover:bg-[#b53a3a] transition disabled:bg-gray-400 disabled:cursor-not-allowed'
                  >
                    {submitting ? 'Updating...' : 'Update Preferences'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UnsubscribePage;
