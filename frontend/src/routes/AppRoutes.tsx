import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminRoute from '../components/AdminRoute';
import HomePage from '../pages/HomePage/Home';
import AboutPage from '../pages/AboutPage/About';
import AnnouncementsPage from '../pages/AnnouncementsPage/Announcements';
import ContactPage from '../pages/ContactPage/Contact';
import LoginPage from '../pages/LoginPage/Login';
import ForgotPasswordPage from '../pages/ForgotPasswordPage/ForgotPassword';
import RegisterPage from '../pages/RegisterPage/Register';
import SignupPage from '../pages/SignupPage/Signup';
import UnsubscribePage from '../pages/UnsubscribePage/Unsubscribe';
import DashboardPage from '../pages/OrganizationView/DashboardPage/Dashboard';
import ProfilePage from '../pages/OrganizationView/ProfilePage/Profile';
import OrgAlertsPage from '../pages/OrganizationView/AlertsPage/Alerts';
import OrgSurveysPage from '../pages/OrganizationView/SurveysPage/Surveys';
import OrgAnnouncementsPage from '../pages/OrganizationView/AnnouncementsPage/Announcements';
import OrgBlogsPage from '../pages/OrganizationView/BlogsPage/Blogs';
import OrgSettingsPage from '../pages/OrganizationView/SettingsPage/Settings';
import OrganizationsList from '../pages/OrganizationView/OrganizationsListPage/OrganizationsList';
import AdminDashboard from '../pages/Admin/AdminDashboard/AdminDashboard';
import OrganizationManagement from '../pages/Admin/OrganizationManagementPage/OrganizationManagement';
import Announcement from '../pages/AnnouncementPage/Announcement';
import AdminAnnouncements from '../pages/Admin/AnnouncementsPage/Announcements';
import AdminBlogs from '../pages/Admin/BlogsPage/Blogs';
import AdminAlerts from '../pages/Admin/AlertsPage/Alerts';
import AdminSurveys from '../pages/Admin/SurveysPage/Surveys';
import CreateSurvey from '../pages/Admin/SurveysPage/CreateSurvey';
import SurveyResponses from '../pages/Admin/SurveyResponsesPage/SurveyResponses';
import SurveySummary from '../pages/Admin/SurveyResponsesPage/SurveySummary';
import Blog from '../pages/BlogPage/Blog';
import BlogsPage from '../pages/BlogsPage/Blogs';
import HomePageEdit from '../pages/Admin/PageEditPages/HomePage/HomePageEdit';
import AboutPageEdit from '../pages/Admin/PageEditPages/AboutPage/AboutPageEdit';
import RegisterPageEdit from '../pages/Admin/PageEditPages/RegisterPage/RegisterPageEdit';
import ContactPageEdit from '../pages/Admin/PageEditPages/ContactPage/ContactPageEdit';
import EmailSignupPageEdit from '../pages/Admin/PageEditPages/EmailSignupPage/EmailSignupPageEdit';
import AnnouncementsPageEdit from '../pages/Admin/PageEditPages/AnnouncementsPage/AnnouncementsPageEdit';
import BlogsPageEdit from '../pages/Admin/PageEditPages/BlogsPage/BlogsPageEdit';
import CustomEmail from '../pages/Admin/CustomEmailPage/CustomEmail';
import AdminMessages from '../pages/Admin/MessagesPage/Messages';
import OrganizationMessages from '../pages/OrganizationView/MessagesPage/Messages';

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
      <Route path='/contact' element={<ContactPage />} />
      <Route path='/login' element={<LoginPage />} />
      <Route path='/forgot-password' element={<ForgotPasswordPage />} />
      <Route path='/register' element={<RegisterPage />} />
      <Route path='/email-signup' element={<SignupPage />} />
      <Route path='/unsubscribe' element={<UnsubscribePage />} />

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
        path='/organizations'
        element={
          <ProtectedRoute>
            <OrganizationsList />
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
        path='/messages'
        element={
          <ProtectedRoute>
            <OrganizationMessages />
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
        path='/admin/surveys'
        element={
          <AdminRoute>
            <AdminSurveys />
          </AdminRoute>
        }
      />
      <Route
        path='/admin/surveys/create'
        element={
          <AdminRoute>
            <CreateSurvey />
          </AdminRoute>
        }
      />
      <Route
        path='/admin/surveys/edit/:id'
        element={
          <AdminRoute>
            <CreateSurvey />
          </AdminRoute>
        }
      />
      <Route
        path='/admin/surveys/:surveyId/responses'
        element={
          <AdminRoute>
            <SurveyResponses />
          </AdminRoute>
        }
      />
      <Route
        path='/admin/surveys/:surveyId/responses/summary'
        element={
          <AdminRoute>
            <SurveySummary />
          </AdminRoute>
        }
      />
      <Route
        path='/admin/email'
        element={
          <AdminRoute>
            <CustomEmail />
          </AdminRoute>
        }
      />
      <Route
        path='/admin/messages'
        element={
          <AdminRoute>
            <AdminMessages />
          </AdminRoute>
        }
      />
      <Route
        path='/admin/page-edit/home'
        element={
          <AdminRoute>
            <HomePageEdit />
          </AdminRoute>
        }
      />
      <Route
        path='/admin/page-edit/about'
        element={
          <AdminRoute>
            <AboutPageEdit />
          </AdminRoute>
        }
      />
      <Route
        path='/admin/page-edit/register'
        element={
          <AdminRoute>
            <RegisterPageEdit />
          </AdminRoute>
        }
      />
      <Route
        path='/admin/page-edit/contact'
        element={
          <AdminRoute>
            <ContactPageEdit />
          </AdminRoute>
        }
      />
      <Route
        path='/admin/page-edit/signup'
        element={
          <AdminRoute>
            <EmailSignupPageEdit />
          </AdminRoute>
        }
      />
      <Route
        path='/admin/page-edit/announcements'
        element={
          <AdminRoute>
            <AnnouncementsPageEdit />
          </AdminRoute>
        }
      />
      <Route
        path='/admin/page-edit/blogs'
        element={
          <AdminRoute>
            <BlogsPageEdit />
          </AdminRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
