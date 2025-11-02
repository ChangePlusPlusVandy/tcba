import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminRoute from '../components/AdminRoute';
import HomePage from '../pages/HomePage/Home';
import AboutPage from '../pages/AboutPage/About';
import AnnouncementsPage from '../pages/AnnouncementsPage/Announcements';
import ResourcesPage from '../pages/ResourcesPage/Resources';
import ContactPage from '../pages/ContactPage/Contact';
import LoginPage from '../pages/LoginPage/Login';
import ForgotPasswordPage from '../pages/ForgotPasswordPage/ForgotPassword';
import RegisterPage from '../pages/RegisterPage/Register';
import SignupPage from '../pages/SignupPage/Signup';
import DashboardPage from '../pages/OrganizationView/DashboardPage/Dashboard';
import ProfilePage from '../pages/OrganizationView/ProfilePage/Profile';
import AdminDashboard from '../pages/Admin/AdminDashboard/AdminDashboard';
import OrganizationManagement from '../pages/Admin/OrganizationManagementPage/OrganizationManagement';
import BlogPage from '../pages/BlogPage/Blog';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path='/' element={<HomePage />} />
      <Route path='/home' element={<HomePage />} />
      <Route path='/about' element={<AboutPage />} />
      <Route path='/announcements' element={<AnnouncementsPage />} />
      <Route path='/blog' element={<BlogPage />} />
      <Route path='/resources' element={<ResourcesPage />} />
      <Route path='/contact' element={<ContactPage />} />
      <Route path='/login' element={<LoginPage />} />
      <Route path='/forgot-password' element={<ForgotPasswordPage />} />
      <Route path='/register' element={<RegisterPage />} />
      <Route path='/email-signup' element={<SignupPage />} />

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
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path='/admin/organizations'
        element={
          <AdminRoute>
            <OrganizationManagement />
          </AdminRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
