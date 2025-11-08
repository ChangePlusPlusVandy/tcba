import AdminSidebar from '../../../components/AdminSidebar';

const AdminDashboard = () => {
  return (
    <div className='flex min-h-screen bg-gray-50'>
      <AdminSidebar />
      <div className='flex-1 p-8'>
        <h1 className='text-3xl font-bold text-gray-800 mb-6'>Dashboard</h1>
        <p className='text-gray-600'>Welcome to the admin dashboard.</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
