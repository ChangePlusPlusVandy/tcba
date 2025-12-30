import {
  useEffect,
  useState,
  type JSXElementConstructor,
  type Key,
  type ReactElement,
  type ReactNode,
  type ReactPortal,
} from 'react';
import OrganizationSidebar from '../../../components/OrganizationSidebar';
import Toast from '../../../components/Toast';
import PublicAttachmentList from '../../../components/PublicAttachmentList';
import Pagination from '../../../components/Pagination';
import { useOrgAnnouncements } from '../../../hooks/queries/useOrgAnnouncements';

type Tag = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

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

const OrgAnnouncementsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  type SortField = 'title' | 'publishedDate' | 'tags' | 'createdAt';
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const {
    data: announcementsData,
    isLoading: loading,
    error: announcementsError,
  } = useOrgAnnouncements(currentPage, itemsPerPage);

  const announcements = announcementsData?.data || [];
  const totalAnnouncements = announcementsData?.total || 0;
  const error = announcementsError ? 'Failed to fetch announcements' : '';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (!target.closest('.tag-dropdown-container')) {
        setTagDropdownOpen(false);
      }
    };

    if (tagDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [tagDropdownOpen]);

  const openDetailModal = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedAnnouncement(null);
  };

  // Compute all tags with counts
  const allTags = Array.from(
    new Set(
      announcements.flatMap(announcement => announcement.tags.map((tag: { name: any }) => tag.name))
    )
  );

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesTags =
      tagsFilter.length === 0 ||
      tagsFilter.some(tagName =>
        announcement.tags?.some(
          (announcementTag: { name: string }) => announcementTag.name === tagName
        )
      );

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (announcement.title.toLowerCase().includes(query) ||
          announcement.content.toLowerCase().includes(query)) &&
        matchesTags
      );
    }

    return matchesTags;
  });

  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'publishedDate':
        aValue = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
        bValue = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
        break;
      case 'tags':
        aValue = a.tags?.length || 0;
        bValue = b.tags?.length || 0;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg
          className='w-4 h-4 text-gray-400'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
        </svg>
      );
    }
    if (sortDirection === 'asc') {
      return (
        <svg
          className='w-4 h-4 text-[#D54242]'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 15l7-7 7 7' />
        </svg>
      );
    }
    return (
      <svg className='w-4 h-4 text-[#D54242]' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
      </svg>
    );
  };

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <OrganizationSidebar />

      <div className='flex-1 p-8'>
        <h1 className='text-3xl font-bold text-gray-800 mb-6'>
          All Announcements ({announcements.length})
        </h1>

        <div className='flex items-center gap-4 mb-6'>
          <div className='relative tag-dropdown-container'>
            <button
              onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
              className='px-4 py-2 border border-gray-300 rounded-[10px] bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#194B90] hover:bg-gray-50 flex items-center gap-2'
            >
              <span>
                {tagsFilter.length > 0 ? `Tags (${tagsFilter.length})` : 'Filter by Tags'}
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${tagDropdownOpen ? 'rotate-180' : ''}`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 9l-7 7-7-7'
                />
              </svg>
            </button>

            {tagDropdownOpen && (
              <div className='absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-[10px] shadow-lg z-50 min-w-[200px] max-h-[300px] overflow-y-auto'>
                {allTags.length === 0 ? (
                  <div className='px-4 py-3 text-sm text-gray-500'>No tags available</div>
                ) : (
                  <div className='py-2'>
                    {allTags.map(tag => (
                      <label
                        key={tag}
                        className='flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer'
                      >
                        <input
                          type='checkbox'
                          checked={tagsFilter.includes(tag)}
                          onChange={e => {
                            if (e.target.checked) {
                              setTagsFilter([...tagsFilter, tag]);
                            } else {
                              setTagsFilter(tagsFilter.filter(t => t !== tag));
                            }
                          }}
                          className='w-4 h-4 text-[#194B90] border-gray-300 rounded focus:ring-[#194B90]'
                        />
                        <span className='ml-2 text-sm text-gray-700'>{tag}</span>
                      </label>
                    ))}
                  </div>
                )}
                {tagsFilter.length > 0 && (
                  <div className='border-t border-gray-200 px-4 py-2'>
                    <button
                      onClick={() => {
                        setTagsFilter([]);
                        setTagDropdownOpen(false);
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

          <div className='flex-1 max-w-xl ml-auto'>
            <div className='relative'>
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

        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6'>
            {error}
          </div>
        )}

        {loading ? (
          <div className='text-center py-12'>
            <p className='text-gray-600'>Loading announcements...</p>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-600'>No announcements found</p>
          </div>
        ) : (
          <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
            <table className='min-w-full'>
              <thead className='bg-gray-50 border-b border-gray-200'>
                <tr>
                  <th
                    className='px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100'
                    onClick={() => handleSort('title')}
                  >
                    <div className='flex items-center gap-2'>
                      Title
                      <SortIcon field='title' />
                    </div>
                  </th>
                  <th
                    className='px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100'
                    onClick={() => handleSort('publishedDate')}
                  >
                    <div className='flex items-center gap-2'>
                      Published
                      <SortIcon field='publishedDate' />
                    </div>
                  </th>
                  <th
                    className='px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100'
                    onClick={() => handleSort('tags')}
                  >
                    <div className='flex items-center gap-2'>
                      Tags
                      <SortIcon field='tags' />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200'>
                {sortedAnnouncements.map(announcement => (
                  <tr key={announcement.id} className='hover:bg-gray-50'>
                    <td
                      className='px-6 py-4 text-[#194B90] font-medium hover:underline cursor-pointer'
                      onClick={() => openDetailModal(announcement)}
                    >
                      {announcement.title}
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm text-gray-600'>
                        {announcement.publishedDate
                          ? new Date(announcement.publishedDate).toLocaleDateString()
                          : '-'}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      {announcement.tags && announcement.tags.length > 0 ? (
                        <div className='flex flex-wrap gap-1'>
                          {announcement.tags.map(
                            (tag: {
                              id: Key | null | undefined;
                              name:
                                | string
                                | number
                                | bigint
                                | boolean
                                | ReactElement<unknown, string | JSXElementConstructor<any>>
                                | Iterable<ReactNode>
                                | ReactPortal
                                | Promise<
                                    | string
                                    | number
                                    | bigint
                                    | boolean
                                    | ReactPortal
                                    | ReactElement<unknown, string | JSXElementConstructor<any>>
                                    | Iterable<ReactNode>
                                    | null
                                    | undefined
                                  >
                                | null
                                | undefined;
                            }) => (
                              <span
                                key={tag.id}
                                className='px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200'
                              >
                                {tag.name}
                              </span>
                            )
                          )}
                        </div>
                      ) : (
                        <span className='text-sm text-gray-400'>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredAnnouncements.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalAnnouncements / itemsPerPage)}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={totalAnnouncements}
          />
        )}
      </div>

      {isDetailModalOpen && selectedAnnouncement && (
        <>
          <input type='checkbox' checked readOnly className='modal-toggle' />
          <div className='modal modal-open'>
            <div className='modal-box max-w-2xl max-h-[80vh] bg-white overflow-y-auto m-8'>
              <h3 className='font-bold text-xl text-gray-900 mb-3'>{selectedAnnouncement.title}</h3>

              <div className='space-y-4'>
                <div>
                  <h4 className='font-semibold text-base text-gray-800 mb-2'>Content</h4>
                  <div
                    className='prose max-w-none text-sm text-gray-900'
                    dangerouslySetInnerHTML={{ __html: selectedAnnouncement.content }}
                  />
                </div>

                {selectedAnnouncement.attachmentUrls &&
                  selectedAnnouncement.attachmentUrls.length > 0 && (
                    <PublicAttachmentList
                      attachmentUrls={selectedAnnouncement.attachmentUrls}
                      requireAuth={true}
                    />
                  )}

                <div>
                  <h4 className='font-semibold text-base text-gray-800 mb-2'>Tags</h4>
                  {selectedAnnouncement.tags && selectedAnnouncement.tags.length > 0 ? (
                    <div className='flex flex-wrap gap-2'>
                      {selectedAnnouncement.tags.map(tag => (
                        <span
                          key={tag.id}
                          className='px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200'
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className='text-sm text-gray-900'>No tags</p>
                  )}
                </div>

                <div>
                  <h4 className='font-semibold text-base text-gray-800 mb-2'>Dates</h4>
                  <div className='grid grid-cols-2 gap-3'>
                    <div>
                      <span className='text-sm font-bold text-gray-600'>Created:</span>
                      <p className='text-sm text-gray-900'>
                        {new Date(selectedAnnouncement.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className='text-sm font-bold text-gray-600'>Updated:</span>
                      <p className='text-sm text-gray-900'>
                        {new Date(selectedAnnouncement.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className='modal-action'>
                <button
                  onClick={closeDetailModal}
                  className='btn bg-[#D54242] hover:bg-[#b53a3a] text-white border-none'
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default OrgAnnouncementsPage;
