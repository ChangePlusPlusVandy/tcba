import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import Toast from '../../../components/Toast';
import ConfirmModal from '../../../components/ConfirmModal';
import AdminSidebar from '../../../components/AdminSidebar';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

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

const AdminAnnouncements = () => {
  const { getToken } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFTS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const isTokenExpiringSoon = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const now = Date.now();
      const timeUntilExpiry = expirationTime - now;
      return timeUntilExpiry < 5 * 60 * 1000;
    } catch (e) {
      return true;
    }
  };

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    let token = await getToken({
      skipCache: true,
      template: 'jwt-template-tcba',
    });

    if (!token) {
      throw new Error('No authentication token available');
    }

    if (isTokenExpiringSoon(token)) {
      console.log('Token expiring soon, proactively refreshing...');
      token = await getToken({ skipCache: true });

      if (!token) {
        throw new Error('No authentication token available');
      }
    }

    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      console.log('Token expired, refreshing and retrying...');

      token = await getToken({ skipCache: true });

      if (!token) {
        throw new Error('No authentication token available');
      }

      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        throw new Error('Authentication failed. Please try logging in again.');
      }
    }

    return response;
  };
  const fetchAnnouncement = async () => {
    try {
      setError('');
      const response = await fetchWithAuth(`${API_BASE_URL}/api/announcements`);

      if (!response.ok) throw new Error('Failed to fetch announcements');

      const data = await response.json();
      setAnnouncements(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncement();
  }, []);

  const published = announcements.filter(a => a.isPublished === true);
  const drafts = announcements.filter(a => a.isPublished === false);

  const filtered =
    filter === 'PUBLISHED' ? published : filter === 'DRAFTS' ? drafts : announcements;

  const searchedAnnouncements = filtered.filter(a => {
    const q = searchQuery.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      a.tags.some(t => t.name.toLowerCase().includes(q))
    );
  });

  const currentFilterCount =
    filter === 'ALL'
      ? announcements.length
      : filter === 'PUBLISHED'
        ? published.length
        : drafts.length;

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <AdminSidebar />

      <div className='flex-1 p-8'>
        <h1 className='text-3xl font-bold text-gray-800 mb-6'>
          {filter === 'ALL' && `All Announcements (${currentFilterCount})`}
          {filter === 'PUBLISHED' && `Published (${currentFilterCount})`}
          {filter === 'DRAFTS' && `Drafts (${currentFilterCount})`}
        </h1>

        {/* FILTER BUTTONS */}
        <div className='flex items-center gap-4 mb-6'>
          <div className='flex gap-2'>
            {['ALL', 'PUBLISHED', 'DRAFTS'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-6 py-2.5 rounded-[10px] font-medium transition ${
                  filter === f
                    ? 'bg-[#EBF3FF] text-[#194B90] border border-[#194B90]'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* SEARCH */}
          <div className='flex-1 max-w-xl ml-auto'>
            <div className='relative'>
              <input
                type='text'
                placeholder='Search announcements'
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

        {/* ERROR */}
        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6'>
            {error}
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className='text-center py-12'>
            <p className='text-gray-600'>Loading announcements...</p>
          </div>
        ) : searchedAnnouncements.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-600'>No announcements found.</p>
          </div>
        ) : (
          <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
            <table className='min-w-full'>
              <thead className='bg-gray-50 border-b border-gray-200'>
                <tr>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Title</th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                    Status
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Tags</th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                    Published
                  </th>
                </tr>
              </thead>

              <tbody className='divide-y divide-gray-200'>
                {searchedAnnouncements.map(a => (
                  <tr
                    key={a.id}
                    className='hover:bg-gray-50'
                    onClick={() => setSelectedAnnouncement(a)}
                  >
                    <td className='px-6 py-4 text-[#194B90] font-medium hover:underline'>
                      {a.title}
                    </td>

                    <td className='px-6 py-4'>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          a.isPublished
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {a.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>

                    <td className='px-6 py-4'>
                      <div className='flex gap-2 flex-wrap'>
                        {a.tags.length === 0 ? (
                          <span className='text-gray-500 text-sm'>None</span>
                        ) : (
                          a.tags.map(t => (
                            <span
                              key={t.id}
                              className='px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs'
                            >
                              {t.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    <td className='px-6 py-4 text-sm text-gray-600'>
                      {a.publishedDate ? new Date(a.publishedDate).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedAnnouncement && (
        <>
          <input type='checkbox' checked readOnly className='modal-toggle' />
          <div className='modal modal-open'>
            <div className='modal-box max-w-2xl max-h-[80vh] bg-white overflow-y-auto m-8'>
              {/* Title */}
              <h3 className='font-bold text-xl text-gray-900 mb-3'>{selectedAnnouncement.title}</h3>

              <div className='space-y-4'>
                {/* Basic Info */}
                <div>
                  <h4 className='font-semibold text-base text-gray-800 mb-2'>Basic Information</h4>
                  <div className='grid grid-cols-2 gap-3'>
                    <div>
                      <span className='text-sm font-bold text-gray-600'>Slug:</span>
                      <p className='text-sm text-gray-900'>{selectedAnnouncement.slug}</p>
                    </div>

                    <div>
                      <span className='text-sm font-bold text-gray-600'>Status:</span>
                      <p className='text-sm'>
                        <span
                          className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                            selectedAnnouncement.isPublished
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {selectedAnnouncement.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </p>
                    </div>

                    <div>
                      <span className='text-sm font-bold text-gray-600'>Published Date:</span>
                      <p className='text-sm text-gray-900'>
                        {selectedAnnouncement.publishedDate
                          ? new Date(selectedAnnouncement.publishedDate).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>

                    <div>
                      <span className='text-sm font-bold text-gray-600'>Created By:</span>
                      <p className='text-sm text-gray-900'>
                        {selectedAnnouncement.createdByAdminId || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h4 className='font-semibold text-base text-gray-800 mb-2'>Content</h4>
                  <p className='text-sm text-gray-900 whitespace-pre-line'>
                    {selectedAnnouncement.content || 'No content'}
                  </p>
                </div>

                {/* Attachments */}
                <div>
                  <h4 className='font-semibold text-base text-gray-800 mb-2'>Attachments</h4>
                  {selectedAnnouncement.attachmentUrls?.length > 0 ? (
                    <ul className='space-y-1'>
                      {selectedAnnouncement.attachmentUrls.map((url, i) => (
                        <li key={i} className='text-sm flex justify-between items-center'>
                          <a
                            href={`/admin/announcements/`}
                            className='text-[#194B90] hover:underline'
                          >
                            {url}
                          </a>{' '}
                          {/* add clickable download link */}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className='text-sm text-gray-900'>No attachments</p>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <h4 className='font-semibold text-base text-gray-800 mb-2'>Tags</h4>
                  {selectedAnnouncement.tags && selectedAnnouncement.tags.length > 0 ? (
                    <div className='flex flex-wrap gap-2'>
                      {selectedAnnouncement.tags.map((tag, index) => (
                        <span
                          key={index}
                          className='px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full'
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className='text-sm text-gray-900'>No tags</p>
                  )}
                </div>

                {/* Dates */}
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

              {/* Actions */}
              <div className='modal-action'>
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className='btn bg-[#194B90] hover:bg-[#133a72] text-white border-none'
                >
                  Close
                </button>
              </div>
            </div>

            <div
              className='modal-backdrop bg-black/30'
              onClick={() => setSelectedAnnouncement(null)}
            ></div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAnnouncements;
