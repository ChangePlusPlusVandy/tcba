import { lazy, Suspense } from 'react';
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
import Announcement from '../pages/AnnouncementPage/Announcement';
import Blog from '../pages/BlogPage/Blog';
import BlogsPage from '../pages/BlogsPage/Blogs';

const DashboardPage = lazy(() => import('../pages/OrganizationView/DashboardPage/Dashboard'));
const ProfilePage = lazy(() => import('../pages/OrganizationView/ProfilePage/Profile'));
const OrgAlertsPage = lazy(() => import('../pages/OrganizationView/AlertsPage/Alerts'));
const OrgSurveysPage = lazy(() => import('../pages/OrganizationView/SurveysPage/Surveys'));
const OrgAnnouncementsPage = lazy(() => import('../pages/OrganizationView/AnnouncementsPage/Announcements'));
const OrgBlogsPage = lazy(() => import('../pages/OrganizationView/BlogsPage/Blogs'));
const OrgSettingsPage = lazy(() => import('../pages/OrganizationView/SettingsPage/Settings'));
const OrganizationsList = lazy(() => import('../pages/OrganizationView/OrganizationsListPage/OrganizationsList'));
const OrganizationMessages = lazy(() => import('../pages/OrganizationView/MessagesPage/Messages'));

const AdminDashboard = lazy(() => import('../pages/Admin/AdminDashboard/AdminDashboard'));
const OrganizationManagement = lazy(() => import('../pages/Admin/OrganizationManagementPage/OrganizationManagement'));
const AdminAnnouncements = lazy(() => import('../pages/Admin/AnnouncementsPage/Announcements'));
const AdminBlogs = lazy(() => import('../pages/Admin/BlogsPage/Blogs'));
const AdminAlerts = lazy(() => import('../pages/Admin/AlertsPage/Alerts'));
const AdminSurveys = lazy(() => import('../pages/Admin/SurveysPage/Surveys'));
const CreateSurvey = lazy(() => import('../pages/Admin/SurveysPage/CreateSurvey'));
const SurveyResponses = lazy(() => import('../pages/Admin/SurveyResponsesPage/SurveyResponses'));
const SurveySummary = lazy(() => import('../pages/Admin/SurveyResponsesPage/SurveySummary'));
const HomePageEdit = lazy(() => import('../pages/Admin/PageEditPages/HomePage/HomePageEdit'));
const AboutPageEdit = lazy(() => import('../pages/Admin/PageEditPages/AboutPage/AboutPageEdit'));
const RegisterPageEdit = lazy(() => import('../pages/Admin/PageEditPages/RegisterPage/RegisterPageEdit'));
const ContactPageEdit = lazy(() => import('../pages/Admin/PageEditPages/ContactPage/ContactPageEdit'));
const EmailSignupPageEdit = lazy(() => import('../pages/Admin/PageEditPages/EmailSignupPage/EmailSignupPageEdit'));
const AnnouncementsPageEdit = lazy(() => import('../pages/Admin/PageEditPages/AnnouncementsPage/AnnouncementsPageEdit'));
const BlogsPageEdit = lazy(() => import('../pages/Admin/PageEditPages/BlogsPage/BlogsPageEdit'));
const CustomEmail = lazy(() => import('../pages/Admin/CustomEmailPage/CustomEmail'));
const AdminMessages = lazy(() => import('../pages/Admin/MessagesPage/Messages'));
const Tags = lazy(() => import('../pages/Admin/TagsPage/Tags'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-lg">Loading...</div>
  </div>
);

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
            <Suspense fallback={<PageLoader />}>
              <DashboardPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path='/profile'
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <ProfilePage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path='/alerts'
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <OrgAlertsPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path='/surveys'
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <OrgSurveysPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path='/settings'
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <OrgSettingsPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path='/organizations'
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <OrganizationsList />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path='/org-announcements'
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <OrgAnnouncementsPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path='/org-blogs'
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <OrgBlogsPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path='/messages'
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <OrganizationMessages />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path='/admin'
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <AdminDashboard />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/admin/dashboard'
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <AdminDashboard />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/admin/organizations'
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <OrganizationManagement />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/admin/announcements'
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <AdminAnnouncements />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/admin/blogs'
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <AdminBlogs />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/admin/alerts'
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <AdminAlerts />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/admin/surveys'
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <AdminSurveys />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/admin/surveys/create'
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <CreateSurvey />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/admin/surveys/edit/:id'
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <CreateSurvey />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/admin/surveys/:surveyId/responses'
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <SurveyResponses />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/admin/surveys/:surveyId/responses/summary'
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <SurveySummary />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/admin/email'
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <CustomEmail />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/admin/tags'
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <Tags />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/admin/messages'
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <AdminMessages />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/admin/page-edit/home'
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <HomePageEdit />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/admin/page-edit/about'
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <AboutPageEdit />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/admin/page-edit/register'
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <RegisterPageEdit />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/admin/page-edit/contact'
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <ContactPageEdit />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/admin/page-edit/signup'
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <EmailSignupPageEdit />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/admin/page-edit/announcements'
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <AnnouncementsPageEdit />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/admin/page-edit/blogs'
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <BlogsPageEdit />
            </Suspense>
          </AdminRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
