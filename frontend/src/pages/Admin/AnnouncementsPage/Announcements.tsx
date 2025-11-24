import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import AdminSidebar from '../../../components/AdminSidebar';
import Toast from '../../../components/Toast';
import ConfirmModal from '../../../components/ConfirmModal';
import FileUpload from '../../../components/FileUpload';
import AttachmentList from '../../../components/AttachmentList';
import { API_BASE_URL } from '../../../config/api';

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
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFTS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  type SortField = 'title' | 'publishedDate' | 'tags' | 'createdAt';
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    slug: '',
    content: '',
    isPublished: false,
    tags: [] as string[],
    attachmentUrls: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [selectedAnnouncementIds, setSelectedAnnouncementIds] = useState<string[]>([]);
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

  const quillRef = useRef<ReactQuill>(null);

  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPG, PNG, GIF, or WebP)');
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        return;
      }

      try {
        const token = await getToken();
        const fileName = file.name;
        const fileType = file.type;

        const presignedResponse = await fetch(
          `${API_BASE_URL}/api/files/presigned-upload?fileName=${encodeURIComponent(fileName)}&fileType=${encodeURIComponent(fileType)}&folder=announcements`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!presignedResponse.ok) {
          throw new Error('Failed to get upload URL');
        }

        const { uploadUrl, key } = await presignedResponse.json();

        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': fileType,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }

        // Get presigned URL for the uploaded image
        const publicImageResponse = await fetch(
          `${API_BASE_URL}/api/files/public-image/${encodeURIComponent(key)}`
        );

        if (!publicImageResponse.ok) {
          throw new Error('Failed to get image URL');
        }

        const { url: imageUrl } = await publicImageResponse.json();

        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection(true);
          const index = range ? range.index : quill.getLength();
          quill.insertEmbed(index, 'image', imageUrl);
          quill.setSelection(index + 1);
        }
      } catch (err: any) {
        console.error('Upload error:', err);
        alert(err.message || 'Failed to upload image');
      }
    };
  }, [getToken]);

  const quillModules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'image'],
          ['clean'],
        ],
        handlers: {
          image: handleImageUpload,
        },
      },
    }),
    [handleImageUpload]
  );

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

  const fetchTags = async () => {
    try {
      setError('');
      const response = await fetchWithAuth(`${API_BASE_URL}/api/tags`);

      if (!response.ok) throw new Error('Failed to fetch tags');

      const data = await response.json();
      setTags(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        isPublished: newAnnouncement.isPublished,
        tagIds: newAnnouncement.tags,
        publishedDate: newAnnouncement.isPublished ? new Date().toISOString() : null,
        attachmentUrls: newAnnouncement.attachmentUrls,
      };

      const response = await fetchWithAuth(`${API_BASE_URL}/api/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create announcement');
      }

      await fetchAnnouncement();

      const successMessage = newAnnouncement.isPublished
        ? 'Announcement created successfully'
        : 'Announcement saved successfully';
      setToast({ message: successMessage, type: 'success' });

      setIsCreateModalOpen(false);
      setNewAnnouncement({
        title: '',
        slug: '',
        content: '',
        isPublished: false,
        tags: [],
        attachmentUrls: [],
      });
    } catch (err: any) {
      console.error('Create announcement error:', err);
      setError(err.message || 'Failed to create announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedAnnouncementIds.length === 0) return;

    const count = selectedAnnouncementIds.length;
    setConfirmModal({
      title: 'Delete Announcements',
      message: `Are you sure you want to delete ${count} announcement${count > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          setIsDeleting(true);
          setError('');
          await Promise.all(
            selectedAnnouncementIds.map(id =>
              fetchWithAuth(`${API_BASE_URL}/api/announcements/${id}`, {
                method: 'DELETE',
              })
            )
          );

          await fetchAnnouncement();
          setSelectedAnnouncementIds([]);
          setToast({
            message: `${count} announcement${count > 1 ? 's' : ''} deleted successfully`,
            type: 'success',
          });
        } catch (err: any) {
          setToast({ message: err.message || 'Failed to delete announcements', type: 'error' });
        } finally {
          setIsDeleting(false);
          setConfirmModal(null);
        }
      },
    });
  };

  const generateSlug = (title: string): string => {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const timestamp = Date.now().toString(36);
    return `${baseSlug}-${timestamp}`;
  };

  useEffect(() => {
    fetchAnnouncement();
    fetchTags();
  }, []);

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

  const published = announcements.filter(a => a.isPublished === true);
  const drafts = announcements.filter(a => a.isPublished === false);

  const filtered =
    filter === 'PUBLISHED' ? published : filter === 'DRAFTS' ? drafts : announcements;

  const searchedAnnouncements = filtered.filter(a => {
    const matchesTags =
      tagsFilter.length === 0 ||
      tagsFilter.some(tagName => a.tags?.some(announcementTag => announcementTag.name === tagName));

    const q = searchQuery.toLowerCase();
    return (
      (a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.tags.some(t => t.name.toLowerCase().includes(q))) &&
      matchesTags
    );
  });

  const sortedAnnouncements = [...searchedAnnouncements].sort((a, b) => {
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
                {tags.length === 0 ? (
                  <div className='px-4 py-3 text-sm text-gray-500'>No tags available</div>
                ) : (
                  <div className='py-2'>
                    {tags.map(tag => (
                      <label
                        key={tag.id}
                        className='flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer'
                      >
                        <input
                          type='checkbox'
                          checked={tagsFilter.includes(tag.name)}
                          onChange={e => {
                            if (e.target.checked) {
                              setTagsFilter([...tagsFilter, tag.name]);
                            } else {
                              setTagsFilter(tagsFilter.filter(t => t !== tag.name));
                            }
                          }}
                          className='w-4 h-4 text-[#194B90] border-gray-300 rounded focus:ring-[#194B90]'
                        />
                        <span className='ml-2 text-sm text-gray-700'>{tag.name}</span>
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

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className='px-6 py-2.5 rounded-[10px] font-medium transition bg-[#D54242] text-white hover:bg-[#b53a3a] cursor-pointer'
          >
            Create
          </button>

          {selectedAnnouncementIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className='px-6 py-2.5 rounded-[10px] font-medium transition bg-[#D54242] text-white hover:bg-[#b53a3a] cursor-pointer'
            >
              Delete Selected ({selectedAnnouncementIds.length})
            </button>
          )}

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
        ) : searchedAnnouncements.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-600'>No announcements found.</p>
          </div>
        ) : (
          <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
            <table className='min-w-full'>
              <thead className='bg-gray-50 border-b border-gray-200'>
                <tr>
                  <th className='px-6 py-4 w-12'>
                    <input
                      type='checkbox'
                      checked={
                        selectedAnnouncementIds.length === sortedAnnouncements.length &&
                        sortedAnnouncements.length > 0
                      }
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedAnnouncementIds(sortedAnnouncements.map(a => a.id));
                        } else {
                          setSelectedAnnouncementIds([]);
                        }
                      }}
                      className='w-4 h-4'
                    />
                  </th>
                  <th
                    className='px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100'
                    onClick={() => handleSort('title')}
                  >
                    <div className='flex items-center gap-2'>
                      Title
                      <SortIcon field='title' />
                    </div>
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                    Status
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
                  <th
                    className='px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100'
                    onClick={() => handleSort('publishedDate')}
                  >
                    <div className='flex items-center gap-2'>
                      Published
                      <SortIcon field='publishedDate' />
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody className='divide-y divide-gray-200'>
                {sortedAnnouncements.map(a => (
                  <tr key={a.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4' onClick={e => e.stopPropagation()}>
                      <input
                        type='checkbox'
                        checked={selectedAnnouncementIds.includes(a.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedAnnouncementIds([...selectedAnnouncementIds, a.id]);
                          } else {
                            setSelectedAnnouncementIds(
                              selectedAnnouncementIds.filter(id => id !== a.id)
                            );
                          }
                        }}
                        className='w-4 h-4'
                      />
                    </td>
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
                      {a.tags && a.tags.length > 0 ? (
                        <div className='flex flex-wrap gap-1'>
                          {a.tags.map(t => (
                            <span
                              key={t.id}
                              className='px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200'
                            >
                              {t.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className='text-sm text-gray-400'>-</span>
                      )}
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

                {selectedAnnouncement.attachmentUrls &&
                  selectedAnnouncement.attachmentUrls.length > 0 && (
                    <AttachmentList attachmentUrls={selectedAnnouncement.attachmentUrls} />
                  )}

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
                    className='px-6 py-2.5 bg-[#D54242] hover:bg-[#b53a3a] text-white rounded-xl font-medium transition'
                  >
                    Publish
                  </button>
                )}
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className='px-6 py-2.5 bg-[#D54242] hover:bg-[#b53a3a] text-white rounded-xl font-medium transition'
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

      {isCreateModalOpen && (
        <>
          <input type='checkbox' checked readOnly className='modal-toggle' />
          <div className='modal modal-open'>
            <div className='modal-box max-w-2xl max-h-[80vh] bg-white overflow-y-auto m-8'>
              <h3 className='font-bold text-xl text-gray-900 mb-4'>Create New Announcement</h3>

              <form onSubmit={handleCreateAnnouncement} className='space-y-4'>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1'>
                    Title <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    required
                    value={newAnnouncement.title}
                    onChange={e => {
                      const title = e.target.value;
                      setNewAnnouncement({
                        ...newAnnouncement,
                        title,
                        slug: generateSlug(title),
                      });
                    }}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                    placeholder='Enter announcement title'
                  />
                </div>

                <div className='mb-4'>
                  <label className='block text-sm font-semibold text-gray-700 mb-1'>
                    Content <span className='text-red-500'>*</span>
                  </label>
                  <div style={{ height: '250px' }}>
                    <ReactQuill
                      ref={quillRef}
                      theme='snow'
                      value={newAnnouncement.content}
                      onChange={value => setNewAnnouncement({ ...newAnnouncement, content: value })}
                      placeholder='Enter announcement content...'
                      modules={quillModules}
                      style={{ height: '200px' }}
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>Tags</label>
                  <div className='min-h-[80px]'>
                    {tags.length === 0 ? (
                      <p className='text-sm text-gray-500'>No tags available</p>
                    ) : (
                      <div className='flex flex-wrap gap-2'>
                        {tags.map(tag => {
                          const isSelected = newAnnouncement.tags.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              type='button'
                              onClick={() => {
                                if (isSelected) {
                                  setNewAnnouncement({
                                    ...newAnnouncement,
                                    tags: newAnnouncement.tags.filter(id => id !== tag.id),
                                  });
                                } else {
                                  setNewAnnouncement({
                                    ...newAnnouncement,
                                    tags: [...newAnnouncement.tags, tag.id],
                                  });
                                }
                              }}
                              className={`px-4 py-1 text-sm font-medium rounded-full transition-colors ${
                                isSelected
                                  ? 'bg-[#D54242] text-white border-2 border-[#D54242]'
                                  : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200'
                              }`}
                            >
                              {tag.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {newAnnouncement.tags.length > 0 && (
                    <p className='text-xs text-gray-600 mt-2'>
                      {newAnnouncement.tags.length} tag
                      {newAnnouncement.tags.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                <FileUpload
                  attachmentUrls={newAnnouncement.attachmentUrls}
                  onFilesChange={files =>
                    setNewAnnouncement({ ...newAnnouncement, attachmentUrls: files })
                  }
                />

                <div className='flex gap-3 pt-4'>
                  <button
                    type='button'
                    disabled={isSubmitting}
                    onClick={async () => {
                      if (!newAnnouncement.title.trim()) {
                        setError('Title is required');
                        return;
                      }
                      if (!newAnnouncement.content.trim()) {
                        setError('Content is required');
                        return;
                      }

                      setIsSubmitting(true);
                      setError('');

                      try {
                        const payload = {
                          title: newAnnouncement.title,
                          content: newAnnouncement.content,
                          isPublished: true,
                          tagIds: newAnnouncement.tags,
                          publishedDate: new Date().toISOString(),
                          attachmentUrls: newAnnouncement.attachmentUrls,
                        };

                        console.log('Publishing announcement with payload:', payload);

                        const response = await fetchWithAuth(`${API_BASE_URL}/api/announcements`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(payload),
                        });

                        if (!response.ok) {
                          const errorData = await response.json();
                          console.error('Server error:', errorData);
                          throw new Error(errorData.error || 'Failed to create announcement');
                        }

                        await fetchAnnouncement();
                        setIsCreateModalOpen(false);
                        setNewAnnouncement({
                          title: '',
                          slug: '',
                          content: '',
                          isPublished: false,
                          tags: [],
                          attachmentUrls: [],
                        });
                        setToast({
                          message: 'Announcement published successfully!',
                          type: 'success',
                        });
                      } catch (err: any) {
                        console.error('Create announcement error:', err);
                        setError(err.message || 'Failed to create announcement');
                        setToast({
                          message: err.message || 'Failed to publish announcement',
                          type: 'error',
                        });
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    className='px-6 py-2.5 bg-[#D54242] hover:bg-[#b53a3a] text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {isSubmitting ? 'Publishing...' : 'Publish'}
                  </button>
                  <button
                    type='button'
                    disabled={isSubmitting}
                    onClick={async () => {
                      // Validation
                      if (!newAnnouncement.title.trim()) {
                        setError('Title is required');
                        return;
                      }
                      if (!newAnnouncement.content.trim()) {
                        setError('Content is required');
                        return;
                      }

                      setIsSubmitting(true);
                      setError('');

                      try {
                        const payload = {
                          title: newAnnouncement.title,
                          content: newAnnouncement.content,
                          isPublished: false,
                          tagIds: newAnnouncement.tags,
                          publishedDate: null,
                          attachmentUrls: newAnnouncement.attachmentUrls,
                        };

                        console.log('Saving to drafts with payload:', payload);

                        const response = await fetchWithAuth(`${API_BASE_URL}/api/announcements`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(payload),
                        });

                        if (!response.ok) {
                          const errorData = await response.json();
                          console.error('Server error:', errorData);
                          throw new Error(errorData.error || 'Failed to create announcement');
                        }

                        await fetchAnnouncement();
                        setIsCreateModalOpen(false);
                        setNewAnnouncement({
                          title: '',
                          slug: '',
                          content: '',
                          isPublished: false,
                          tags: [],
                          attachmentUrls: [],
                        });
                        setToast({ message: 'Announcement saved to drafts!', type: 'success' });
                      } catch (err: any) {
                        console.error('Create announcement error:', err);
                        setError(err.message || 'Failed to create announcement');
                        setToast({
                          message: err.message || 'Failed to save announcement',
                          type: 'error',
                        });
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    className='px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {isSubmitting ? 'Saving...' : 'Save to Drafts'}
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setNewAnnouncement({
                        title: '',
                        slug: '',
                        content: '',
                        isPublished: false,
                        tags: [],
                        attachmentUrls: [],
                      });
                    }}
                    className='px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium'
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>

            <div
              className='modal-backdrop bg-black/30'
              onClick={() => {
                setIsCreateModalOpen(false);
                setNewAnnouncement({
                  title: '',
                  slug: '',
                  content: '',
                  isPublished: false,
                  tags: [],
                  attachmentUrls: [],
                });
              }}
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
          isLoading={isDeleting}
          loadingText='Deleting...'
        />
      )}
    </div>
  );
};

export default AdminAnnouncements;
