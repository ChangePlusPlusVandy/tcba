import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoFunnelOutline } from 'react-icons/io5';

type Announcement = {
  id: string;
  title: string;
  content: string;
  publishedDate?: string;
  isPublished: boolean;
  attachmentUrls: string[];
  tags: Tag[];
  createdByAdminId: string;
  createdAt: string;
  updatedAt: string;
};

type Tag = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

const AnnouncementsPage = () => {
  // ALL ANNOUNCEMENTS AND TAGS STATES
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  // LOADING AND ERROR STATES
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // FILTER STATES
  const [timeFilter, setTimeFilter] = useState<'24h' | 'week' | 'month' | 'year' | null>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const navigate = useNavigate();

  const MAX_LENGTH = 200; // MAX POST LENGTH BEFORE TRUNCATION

  // GET ALL ANNOUNCEMENTS
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

  // GET ALL TAGS
  const getTags = async () => {
    try {
      const tags = await axios.get('http://localhost:8000/api/tags');
      console.log('API Response:', tags.data);
      setTags(tags.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching tags:', error);
      setError('An unexpected error occurred');
    }
    setLoading(false);
  };

  useEffect(() => {
    getAnnouncements();
    getTags();
  }, []);

  // FORMAT TIME AGO
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }

    if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} ${Math.floor(diffInMinutes / 60) === 1 ? 'hour' : 'hours'} ago`;
    }
    return `${Math.floor(diffInMinutes / 1440)} ${Math.floor(diffInMinutes / 1440) === 1 ? 'day' : 'days'} ago`;
  };

  // FILTER ANNOUNCEMENTS BASED ON SELECTED TIME AND TAGS
  const filterAnnouncements = announcements.filter(a => {
    const now = new Date();

    // TIME FILTER
    if (timeFilter) {
      const createdAt = new Date(a.createdAt);
      const diffInHours = (now.getTime() - createdAt.getTime()) / 1000 / 3600;
      if (
        (timeFilter === '24h' && diffInHours > 24) ||
        (timeFilter === 'week' && diffInHours > 24 * 7) ||
        (timeFilter === 'month' && diffInHours > 24 * 30) ||
        (timeFilter === 'year' && diffInHours > 24 * 365)
      ) {
        return false;
      }
    }

    // TAG FILTER
    if (selectedTags.length > 0) {
      const selectedTagNames = selectedTags.map(t => t.name);
      const announcementTagNames = a.tags.map(t => t.name);
      if (!announcementTagNames.some(tag => selectedTagNames.includes(tag))) {
        return false;
      }
    }

    return true;
  });

  return (
    <div>
      <section>
        <div className='grid grid-cols-2 gap-0'>
          <div className='bg-white px-8 sm:px-12 py-20 flex items-center'>
            <div className='p-8'>
              <h2 className='font-[Open_Sans] text-[40px] font-bold leading-[100%] text-[#3C3C3C] mb-6'>
                Announcements
              </h2>
              <p className='font-[Open_Sans] text-[18px] font-normal leading-[150%] text-[#3C3C3C]'>
                The Tennessee Coalition for Better Aging exists to promote the general welfare of
                older Tennesseans and their families through partnerships that mobilize resources to
                educate and advocate for important policies and programs.
              </p>
            </div>
          </div>
          <div className='min-h-[220px] bg-slate-200' />
        </div>
      </section>
      <section>
        <div className='grid grid-cols-2 gap-0'>
          <div className='bg-white p-20 flex-col justify-center text-[#3C3C3C] py-6'>
            <p className='font-[Open_Sans] text-[18px] font-normal'>
              {filterAnnouncements.length}{' '}
              {filterAnnouncements.length === 1 ? 'Announcement' : 'Announcements'}
            </p>
          </div>
          <div className='flex gap-3 items-center justify-end bg-white p-20 py-6'>
            <button
              className={`px-6 py-3 rounded-lg shadow-sm border border-gray-200 transition-colors ${
                timeFilter === '24h'
                  ? 'bg-[#EBF3FF] text-[#194B90]'
                  : 'bg-white text-[#3C3C3C] hover:bg-gray-200'
              }`}
              onClick={() => setTimeFilter(prev => (prev === '24h' ? null : '24h'))}
            >
              Last 24 hours
            </button>
            <button
              className={`px-6 py-3 rounded-lg shadow-sm border border-gray-200 transition-colors ${
                timeFilter === 'week'
                  ? 'bg-[#EBF3FF] text-[#194B90]'
                  : 'bg-white text-[#3C3C3C] hover:bg-gray-200'
              }`}
              onClick={() => setTimeFilter(prev => (prev === 'week' ? null : 'week'))}
            >
              Last week
            </button>
            <button
              className={`px-6 py-3 rounded-lg shadow-sm border border-gray-200 transition-colors ${
                timeFilter === 'month'
                  ? 'bg-[#EBF3FF] text-[#194B90]'
                  : 'bg-white text-[#3C3C3C] hover:bg-gray-200'
              }`}
              onClick={() => setTimeFilter(prev => (prev === 'month' ? null : 'month'))}
            >
              Last month
            </button>
            <button
              className={`px-6 py-3 rounded-lg shadow-sm border border-gray-200 transition-colors ${
                timeFilter === 'year'
                  ? 'bg-[#EBF3FF] text-[#194B90]'
                  : 'bg-white text-[#3C3C3C] hover:bg-gray-200'
              }`}
              onClick={() => setTimeFilter(prev => (prev === 'year' ? null : 'year'))}
            >
              Last year
            </button>
            <div className='relative'>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`px-6 py-3 ${isFilterOpen ? 'bg-[#C6D9F2]' : 'bg-[#EBF3FF]'} text-[#194B90] rounded-lg shadow-sm hover:bg-[#C6D9F2] transition-colors flex items-center gap-2`}
              >
                Filter
                <IoFunnelOutline className='w-5 h-5' />
              </button>
              {isFilterOpen && (
                <div
                  className={`${selectedTags.length > 0 ? 'max-h-70' : 'max-h-60'} absolute overflow-y-auto right-0 mt-2 w-56 bg-[#EBF3FF] border border-gray-200 rounded-lg shadow-lg`}
                >
                  {tags.length === 0 && (
                    <button className='w-full text-left px-4 py-2 hover:bg-[#C6D9F2] text-[#3C3C3C] font-[Open_Sans] font-semibold'>
                      No Tags Available
                    </button>
                  )}
                  {selectedTags.length > 0 && (
                    <button
                      onClick={() => setSelectedTags([])}
                      className='w-full text-left px-4 py-2 border-b hover:bg-[#C6D9F2] text-red-600 font-[Open_Sans] font-semibold'
                    >
                      Clear All
                    </button>
                  )}
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => {
                        setSelectedTags(prev =>
                          prev.some(t => t.id === tag.id)
                            ? prev.filter(t => t.id !== tag.id)
                            : [...prev, tag]
                        );
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-[#C6D9F2] text-[#194B90] font-[Open_Sans] ${
                        selectedTags.some(t => t.id === tag.id) && 'bg-[#C6D9F2] font-semibold'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <div className='p-8'>
        {loading && <p>Loading announcements...</p>}

        {error && <p>{error}</p>}

        {!loading && !error && announcements.length === 0 && (
          <p className='font-[Open_Sans] text-[32px] font-bold leading-[100%] text-[#AAAAAA] mb-6'>
            No announcements available.
          </p>
        )}

        {!loading && !error && announcements.length > 0 && (
          <div className='space-y-8'>
            {filterAnnouncements.map(a => {
              const shouldTruncate = a.content.length > MAX_LENGTH;
              const displayedContent = !shouldTruncate
                ? a.content
                : `${a.content.slice(0, MAX_LENGTH)}...`;

              return (
                <div
                  key={a.id}
                  onClick={() => navigate(`/announcement/${a.id}`)}
                  className='flex gap-0 p-6 border border-gray-200 rounded-2xl transition-shadow duration-300 hover:shadow-[0_4px_12px_10px_#EBF3FFE5] cursor-pointer m-4'
                >
                  <div>
                    <h2 className='font-[Open_Sans] text-[24px] font-semibold leading-[150%] text-[#3C3C3C] mb-2'>
                      {a.title}
                    </h2>
                    <h3 className='font-[Open_Sans] text-[14px] font-normal leading-[150%] text-[#717171] mb-4'>
                      {getTimeAgo(a.createdAt)}
                    </h3>
                    <p className='font-[Open_Sans] text-[14px] font-normal leading-[150%] text-[#3C3C3C] mb-2'>
                      {displayedContent}
                    </p>
                  </div>
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
