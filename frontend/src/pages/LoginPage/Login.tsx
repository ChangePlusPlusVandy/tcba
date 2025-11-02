import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';

const LoginPage = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded) return;

    setLoading(true);
    setError('');

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate('/dashboard');
      } else {
        console.log('Sign in status:', result.status);
        setError('Additional authentication required');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.errors?.[0]?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='w-full min-h-screen flex items-center justify-center py-8 px-8 bg-gray-50'>
      <div className='w-full max-w-md bg-white p-8 rounded-lg shadow-sm -mt-20'>
        <h1 className='text-3xl font-semibold text-gray-800 text-center mb-8'>
          Sign in for existing users
        </h1>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm'>
              {error}
            </div>
          )}

          <div className='flex flex-col space-y-2'>
            <label htmlFor='email' className='text-gray-700 font-medium'>
              Email
            </label>
            <input
              type='email'
              id='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className='w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D54242] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed'
            />
          </div>

          <div className='flex flex-col space-y-2'>
            <label htmlFor='password' className='text-gray-700 font-medium'>
              Password
            </label>
            <input
              type='password'
              id='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className='w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D54242] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed'
            />
          </div>

          <div className='flex flex-col space-y-2'>
            <Link to='/forgot-password' className='text-[#D54242] hover:text-[#b53a3a] text-sm'>
              Forgot your password?
            </Link>
            <Link to='/register' className='text-[#D54242] hover:text-[#b53a3a] text-sm'>
              Not registered? Apply to join the coalition
            </Link>
          </div>

          <div className='flex justify-center pt-4'>
            <button
              type='submit'
              disabled={loading || !isLoaded}
              className='w-32 h-12 rounded-full bg-[#D54242] text-white font-semibold hover:bg-[#b53a3a] transition shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed'
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
