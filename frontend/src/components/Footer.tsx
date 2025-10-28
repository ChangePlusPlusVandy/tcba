import tcbaFooterLogo from '../assets/tcbaFooter.png';

const Footer = () => {
  return (
    <footer className='w-full bg-white border-t border-gray-200 mt-auto'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='flex justify-center'>
          <img src={tcbaFooterLogo} alt='TN Coalition for Better Aging' className='h-16 w-auto' />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
