import { Link } from 'react-router-dom';
import tncbaLogo from '../assets/tcba.jpg';
import { IoPersonSharp } from "react-icons/io5";

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
              className='text-gray-700 hover:text-red-700 font-medium transition-colors duration-200'
            >
              Home
            </Link>
            <Link
              to='/about'
              className='text-gray-700 hover:text-red-700 font-medium transition-colors duration-200'
            >
              About Us
            </Link>
            <Link
              to='/announcements'
              className='text-gray-700 hover:text-red-700 font-medium transition-colors duration-200'
            >
              Announcements
            </Link>
            <Link
              to='/blog'
              className='text-gray-700 hover:text-red-700 font-medium transition-colors duration-200'
            >
              Blog
            </Link>
            <Link
              to='/contact'
              className='text-gray-700 hover:text-red-700 font-medium transition-colors duration-200'
            >
              Contact Us
            </Link>
            <Link
              to='/login'
              className='text-gray-700 hover:text-red-700 font-medium transition-colors duration-200 flex items-center gap-2'
            >
              <IoPersonSharp className='text-xl' />
            </Link>
          </div>

          <div className='md:hidden'>
            <button
              type='button'
              className='text-gray-700 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-700 rounded-md p-2'
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
