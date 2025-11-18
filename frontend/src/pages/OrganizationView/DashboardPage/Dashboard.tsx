import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import OrganizationSidebar from '../../../components/OrganizationSidebar';
import { API_BASE_URL } from '../../../config/api';

interface Alert {
  id: string;
  title: string;
  content: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  isPublished: boolean;
  publishedDate: string | null;
}

interface Survey {
  id: string;
  title: string;
  isActive: boolean;
  isPublished: boolean;
}

const DashboardPage = () => {
  const [alert, setAlert] = useState<Alert | null>(null);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [isAlertClosed, setIsAlertClosed] = useState(false);
  const [isSurveyClosed, setIsSurveyClosed] = useState(false);

  useEffect(() => {
    loadAlerts();
    loadSurveys();
  }, []);

  const loadAlerts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/alerts`);
      const data: Alert[] = await response.json();
      const publishedAlert = data.find(item => item.isPublished) ?? data[0] ?? null;

      if (publishedAlert) {
        const closedAlerts = JSON.parse(localStorage.getItem('closedAlerts') || '[]');
        setIsAlertClosed(closedAlerts.includes(publishedAlert.id));
      }
      setAlert(publishedAlert);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const loadSurveys = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/surveys`);
      const data: Survey[] = await response.json();
      const activeSurvey = data.find(item => item.isActive && item.isPublished) ?? null;

      if (activeSurvey) {
        const closedSurveys = JSON.parse(localStorage.getItem('closedSurveys') || '[]');
        setIsSurveyClosed(closedSurveys.includes(activeSurvey.id));
      }
      setSurvey(activeSurvey);
    } catch (error) {
      console.error('Error fetching surveys:', error);
    }
  };

  const handleCloseAlert = () => {
    if (alert) {
      const closedAlerts = JSON.parse(localStorage.getItem('closedAlerts') || '[]');
      if (!closedAlerts.includes(alert.id)) {
        closedAlerts.push(alert.id);
        localStorage.setItem('closedAlerts', JSON.stringify(closedAlerts));
      }
      setIsAlertClosed(true);
    }
  };

  const handleCloseSurvey = () => {
    if (survey) {
      const closedSurveys = JSON.parse(localStorage.getItem('closedSurveys') || '[]');
      if (!closedSurveys.includes(survey.id)) {
        closedSurveys.push(survey.id);
        localStorage.setItem('closedSurveys', JSON.stringify(closedSurveys));
      }
      setIsSurveyClosed(true);
    }
  };

  const getAlertColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return {
          bg: 'bg-red-100/90',
          border: 'border-red-200/80',
          text: 'text-red-900',
          button: '#D54242',
        };
      case 'MEDIUM':
        return {
          bg: 'bg-orange-100/90',
          border: 'border-orange-200/80',
          text: 'text-orange-900',
          button: '#E67E22',
        };
      case 'LOW':
        return {
          bg: 'bg-yellow-100/90',
          border: 'border-yellow-200/80',
          text: 'text-yellow-900',
          button: '#F39C12',
        };
      default:
        return {
          bg: 'bg-blue-100/90',
          border: 'border-blue-200/80',
          text: 'text-blue-900',
          button: '#3498DB',
        };
    }
  };

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <OrganizationSidebar />
      <div className='flex-1 p-8'>
        <h1 className='text-3xl font-bold text-gray-800 mb-6'>Dashboard</h1>

        {alert && !isAlertClosed && (
          <div className='mb-6'>
            <div
              className={`${getAlertColor(alert.priority).bg} border ${getAlertColor(alert.priority).border} shadow-lg rounded-3xl px-6 sm:px-10 py-5 relative backdrop-blur-sm`}
            >
              <button
                onClick={handleCloseAlert}
                className={`absolute top-4 right-6 sm:right-10 ${getAlertColor(alert.priority).text} hover:opacity-75 transition`}
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
              <div className='flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6 pr-12'>
                <div className='flex-1 space-y-2'>
                  <div className='flex items-center gap-2'>
                    <p
                      className={`text-sm font-semibold uppercase tracking-wide ${getAlertColor(alert.priority).text}`}
                    >
                      Alert
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full bg-white/50 ${getAlertColor(alert.priority).text} font-medium`}
                    >
                      {alert.priority}
                    </span>
                  </div>
                  <h2 className={`text-lg font-semibold ${getAlertColor(alert.priority).text}`}>
                    {alert.title}
                  </h2>
                </div>
                <Link
                  to='/alerts'
                  className='text-white px-4 py-2 rounded-full text-sm font-semibold shadow hover:opacity-90 transition'
                  style={{ backgroundColor: getAlertColor(alert.priority).button }}
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        )}

        {survey && !isSurveyClosed && (
          <div className='mb-6'>
            <div className='bg-blue-100/90 border border-blue-200/80 shadow-lg rounded-3xl px-6 sm:px-10 py-5 relative backdrop-blur-sm'>
              <button
                onClick={handleCloseSurvey}
                className='absolute top-4 right-6 sm:right-10 text-blue-900 hover:text-blue-950 transition'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
              <div className='flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6 pr-12'>
                <div className='flex-1 space-y-2'>
                  <p className='text-sm font-semibold uppercase tracking-wide text-blue-900'>
                    Survey
                  </p>
                  <h2 className='text-lg font-semibold text-blue-950'>{survey.title}</h2>
                </div>
                <Link
                  to='/surveys'
                  className='text-white px-4 py-2 rounded-full text-sm font-semibold shadow'
                  style={{ backgroundColor: '#194B90' }}
                >
                  Take Survey
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
