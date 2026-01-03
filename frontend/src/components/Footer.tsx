import { Link } from 'react-router-dom';
import tcbaFooterLogo from '../assets/tcbaFooter.png';

const Footer = () => {
  return (
    <footer className='w-full mt-auto pt-12' style={{ backgroundColor: '#EBF3FF' }}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='flex items-center justify-center gap-56'>
          <img src={tcbaFooterLogo} alt='TN Coalition for Better Aging' className='h-16 w-auto' />

          <div className='flex gap-12'>
            <div className='flex flex-col gap-2'>
              <h3 className='font-semibold text-sm mb-1' style={{ color: '#3C3C3C' }}>
                Learn more about us
              </h3>
              <Link
                to='/about'
                className='relative text-sm text-[#3C3C3C] hover:text-[#88242C] transition-colors duration-200 before:absolute before:bottom-0 before:left-0 before:w-0 before:h-0.5 before:bg-[#88242C] before:transition-all before:duration-300 hover:before:w-full w-fit'
              >
                About Us
              </Link>
              <Link
                to='/announcements'
                className='relative text-sm text-[#3C3C3C] hover:text-[#88242C] transition-colors duration-200 before:absolute before:bottom-0 before:left-0 before:w-0 before:h-0.5 before:bg-[#88242C] before:transition-all before:duration-300 hover:before:w-full w-fit'
              >
                Announcements
              </Link>
              <Link
                to='/blog'
                className='relative text-sm text-[#3C3C3C] hover:text-[#88242C] transition-colors duration-200 before:absolute before:bottom-0 before:left-0 before:w-0 before:h-0.5 before:bg-[#88242C] before:transition-all before:duration-300 hover:before:w-full w-fit'
              >
                Blogs
              </Link>
            </div>

            <div className='flex flex-col gap-2'>
              <h3 className='font-semibold text-sm mb-1' style={{ color: '#3C3C3C' }}>
                Get involved
              </h3>
              <Link
                to='/register'
                className='relative text-sm text-[#3C3C3C] hover:text-[#88242C] transition-colors duration-200 before:absolute before:bottom-0 before:left-0 before:w-0 before:h-0.5 before:bg-[#88242C] before:transition-all before:duration-300 hover:before:w-full w-fit'
              >
                Organization Signup
              </Link>
              <Link
                to='/email-signup'
                className='relative text-sm text-[#3C3C3C] hover:text-[#88242C] transition-colors duration-200 before:absolute before:bottom-0 before:left-0 before:w-0 before:h-0.5 before:bg-[#88242C] before:transition-all before:duration-300 hover:before:w-full w-fit'
              >
                Email Signup
              </Link>
              <Link
                to='/contact'
                className='relative text-sm text-[#3C3C3C] hover:text-[#88242C] transition-colors duration-200 before:absolute before:bottom-0 before:left-0 before:w-0 before:h-0.5 before:bg-[#88242C] before:transition-all before:duration-300 hover:before:w-full w-fit'
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
