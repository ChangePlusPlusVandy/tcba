import { Link } from 'react-router-dom';
import tcbaFooterLogo from '../assets/tcbaFooter.png';

const Footer = () => {
  return (
    <footer className='w-full mt-auto' style={{ backgroundColor: '#EBF3FF' }}>
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
                className='text-sm transition-colors duration-200'
                style={{ color: '#3C3C3C' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#88242C')}
                onMouseLeave={e => (e.currentTarget.style.color = '#3C3C3C')}
              >
                About Us
              </Link>
              <Link
                to='/announcements'
                className='text-sm transition-colors duration-200'
                style={{ color: '#3C3C3C' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#88242C')}
                onMouseLeave={e => (e.currentTarget.style.color = '#3C3C3C')}
              >
                Announcements
              </Link>
              <Link
                to='/blog'
                className='text-sm transition-colors duration-200'
                style={{ color: '#3C3C3C' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#88242C')}
                onMouseLeave={e => (e.currentTarget.style.color = '#3C3C3C')}
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
                className='text-sm transition-colors duration-200'
                style={{ color: '#3C3C3C' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#88242C')}
                onMouseLeave={e => (e.currentTarget.style.color = '#3C3C3C')}
              >
                Organization Signup
              </Link>
              <Link
                to='/email-signup'
                className='text-sm transition-colors duration-200'
                style={{ color: '#3C3C3C' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#88242C')}
                onMouseLeave={e => (e.currentTarget.style.color = '#3C3C3C')}
              >
                Email Signup
              </Link>
              <Link
                to='/contact'
                className='text-sm transition-colors duration-200'
                style={{ color: '#3C3C3C' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#88242C')}
                onMouseLeave={e => (e.currentTarget.style.color = '#3C3C3C')}
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
