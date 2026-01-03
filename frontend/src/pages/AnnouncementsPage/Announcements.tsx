import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MutatingDots } from 'react-loader-spinner';
import { IoFunnelOutline } from 'react-icons/io5';
import 'react-quill-new/dist/quill.snow.css';
import S3Image from '../../components/S3Image';
import Pagination from '../../components/Pagination';
import { useAnnouncements } from '../../hooks/queries/useAnnouncements';
import { useTags } from '../../hooks/queries/useTags';
import { usePageContent } from '../../hooks/queries/usePageContent';

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

interface PageContent {
  [key: string]: { id: string; value: string; type: string };
}

interface AnnouncementsPageProps {
  previewContent?: PageContent;
}

const AnnouncementsPage = ({ previewContent }: AnnouncementsPageProps = {}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const {
    data: announcementsData,
    isLoading: announcementsLoading,
    error: announcementsError,
  } = useAnnouncements(currentPage, itemsPerPage);
  const { data: tags = [] } = useTags();
  const tagsArray = tags as Tag[];
  const { data: pageContentData } = usePageContent('announcements');

  const [timeFilter, setTimeFilter] = useState<'24h' | 'week' | 'month' | 'year' | null>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);


  const MAX_LENGTH = 200;

  const announcementsResponse = announcementsData || { data: [], total: 0 };
  const announcements: Announcement[] = Array.isArray(
    announcementsResponse.data || announcementsResponse
  )
    ? announcementsResponse.data || announcementsResponse
    : [];
  const totalAnnouncements =
    announcementsResponse.total || announcementsResponse.pagination?.total || announcements.length;
  const loading = announcementsLoading;
  const error = announcementsError ? 'An unexpected error occurred' : null;

  const content = previewContent || pageContentData || {};

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

  // FORMAT DATE
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

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

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return a.title.toLowerCase().includes(query) || a.content.toLowerCase().includes(query);
    }

    return true;
  });

  const headerImageSrc = content['header_image']?.value || '';

  return (
    <div className='mt-8'>
      <section>
        <div className='grid grid-cols-2 gap-0'>
          <div className='bg-white px-8 sm:px-12 py-20 flex items-center'>
            <div className='p-8'>
              <h2 className='font-[Open_Sans] text-[40px] font-bold leading-[100%] text-gray-800 mb-6'>
                {content['header_title']?.value || 'Announcements'}
              </h2>
              <div
                className='font-[Open_Sans] text-[18px] font-normal leading-[150%] text-gray-800'
                dangerouslySetInnerHTML={{
                  __html:
                    content['header_description']?.value ||
                    'The Tennessee Coalition for Better Aging exists to promote the general welfare of older Tennesseans and their families through partnerships that mobilize resources to educate and advocate for important policies and programs.',
                }}
              />
            </div>
          </div>
          <div className='h-[400px] bg-slate-200 mr-12 rounded-lg overflow-hidden'>
            {headerImageSrc && (
              <S3Image
                src={headerImageSrc}
                alt='Announcements Header'
                className='w-full h-full object-cover'
              />
            )}
          </div>
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
                  timeFilter === null
                    ? 'bg-[#EBF3FF] text-[#194B90]'
                    : 'bg-white text-[#3C3C3C] hover:bg-gray-200'
                }`}
                onClick={() => setTimeFilter(null)}
              >
                All
              </button>
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
              <div className='relative tag-dropdown-container' ref={filterRef}>
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`px-6 py-3 ${isFilterOpen ? 'bg-[#b53a3a]' : 'bg-[#D54242]'} text-white rounded-lg shadow-sm hover:bg-[#b53a3a] transition-colors flex items-center gap-2`}
                >
                  Filter
                  <IoFunnelOutline className='w-5 h-5' />
                </button>

                {isFilterOpen && (
                  <div className='absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-[10px] shadow-lg z-50 min-w-[200px] max-h-[300px] overflow-y-auto'>
                    {tagsArray.length === 0 ? (
                      <div className='px-4 py-3 text-sm text-gray-500'>No tags available</div>
                    ) : (
                      <div className='py-2'>
                        {tagsArray.map(tag => (
                          <label
                            key={tag.id}
                            className='flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer'
                          >
                            <input
                              type='checkbox'
                              checked={selectedTags.some(t => t.id === tag.id)}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedTags([...selectedTags, tag]);
                                } else {
                                  setSelectedTags(selectedTags.filter(t => t.id !== tag.id));
                                }
                              }}
                              className='w-4 h-4 text-[#194B90] border-gray-300 rounded focus:ring-[#194B90]'
                            />
                            <span className='ml-2 text-sm text-gray-700'>{tag.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {selectedTags.length > 0 && (
                      <div className='border-t border-gray-200 px-4 py-2'>
                        <button
                          onClick={() => {
                            setSelectedTags([]);
                            setIsFilterOpen(false);
                          }}
                          className='text-sm text-[#D54242] hover:text-[#b53a3a] font-medium'
                        >
                          Clear All
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className='relative flex-1 max-w-xl' style={{ marginLeft: '12px' }}>
              <input
                type='text'
                placeholder='Search announcements...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#194B90]'
              />
              <svg
                className='absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
            </div>
          </div>
        </div>
      </section>
      <div className='px-8 pb-8'>
        {loading && (
          <div className='flex justify-center items-center py-12'>
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
        )}

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
                <Link
                  key={a.id}
                  to={`/announcement/${a.slug}`}
                  className='flex gap-0 p-6 border border-gray-200 rounded-2xl transition-shadow duration-300 hover:shadow-[0_4px_12px_10px_#EBF3FFE5] block m-4 no-underline'
                >
                  <div className='w-full'>
                    <h2 className='font-[Open_Sans] text-[24px] font-semibold leading-[150%] text-[#3C3C3C] mb-2'>
                      {a.title}
                    </h2>
                    <div className='flex items-center gap-3 mb-4'>
                      <h3 className='font-[Open_Sans] text-[14px] font-normal leading-[150%] text-[#717171]'>
                        {formatDate(a.createdAt)}
                      </h3>
                      {a.tags.length > 0 && (
                        <>
                          <span className='text-[#717171]'>•</span>
                          <div className='flex gap-2 flex-wrap'>
                            {a.tags.map((tag: Tag) => (
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
                </Link>
              );
            })}
          </div>
        )}

        {!loading && !error && filterAnnouncements.length > 0 && (
          <div className='mt-8'>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalAnnouncements / itemsPerPage)}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={totalAnnouncements}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage;
