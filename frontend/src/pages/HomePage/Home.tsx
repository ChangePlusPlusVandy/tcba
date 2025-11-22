import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import heroImage from '../../assets/home.jpg';
import tcbaCapitol from '../../assets/TCBACapitol.jpg';
import tcbaGroupPhoto from '../../assets/TCBAGroupPhoto.png';
import { FaHandshake, FaBullhorn, FaPeopleArrows, FaChartLine } from 'react-icons/fa';
import { MdHealthAndSafety, MdFamilyRestroom } from 'react-icons/md';
import S3Image from '../../components/S3Image';
import { API_BASE_URL } from '../../config/api';

type NotificationType = 'ANNOUNCEMENT' | 'BLOG' | 'ALERT' | 'SURVEY';

type NotificationBanner = {
  id: string;
  type: NotificationType;
  title: string;
  slug?: string;
  publishedDate?: string | null;
};

interface PageContent {
  [key: string]: { id: string; value: string; type: string };
}

interface HomePageProps {
  previewContent?: PageContent;
}

const HomePage = ({ previewContent }: HomePageProps = {}) => {
  const [notifications, setNotifications] = useState<NotificationBanner[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [content, setContent] = useState<PageContent>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (previewContent) {
      setContent(previewContent);
      setLoading(false);
      return;
    }

    const loadContent = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/page-content/home`);
        if (!response.ok) throw new Error('Failed to fetch page content');
        const data = await response.json();
        if (isMounted) {
          setContent(data);
        }
      } catch (error) {
        console.error('Error loading page content:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const loadNotifications = async () => {
      try {
        const allNotifications: NotificationBanner[] = [];

        const announcementsRes = await fetch(`${API_BASE_URL}/api/announcements`);
        if (announcementsRes.ok) {
          const announcements = await announcementsRes.json();
          announcements
            .filter((a: any) => a.isPublished)
            .slice(0, 3)
            .forEach((a: any) => {
              allNotifications.push({
                id: `announcement-${a.id}`,
                type: 'ANNOUNCEMENT',
                title: a.title,
                slug: a.slug,
                publishedDate: a.publishedDate,
              });
            });
        }

        const blogsRes = await fetch(`${API_BASE_URL}/api/blogs`);
        if (blogsRes.ok) {
          const blogs = await blogsRes.json();
          blogs
            .filter((b: any) => b.isPublished)
            .slice(0, 2)
            .forEach((b: any) => {
              allNotifications.push({
                id: `blog-${b.id}`,
                type: 'BLOG',
                title: b.title,
                slug: b.slug,
                publishedDate: b.publishedDate,
              });
            });
        }

        // Load alerts
        const alertsRes = await fetch(`${API_BASE_URL}/api/alerts`);
        if (alertsRes.ok) {
          const alerts = await alertsRes.json();
          alerts
            .filter((a: any) => a.isPublished)
            .slice(0, 2)
            .forEach((a: any) => {
              allNotifications.push({
                id: `alert-${a.id}`,
                type: 'ALERT',
                title: a.title,
                publishedDate: a.publishedDate,
              });
            });
        }

        const surveysRes = await fetch(`${API_BASE_URL}/api/surveys`);
        if (surveysRes.ok) {
          const surveys = await surveysRes.json();
          surveys
            .filter((s: any) => s.isPublished)
            .slice(0, 2)
            .forEach((s: any) => {
              allNotifications.push({
                id: `survey-${s.id}`,
                type: 'SURVEY',
                title: s.title,
                publishedDate: s.createdAt,
              });
            });
        }

        allNotifications.sort((a, b) => {
          const dateA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
          const dateB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
          return dateB - dateA;
        });

        if (isMounted) {
          setNotifications(allNotifications);

          const closedNotifications = JSON.parse(
            localStorage.getItem('closedNotifications') || '[]'
          );
          setDismissedIds(closedNotifications);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadContent();
    if (!previewContent) {
      loadNotifications();
    }

    return () => {
      isMounted = false;
    };
  }, [previewContent]);

  const handleDismissNotification = (notificationId: string) => {
    const updatedDismissed = [...dismissedIds, notificationId];
    setDismissedIds(updatedDismissed);
    localStorage.setItem('closedNotifications', JSON.stringify(updatedDismissed));
  };

  const visibleNotifications = notifications.filter(n => !dismissedIds.includes(n.id));

  const getNotificationRoute = (notification: NotificationBanner) => {
    switch (notification.type) {
      case 'ANNOUNCEMENT':
        return `/announcement/${notification.slug}`;
      case 'BLOG':
        return `/blog/${notification.slug}`;
      case 'ALERT':
        return '/alerts';
      case 'SURVEY':
        return '/surveys';
      default:
        return '/';
    }
  };

  const getNotificationStyles = (type: NotificationType) => {
    switch (type) {
      case 'ANNOUNCEMENT':
        return {
          bg: 'bg-rose-100/90',
          border: 'border-rose-200/80',
          label: 'text-rose-900',
          title: 'text-rose-950',
          date: 'text-rose-900/70',
          closeBtn: 'text-rose-900 hover:text-rose-950',
        };
      case 'BLOG':
        return {
          bg: 'bg-blue-100/90',
          border: 'border-blue-200/80',
          label: 'text-blue-900',
          title: 'text-blue-950',
          date: 'text-blue-900/70',
          closeBtn: 'text-blue-900 hover:text-blue-950',
        };
      case 'ALERT':
        return {
          bg: 'bg-amber-100/90',
          border: 'border-amber-200/80',
          label: 'text-amber-900',
          title: 'text-amber-950',
          date: 'text-amber-900/70',
          closeBtn: 'text-amber-900 hover:text-amber-950',
        };
      case 'SURVEY':
        return {
          bg: 'bg-emerald-100/90',
          border: 'border-emerald-200/80',
          label: 'text-emerald-900',
          title: 'text-emerald-950',
          date: 'text-emerald-900/70',
          closeBtn: 'text-emerald-900 hover:text-emerald-950',
        };
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-lg'>Loading...</div>
      </div>
    );
  }

  const heroImageSrc = content['hero_image']?.value || heroImage;

  return (
    <div className='flex flex-col gap-16 pb-20'>
      <section className='relative min-h-[420px] w-screen left-1/2 -translate-x-1/2 overflow-hidden'>
        <S3Image
          src={heroImageSrc}
          fallbackSrc={heroImage}
          alt='Hands providing support'
          className='absolute inset-0 w-full h-full object-cover'
        />
        <div className='absolute inset-0 bg-slate-950/60' />

        {visibleNotifications.length > 0 && (
          <div className='absolute top-1 left-0 right-0 z-10 px-2'>
            <div className='relative'>
              {visibleNotifications.slice(1, 3).map((notification, index) => {
                const styles = getNotificationStyles(notification.type);
                const offset = (index + 1) * 6;
                const scale = 1 - (index + 1) * 0.02;
                return (
                  <div
                    key={notification.id}
                    className={`absolute left-0 right-0 ${styles.bg} border ${styles.border} rounded-3xl px-6 sm:px-10 py-3 backdrop-blur-sm`}
                    style={{
                      top: `${offset}px`,
                      transform: `scale(${scale})`,
                      transformOrigin: 'top center',
                      zIndex: 10 - index - 1,
                      opacity: 0.7 - index * 0.2,
                    }}
                  >
                    <div className='max-w-7xl mx-auto opacity-0'>
                      <div className='pr-32'>
                        <div className='mb-1'>
                          <p className='text-sm font-semibold uppercase tracking-wide'>
                            {notification.type}
                          </p>
                        </div>
                        <h2 className='text-lg font-semibold'>{notification.title}</h2>
                      </div>
                    </div>
                  </div>
                );
              })}

              {(() => {
                const notification = visibleNotifications[0];
                const styles = getNotificationStyles(notification.type);
                return (
                  <div
                    className={`${styles.bg} border ${styles.border} shadow-lg rounded-3xl px-6 sm:px-10 py-3 relative backdrop-blur-sm transition-all duration-300`}
                    style={{ zIndex: 10 }}
                  >
                    <div className='max-w-7xl mx-auto'>
                      <button
                        onClick={() => handleDismissNotification(notification.id)}
                        className={`absolute top-3 right-6 sm:right-10 ${styles.closeBtn} transition z-10`}
                        aria-label='Close notification'
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
                      <Link
                        to={getNotificationRoute(notification)}
                        onClick={() => handleDismissNotification(notification.id)}
                        className='absolute bottom-3 right-6 sm:right-10 text-white px-4 py-2 rounded-full text-sm font-semibold shadow transition whitespace-nowrap'
                        style={{ backgroundColor: '#D54242' }}
                      >
                        {notification.type === 'SURVEY' ? 'Take Survey' : 'Read More'}
                      </Link>
                      <div className='pr-32'>
                        <div className='mb-1 flex items-center gap-3'>
                          <p
                            className={`text-sm font-semibold uppercase tracking-wide ${styles.label}`}
                          >
                            {notification.type === 'ANNOUNCEMENT'
                              ? 'Announcement'
                              : notification.type === 'BLOG'
                                ? 'New Blog'
                                : notification.type === 'ALERT'
                                  ? 'Alert'
                                  : 'Survey'}
                          </p>
                          {visibleNotifications.length > 1 && (
                            <span
                              className={`text-xs ${styles.date} bg-white/50 px-2 py-0.5 rounded-full`}
                            >
                              +{visibleNotifications.length - 1} more
                            </span>
                          )}
                        </div>
                        {notification.publishedDate && (
                          <p className={`text-xs ${styles.date}`}>
                            {new Date(notification.publishedDate).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        )}
                        <h2 className={`text-lg font-semibold ${styles.title}`}>
                          {notification.title}
                        </h2>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        <div className='relative max-w-7xl mx-auto pt-24 pb-24 lg:pt-32 lg:pb-28'>
          <h1 className='text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-white max-w-2xl'>
            {content['hero_title']?.value || 'Tennessee Coalition for Better Aging'}
          </h1>
          <div
            className='text-base sm:text-lg text-white/90 leading-relaxed max-w-2xl mt-6'
            dangerouslySetInnerHTML={{
              __html:
                content['hero_description']?.value ||
                'The Tennessee Coalition for Better Aging (TCBA) exists to promote the general welfare of older Tennesseans and their families; through partnerships that mobilize resources to educate and advocate for important policies and programs.',
            }}
          />
          <Link
            to='/register'
            className='bg-[#cc4444] text-white px-6 py-3 rounded-[18px] text-sm sm:text-base font-semibold shadow-lg hover:bg-[#b53a3a] transition inline-block mt-6'
          >
            {content['hero_button_text']?.value || 'Stay Connected'}
          </Link>
        </div>
      </section>

      <section className='relative w-screen left-1/2 -translate-x-1/2 -mt-8'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-fr'>
            <div className='bg-white border border-transparent px-8 sm:px-12 py-10 space-y-4 flex flex-col justify-center rounded-lg'>
              <h2 className='text-3xl font-bold text-slate-900'>
                {content['working_title']?.value || 'Working Towards a Better Tomorrow'}
              </h2>
              <div
                className='text-base text-slate-600 leading-relaxed max-w-[80%]'
                dangerouslySetInnerHTML={{
                  __html:
                    content['working_paragraph1']?.value ||
                    "Given that older adults are the fastest growing segment of Tennessee's population and the most significant increase will be among those 85 and older, and given that family caregivers provide over 80% of long-term care, we are committed to advocating for and with older adults and their families.",
                }}
              />
              <div
                className='text-base text-slate-600 leading-relaxed max-w-[80%]'
                dangerouslySetInnerHTML={{
                  __html:
                    content['working_paragraph2']?.value ||
                    'The Coalition for Better Aging takes collective action to ensure that older adults can age with dignity and family caregivers have the support they need. The COVID-19 pandemic highlighted the shortcomings of our current systems and the need to prioritize the health and well-being of older Tennesseans and their families.',
                }}
              />
            </div>
            <div className='bg-slate-200 border border-transparent overflow-hidden relative group rounded-lg'>
              <S3Image
                src={content['working_image1']?.value || tcbaCapitol}
                fallbackSrc={tcbaCapitol}
                alt='TCBA at the Capitol'
                className='w-full h-full object-cover'
              />
              <div className='absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6'>
                <div
                  className='text-white text-sm leading-relaxed'
                  dangerouslySetInnerHTML={{
                    __html:
                      content['working_image1_hover']?.value ||
                      "TCBA members (left to right) Dianne Oliver, Executive Director of The West Home Foundation; Carol Westlake, Executive Director of the Tennessee Disability Coalition (TDC); Mia McNeil, State Director for AARP-TN; Kimberly Spaulding, AARP-TN's Advocacy Director; Grace Smith, Executive Director of AgeWell Middle TN and Donna DeStefano, Assistant Executive Director of TDC after meeting with Gov. Bill Lee's staff to discuss elevating and reorganizing aging and disability at the state level.",
                  }}
                />
              </div>
            </div>
            <div className='bg-slate-200 border border-transparent overflow-hidden relative group rounded-lg'>
              <S3Image
                src={content['working_image2']?.value || tcbaGroupPhoto}
                fallbackSrc={tcbaGroupPhoto}
                alt='TCBA Group Photo'
                className='w-full h-full object-cover'
              />
              <div className='absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6'>
                <div
                  className='text-white text-sm leading-relaxed'
                  dangerouslySetInnerHTML={{
                    __html:
                      content['working_image2_hover']?.value ||
                      'TCBA members (left to right) Grace Smith, AgeWell Middle TN; Sara Fowler, GNRC Director of Aging and Disability Services; Dianne Oliver, The West Home Foundation; Kimberly Spaulding, AARP-TN; Mia McNeil, AARP-TN; and Donna DeStefano, TDC met with DIDD Commissioner Brad Turner and Chief of Staff, Lauren LeGate, to discuss priority issues, opportunities and proposed legislation to move TCAD and create a Dept. of Aging and Disability.',
                  }}
                />
              </div>
            </div>
            <div className='bg-white border border-transparent px-8 sm:px-12 py-10 space-y-4 flex flex-col justify-center rounded-lg'>
              <h2 className='text-3xl font-bold text-slate-900'>
                {content['working_text_title']?.value || 'Our Vision'}
              </h2>
              <div
                className='text-base text-slate-600 leading-relaxed'
                dangerouslySetInnerHTML={{
                  __html:
                    content['working_text_paragraph1']?.value ||
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
                }}
              />
              <div
                className='text-base text-slate-600 leading-relaxed'
                dangerouslySetInnerHTML={{
                  __html:
                    content['working_text_paragraph2']?.value ||
                    'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className='max-w-6xl mx-auto px-4 sm:px-6 space-y-12 text-center'>
        <div className='space-y-5'>
          <h2 className='text-3xl font-bold text-slate-900'>How We Work</h2>
          <div
            className='text-lg text-slate-600 italic max-w-3xl mx-auto leading-relaxed'
            dangerouslySetInnerHTML={{
              __html:
                content['how_we_work_quote']?.value ||
                '"We have to do the work of imagining what could be possible, and then do our part to make it real" - Tallu Quinn, Former Director Nashville Food Project',
            }}
          />
        </div>
        <div className='grid gap-12 md:grid-cols-3 justify-items-center'>
          {['partnership', 'advocacy', 'outreach'].map(key => {
            const title =
              content[`how_we_work_${key}_title`]?.value ||
              key.charAt(0).toUpperCase() + key.slice(1);
            const description = content[`how_we_work_${key}_desc`]?.value || '';
            return (
              <div key={key} className='flex flex-col items-center text-center space-y-4 max-w-sm'>
                {key === 'partnership' && <FaHandshake className='w-14 h-14 text-slate-700' />}
                {key === 'advocacy' && <FaBullhorn className='w-14 h-14 text-slate-700' />}
                {key === 'outreach' && <FaPeopleArrows className='w-14 h-14 text-slate-700' />}
                <div className='space-y-3 px-2'>
                  <h3 className='text-xl font-bold text-slate-900'>{title}</h3>
                  <div
                    className='text-sm text-slate-600 leading-relaxed'
                    dangerouslySetInnerHTML={{ __html: description }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className='max-w-6xl mx-auto px-4 sm:px-6 space-y-12 text-center'>
        <div className='space-y-3'>
          <h2 className='text-3xl font-bold text-slate-900'>Why We Work Together</h2>
          <div
            className='text-lg text-slate-600 italic max-w-3xl mx-auto leading-relaxed'
            dangerouslySetInnerHTML={{
              __html: content['why_we_work_quote']?.value || 'Our voices are stronger together.',
            }}
          />
        </div>
        <div className='grid gap-12 md:grid-cols-3 justify-items-center'>
          {['age', 'ltss', 'caregiver'].map(key => {
            const title = content[`why_we_work_${key}_title`]?.value || '';
            const description = content[`why_we_work_${key}_desc`]?.value || '';
            return (
              <div key={key} className='flex flex-col items-center text-center space-y-4 max-w-sm'>
                {key === 'age' && <FaChartLine className='w-14 h-14 text-slate-700' />}
                {key === 'ltss' && <MdHealthAndSafety className='w-14 h-14 text-slate-700' />}
                {key === 'caregiver' && <MdFamilyRestroom className='w-14 h-14 text-slate-700' />}
                <div className='space-y-3 px-2'>
                  <h3 className='text-xl font-bold text-slate-900'>{title}</h3>
                  <div
                    className='text-sm text-slate-600 leading-relaxed'
                    dangerouslySetInnerHTML={{ __html: description }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
