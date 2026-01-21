import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import tncbaLogo from '../assets/tcba.jpg';
import { IoPersonSharp, IoClose } from 'react-icons/io5';

const Navbar = () => {
  const { user } = useUser();
  const location = useLocation();
  const isAdmin = user?.publicMetadata?.role === 'ADMIN';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className='w-full bg-white border-b border-gray-200'>
      <div className='w-full px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-20'>
          <Link to='/' className='flex-shrink-0 mr-8' onClick={closeMobileMenu}>
            <img src={tncbaLogo} alt='TNCBA Logo' className='h-12 w-auto' />
          </Link>
          <div className='hidden md:flex items-center space-x-8'>
            <Link
              to='/'
              className={`relative text-[#3C3C3C] hover:text-[#88242C] transition-colors duration-200 before:absolute before:bottom-0 before:left-0 before:w-0 before:h-0.5 before:bg-[#88242C] before:transition-all before:duration-300 hover:before:w-full ${location.pathname === '/' ? 'font-bold' : 'font-medium'}`}
            >
              Home
            </Link>
            <Link
              to='/about'
              className={`relative text-[#3C3C3C] hover:text-[#88242C] transition-colors duration-200 before:absolute before:bottom-0 before:left-0 before:w-0 before:h-0.5 before:bg-[#88242C] before:transition-all before:duration-300 hover:before:w-full ${location.pathname === '/about' ? 'font-bold' : 'font-medium'}`}
            >
              About Us
            </Link>
            <Link
              to='/announcements'
              className={`relative text-[#3C3C3C] hover:text-[#88242C] transition-colors duration-200 before:absolute before:bottom-0 before:left-0 before:w-0 before:h-0.5 before:bg-[#88242C] before:transition-all before:duration-300 hover:before:w-full ${location.pathname === '/announcements' ? 'font-bold' : 'font-medium'}`}
            >
              Announcements
            </Link>
            <Link
              to='/blogs'
              className={`relative text-[#3C3C3C] hover:text-[#88242C] transition-colors duration-200 before:absolute before:bottom-0 before:left-0 before:w-0 before:h-0.5 before:bg-[#88242C] before:transition-all before:duration-300 hover:before:w-full ${location.pathname === '/blogs' ? 'font-bold' : 'font-medium'}`}
            >
              Blogs
            </Link>
            <Link
              to='/register'
              className={`relative text-[#3C3C3C] hover:text-[#88242C] transition-colors duration-200 before:absolute before:bottom-0 before:left-0 before:w-0 before:h-0.5 before:bg-[#88242C] before:transition-all before:duration-300 hover:before:w-full ${location.pathname === '/register' ? 'font-bold' : 'font-medium'}`}
            >
              Get Involved
            </Link>
            <SignedIn>
              {isAdmin ? (
                <Link
                  to='/admin/dashboard'
                  className={`relative text-[#3C3C3C] hover:text-[#88242C] transition-colors duration-200 before:absolute before:bottom-0 before:left-0 before:w-0 before:h-0.5 before:bg-[#88242C] before:transition-all before:duration-300 hover:before:w-full ${location.pathname.startsWith('/admin') ? 'font-bold' : 'font-medium'}`}
                >
                  Admin Panel
                </Link>
              ) : (
                <Link
                  to='/dashboard'
                  className={`relative text-[#3C3C3C] hover:text-[#88242C] transition-colors duration-200 before:absolute before:bottom-0 before:left-0 before:w-0 before:h-0.5 before:bg-[#88242C] before:transition-all before:duration-300 hover:before:w-full ${location.pathname === '/dashboard' ? 'font-bold' : 'font-medium'}`}
                >
                  Organization Panel
                </Link>
              )}
            </SignedIn>

            <SignedOut>
              <Link
                to='/login'
                className='relative text-[#3C3C3C] hover:text-[#88242C] font-medium transition-colors duration-200 flex items-center gap-2 before:absolute before:bottom-0 before:left-0 before:w-0 before:h-0.5 before:bg-[#88242C] before:transition-all before:duration-300 hover:before:w-full'
                aria-label='Login to your account'
              >
                <IoPersonSharp className='text-xl' role='presentation' />
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
              onClick={toggleMobileMenu}
              className='focus:outline-none focus:ring-2 focus:ring-[#88242C] rounded-md p-2 transition-colors duration-200 text-[#3C3C3C] hover:text-[#88242C]'
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls='mobile-menu'
            >
              {isMobileMenuOpen ? (
                <IoClose className='h-6 w-6' />
              ) : (
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
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div id='mobile-menu' className='md:hidden bg-white border-b border-gray-200' role='menu'>
          <div className='px-4 pt-2 pb-4 space-y-1'>
            <Link
              to='/'
              onClick={closeMobileMenu}
              className={`block px-3 py-2 rounded-md text-base ${location.pathname === '/' ? 'font-bold text-[#88242C] bg-red-50' : 'font-medium text-[#3C3C3C] hover:text-[#88242C] hover:bg-gray-50'}`}
              role='menuitem'
            >
              Home
            </Link>
            <Link
              to='/about'
              onClick={closeMobileMenu}
              className={`block px-3 py-2 rounded-md text-base ${location.pathname === '/about' ? 'font-bold text-[#88242C] bg-red-50' : 'font-medium text-[#3C3C3C] hover:text-[#88242C] hover:bg-gray-50'}`}
              role='menuitem'
            >
              About Us
            </Link>
            <Link
              to='/announcements'
              onClick={closeMobileMenu}
              className={`block px-3 py-2 rounded-md text-base ${location.pathname === '/announcements' ? 'font-bold text-[#88242C] bg-red-50' : 'font-medium text-[#3C3C3C] hover:text-[#88242C] hover:bg-gray-50'}`}
              role='menuitem'
            >
              Announcements
            </Link>
            <Link
              to='/blogs'
              onClick={closeMobileMenu}
              className={`block px-3 py-2 rounded-md text-base ${location.pathname === '/blogs' ? 'font-bold text-[#88242C] bg-red-50' : 'font-medium text-[#3C3C3C] hover:text-[#88242C] hover:bg-gray-50'}`}
              role='menuitem'
            >
              Blogs
            </Link>
            <Link
              to='/register'
              onClick={closeMobileMenu}
              className={`block px-3 py-2 rounded-md text-base ${location.pathname === '/register' ? 'font-bold text-[#88242C] bg-red-50' : 'font-medium text-[#3C3C3C] hover:text-[#88242C] hover:bg-gray-50'}`}
              role='menuitem'
            >
              Get Involved
            </Link>

            <SignedIn>
              {isAdmin ? (
                <Link
                  to='/admin/dashboard'
                  onClick={closeMobileMenu}
                  className={`block px-3 py-2 rounded-md text-base ${location.pathname.startsWith('/admin') ? 'font-bold text-[#88242C] bg-red-50' : 'font-medium text-[#3C3C3C] hover:text-[#88242C] hover:bg-gray-50'}`}
                  role='menuitem'
                >
                  Admin Panel
                </Link>
              ) : (
                <Link
                  to='/dashboard'
                  onClick={closeMobileMenu}
                  className={`block px-3 py-2 rounded-md text-base ${location.pathname === '/dashboard' ? 'font-bold text-[#88242C] bg-red-50' : 'font-medium text-[#3C3C3C] hover:text-[#88242C] hover:bg-gray-50'}`}
                  role='menuitem'
                >
                  Organization Panel
                </Link>
              )}
            </SignedIn>

            <SignedOut>
              <Link
                to='/login'
                onClick={closeMobileMenu}
                className='block px-3 py-2 rounded-md text-base font-medium text-[#3C3C3C] hover:text-[#88242C] hover:bg-gray-50 flex items-center gap-2'
                role='menuitem'
              >
                <IoPersonSharp className='text-xl' />
                Sign In
              </Link>
            </SignedOut>

            <SignedIn>
              <div className='px-3 py-2 flex items-center gap-2'>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: 'w-9 h-9',
                    },
                  }}
                  afterSignOutUrl='/login'
                />
                <span className='text-sm text-gray-600'>Account</span>
              </div>
            </SignedIn>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
