import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminRoute from '../components/AdminRoute';
import HomePage from '../pages/HomePage/Home';
import AboutPage from '../pages/AboutPage/About';
import AnnouncementsPage from '../pages/AnnouncementsPage/Announcements';
import ResourcesPage from '../pages/ResourcesPage/Resources';
import ContactPage from '../pages/ContactPage/Contact';
import LoginPage from '../pages/LoginPage/Login';
import RegisterPage from '../pages/RegisterPage/Register';
import DashboardPage from '../pages/OrganizationView/DashboardPage/Dashboard';
import ProfilePage from '../pages/OrganizationView/ProfilePage/Profile';
import AdminDashboard from '../pages/Admin/AdminDashboard/AdminDashboard';
import OrganizationManagement from '../pages/Admin/OrganizationManagementPage/OrganizationManagement';
import Announcement from '../pages/AnnouncementPage/Announcement';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path='/' element={<HomePage />} />
      <Route path='/home' element={<HomePage />} />
      <Route path='/about' element={<AboutPage />} />
      <Route path='/announcements' element={<AnnouncementsPage />} />
      <Route path='/announcement/:id' element={<Announcement />} />
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
