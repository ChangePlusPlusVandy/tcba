import { MutatingDots } from 'react-loader-spinner';
import OrganizationSidebar from '../../../components/OrganizationSidebar';

const OrganizationMessages = () => {
  // replace this harcoded loading=false with actual data fetching hook when messaging is implemented
  const loading = false;

  if (loading) {
    return (
      <div className='flex min-h-screen bg-gray-50'>
        <OrganizationSidebar />
        <div className='flex-1 flex items-center justify-center'>
          <MutatingDots
            visible={true}
            height='100'
            width='100'
            color='#D54242'
            secondaryColor='#D54242'
            radius='12.5'
            ariaLabel='mutating-dots-loading'
          />
        </div>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <OrganizationSidebar />
      <div className='flex-1 p-8'>
        <div className='max-w-7xl mx-auto'>
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>Messages</h1>
            <p className='text-gray-600'>Send and receive messages with organizations</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationMessages;
