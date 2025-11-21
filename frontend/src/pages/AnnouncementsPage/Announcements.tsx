import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoFunnelOutline, IoSearchOutline } from 'react-icons/io5';
import 'react-quill-new/dist/quill.snow.css';
import { API_BASE_URL } from '../../config/api';

type Announcement = {
  id: string;
  slug: string;
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
  const [searchQuery, setSearchQuery] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  const MAX_LENGTH = 200; // MAX POST LENGTH BEFORE TRUNCATION

  // GET ALL ANNOUNCEMENTS
  const getAnnouncements = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/announcements`);
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
      const tags = await axios.get(`${API_BASE_URL}/api/tags`);
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);

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

  const filterAnnouncements = announcements
    .filter(a => {
      const now = new Date();

      // TIME FILTER
      if (timeFilter) {
        const publishedDate = new Date(a.publishedDate || a.createdAt);
        const diffInHours = (now.getTime() - publishedDate.getTime()) / 1000 / 3600;
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

      // SEARCH FILTER
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return a.title.toLowerCase().includes(query) || a.content.toLowerCase().includes(query);
      }

      return true;
    })
    .sort((a, b) => {
      // sort by publishedDate descending (most recent first)
      const dateA = new Date(a.publishedDate || a.createdAt).getTime();
      const dateB = new Date(b.publishedDate || b.createdAt).getTime();
      return dateB - dateA;
    });

  return (
    <div className='mt-8'>
      <section>
        <div className='grid grid-cols-2 gap-0'>
          <div className='bg-white px-8 sm:px-12 py-20 flex items-center'>
            <div className='p-8'>
              <h2 className='font-[Open_Sans] text-[40px] font-bold leading-[100%] text-gray-800 mb-6'>
                Announcements
              </h2>
              <p className='font-[Open_Sans] text-[18px] font-normal leading-[150%] text-gray-800'>
                The Tennessee Coalition for Better Aging exists to promote the general welfare of
                older Tennesseans and their families through partnerships that mobilize resources to
                educate and advocate for important policies and programs.
              </p>
            </div>
          </div>
          <div className='h-[400px] bg-slate-200 mr-12 rounded-lg' />
        </div>
      </section>
      <section className='mt-8'>
        <div className='bg-white px-20 py-4'>
          <p className='font-[Open_Sans] text-[18px] font-bold text-gray-800 mb-4'>
            {filterAnnouncements.length}{' '}
            {filterAnnouncements.length === 1 ? 'Announcement' : 'Announcements'}
          </p>
          <div className='flex items-center justify-between'>
            <div className='flex gap-2 items-center'>
              <button
                className={`px-8 py-3 rounded-lg shadow-sm border border-gray-200 transition-colors whitespace-nowrap ${
                  timeFilter === '24h'
                    ? 'bg-[#EBF3FF] text-[#194B90]'
                    : 'bg-white text-[#3C3C3C] hover:bg-gray-200'
                }`}
                onClick={() => setTimeFilter(prev => (prev === '24h' ? null : '24h'))}
              >
                Last Day
              </button>
              <button
                className={`px-8 py-3 rounded-lg shadow-sm border border-gray-200 transition-colors whitespace-nowrap ${
                  timeFilter === 'week'
                    ? 'bg-[#EBF3FF] text-[#194B90]'
                    : 'bg-white text-[#3C3C3C] hover:bg-gray-200'
                }`}
                onClick={() => setTimeFilter(prev => (prev === 'week' ? null : 'week'))}
              >
                Last Week
              </button>
              <button
                className={`px-8 py-3 rounded-lg shadow-sm border border-gray-200 transition-colors whitespace-nowrap ${
                  timeFilter === 'month'
                    ? 'bg-[#EBF3FF] text-[#194B90]'
                    : 'bg-white text-[#3C3C3C] hover:bg-gray-200'
                }`}
                onClick={() => setTimeFilter(prev => (prev === 'month' ? null : 'month'))}
              >
                Last Month
              </button>
              <button
                className={`px-8 py-3 rounded-lg shadow-sm border border-gray-200 transition-colors whitespace-nowrap ${
                  timeFilter === 'year'
                    ? 'bg-[#EBF3FF] text-[#194B90]'
                    : 'bg-white text-[#3C3C3C] hover:bg-gray-200'
                }`}
                onClick={() => setTimeFilter(prev => (prev === 'year' ? null : 'year'))}
              >
                Last Year
              </button>
              <div className='relative' ref={filterRef}>
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`px-6 py-3 ${isFilterOpen ? 'bg-[#b53a3a]' : 'bg-[#D54242]'} text-white rounded-lg shadow-sm hover:bg-[#b53a3a] transition-colors flex items-center gap-2`}
                >
                  Filter
                  <IoFunnelOutline className='w-5 h-5' />
                </button>
                {isFilterOpen && (
                  <div
                    className={`${selectedTags.length > 0 ? 'max-h-70' : 'max-h-60'} absolute overflow-y-auto left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10`}
                  >
                    {tags.length === 0 && (
                      <button className='w-full text-left px-4 py-2 hover:bg-[#EBF3FF] text-[#3C3C3C] font-[Open_Sans]'>
                        No Tags Available
                      </button>
                    )}
                    {selectedTags.length > 0 && (
                      <button
                        onClick={() => setSelectedTags([])}
                        className='w-full text-left px-4 py-2 border-b hover:bg-[#EBF3FF] text-[#3C3C3C] font-[Open_Sans]'
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
                        className={`w-full text-left px-4 py-2 hover:bg-[#EBF3FF] text-[#3C3C3C] font-[Open_Sans] ${
                          selectedTags.some(t => t.id === tag.id) && 'bg-[#EBF3FF] font-semibold'
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className='relative'>
              <input
                type='text'
                placeholder='Search...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='px-4 py-3 pl-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#194B90] focus:border-transparent'
              />
              <IoSearchOutline className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
            </div>
          </div>
        </div>
      </section>
      <div className='px-8 pb-8'>
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
                  onClick={() => navigate(`/announcement/${a.slug}`)}
                  className='flex gap-0 p-6 border border-gray-200 rounded-2xl transition-shadow duration-300 hover:shadow-[0_4px_12px_10px_#EBF3FFE5] cursor-pointer m-4'
                >
                  <div className='w-full'>
                    <h2 className='font-[Open_Sans] text-[24px] font-semibold leading-[150%] text-[#3C3C3C] mb-2'>
                      {a.title}
                    </h2>
                    <div className='flex items-center gap-3 mb-4'>
                      <h3 className='font-[Open_Sans] text-[14px] font-normal leading-[150%] text-[#717171]'>
                        {getTimeAgo(a.publishedDate || a.createdAt)}
                      </h3>
                      {a.tags.length > 0 && (
                        <>
                          <span className='text-[#717171]'>•</span>
                          <div className='flex gap-2 flex-wrap'>
                            {a.tags.map(tag => (
                              <span
                                key={tag.id}
                                className='px-3 py-1 bg-[#EBF3FF] text-[#194B90] rounded-full text-[12px] font-medium'
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    <div
                      className='font-[Open_Sans] text-[14px] font-normal leading-[150%] text-[#3C3C3C] mb-2 ql-editor'
                      dangerouslySetInnerHTML={{ __html: displayedContent }}
                    />
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
