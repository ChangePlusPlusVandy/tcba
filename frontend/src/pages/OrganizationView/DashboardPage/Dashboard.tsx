import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import OrganizationSidebar from '../../../components/OrganizationSidebar';
import { API_BASE_URL } from '../../../config/api';

type BannerType = 'ALERT' | 'SURVEY';

type Banner = {
  id: string;
  type: BannerType;
  title: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  publishedDate?: string | null;
};

const DashboardPage = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const allBanners: Banner[] = [];

      const alertsRes = await fetch(`${API_BASE_URL}/api/alerts?page=1&limit=50`);
      if (alertsRes.ok) {
        const response = await alertsRes.json();
        const alerts = response.data || response;
        (Array.isArray(alerts) ? alerts : [])
          .filter((a: any) => a.isPublished)
          .forEach((a: any) => {
            allBanners.push({
              id: `alert-${a.id}`,
              type: 'ALERT',
              title: a.title,
              priority: a.priority,
              publishedDate: a.publishedDate,
            });
          });
      }

      const surveysRes = await fetch(`${API_BASE_URL}/api/surveys`);
      if (surveysRes.ok) {
        const surveys = await surveysRes.json();
        surveys
          .filter((s: any) => s.isActive && s.isPublished)
          .forEach((s: any) => {
            allBanners.push({
              id: `survey-${s.id}`,
              type: 'SURVEY',
              title: s.title,
              publishedDate: s.createdAt,
            });
          });
      }

      allBanners.sort((a, b) => {
        const dateA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
        const dateB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
        return dateB - dateA;
      });

      setBanners(allBanners);

      const closedBanners = JSON.parse(localStorage.getItem('closedOrgBanners') || '[]');
      setDismissedIds(closedBanners);
    } catch (error) {
      console.error('Error fetching banners:', error);
    }
  };

  const handleDismissBanner = (bannerId: string) => {
    const updatedDismissed = [...dismissedIds, bannerId];
    setDismissedIds(updatedDismissed);
    localStorage.setItem('closedOrgBanners', JSON.stringify(updatedDismissed));
  };

  const visibleBanners = banners.filter(b => !dismissedIds.includes(b.id));

  const getBannerRoute = (banner: Banner) => {
    switch (banner.type) {
      case 'ALERT':
        return '/alerts';
      case 'SURVEY':
        return '/surveys';
      default:
        return '/';
    }
  };

  const getBannerStyles = (type: BannerType) => {
    switch (type) {
      case 'ALERT':
        return {
          bg: 'bg-red-100/90',
          border: 'border-red-200/80',
          label: 'text-red-900',
          title: 'text-red-950',
          closeBtn: 'text-red-900 hover:text-red-950',
          button: '#DC2626',
          buttonText: 'View Details',
        };
      case 'SURVEY':
        return {
          bg: 'bg-yellow-100/90',
          border: 'border-yellow-200/80',
          label: 'text-yellow-900',
          title: 'text-yellow-950',
          closeBtn: 'text-yellow-900 hover:text-yellow-950',
          button: '#CA8A04',
          buttonText: 'Take Survey',
        };
    }
  };

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <OrganizationSidebar />
      <div className='flex-1 p-8'>
        <h1 className='text-3xl font-bold text-gray-800 mb-6'>Dashboard</h1>

        {visibleBanners.length > 0 && (
          <div className='mb-6'>
            <div className='relative'>
              {visibleBanners.slice(1, 3).map((banner, index) => {
                const styles = getBannerStyles(banner.type);
                const offset = (index + 1) * 6;
                const scale = 1 - (index + 1) * 0.02;
                return (
                  <div
                    key={banner.id}
                    className={`absolute left-0 right-0 ${styles.bg} border ${styles.border} rounded-3xl px-6 sm:px-10 py-5 backdrop-blur-sm`}
                    style={{
                      top: `${offset}px`,
                      transform: `scale(${scale})`,
                      transformOrigin: 'top center',
                      zIndex: 10 - index - 1,
                      opacity: 0.7 - index * 0.2,
                    }}
                  >
                    <div className='opacity-0'>
                      <div className='pr-32'>
                        <div className='mb-1'>
                          <p className='text-sm font-semibold uppercase tracking-wide'>
                            {banner.type}
                          </p>
                        </div>
                        <h2 className='text-lg font-semibold'>{banner.title}</h2>
                      </div>
                    </div>
                  </div>
                );
              })}

              {(() => {
                const banner = visibleBanners[0];
                const styles = getBannerStyles(banner.type);
                return (
                  <div
                    className={`${styles.bg} border ${styles.border} shadow-lg rounded-3xl px-6 sm:px-10 py-5 relative backdrop-blur-sm transition-all duration-300`}
                    style={{ zIndex: 10 }}
                  >
                    <button
                      onClick={() => handleDismissBanner(banner.id)}
                      className={`absolute top-4 right-6 sm:right-10 ${styles.closeBtn} transition z-10`}
                      aria-label='Close banner'
                    >
                      <svg
                        className='w-5 h-5'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
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
                            className={`text-sm font-semibold uppercase tracking-wide ${styles.label}`}
                          >
                            {banner.type === 'ALERT' ? 'Alert' : 'Survey'}
                          </p>
                          {banner.type === 'ALERT' && banner.priority && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full bg-white/50 ${styles.label} font-medium`}
                            >
                              {banner.priority}
                            </span>
                          )}
                          {visibleBanners.length > 1 && (
                            <span
                              className={`text-xs ${styles.label} bg-white/50 px-2 py-0.5 rounded-full`}
                            >
                              +{visibleBanners.length - 1} more
                            </span>
                          )}
                        </div>
                        <h2 className={`text-lg font-semibold ${styles.title}`}>{banner.title}</h2>
                      </div>
                      <Link
                        to={getBannerRoute(banner)}
                        className='text-white px-4 py-2 rounded-full text-sm font-semibold shadow hover:opacity-90 transition'
                        style={{ backgroundColor: styles.button }}
                      >
                        {styles.buttonText}
                      </Link>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
