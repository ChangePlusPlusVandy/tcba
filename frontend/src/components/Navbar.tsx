import { Link } from 'react-router-dom';
import tncbaLogo from '../assets/tcba.jpg';
import { IoPersonSharp } from 'react-icons/io5';

const Navbar = () => {
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
              className='font-medium transition-colors duration-200'
              style={{ color: '#3C3C3C' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#88242C'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#3C3C3C'}
            >
              Home
            </Link>
            <Link
              to='/about'
              className='font-medium transition-colors duration-200'
              style={{ color: '#3C3C3C' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#88242C'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#3C3C3C'}
            >
              About Us
            </Link>
            <Link
              to='/announcements'
              className='font-medium transition-colors duration-200'
              style={{ color: '#3C3C3C' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#88242C'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#3C3C3C'}
            >
              Announcements
            </Link>
            <Link
              to='/blog'
              className='font-medium transition-colors duration-200'
              style={{ color: '#3C3C3C' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#88242C'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#3C3C3C'}
            >
              Blog
            </Link>
            <Link
              to='/contact'
              className='font-medium transition-colors duration-200'
              style={{ color: '#3C3C3C' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#88242C'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#3C3C3C'}
            >
              Contact Us
            </Link>
            <Link
              to='/login'
              className='font-medium transition-colors duration-200 flex items-center gap-2'
              style={{ color: '#3C3C3C' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#88242C'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#3C3C3C'}
            >
              <IoPersonSharp className='text-xl' />
            </Link>
          </div>

          <div className='md:hidden'>
            <button
              type='button'
              className='focus:outline-none focus:ring-2 focus:ring-[#88242C] rounded-md p-2 transition-colors duration-200'
              style={{ color: '#3C3C3C' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#88242C'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#3C3C3C'}
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
