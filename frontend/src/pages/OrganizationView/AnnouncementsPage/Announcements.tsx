import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import Toast from '../../../components/Toast';
import ConfirmModal from '../../../components/ConfirmModal';
import { API_BASE_URL } from '../../../config/api';
import OrganizationSidebar from '../../../components/OrganizationSidebar';
import Toast from '../../../components/Toast';
import PublicAttachmentList from '../../../components/PublicAttachmentList';
import { API_BASE_URL } from '../../../config/api';

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

const OrgAnnouncementsPage = () => {
  const { getToken } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFTS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
  } | null>(null);

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
    let token = await getToken();

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
        const errorBody = await response.text();
        console.error('Auth failed even after token refresh. Response:', errorBody);
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
      console.log('Fetched announcements:', data);
      console.log('Announcements count:', data.length);
      console.log(
        'Drafts:',
        data.filter((a: any) => !a.isPublished)
      );
      console.log(
        'Published:',
        data.filter((a: any) => a.isPublished)
      );
      setAnnouncements(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };
  //   try {
  //     setError('');
  //     const response = await fetchWithAuth(`${API_BASE_URL}/api/tags`);

  //     if (!response.ok) throw new Error('Failed to fetch tags');

  //     // const data = await response.json();
  //     // setTags(data);
  //   } catch (err: any) {
  //     setError(err.message || 'Failed to load tags');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleCreateAnnouncement = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsSubmitting(true);
  //   setError('');

  //   try {
  //     const payload = {
  //       title: newAnnouncement.title,
  //       content: newAnnouncement.content,
  //       isPublished: newAnnouncement.isPublished,
  //       tagIds: newAnnouncement.tags,
  //       publishedDate: newAnnouncement.isPublished ? new Date().toISOString() : null,
  //     };

  //     const response = await fetchWithAuth(`${API_BASE_URL}/api/announcements`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(payload),
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.error || 'Failed to create announcement');
  //     }

  //     await fetchAnnouncement();

  //     const successMessage = newAnnouncement.isPublished
  //       ? 'Announcement created successfully'
  //       : 'Announcement saved successfully';
  //     setToast({ message: successMessage, type: 'success' });

  //     setIsCreateModalOpen(false);
  //     setNewAnnouncement({
  //       title: '',
  //       slug: '',
  //       content: '',
  //       isPublished: false,
  //       tags: [],
  //     });
  //   } catch (err: any) {
  //     console.error('Create announcement error:', err);
  //     setError(err.message || 'Failed to create announcement');
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  // const handleDeleteSelected = () => {
  //   if (selectedAnnouncementIds.length === 0) return;

  //   const count = selectedAnnouncementIds.length;
  //   setConfirmModal({
  //     title: 'Delete Announcements',
  //     message: `Are you sure you want to delete ${count} announcement${count > 1 ? 's' : ''}? This action cannot be undone.`,
  //     confirmText: 'Delete',
  //     onConfirm: async () => {
  //       try {
  //         setError('');
  //         await Promise.all(
  //           selectedAnnouncementIds.map(id =>
  //             fetchWithAuth(`${API_BASE_URL}/api/announcements/${id}`, {
  //               method: 'DELETE',
  //             })
  //           )
  //         );

  //         await fetchAnnouncement();
  //         setSelectedAnnouncementIds([]);
  //         setToast({
  //           message: `${count} announcement${count > 1 ? 's' : ''} deleted successfully`,
  //           type: 'success',
  //         });
  //       } catch (err: any) {
  //         setToast({ message: err.message || 'Failed to delete announcements', type: 'error' });
  //       } finally {
  //         setConfirmModal(null);
  //       }
  //     },
  //   });
  // };

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
      <OrganizationSidebar />

      <div className='flex-1 p-8'>
        <h1 className='text-3xl font-bold text-gray-800 mb-6'>
          {filter === 'ALL' && `All Announcements (${currentFilterCount})`}
          {filter === 'PUBLISHED' && `Published (${currentFilterCount})`}
          {filter === 'DRAFTS' && `Drafts (${currentFilterCount})`}
        </h1>

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
                } cursor-pointer`}
              >
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
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

        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6'>
            {error}
          </div>
        )}

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
                  <tr key={a.id} className='hover:bg-gray-50'>
                    <td
                      className='px-6 py-4 text-[#194B90] font-medium hover:underline cursor-pointer'
                      onClick={() => setSelectedAnnouncement(a)}
                    >
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
                              className='px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200'
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
              <h3 className='font-bold text-xl text-gray-900 mb-3'>{selectedAnnouncement.title}</h3>

              <div className='space-y-4'>
                <div>
                  <h4 className='font-semibold text-base text-gray-800 mb-2'>Basic Information</h4>
                  <div className='grid grid-cols-2 gap-3'>
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

                <div>
                  <h4 className='font-semibold text-base text-gray-800 mb-2'>Content</h4>
                  <div
                    className='prose max-w-none text-sm text-gray-900'
                    dangerouslySetInnerHTML={{
                      __html: selectedAnnouncement.content || 'No content',
                    }}
                  />
                </div>

                <div>
                  <h4 className='font-semibold text-base text-gray-800 mb-2'>Attachments</h4>
                  {selectedAnnouncement.attachmentUrls?.length > 0 ? (
                    <ul className='space-y-1'>
                      {selectedAnnouncement.attachmentUrls.map((url, i) => (
                        <li key={i} className='text-sm flex justify-between items-center'>
                          <a
                            href={`/org-announcements/`}
                            className='text-[#194B90] hover:underline'
                          >
                            {url}
                          </a>{' '}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className='text-sm text-gray-900'>No attachments</p>
                  )}
                </div>

                <div>
                  <h4 className='font-semibold text-base text-gray-800 mb-2'>Tags</h4>
                  {selectedAnnouncement.tags && selectedAnnouncement.tags.length > 0 ? (
                    <div className='flex flex-wrap gap-2'>
                      {selectedAnnouncement.tags.map((tag, index) => (
                        <span
                          key={index}
                          className='px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200'
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
                {!selectedAnnouncement.isPublished && (
                  <button
                    onClick={async () => {
                      try {
                        await fetchWithAuth(
                          `${API_BASE_URL}/api/announcements/${selectedAnnouncement.id}/publish`,
                          {
                            method: 'POST',
                          }
                        );
                        setToast({
                          message: 'Announcement published successfully',
                          type: 'success',
                        });
                        await fetchAnnouncement();
                        setSelectedAnnouncement(null);
                      } catch (err: any) {
                        setToast({
                          message: err.message || 'Failed to publish announcement',
                          type: 'error',
                        });
                      }
                    }}
                    className='btn bg-[#D54242] hover:bg-[#b53a3a] text-white border-none'
                  >
                    Publish
                  </button>
                )}
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className='btn bg-[#D54242] hover:bg-[#b53a3a] text-white border-none'
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

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
};

export default OrgAnnouncementsPage;
