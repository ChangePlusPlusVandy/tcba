import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import AdminSidebar from '../../../components/AdminSidebar';
import GoogleMap from '../../../components/GoogleMap';
import { API_BASE_URL } from '../../../config/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Stats {
  totalOrganizations: number;
  pendingOrganizations: number;
  approvedOrganizations: number;
  totalAnnouncements: number;
  totalBlogs: number;
  totalSurveys: number;
  activeSurveys: number;
  totalEmailSubscribers: number;
  totalAlerts: number;
}

interface ActivityItem {
  id: string;
  type: 'organization' | 'announcement' | 'survey' | 'surveyResponse';
  title: string;
  description: string;
  createdAt: string;
}

interface SurveyResponse {
  id: string;
  surveyId: string;
  surveyTitle: string;
  organizationName: string;
  submittedDate: string;
}

interface OrganizationMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  website?: string;
}

interface GrowthDataPoint {
  month: string;
  count: number;
}

interface SurveyWithResponses {
  id: string;
  title: string;
  totalSent: number;
  totalResponded: number;
  responseRate: number;
}

interface DashboardData {
  stats: Stats;
  recentActivity: ActivityItem[];
  organizationsWithLocation: OrganizationMarker[];
  actionItems: {
    pendingOrganizations: number;
    recentSurveyResponses: SurveyResponse[];
  };
  growthData?: {
    organizations: GrowthDataPoint[];
    subscriptions: GrowthDataPoint[];
  };
  surveyResponseRates?: SurveyWithResponses[];
}

type ModalType =
  | 'organizations'
  | 'pending'
  | 'announcements'
  | 'blogs'
  | 'surveys'
  | 'subscribers'
  | null;
type GraphType = 'orgGrowth' | 'emailGrowth' | 'surveyResponses';

interface ModalData {
  organizations: Array<{ id: string; name: string; email: string; status: string }>;
  pending: Array<{ id: string; name: string; email: string; createdAt: string }>;
  announcements: Array<{ id: string; title: string; createdAt: string; isPublished: boolean }>;
  blogs: Array<{ id: string; title: string; author: string; createdAt: string }>;
  surveys: Array<{ id: string; title: string; isActive: boolean; createdAt: string }>;
  subscribers: Array<{ id: string; email: string; name?: string; createdAt: string }>;
}

const AdminDashboard = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalData, setModalData] = useState<ModalData>({
    organizations: [],
    pending: [],
    announcements: [],
    blogs: [],
    surveys: [],
    subscribers: [],
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [graphType, setGraphType] = useState<GraphType>('orgGrowth');
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>('');

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const dashboardData = await response.json();
      setData(dashboardData);

      if (dashboardData.surveyResponseRates && dashboardData.surveyResponseRates.length > 0) {
        setSelectedSurveyId(dashboardData.surveyResponseRates[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const openModal = async (type: ModalType) => {
    if (!type) return;
    setActiveModal(type);
    setModalLoading(true);

    try {
      const token = await getToken();
      let endpoint = '';

      switch (type) {
        case 'organizations':
          endpoint = '/api/organizations';
          break;
        case 'pending':
          endpoint = '/api/organizations?status=PENDING';
          break;
        case 'announcements':
          endpoint = '/api/announcements';
          break;
        case 'blogs':
          endpoint = '/api/blogs';
          break;
        case 'surveys':
          endpoint = '/api/surveys';
          break;
        case 'subscribers':
          endpoint = '/api/subscriptions';
          break;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const responseData = await response.json();
        setModalData(prev => ({ ...prev, [type]: responseData }));
      }
    } catch (err) {
      console.error('Error fetching modal data:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'min' : 'mins'} ago`;
    }
    if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'organization':
        return (
          <div className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center'>
            <svg
              className='w-4 h-4 text-blue-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'
              />
            </svg>
          </div>
        );
      case 'announcement':
        return (
          <div className='w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center'>
            <svg
              className='w-4 h-4 text-yellow-600'
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
          </div>
        );
      case 'survey':
        return (
          <div className='w-8 h-8 rounded-full bg-green-100 flex items-center justify-center'>
            <svg
              className='w-4 h-4 text-green-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
              />
            </svg>
          </div>
        );
      case 'surveyResponse':
        return (
          <div className='w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center'>
            <svg
              className='w-4 h-4 text-purple-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getCombinedActivity = () => {
    if (!data) return [];

    const activities: ActivityItem[] = [...data.recentActivity];

    if (data.actionItems?.recentSurveyResponses) {
      data.actionItems.recentSurveyResponses.forEach(response => {
        activities.push({
          id: response.id,
          type: 'surveyResponse',
          title: response.surveyTitle,
          description: `Response from ${response.organizationName}`,
          createdAt: response.submittedDate,
        });
      });
    }

    return activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 15);
  };

  const getChartData = () => {
    if (!data) return null;

    if (graphType === 'orgGrowth' && data.growthData?.organizations) {
      return {
        labels: data.growthData.organizations.map(d => d.month),
        datasets: [
          {
            label: 'Organizations',
            data: data.growthData.organizations.map(d => d.count),
            borderColor: '#194B90',
            backgroundColor: 'rgba(25, 75, 144, 0.1)',
            fill: true,
            tension: 0.4,
          },
        ],
      };
    }

    if (graphType === 'emailGrowth' && data.growthData?.subscriptions) {
      return {
        labels: data.growthData.subscriptions.map(d => d.month),
        datasets: [
          {
            label: 'Email Subscribers',
            data: data.growthData.subscriptions.map(d => d.count),
            borderColor: '#D54242',
            backgroundColor: 'rgba(213, 66, 66, 0.1)',
            fill: true,
            tension: 0.4,
          },
        ],
      };
    }

    if (graphType === 'surveyResponses' && data.surveyResponseRates) {
      const selectedSurvey = data.surveyResponseRates.find(s => s.id === selectedSurveyId);
      if (selectedSurvey) {
        return {
          labels: ['Responded', 'Not Responded'],
          datasets: [
            {
              label: 'Response Rate',
              data: [
                selectedSurvey.totalResponded,
                selectedSurvey.totalSent - selectedSurvey.totalResponded,
              ],
              backgroundColor: ['#22c55e', '#e5e7eb'],
              borderWidth: 0,
            },
          ],
        };
      }
    }

    // Default empty data
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Data',
          data: [0, 0, 0, 0, 0, 0],
          borderColor: '#194B90',
          backgroundColor: 'rgba(25, 75, 144, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className='flex min-h-screen bg-gray-50'>
        <AdminSidebar />
        <div className='flex-1 flex items-center justify-center'>
          <div className='text-lg'>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className='flex min-h-screen bg-gray-50'>
        <AdminSidebar />
        <div className='flex-1 flex items-center justify-center'>
          <div className='text-lg text-red-600'>{error || 'Failed to load dashboard'}</div>
        </div>
      </div>
    );
  }

  const statCards: Array<{
    label: string;
    value: number;
    icon: ReactNode;
    modalType: ModalType;
  }> = [
    {
      label: 'Organizations',
      value: data.stats.totalOrganizations,
      modalType: 'organizations',
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
            d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'
          />
        </svg>
      ),
    },
    {
      label: 'Pending Approvals',
      value: data.stats.pendingOrganizations,
      modalType: 'pending',
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
            d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
      ),
    },
    {
      label: 'Announcements',
      value: data.stats.totalAnnouncements,
      modalType: 'announcements',
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
    },
    {
      label: 'Blogs',
      value: data.stats.totalBlogs,
      modalType: 'blogs',
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
    },
    {
      label: 'Surveys',
      value: data.stats.totalSurveys,
      modalType: 'surveys',
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
            d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
          />
        </svg>
      ),
    },
    {
      label: 'Email Subscribers',
      value: data.stats.totalEmailSubscribers,
      modalType: 'subscribers',
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
            d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
          />
        </svg>
      ),
    },
  ];

  const mapMarkers = data.organizationsWithLocation.map(org => ({
    id: org.id,
    name: org.name,
    latitude: org.latitude,
    longitude: org.longitude,
    address: org.address,
    city: org.city,
    website: org.website,
  }));

  const combinedActivity = getCombinedActivity();
  const chartData = getChartData();

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <AdminSidebar />
      <div className='flex-1 p-8 overflow-auto'>
        <div className='max-w-7xl mx-auto'>
          <h1 className='text-3xl font-bold text-gray-800 mb-6'>Dashboard</h1>

          <div className='bg-white rounded-xl shadow-sm p-6 mb-8'>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
              {statCards.map((stat, index) => (
                <button
                  key={index}
                  onClick={() => openModal(stat.modalType)}
                  className='bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors text-left cursor-pointer'
                >
                  <div className='flex items-center justify-between mb-2'>
                    {stat.icon}
                    <span className='w-2 h-2 rounded-full bg-[#D54242]'></span>
                  </div>
                  <p className='text-2xl font-bold text-gray-800'>{stat.value}</p>
                  <p className='text-sm text-gray-500'>{stat.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <div className='bg-white rounded-xl shadow-sm p-6'>
              <h2 className='text-lg font-semibold text-gray-800 mb-4'>Recent Activity</h2>
              <div className='space-y-4 max-h-[500px] overflow-y-auto'>
                {combinedActivity.length > 0 ? (
                  combinedActivity.map((activity, index) => (
                    <div
                      key={`${activity.type}-${activity.id}-${index}`}
                      className='flex items-start gap-3'
                    >
                      {getActivityIcon(activity.type)}
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium text-gray-800 truncate'>
                          {activity.title}
                        </p>
                        <p className='text-xs text-gray-500'>{activity.description}</p>
                        <p className='text-xs text-gray-400'>{getTimeAgo(activity.createdAt)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className='text-gray-500 text-sm'>No recent activity</p>
                )}
              </div>
            </div>

            <div className='space-y-6'>
              <div className='bg-white rounded-xl shadow-sm p-6'>
                <h2 className='text-lg font-semibold text-gray-800 mb-4'>Analytics</h2>
                <select
                  value={graphType}
                  onChange={e => setGraphType(e.target.value as GraphType)}
                  className='select select-sm select-bordered w-full mb-4'
                >
                  <option value='orgGrowth'>Org Growth</option>
                  <option value='emailGrowth'>Email Subscribers</option>
                  <option value='surveyResponses'>Survey Responses</option>
                </select>

                {graphType === 'surveyResponses' &&
                  data.surveyResponseRates &&
                  data.surveyResponseRates.length > 0 && (
                    <select
                      value={selectedSurveyId}
                      onChange={e => setSelectedSurveyId(e.target.value)}
                      className='select select-sm select-bordered w-full mb-4'
                    >
                      {data.surveyResponseRates.map(survey => (
                        <option key={survey.id} value={survey.id}>
                          {survey.title} ({survey.responseRate}%)
                        </option>
                      ))}
                    </select>
                  )}

                <div className='h-[200px]'>
                  {chartData &&
                    (graphType === 'surveyResponses' ? (
                      <Bar
                        data={chartData}
                        options={{ ...chartOptions, indexAxis: 'y' as const }}
                      />
                    ) : (
                      <Line data={chartData} options={chartOptions} />
                    ))}
                </div>
              </div>

              <div className='bg-white rounded-xl shadow-sm p-6'>
                <h2 className='text-lg font-semibold text-gray-800 mb-4'>Organization Locations</h2>
                <div className='rounded-lg overflow-hidden'>
                  <GoogleMap
                    apiKey={GOOGLE_MAPS_API_KEY}
                    markers={mapMarkers}
                    height='200px'
                    zoom={7}
                  />
                </div>
                <p className='text-xs text-gray-500 mt-2 text-center'>
                  {mapMarkers.length} organizations with locations
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeModal && (
        <>
          <input type='checkbox' checked readOnly className='modal-toggle' />
          <div className='modal modal-open'>
            <div className='modal-box max-w-2xl max-h-[80vh] bg-white overflow-y-auto m-8'>
              <h3 className='font-bold text-xl text-gray-900 mb-4'>
                {activeModal === 'organizations' && 'All Organizations'}
                {activeModal === 'pending' && 'Pending Approvals'}
                {activeModal === 'announcements' && 'All Announcements'}
                {activeModal === 'blogs' && 'All Blogs'}
                {activeModal === 'surveys' && 'All Surveys'}
                {activeModal === 'subscribers' && 'Email Subscribers'}
              </h3>

              <div className='space-y-3'>
                {modalLoading ? (
                  <div className='flex items-center justify-center py-8'>
                    <span className='loading loading-spinner loading-md'></span>
                  </div>
                ) : (
                  <>
                    {activeModal === 'organizations' &&
                      modalData.organizations.map((org: any) => (
                        <div
                          key={org.id}
                          onClick={() => navigate('/admin/organizations')}
                          className='p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition'
                        >
                          <div className='flex items-center justify-between'>
                            <div>
                              <p className='font-medium text-gray-800'>{org.name}</p>
                              <p className='text-sm text-gray-500'>{org.email}</p>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                org.status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-700'
                                  : org.status === 'PENDING'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {org.status}
                            </span>
                          </div>
                        </div>
                      ))}

                    {activeModal === 'pending' &&
                      modalData.pending.map((org: any) => (
                        <div
                          key={org.id}
                          onClick={() => navigate('/admin/organizations')}
                          className='p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 cursor-pointer transition'
                        >
                          <div className='flex items-center justify-between'>
                            <div>
                              <p className='font-medium text-gray-800'>{org.name}</p>
                              <p className='text-sm text-gray-500'>{org.email}</p>
                            </div>
                            <span className='text-xs text-gray-400'>
                              {new Date(org.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}

                    {activeModal === 'announcements' &&
                      modalData.announcements.map((ann: any) => (
                        <div
                          key={ann.id}
                          onClick={() => navigate('/admin/announcements')}
                          className='p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition'
                        >
                          <div className='flex items-center justify-between'>
                            <div>
                              <p className='font-medium text-gray-800'>{ann.title}</p>
                              <p className='text-sm text-gray-500'>
                                {new Date(ann.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                ann.isPublished
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {ann.isPublished ? 'Published' : 'Draft'}
                            </span>
                          </div>
                        </div>
                      ))}

                    {activeModal === 'blogs' &&
                      modalData.blogs.map((blog: any) => (
                        <div
                          key={blog.id}
                          onClick={() => navigate('/admin/blogs')}
                          className='p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition'
                        >
                          <div className='flex items-center justify-between'>
                            <div>
                              <p className='font-medium text-gray-800'>{blog.title}</p>
                              <p className='text-sm text-gray-500'>
                                by {blog.author} - {new Date(blog.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                    {activeModal === 'surveys' &&
                      modalData.surveys.map((survey: any) => (
                        <div
                          key={survey.id}
                          onClick={() => navigate(`/admin/surveys/${survey.id}/responses`)}
                          className='p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition'
                        >
                          <div className='flex items-center justify-between'>
                            <div>
                              <p className='font-medium text-gray-800'>{survey.title}</p>
                              <p className='text-sm text-gray-500'>
                                {new Date(survey.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                survey.isActive
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {survey.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      ))}

                    {activeModal === 'subscribers' &&
                      modalData.subscribers.map((sub: any) => (
                        <div key={sub.id} className='p-4 bg-gray-50 rounded-lg'>
                          <div className='flex items-center justify-between'>
                            <div>
                              <p className='font-medium text-gray-800'>{sub.name || 'No name'}</p>
                              <p className='text-sm text-gray-500'>{sub.email}</p>
                              {sub.subscriptionTypes && sub.subscriptionTypes.length > 0 && (
                                <div className='flex flex-wrap gap-1 mt-1'>
                                  {sub.subscriptionTypes.map((type: string, idx: number) => (
                                    <span
                                      key={idx}
                                      className='px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full'
                                    >
                                      {type}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <span className='text-xs text-gray-400'>
                              {new Date(sub.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}

                    {((activeModal === 'organizations' && modalData.organizations.length === 0) ||
                      (activeModal === 'pending' && modalData.pending.length === 0) ||
                      (activeModal === 'announcements' && modalData.announcements.length === 0) ||
                      (activeModal === 'blogs' && modalData.blogs.length === 0) ||
                      (activeModal === 'surveys' && modalData.surveys.length === 0) ||
                      (activeModal === 'subscribers' && modalData.subscribers.length === 0)) && (
                      <p className='text-gray-500 text-center py-8'>No items found</p>
                    )}
                  </>
                )}
              </div>

              <div className='modal-action'>
                <button
                  onClick={closeModal}
                  className='px-6 py-2.5 bg-[#D54242] hover:bg-[#b53a3a] text-white rounded-xl font-medium transition'
                >
                  Close
                </button>
              </div>
            </div>
            <div className='modal-backdrop bg-black/30' onClick={closeModal}></div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
