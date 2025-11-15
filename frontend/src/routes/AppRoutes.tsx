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
import OrgAlertsPage from '../pages/OrganizationView/AlertsPage/Alerts';
import OrgSurveysPage from '../pages/OrganizationView/SurveysPage/Surveys';
import OrgAnnouncementsPage from '../pages/OrganizationView/AnnouncementsPage/Announcements';
import OrgBlogsPage from '../pages/OrganizationView/BlogsPage/Blogs';
import OrgSettingsPage from '../pages/OrganizationView/SettingsPage/Settings';
import AdminDashboard from '../pages/Admin/AdminDashboard/AdminDashboard';
import OrganizationManagement from '../pages/Admin/OrganizationManagementPage/OrganizationManagement';
import Announcement from '../pages/AnnouncementPage/Announcement';
import AdminAnnouncements from '../pages/Admin/AnnouncementsPage/Announcements';
import AdminBlogs from '../pages/Admin/BlogsPage/Blogs';
import AdminAlerts from '../pages/Admin/AlertsPage/Alerts';
import AdminSurveys from '../pages/Admin/SurveysPage/Surveys';
import Blog from '../pages/BlogPage/Blog';
import BlogsPage from '../pages/BlogsPage/Blogs';
import CreateAlert from '../pages/Admin/AlertsPage/Create-Alert';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path='/' element={<HomePage />} />
      <Route path='/home' element={<HomePage />} />
      <Route path='/about' element={<AboutPage />} />
      <Route path='/announcements' element={<AnnouncementsPage />} />
      <Route path='/announcement/:slug' element={<Announcement />} />
      <Route path='/blogs' element={<BlogsPage />} />
      <Route path='/blog/:slug' element={<Blog />} />
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
        path='/alerts'
        element={
          <ProtectedRoute>
            <OrgAlertsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path='/surveys'
        element={
          <ProtectedRoute>
            <OrgSurveysPage />
          </ProtectedRoute>
        }
      />
      <Route
        path='/settings'
        element={
          <ProtectedRoute>
            <OrgSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path='/org-announcements'
        element={
          <ProtectedRoute>
            <OrgAnnouncementsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path='/org-blogs'
        element={
          <ProtectedRoute>
            <OrgBlogsPage />
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
        path='/admin/dashboard'
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
      <Route
        path='/admin/announcements'
        element={
          <AdminRoute>
            <AdminAnnouncements />
          </AdminRoute>
        }
      />
      <Route
        path='/admin/blogs'
        element={
          <AdminRoute>
            <AdminBlogs />
          </AdminRoute>
        }
      />
      <Route
        path='/admin/alerts'
        element={
          <AdminRoute>
            <AdminAlerts />
          </AdminRoute>
        }
      />
      <Route
        path='/admin/alerts/create-alert'
        element={
          <AdminRoute>
            <CreateAlert />
          </AdminRoute>
        }
      />
      <Route
        path='/admin/surveys'
        element={
          <AdminRoute>
            <AdminSurveys />
          </AdminRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
