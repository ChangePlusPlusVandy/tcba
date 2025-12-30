import { Link, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import tncbaLogo from '../assets/tcba.jpg';
import { IoPersonSharp } from 'react-icons/io5';

const Navbar = () => {
  const { user } = useUser();
  const location = useLocation();
  const isAdmin = user?.publicMetadata?.role === 'ADMIN';

  return (
    <nav className='w-full bg-white border-b border-gray-200'>
      <div className='w-full px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-20'>
          <Link to='/' className='flex-shrink-0 mr-8'>
            <img src={tncbaLogo} alt='TNCBA Logo' className='h-12 w-auto' />
          </Link>
          <div className='hidden md:flex items-center space-x-8'>
            <Link
              to='/'
              className={`transition-colors duration-200 ${location.pathname === '/' ? 'font-bold' : 'font-medium'}`}
              style={{ color: '#3C3C3C' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#88242C')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3C3C3C')}
            >
              Home
            </Link>
            <Link
              to='/about'
              className={`transition-colors duration-200 ${location.pathname === '/about' ? 'font-bold' : 'font-medium'}`}
              style={{ color: '#3C3C3C' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#88242C')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3C3C3C')}
            >
              About Us
            </Link>
            <Link
              to='/announcements'
              className={`transition-colors duration-200 ${location.pathname === '/announcements' ? 'font-bold' : 'font-medium'}`}
              style={{ color: '#3C3C3C' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#88242C')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3C3C3C')}
            >
              Announcements
            </Link>
            <Link
              to='/blogs'
              className={`transition-colors duration-200 ${location.pathname === '/blogs' ? 'font-bold' : 'font-medium'}`}
              style={{ color: '#3C3C3C' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#88242C')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3C3C3C')}
            >
              Blogs
            </Link>
            <Link
              to='/register'
              className={`transition-colors duration-200 ${location.pathname === '/register' ? 'font-bold' : 'font-medium'}`}
              style={{ color: '#3C3C3C' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#88242C')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3C3C3C')}
            >
              Get Involved
            </Link>
            <SignedIn>
              {isAdmin ? (
                <Link
                  to='/admin/dashboard'
                  className={`transition-colors duration-200 ${location.pathname.startsWith('/admin') ? 'font-bold' : 'font-medium'}`}
                  style={{ color: '#3C3C3C' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#88242C')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#3C3C3C')}
                >
                  Admin Panel
                </Link>
              ) : (
                <Link
                  to='/dashboard'
                  className={`transition-colors duration-200 ${location.pathname === '/dashboard' ? 'font-bold' : 'font-medium'}`}
                  style={{ color: '#3C3C3C' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#88242C')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#3C3C3C')}
                >
                  Organization Panel
                </Link>
              )}
            </SignedIn>

            <SignedOut>
              <Link
                to='/login'
                className='font-medium transition-colors duration-200 flex items-center gap-2'
                style={{ color: '#3C3C3C' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#88242C')}
                onMouseLeave={e => (e.currentTarget.style.color = '#3C3C3C')}
              >
                <IoPersonSharp className='text-xl' />
              </Link>
            </SignedOut>
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-9 h-9',
                  },
                }}
                afterSignOutUrl='/login'
              />
            </SignedIn>
          </div>

          <div className='md:hidden'>
            <button
              type='button'
              className='focus:outline-none focus:ring-2 focus:ring-[#88242C] rounded-md p-2 transition-colors duration-200'
              style={{ color: '#3C3C3C' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#88242C')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3C3C3C')}
              aria-label='Open menu'
            >
              <svg
                className='h-6 w-6'
                fill='none'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path d='M4 6h16M4 12h16M4 18h16'></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
