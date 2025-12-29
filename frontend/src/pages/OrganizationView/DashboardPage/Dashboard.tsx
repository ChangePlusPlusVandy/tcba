import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import OrganizationSidebar from '../../../components/OrganizationSidebar';
import { API_BASE_URL } from '../../../config/api';
import { useDashboardData } from '../../../hooks/queries/useDashboardData';

interface DashboardStats {
  newAlerts: number;
  newSurveys: number;
  newAnnouncements: number;
  newBlogs: number;
}

interface ContentItem {
  id: string;
  title: string;
  excerpt?: string;
  createdAt: string;
  type: 'alert' | 'survey' | 'announcement' | 'blog';
  priority?: string;
  dueDate?: string;
}

const DashboardPage = () => {
  const { getToken } = useAuth();
  const { orgProfile, alerts, surveys, surveyResponses, announcements, blogs, isLoading } = useDashboardData();

  const lastCheckedDates = useMemo(() => ({
    alerts: orgProfile?.lastCheckedAlertsAt ? new Date(orgProfile.lastCheckedAlertsAt) : null,
    announcements: orgProfile?.lastCheckedAnnouncementsAt ? new Date(orgProfile.lastCheckedAnnouncementsAt) : null,
    blogs: orgProfile?.lastCheckedBlogsAt ? new Date(orgProfile.lastCheckedBlogsAt) : null,
    messages: orgProfile?.lastCheckedMessagesAt ? new Date(orgProfile.lastCheckedMessagesAt) : null,
  }), [orgProfile]);

  const { stats, latestItems } = useMemo(() => {
    const computedStats: DashboardStats = {
      newAlerts: 0,
      newSurveys: 0,
      newAnnouncements: 0,
      newBlogs: 0,
    };
    const computedLatest: {
      alert?: ContentItem;
      survey?: ContentItem;
      announcement?: ContentItem;
      blog?: ContentItem;
    } = {};

    if (alerts) {
      const alertsData = (alerts.data || alerts).filter((a: any) => a.isPublished);
      const newAlerts = lastCheckedDates.alerts
        ? alertsData.filter((a: any) => new Date(a.publishedDate || a.createdAt) > lastCheckedDates.alerts!)
        : alertsData;
      computedStats.newAlerts = newAlerts.length;
      if (newAlerts[0]) {
        computedLatest.alert = {
          id: newAlerts[0].id,
          title: newAlerts[0].title,
          excerpt: newAlerts[0].message?.substring(0, 150),
          createdAt: newAlerts[0].publishedDate || newAlerts[0].createdAt,
          type: 'alert',
          priority: newAlerts[0].priority,
        };
      }
    }

    if (surveys && surveyResponses) {
      const activeSurveys = surveys.filter((s: any) => s.isActive && s.isPublished);
      const completedSurveyIds = surveyResponses
        .filter((r: any) => r.submittedDate)
        .map((r: any) => r.surveyId);
      const incompleteSurveys = activeSurveys.filter((s: any) => !completedSurveyIds.includes(s.id));
      computedStats.newSurveys = incompleteSurveys.length;
      if (incompleteSurveys[0]) {
        computedLatest.survey = {
          id: incompleteSurveys[0].id,
          title: incompleteSurveys[0].title,
          excerpt: incompleteSurveys[0].description?.substring(0, 150),
          createdAt: incompleteSurveys[0].createdAt,
          type: 'survey',
          dueDate: incompleteSurveys[0].dueDate,
        };
      }
    }

    if (announcements) {
      const announcementsData = (announcements.data || announcements).filter((a: any) => a.isPublished);
      const newAnnouncements = lastCheckedDates.announcements
        ? announcementsData.filter((a: any) => new Date(a.publishedDate || a.createdAt) > lastCheckedDates.announcements!)
        : announcementsData;
      computedStats.newAnnouncements = newAnnouncements.length;
      if (newAnnouncements[0]) {
        computedLatest.announcement = {
          id: newAnnouncements[0].id,
          title: newAnnouncements[0].title,
          excerpt: newAnnouncements[0].content?.substring(0, 150),
          createdAt: newAnnouncements[0].publishedDate || newAnnouncements[0].createdAt,
          type: 'announcement',
        };
      }
    }

    if (blogs) {
      const blogsData = (blogs.data || blogs).filter((b: any) => b.isPublished);
      const newBlogs = lastCheckedDates.blogs
        ? blogsData.filter((b: any) => new Date(b.createdAt) > lastCheckedDates.blogs!)
        : blogsData;
      computedStats.newBlogs = newBlogs.length;
      if (newBlogs[0]) {
        computedLatest.blog = {
          id: newBlogs[0].id,
          title: newBlogs[0].title,
          excerpt: newBlogs[0].content?.substring(0, 150),
          createdAt: newBlogs[0].createdAt,
          type: 'blog',
        };
      }
    }

    return { stats: computedStats, latestItems: computedLatest };
  }, [alerts, surveys, surveyResponses, announcements, blogs, lastCheckedDates]);

  const loading = isLoading;

  const markAsViewed = async (contentType: string) => {
    try {
      const token = await getToken();
      await fetch(`${API_BASE_URL}/api/organizations/mark-viewed`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ contentType }),
      });

      fetchDashboardData();
    } catch (error) {
      console.error('Error marking content as viewed:', error);
    }
  };

  const getStatCardRoute = (type: string) => {
    switch (type) {
      case 'alerts':
        return '/alerts';
      case 'surveys':
        return '/surveys';
      case 'announcements':
        return '/announcements';
      case 'blogs':
        return '/blogs';
      default:
        return '/';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return diffInHours === 0 ? 'Just now' : `${diffInHours}h ago`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }
    return date.toLocaleDateString();
  };

  const statCards = [
    {
      label: 'New Alerts',
      value: stats.newAlerts,
      type: 'alerts',
      icon: (
        <svg
          className='w-5 h-5 text-gray-600'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
          />
        </svg>
      ),
      color: 'bg-gray-50 hover:bg-gray-100',
    },
    {
      label: 'Surveys to Complete',
      value: stats.newSurveys,
      type: 'surveys',
      icon: (
        <svg
          className='w-5 h-5 text-gray-600'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
          />
        </svg>
      ),
      color: 'bg-gray-50 hover:bg-gray-100',
    },
    {
      label: 'New Announcements',
      value: stats.newAnnouncements,
      type: 'announcements',
      icon: (
        <svg
          className='w-5 h-5 text-gray-600'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z'
          />
        </svg>
      ),
      color: 'bg-gray-50 hover:bg-gray-100',
    },
    {
      label: 'New Blog Posts',
      value: stats.newBlogs,
      type: 'blogs',
      icon: (
        <svg
          className='w-5 h-5 text-gray-600'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z'
          />
        </svg>
      ),
      color: 'bg-gray-50 hover:bg-gray-100',
    },
  ];

  if (loading) {
    return (
      <div className='flex min-h-screen bg-gray-50'>
        <OrganizationSidebar />
        <div className='flex-1 flex items-center justify-center'>
          <div className='text-lg'>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <OrganizationSidebar />
      <div className='flex-1 p-8 overflow-auto'>
        <div className='max-w-7xl mx-auto'>
          <h1 className='text-3xl font-bold text-gray-800 mb-6'>Dashboard</h1>

          <div className='bg-white rounded-xl shadow-sm p-6 mb-8'>
            <h2 className='text-lg font-semibold text-gray-800 mb-4'>Your Updates</h2>
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
              {statCards.map((stat, index) => (
                <Link
                  key={index}
                  to={getStatCardRoute(stat.type)}
                  onClick={() => markAsViewed(stat.type)}
                  className={`${stat.color} rounded-xl p-4 transition-colors text-left cursor-pointer`}
                >
                  <div className='flex items-center justify-between mb-2'>
                    {stat.icon}
                    {stat.value > 0 && <span className='w-2 h-2 rounded-full bg-[#D54242]'></span>}
                  </div>
                  <p className='text-2xl font-bold text-gray-800'>{stat.value}</p>
                  <p className='text-sm text-gray-600'>{stat.label}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <div className='bg-white rounded-xl shadow-sm p-6'>
              <h3 className='text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                <svg
                  className='w-5 h-5 text-gray-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                  />
                </svg>
                Latest Alert
              </h3>
              {latestItems.alert ? (
                <>
                  <div className='flex items-center justify-between mb-2'>
                    <h4 className='font-medium text-gray-900'>{latestItems.alert.title}</h4>
                    {latestItems.alert.priority && (
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          latestItems.alert.priority === 'HIGH'
                            ? 'bg-red-100 text-red-700'
                            : latestItems.alert.priority === 'MEDIUM'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {latestItems.alert.priority}
                      </span>
                    )}
                  </div>
                  {latestItems.alert.excerpt && (
                    <div
                      className='text-sm text-gray-600 mb-3 line-clamp-2'
                      dangerouslySetInnerHTML={{ __html: latestItems.alert.excerpt + '...' }}
                    />
                  )}
                  <div className='flex items-center justify-between'>
                    <span className='text-xs text-gray-400'>
                      {formatDate(latestItems.alert.createdAt)}
                    </span>
                    <Link
                      to='/alerts'
                      className='text-sm text-[#D54242] hover:text-[#b53a3a] font-medium'
                    >
                      View Details →
                    </Link>
                  </div>
                </>
              ) : (
                <p className='text-gray-500 text-center py-8'>No updates</p>
              )}
            </div>

            <div className='bg-white rounded-xl shadow-sm p-6'>
              <h3 className='text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                <svg
                  className='w-5 h-5 text-gray-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                  />
                </svg>
                Latest Survey
              </h3>
              {latestItems.survey ? (
                <>
                  <div className='flex items-center justify-between mb-2'>
                    <h4 className='font-medium text-gray-900'>{latestItems.survey.title}</h4>
                    {latestItems.survey.dueDate && (
                      <span className='text-xs text-gray-500'>
                        Due: {new Date(latestItems.survey.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {latestItems.survey.excerpt && (
                    <p className='text-sm text-gray-600 mb-3 line-clamp-2'>
                      {latestItems.survey.excerpt}...
                    </p>
                  )}
                  <div className='flex items-center justify-between'>
                    <span className='text-xs text-gray-400'>
                      {formatDate(latestItems.survey.createdAt)}
                    </span>
                    <Link
                      to='/surveys'
                      className='text-sm text-[#D54242] hover:text-[#b53a3a] font-medium'
                    >
                      Take Survey →
                    </Link>
                  </div>
                </>
              ) : (
                <p className='text-gray-500 text-center py-8'>No updates</p>
              )}
            </div>

            {/* Latest Announcement */}
            <div className='bg-white rounded-xl shadow-sm p-6'>
              <h3 className='text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                <svg
                  className='w-5 h-5 text-gray-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z'
                  />
                </svg>
                Latest Announcement
              </h3>
              {latestItems.announcement ? (
                <>
                  <h4 className='font-medium text-gray-900 mb-2'>
                    {latestItems.announcement.title}
                  </h4>
                  {latestItems.announcement.excerpt && (
                    <div
                      className='text-sm text-gray-600 mb-3 line-clamp-2'
                      dangerouslySetInnerHTML={{ __html: latestItems.announcement.excerpt + '...' }}
                    />
                  )}
                  <div className='flex items-center justify-between'>
                    <span className='text-xs text-gray-400'>
                      {formatDate(latestItems.announcement.createdAt)}
                    </span>
                    <Link
                      to='/announcements'
                      className='text-sm text-[#D54242] hover:text-[#b53a3a] font-medium'
                    >
                      Read More →
                    </Link>
                  </div>
                </>
              ) : (
                <p className='text-gray-500 text-center py-8'>No updates</p>
              )}
            </div>

            <div className='bg-white rounded-xl shadow-sm p-6'>
              <h3 className='text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                <svg
                  className='w-5 h-5 text-gray-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z'
                  />
                </svg>
                Latest Blog Post
              </h3>
              {latestItems.blog ? (
                <>
                  <h4 className='font-medium text-gray-900 mb-2'>{latestItems.blog.title}</h4>
                  {latestItems.blog.excerpt && (
                    <div
                      className='text-sm text-gray-600 mb-3 line-clamp-2'
                      dangerouslySetInnerHTML={{ __html: latestItems.blog.excerpt + '...' }}
                    />
                  )}
                  <div className='flex items-center justify-between'>
                    <span className='text-xs text-gray-400'>
                      {formatDate(latestItems.blog.createdAt)}
                    </span>
                    <Link
                      to='/blogs'
                      className='text-sm text-[#D54242] hover:text-[#b53a3a] font-medium'
                    >
                      Read More →
                    </Link>
                  </div>
                </>
              ) : (
                <p className='text-gray-500 text-center py-8'>No updates</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
