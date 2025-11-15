import AdminSidebar from '../../../components/AdminSidebar';

const AdminMessages = () => {
  return (
    <div className='flex min-h-screen bg-gray-50'>
      <AdminSidebar />
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

export default AdminMessages;
