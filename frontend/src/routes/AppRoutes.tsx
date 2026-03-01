import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MutatingDots } from 'react-loader-spinner';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminRoute from '../components/AdminRoute';
import AlertResponses from '../pages/Admin/AlertsPage/AlertResponses';
import AlertSummary from '../pages/Admin/AlertsPage/AlertSummary';

const HomePage = lazy(() => import('../pages/HomePage/Home'));
const AboutPage = lazy(() => import('../pages/AboutPage/About'));
const AdvocacyPage = lazy(() => import('../pages/AdvocacyPage/Advocacy'));
const AnnouncementsPage = lazy(() => import('../pages/AnnouncementsPage/Announcements'));
const ContactPage = lazy(() => import('../pages/ContactPage/Contact'));
const LoginPage = lazy(() => import('../pages/LoginPage/Login'));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage/ForgotPassword'));
const RegisterPage = lazy(() => import('../pages/RegisterPage/Register'));
const SignupPage = lazy(() => import('../pages/SignupPage/Signup'));
const UnsubscribePage = lazy(() => import('../pages/UnsubscribePage/Unsubscribe'));
const Announcement = lazy(() => import('../pages/AnnouncementPage/Announcement'));
const Blog = lazy(() => import('../pages/BlogPage/Blog'));
const BlogsPage = lazy(() => import('../pages/BlogsPage/Blogs'));

const DashboardPage = lazy(() => import('../pages/OrganizationView/DashboardPage/Dashboard'));
const ProfilePage = lazy(() => import('../pages/OrganizationView/ProfilePage/Profile'));
const OrgAlertsPage = lazy(() => import('../pages/OrganizationView/AlertsPage/Alerts'));
const OrgSurveysPage = lazy(() => import('../pages/OrganizationView/SurveysPage/Surveys'));
const OrgAnnouncementsPage = lazy(
  () => import('../pages/OrganizationView/AnnouncementsPage/Announcements')
);
const OrgBlogsPage = lazy(() => import('../pages/OrganizationView/BlogsPage/Blogs'));
const OrgSettingsPage = lazy(() => import('../pages/OrganizationView/SettingsPage/Settings'));
const OrganizationsList = lazy(
  () => import('../pages/OrganizationView/OrganizationsListPage/OrganizationsList')
);
const OrganizationMessages = lazy(() => import('../pages/OrganizationView/MessagesPage/Messages'));

const AdminDashboard = lazy(() => import('../pages/Admin/AdminDashboard/AdminDashboard'));
const OrganizationManagement = lazy(
  () => import('../pages/Admin/OrganizationManagementPage/OrganizationManagement')
);
const AdminAnnouncements = lazy(() => import('../pages/Admin/AnnouncementsPage/Announcements'));
const AdminBlogs = lazy(() => import('../pages/Admin/BlogsPage/Blogs'));
const AdminAlerts = lazy(() => import('../pages/Admin/AlertsPage/Alerts'));
const AdminSurveys = lazy(() => import('../pages/Admin/SurveysPage/Surveys'));
const CreateSurvey = lazy(() => import('../pages/Admin/SurveysPage/CreateSurvey'));
const SurveyResponses = lazy(() => import('../pages/Admin/SurveyResponsesPage/SurveyResponses'));
const SurveySummary = lazy(() => import('../pages/Admin/SurveyResponsesPage/SurveySummary'));
const HomePageEdit = lazy(() => import('../pages/Admin/PageEditPages/HomePage/HomePageEdit'));
const AboutPageEdit = lazy(() => import('../pages/Admin/PageEditPages/AboutPage/AboutPageEdit'));
const RegisterPageEdit = lazy(
  () => import('../pages/Admin/PageEditPages/RegisterPage/RegisterPageEdit')
);
const ContactPageEdit = lazy(
  () => import('../pages/Admin/PageEditPages/ContactPage/ContactPageEdit')
);
const EmailSignupPageEdit = lazy(
  () => import('../pages/Admin/PageEditPages/EmailSignupPage/EmailSignupPageEdit')
);
const AnnouncementsPageEdit = lazy(
  () => import('../pages/Admin/PageEditPages/AnnouncementsPage/AnnouncementsPageEdit')
);
const BlogsPageEdit = lazy(() => import('../pages/Admin/PageEditPages/BlogsPage/BlogsPageEdit'));
const AdvocacyPageEdit = lazy(
  () => import('../pages/Admin/PageEditPages/AdvocacyPage/AdvocacyPageEdit')
);
const CustomEmail = lazy(() => import('../pages/Admin/CustomEmailPage/CustomEmail'));
const AdminMessages = lazy(() => import('../pages/Admin/MessagesPage/Messages'));
const Tags = lazy(() => import('../pages/Admin/TagsPage/Tags'));
const EventManagementPage = lazy(() => import('../pages/Admin/EventManagementPage'));
const OrgEventsPage = lazy(() => import('../pages/OrganizationView/EventsPage'));
const PublicEventsPage = lazy(() => import('../pages/PublicEventsPage'));

const PageLoader = () => {
  return (
    <div className='flex items-center justify-center min-h-screen bg-gray-50'>
      <MutatingDots
        visible={true}
        height='100'
        width='100'
        color='#D54242'
        secondaryColor='#D54242'
        radius='12.5'
        ariaLabel='mutating-dots-loading'
      />
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path='/'
        element={
          <Suspense fallback={<PageLoader />}>
            <HomePage />
          </Suspense>
        }
      />
      <Route
        path='/home'
        element={
          <Suspense fallback={<PageLoader />}>
            <HomePage />
          </Suspense>
        }
      />
      <Route
        path='/about'
        element={
          <Suspense fallback={<PageLoader />}>
            <AboutPage />
          </Suspense>
        }
      />
      <Route
        path='/advocacy'
        element={
          <Suspense fallback={<PageLoader />}>
            <AdvocacyPage />
          </Suspense>
        }
      />
      <Route
        path='/announcements'
        element={
          <Suspense fallback={<PageLoader />}>
            <AnnouncementsPage />
          </Suspense>
        }
      />
      <Route
        path='/announcement/:slug'
        element={
          <Suspense fallback={<PageLoader />}>
            <Announcement />
          </Suspense>
        }
      />
      <Route
        path='/blogs'
        element={
          <Suspense fallback={<PageLoader />}>
            <BlogsPage />
          </Suspense>
        }
      />
      <Route
        path='/blog/:slug'
        element={
          <Suspense fallback={<PageLoader />}>
            <Blog />
          </Suspense>
        }
      />
      <Route
        path='/contact'
        element={
          <Suspense fallback={<PageLoader />}>
            <ContactPage />
          </Suspense>
        }
      />
      <Route
        path='/login'
        element={
          <Suspense fallback={<PageLoader />}>
            <LoginPage />
          </Suspense>
        }
      />
      <Route
        path='/forgot-password'
        element={
          <Suspense fallback={<PageLoader />}>
            <ForgotPasswordPage />
          </Suspense>
        }
      />
      <Route
        path='/register'
        element={
          <Suspense fallback={<PageLoader />}>
            <RegisterPage />
          </Suspense>
        }
      />
      <Route
        path='/email-signup'
        element={
          <Suspense fallback={<PageLoader />}>
            <SignupPage />
          </Suspense>
        }
      />
      <Route
        path='/unsubscribe'
        element={
          <Suspense fallback={<PageLoader />}>
            <UnsubscribePage />
          </Suspense>
        }
      />
      <Route
        path='/events'
        element={
          <Suspense fallback={<PageLoader />}>
            <PublicEventsPage />
          </Suspense>
        }
      />

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
        path='/org-events'
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <OrgEventsPage />
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
        path='/admin/alerts/:alertId/responses'
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <AlertResponses />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/admin/alerts/:alertId/responses/summary'
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <AlertSummary />
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
        path='/admin/page-edit/advocacy'
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <AdvocacyPageEdit />
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
      <Route
        path='/admin/events'
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <EventManagementPage />
            </Suspense>
          </AdminRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
