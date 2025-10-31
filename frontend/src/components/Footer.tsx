import tcbaFooterLogo from '../assets/tcbaFooter.png';

const Footer = () => {
  return (
    <footer className='w-full mt-auto' style={{ backgroundColor: '#EBF3FF' }}>
      <div className='w-full px-4 sm:px-6 lg:px-8 py-8'>
        <div className='flex justify-start'>
          <img src={tcbaFooterLogo} alt='TN Coalition for Better Aging' className='h-16 w-auto' />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
