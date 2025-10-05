import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import HomePage from '../pages/HomePage/Home';
import AboutPage from '../pages/AboutPage/About';
import OrganizationsPage from '../pages/OrganizationsPage/Organizations';
import ResourcesPage from '../pages/ResourcesPage/Resources';
import ContactPage from '../pages/ContactPage/Contact';
import LoginPage from '../pages/LoginPage/Login';
import RegisterPage from '../pages/RegisterPage/Register';
import DashboardPage from '../pages/DashboardPage/Dashboard';
import ProfilePage from '../pages/ProfilePage/Profile';
import AdminDashboard from '../pages/Admin/AdminDashboard/AdminDashboard';
import OrganizationManagement from '../pages/Admin/OrganizationManagementPage/OrganizationManagement';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path='/' element={<HomePage />} />
      <Route path='/about' element={<AboutPage />} />
      <Route path='/organizations' element={<OrganizationsPage />} />
      <Route path='/resources' element={<ResourcesPage />} />
      <Route path='/contact' element={<ContactPage />} />
      <Route path='/login' element={<LoginPage />} />
      <Route path='/register' element={<RegisterPage />} />

      <Route
        path='/dashboard'
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path='/profile'
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path='/admin'
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path='/admin/organizations'
        element={
          <ProtectedRoute>
            <OrganizationManagement />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
