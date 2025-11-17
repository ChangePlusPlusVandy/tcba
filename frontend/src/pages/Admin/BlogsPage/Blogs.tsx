import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import AdminSidebar from '../../../components/AdminSidebar';
import Toast from '../../../components/Toast';
import ConfirmModal from '../../../components/ConfirmModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

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

  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

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
    const token = await getToken({ template: 'jwt-template-tcba' });
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
        <div className='modal modal-open'>
          <div className='modal-box max-w-4xl'>
            <h3 className='font-bold text-lg mb-4'>Create New Blog</h3>

            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Title *</label>
                <input
                  type='text'
                  value={newBlog.title}
                  onChange={e => setNewBlog({ ...newBlog, title: e.target.value })}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                  placeholder='Enter blog title'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Author *</label>
                <input
                  type='text'
                  value={newBlog.author}
                  onChange={e => setNewBlog({ ...newBlog, author: e.target.value })}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                  placeholder='Enter author name'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Content *</label>
                <ReactQuill
                  theme='snow'
                  value={newBlog.content}
                  onChange={value => setNewBlog({ ...newBlog, content: value })}
                  modules={modules}
                  className='bg-white'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Tags</label>
                <div className='flex gap-2 flex-wrap mb-2'>
                  {newBlog.tagIds.map(tagId => {
                    const tag = allTags.find(t => t.id === tagId);
                    return tag ? (
                      <span
                        key={tag.id}
                        className='px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full flex items-center gap-2'
                      >
                        {tag.name}
                        <button
                          onClick={() =>
                            setNewBlog({
                              ...newBlog,
                              tagIds: newBlog.tagIds.filter(id => id !== tagId),
                            })
                          }
                          className='text-blue-700 hover:text-blue-900'
                        >
                          ×
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
                <div className='relative'>
                  <button
                    type='button'
                    onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                    className='px-4 py-2 bg-[#194B90] text-white rounded-md hover:bg-[#153a70] text-sm'
                  >
                    Add Tag
                  </button>
                  {isTagDropdownOpen && (
                    <div className='absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-md shadow-lg z-50 w-56 max-h-60 overflow-y-auto'>
                      {allTags
                        .filter(tag => !newBlog.tagIds.includes(tag.id))
                        .map(tag => (
                          <button
                            key={tag.id}
                            type='button'
                            onClick={() => {
                              setNewBlog({
                                ...newBlog,
                                tagIds: [...newBlog.tagIds, tag.id],
                              });
                              setIsTagDropdownOpen(false);
                            }}
                            className='w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700'
                          >
                            {tag.name}
                          </button>
                        ))}
                      {allTags.filter(tag => !newBlog.tagIds.includes(tag.id)).length === 0 && (
                        <div className='px-4 py-2 text-sm text-gray-500'>No tags available</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className='modal-action'>
              <button
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
                className='btn btn-ghost'
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreateBlog(false)}
                className='btn bg-gray-600 text-white hover:bg-gray-700'
              >
                Save to Drafts
              </button>
              <button
                onClick={() => handleCreateBlog(true)}
                className='btn bg-[#194B90] text-white hover:bg-[#153a70]'
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {isDetailModalOpen && selectedBlog && (
        <div className='modal modal-open'>
          <div className='modal-box max-w-4xl'>
            <h3 className='font-bold text-2xl mb-2'>{selectedBlog.title}</h3>
            <p className='text-sm text-gray-600 mb-4'>By {selectedBlog.author}</p>

            <div className='flex gap-2 flex-wrap mb-4'>
              {selectedBlog.tags.map(tag => (
                <span
                  key={tag.id}
                  className='px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full'
                >
                  {tag.name}
                </span>
              ))}
            </div>

            <div
              className='prose max-w-none mb-4'
              dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
            />

            <div className='flex items-center justify-between mt-6 pt-4 border-t'>
              <div>
                <p className='text-sm text-gray-600'>
                  Status:{' '}
                  <span
                    className={`font-medium ${
                      selectedBlog.isPublished ? 'text-green-600' : 'text-yellow-600'
                    }`}
                  >
                    {selectedBlog.isPublished ? 'Published' : 'Draft'}
                  </span>
                </p>
                <p className='text-sm text-gray-600'>
                  Created: {new Date(selectedBlog.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className='modal-action'>
              <button onClick={closeDetailModal} className='btn'>
                Close
              </button>
            </div>
          </div>
        </div>
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
