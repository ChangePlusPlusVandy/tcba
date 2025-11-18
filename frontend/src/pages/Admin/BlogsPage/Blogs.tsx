import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import AdminSidebar from '../../../components/AdminSidebar';
import Toast from '../../../components/Toast';
import ConfirmModal from '../../../components/ConfirmModal';
import { API_BASE_URL } from '../../../config/api';

type Tag = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type Blog = {
  id: string;
  slug: string;
  title: string;
  content: string;
  author: string;
  tags: Tag[];
  featuredImageUrl?: string;
  isPublished: boolean;
  publishedDate?: string;
  createdAt: string;
  updatedAt: string;
};

type Filter = 'ALL' | 'PUBLISHED' | 'DRAFTS';

const AdminBlogs = () => {
  const { getToken } = useAuth();

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBlogIds, setSelectedBlogIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);

  const [newBlog, setNewBlog] = useState({
    title: '',
    content: '',
    author: '',
    tagIds: [] as string[],
    isPublished: false,
  });

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

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = await getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    if (response.status === 204) return null;
    return response.json();
  };

  const fetchBlogs = async () => {
    try {
      setError('');
      const data = await fetchWithAuth(`${API_BASE_URL}/api/blogs`);
      console.log('Fetched blogs:', data);
      console.log('Blogs count:', data.length);
      console.log(
        'Drafts:',
        data.filter((b: any) => !b.isPublished)
      );
      console.log(
        'Published:',
        data.filter((b: any) => b.isPublished)
      );
      setBlogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch blogs');
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/blogs/tags`);
      setAllTags(response.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  useEffect(() => {
    fetchBlogs();
    fetchTags();
  }, []);

  const handleCreateBlog = async (publish: boolean) => {
    if (!newBlog.title.trim()) {
      setToast({ message: 'Title is required', type: 'error' });
      return;
    }
    if (!newBlog.content.trim()) {
      setToast({ message: 'Content is required', type: 'error' });
      return;
    }
    if (!newBlog.author.trim()) {
      setToast({ message: 'Author is required', type: 'error' });
      return;
    }

    try {
      setError('');
      const blogData = {
        ...newBlog,
        isPublished: publish,
        publishedDate: publish ? new Date().toISOString() : null,
      };

      console.log('Creating blog with data:', blogData);

      await fetchWithAuth(`${API_BASE_URL}/api/blogs`, {
        method: 'POST',
        body: JSON.stringify(blogData),
      });

      await fetchBlogs();
      setIsCreateModalOpen(false);
      setNewBlog({
        title: '',
        content: '',
        author: '',
        tagIds: [],
        isPublished: false,
      });

      const successMessage = publish ? 'Blog created successfully' : 'Blog saved successfully';
      setToast({ message: successMessage, type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to create blog', type: 'error' });
    }
  };

  const handleDeleteSelected = () => {
    if (selectedBlogIds.length === 0) return;

    const count = selectedBlogIds.length;
    setConfirmModal({
      title: 'Delete Blogs',
      message: `Are you sure you want to delete ${count} blog${count > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          setError('');
          await Promise.all(
            selectedBlogIds.map(id =>
              fetchWithAuth(`${API_BASE_URL}/api/blogs/${id}`, {
                method: 'DELETE',
              })
            )
          );

          await fetchBlogs();
          setSelectedBlogIds([]);
          setToast({
            message: `${count} blog${count > 1 ? 's' : ''} deleted successfully`,
            type: 'success',
          });
        } catch (err: any) {
          setToast({ message: err.message || 'Failed to delete blogs', type: 'error' });
        } finally {
          setConfirmModal(null);
        }
      },
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedBlogIds(filteredBlogs.map(b => b.id));
    } else {
      setSelectedBlogIds([]);
    }
  };

  const handleSelectBlog = (id: string) => {
    setSelectedBlogIds(prev =>
      prev.includes(id) ? prev.filter(blogId => blogId !== id) : [...prev, id]
    );
  };

  const openDetailModal = (blog: Blog) => {
    setSelectedBlog(blog);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedBlog(null);
  };

  const filteredBlogs = blogs.filter(blog => {
    if (filter === 'PUBLISHED' && !blog.isPublished) return false;
    if (filter === 'DRAFTS' && blog.isPublished) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        blog.title.toLowerCase().includes(query) ||
        blog.content.toLowerCase().includes(query) ||
        blog.author.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
  };

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <AdminSidebar />

      <div className='flex-1 p-8'>
        <h1 className='text-3xl font-bold text-gray-800 mb-6'>All Blogs ({blogs.length})</h1>

        <div className='flex items-center gap-4 mb-6'>
          <div className='flex gap-2'>
            <button
              onClick={() => setFilter('ALL')}
              className={`px-6 py-2.5 rounded-[10px] font-medium transition ${
                filter === 'ALL'
                  ? 'bg-[#EBF3FF] text-[#194B90] border border-[#194B90]'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              } cursor-pointer`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('PUBLISHED')}
              className={`px-6 py-2.5 rounded-[10px] font-medium transition ${
                filter === 'PUBLISHED'
                  ? 'bg-[#EBF3FF] text-[#194B90] border border-[#194B90]'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              } cursor-pointer`}
            >
              Published
            </button>
            <button
              onClick={() => setFilter('DRAFTS')}
              className={`px-6 py-2.5 rounded-[10px] font-medium transition ${
                filter === 'DRAFTS'
                  ? 'bg-[#EBF3FF] text-[#194B90] border border-[#194B90]'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              } cursor-pointer`}
            >
              Drafts
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className='px-6 py-2.5 rounded-[10px] font-medium transition bg-[#D54242] text-white hover:bg-[#b53a3a] cursor-pointer'
          >
            Create
          </button>

          {selectedBlogIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className='px-6 py-2.5 rounded-[10px] font-medium transition bg-[#D54242] text-white hover:bg-[#b53a3a] cursor-pointer'
            >
              Delete Selected ({selectedBlogIds.length})
            </button>
          )}

          <div className='flex-1 max-w-xl ml-auto'>
            <div className='relative'>
              <input
                type='text'
                placeholder='Search blogs'
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
            <p className='text-gray-600'>Loading blogs...</p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-600'>No blogs found</p>
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
                        filteredBlogs.length > 0 && selectedBlogIds.length === filteredBlogs.length
                      }
                      onChange={handleSelectAll}
                      className='w-4 h-4'
                    />
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Title</th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                    Author
                  </th>
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
                {filteredBlogs.map(blog => (
                  <tr key={blog.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4' onClick={e => e.stopPropagation()}>
                      <input
                        type='checkbox'
                        checked={selectedBlogIds.includes(blog.id)}
                        onChange={() => handleSelectBlog(blog.id)}
                        className='w-4 h-4'
                      />
                    </td>
                    <td
                      className='px-6 py-4 text-[#194B90] font-medium hover:underline cursor-pointer'
                      onClick={() => openDetailModal(blog)}
                    >
                      {blog.title}
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm text-gray-900'>{blog.author}</span>
                    </td>
                    <td className='px-6 py-4'>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          blog.isPublished
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {blog.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex gap-2 flex-wrap'>
                        {blog.tags.map(tag => (
                          <span
                            key={tag.id}
                            className='px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200'
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm text-gray-600'>
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <>
          <input type='checkbox' checked readOnly className='modal-toggle' />
          <div className='modal modal-open'>
            <div className='modal-box max-w-2xl max-h-[80vh] bg-white overflow-y-auto m-8'>
              <h3 className='font-bold text-xl text-gray-900 mb-4'>Create New Blog</h3>

              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1'>
                    Title <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    required
                    value={newBlog.title}
                    onChange={e => setNewBlog({ ...newBlog, title: e.target.value })}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                    placeholder='Enter blog title'
                  />
                </div>

                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1'>
                    Author <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    required
                    value={newBlog.author}
                    onChange={e => setNewBlog({ ...newBlog, author: e.target.value })}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                    placeholder='Enter author name'
                  />
                </div>

                <div className='mb-4'>
                  <label className='block text-sm font-semibold text-gray-700 mb-1'>
                    Content <span className='text-red-500'>*</span>
                  </label>
                  <div style={{ height: '250px' }}>
                    <ReactQuill
                      theme='snow'
                      value={newBlog.content}
                      onChange={value => setNewBlog({ ...newBlog, content: value })}
                      placeholder='Enter blog content...'
                      modules={modules}
                      style={{ height: '200px' }}
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>Tags</label>
                  <div className='min-h-[80px]'>
                    {allTags.length === 0 ? (
                      <p className='text-sm text-gray-500'>No tags available</p>
                    ) : (
                      <div className='flex flex-wrap gap-2'>
                        {allTags.map(tag => {
                          const isSelected = newBlog.tagIds.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              type='button'
                              onClick={() => {
                                if (isSelected) {
                                  setNewBlog({
                                    ...newBlog,
                                    tagIds: newBlog.tagIds.filter(id => id !== tag.id),
                                  });
                                } else {
                                  setNewBlog({
                                    ...newBlog,
                                    tagIds: [...newBlog.tagIds, tag.id],
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

                  {newBlog.tagIds.length > 0 && (
                    <p className='text-xs text-gray-600 mt-2'>
                      {newBlog.tagIds.length} tag{newBlog.tagIds.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                <div className='flex gap-3 pt-4'>
                  <button
                    type='button'
                    onClick={() => handleCreateBlog(true)}
                    className='px-6 py-2.5 bg-[#D54242] hover:bg-[#b53a3a] text-white rounded-lg font-medium'
                  >
                    Publish
                  </button>
                  <button
                    type='button'
                    onClick={() => handleCreateBlog(false)}
                    className='px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium'
                  >
                    Save to Drafts
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setNewBlog({
                        title: '',
                        content: '',
                        author: '',
                        tagIds: [],
                        isPublished: false,
                      });
                    }}
                    className='px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium'
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {isDetailModalOpen && selectedBlog && (
        <>
          <input type='checkbox' checked readOnly className='modal-toggle' />
          <div className='modal modal-open'>
            <div className='modal-box max-w-2xl max-h-[80vh] bg-white overflow-y-auto m-8'>
              <h3 className='font-bold text-xl text-gray-900 mb-3'>{selectedBlog.title}</h3>

              <div className='space-y-4'>
                {/* Basic Info */}
                <div>
                  <h4 className='font-semibold text-base text-gray-800 mb-2'>Basic Information</h4>
                  <div className='grid grid-cols-2 gap-3'>
                    <div>
                      <span className='text-sm font-bold text-gray-600'>Author:</span>
                      <p className='text-sm text-gray-900'>{selectedBlog.author}</p>
                    </div>

                    <div>
                      <span className='text-sm font-bold text-gray-600'>Status:</span>
                      <p className='text-sm'>
                        <span
                          className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                            selectedBlog.isPublished
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {selectedBlog.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className='font-semibold text-base text-gray-800 mb-2'>Content</h4>
                  <div
                    className='prose max-w-none text-sm text-gray-900'
                    dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
                  />
                </div>

                <div>
                  <h4 className='font-semibold text-base text-gray-800 mb-2'>Tags</h4>
                  {selectedBlog.tags && selectedBlog.tags.length > 0 ? (
                    <div className='flex flex-wrap gap-2'>
                      {selectedBlog.tags.map(tag => (
                        <span
                          key={tag.id}
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
                        {new Date(selectedBlog.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className='text-sm font-bold text-gray-600'>Updated:</span>
                      <p className='text-sm text-gray-900'>
                        {new Date(selectedBlog.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className='modal-action'>
                {!selectedBlog.isPublished && (
                  <button
                    onClick={async () => {
                      try {
                        await fetchWithAuth(
                          `${API_BASE_URL}/api/blogs/${selectedBlog.id}/publish`,
                          {
                            method: 'PUT',
                          }
                        );
                        setToast({ message: 'Blog published successfully', type: 'success' });
                        await fetchBlogs();
                        closeDetailModal();
                      } catch (err: any) {
                        setToast({
                          message: err.message || 'Failed to publish blog',
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

export default AdminBlogs;
