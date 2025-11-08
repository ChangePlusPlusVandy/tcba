import AdminSidebar from '../../../components/AdminSidebar';

const AdminBlogs = () => {
  return (
    <div className='flex min-h-screen bg-gray-50'>
      <AdminSidebar />
      <div className='flex-1 p-8'>
        <h1 className='text-3xl font-bold text-gray-800 mb-6'>Blogs</h1>
      </div>
    </div>
  );
};

export default AdminBlogs;
