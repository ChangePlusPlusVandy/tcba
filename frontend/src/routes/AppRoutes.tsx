import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import HomePage from '../pages/Home';
import AboutPage from '../pages/About';
import OrganizationsPage from '../pages/Organizations';
import ResourcesPage from '../pages/Resources';
import ContactPage from '../pages/Contact';
import LoginPage from '../pages/Login';
import RegisterPage from '../pages/Register';
import DashboardPage from '../pages/Dashboard';
import ProfilePage from '../pages/Profile';
import AdminDashboard from '../pages/Admin/Dashboard';
import OrganizationManagement from '../pages/Admin/OrganizationManagement';

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
