import axios from 'axios';
import { useEffect, useState } from 'react';

type Announcement = {
  id: string;
  title: string;
  content: string;
  publishedDate?: string;
  isPublished: boolean;
  attachmentUrls: string[];
  tags: string[];
  createdByAdminId: string;
  createdAt: string;
  updatedAt: string;
};

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const MAX_LENGTH = 200; // max post length before truncating

  const getAnnouncements = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/announcements');
      console.log('API Response:', response.data);
      setAnnouncements(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setError('An unexpected error occurred');
    }
    setLoading(false);
  };

  useEffect(() => {
    getAnnouncements();
  }, []);

  // Format time ago
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  };

  return (
    <div>
      <div className='px-8 py-12 mb-8'>
        <h1 className='font-[Open_Sans] text-[32px] font-bold leading-[100%] text-[#3C3C3C] mb-6'>
          Announcements
        </h1>
        <p className='font-[Open_Sans] text-[16px] font-normal leading-[150%] text-[#000000] max-w-xl'>
          The Tennessee Coalition for Better Aging exists to promote the general welfare of older
          Tennesseans and their families through partnerships that mobilize resources to educate and
          advocate for important policies and programs.
        </p>
      </div>

      <div className='px-8'>
        {loading && <p>Loading announcements...</p>}

        {error && (
          <p className='font-[Open_Sans] text-[24px] font-semibold leading-[150%] text-[#FF0000] mb-2'>
            {error}
          </p>
        )}

        {!loading && !error && announcements.length === 0 && (
          <p className='font-[Open_Sans] text-[32px] font-bold leading-[100%] text-[#AAAAAA] mb-6'>
            No announcements available.
          </p>
        )}

        {!loading && !error && announcements.length > 0 && (
          <div className='space-y-8'>
            {announcements.map(a => {
              const isExpanded = expandedId === a.id;
              const shouldTruncate = a.content.length > MAX_LENGTH;
              const displayedContent =
                isExpanded || !shouldTruncate ? a.content : `${a.content.slice(0, MAX_LENGTH)}...`;

              return (
                <div
                  key={a.id}
                  className='p-6 border border-gray-200 rounded-2xl transition-shadow duration-300 hover:shadow-[0_4px_12px_10px_#EBF3FFE5] cursor-pointer'
                >
                  <h2 className='font-[Open_Sans] text-[24px] font-semibold leading-[150%] text-[#3C3C3C] mb-2'>
                    {a.title}
                  </h2>
                  <h3 className='font-[Open_Sans] text-[14px] font-normal leading-[150%] text-[#717171] mb-4'>
                    {getTimeAgo(a.createdAt)}
                  </h3>

                  <p className='font-[Open_Sans] text-[14px] font-normal leading-[150%] text-[#3C3C3C] mb-2'>
                    {displayedContent}
                  </p>

                  {shouldTruncate && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleExpand(a.id);
                      }}
                      className='font-[Open_Sans] underline text-[14px] text-[#000000]'
                    >
                      {isExpanded ? 'Show Less' : 'Read More'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage;
