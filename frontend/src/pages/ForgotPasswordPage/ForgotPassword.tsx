import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';

const ForgotPasswordPage = () => {
  const { isLoaded, signIn } = useSignIn();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const navigate = useNavigate();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });

      setSuccess('Password reset code sent to your email!');
      setStep('reset');
    } catch (err: any) {
      console.error('Error sending reset code:', err);
      setError(err?.errors?.[0]?.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError('');

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password: newPassword,
      });

      if (result.status === 'complete') {
        setSuccess('Password reset successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Password reset incomplete. Please try again.');
      }
    } catch (err: any) {
      console.error('Error resetting password:', err);
      setError(err?.errors?.[0]?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='w-full min-h-screen flex items-center justify-center p-8 bg-gray-50'>
      <div className='w-full max-w-md bg-white p-8 rounded-lg shadow-sm -mt-20'>
        <h1 className='text-3xl font-semibold text-gray-800 text-center mb-8'>
          Reset Your Password
        </h1>

        {step === 'email' ? (
          <form onSubmit={handleSendCode} className='space-y-6'>
            {error && (
              <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm'>
                {error}
              </div>
            )}
            {success && (
              <div className='bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm'>
                {success}
              </div>
            )}

            <p className='text-gray-600 text-sm text-center'>
              Enter your email address and we'll send you a code to reset your password.
            </p>

            <div className='flex flex-col space-y-2'>
              <label htmlFor='email' className='text-gray-700 font-medium'>
                Email
              </label>
              <input
                type='email'
                id='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
                className='w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D54242] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed'
              />
            </div>

            <div className='flex justify-center pt-4'>
              <button
                type='submit'
                disabled={loading || !isLoaded}
                className='w-40 h-12 rounded-full bg-[#D54242] text-white font-semibold hover:bg-[#b53a3a] transition shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed'
              >
                {loading ? 'Sending...' : 'Send Code'}
              </button>
            </div>

            <div className='text-center mt-4'>
              <Link to='/login' className='text-[#D54242] hover:text-[#b53a3a] text-sm'>
                Back to Login
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className='space-y-6'>
            {error && (
              <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm'>
                {error}
              </div>
            )}
            {success && (
              <div className='bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm'>
                {success}
              </div>
            )}

            <p className='text-gray-600 text-sm text-center'>
              Enter the code sent to your email and your new password.
            </p>

            <div className='flex flex-col space-y-2'>
              <label htmlFor='code' className='text-gray-700 font-medium'>
                Reset Code
              </label>
              <input
                type='text'
                id='code'
                value={code}
                onChange={e => setCode(e.target.value)}
                required
                disabled={loading}
                className='w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D54242] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed'
              />
            </div>

            <div className='flex flex-col space-y-2'>
              <label htmlFor='newPassword' className='text-gray-700 font-medium'>
                New Password
              </label>
              <input
                type='password'
                id='newPassword'
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                disabled={loading}
                className='w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D54242] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed'
              />
            </div>

            <div className='flex justify-center pt-4'>
              <button
                type='submit'
                disabled={loading || !isLoaded}
                className='w-40 h-12 rounded-full bg-[#D54242] text-white font-semibold hover:bg-[#b53a3a] transition shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed'
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>

            <div className='text-center mt-4'>
              <button
                type='button'
                onClick={() => setStep('email')}
                className='text-[#D54242] hover:text-[#b53a3a] text-sm'
              >
                Resend Code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
