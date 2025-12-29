import axios from 'axios';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import ImageResize from 'quill-image-resize-module-react';
import AdminSidebar from '../../../components/AdminSidebar';
import Toast from '../../../components/Toast';
import ConfirmModal from '../../../components/ConfirmModal';
import FileUpload from '../../../components/FileUpload';
import AttachmentList from '../../../components/AttachmentList';
import Pagination from '../../../components/Pagination';
import { useAdminBlogs } from '../../../hooks/queries/useAdminBlogs';
import { useBlogMutations } from '../../../hooks/mutations/useBlogMutations';
import { API_BASE_URL } from '../../../config/api';

Quill.register('modules/imageResize', ImageResize);

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
  attachmentUrls?: string[];
};

type Filter = 'ALL' | 'PUBLISHED' | 'DRAFTS';

const AdminBlogs = () => {
  const { getToken } = useAuth();
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedBlogIds, setSelectedBlogIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const { data: blogsData, isLoading: loading, error: blogsError } = useAdminBlogs(currentPage, itemsPerPage);
  const { createBlog, updateBlog, deleteBlog } = useBlogMutations();

  const blogsResponse = blogsData || {};
  const blogs = blogsResponse.data || blogsResponse;
  const blogsArray: Blog[] = Array.isArray(blogs) ? blogs : [];
  const totalBlogs = blogsResponse.total || blogsResponse.pagination?.total || blogsArray.length;
  const error = blogsError ? 'Failed to fetch blogs' : '';

  type SortField = 'title' | 'author' | 'publishedDate' | 'tags' | 'createdAt';
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedBlog, setEditedBlog] = useState({
    title: '',
    content: '',
    author: '',
    tagIds: [] as string[],
    attachmentUrls: [] as string[],
  });

  const [newBlog, setNewBlog] = useState({
    title: '',
    content: '',
    author: '',
    tagIds: [] as string[],
    isPublished: false,
    attachmentUrls: [] as string[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const fetchTags = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/blogs/tags`);
      setAllTags(response.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  useEffect(() => {
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
      setIsSubmitting(true);
      const blogData = {
        ...newBlog,
        isPublished: publish,
        publishedDate: publish ? new Date().toISOString() : null,
      };

      await createBlog.mutateAsync(blogData);

      setIsCreateModalOpen(false);
      setNewBlog({
        title: '',
        content: '',
        author: '',
        tagIds: [],
        isPublished: false,
        attachmentUrls: [],
      });

      const successMessage = publish ? 'Blog created successfully' : 'Blog saved successfully';
      setToast({ message: successMessage, type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to create blog', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBlog = async () => {
    if (!selectedBlog) return;

    setIsSubmitting(true);

    try {
      const payload = {
        title: editedBlog.title,
        content: editedBlog.content,
        author: editedBlog.author,
        tagIds: editedBlog.tagIds,
        attachmentUrls: editedBlog.attachmentUrls,
      };

      await updateBlog.mutateAsync({ id: selectedBlog.id, data: payload });

      setToast({ message: 'Blog updated successfully', type: 'success' });
      closeDetailModal();
      setIsEditMode(false);
    } catch (err: any) {
      console.error('Update blog error:', err);
      setToast({ message: err.message || 'Failed to update blog', type: 'error' });
    } finally {
      setIsSubmitting(false);
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
          setIsDeleting(true);
          await Promise.all(
            selectedBlogIds.map(id => deleteBlog.mutateAsync(id))
          );

          setSelectedBlogIds([]);
          setToast({
            message: `${count} blog${count > 1 ? 's' : ''} deleted successfully`,
            type: 'success',
          });
        } catch (err: any) {
          setToast({ message: err.message || 'Failed to delete blogs', type: 'error' });
        } finally {
          setIsDeleting(false);
          setConfirmModal(null);
        }
      },
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedBlogIds(sortedBlogs.map(b => b.id));
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

  const filteredBlogs = blogsArray.filter(blog => {
    if (filter === 'PUBLISHED' && !blog.isPublished) return false;
    if (filter === 'DRAFTS' && blog.isPublished) return false;

    const matchesTags =
      tagsFilter.length === 0 ||
      tagsFilter.some(tagName => blog.tags?.some(blogTag => blogTag.name === tagName));

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (blog.title.toLowerCase().includes(query) ||
          blog.content.toLowerCase().includes(query) ||
          blog.author.toLowerCase().includes(query)) &&
        matchesTags
      );
    }

    return matchesTags;
  });

  const sortedBlogs = [...filteredBlogs].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'author':
        aValue = a.author.toLowerCase();
        bValue = b.author.toLowerCase();
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

  const quillRef = useRef<ReactQuill>(null);

  const alignImage = useCallback((alignment: 'left' | 'center' | 'right') => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const range = quill.getSelection();
    if (!range) return;

    const [leaf] = quill.getLeaf(range.index);
    if (leaf && leaf.domNode && (leaf.domNode as Element).tagName === 'IMG') {
      const img = leaf.domNode as HTMLImageElement;

      img.style.float = '';
      img.style.display = '';
      img.style.marginLeft = '';
      img.style.marginRight = '';

      switch (alignment) {
        case 'left':
          img.style.float = 'left';
          img.style.marginRight = '1rem';
          img.style.marginBottom = '0.5rem';
          break;
        case 'right':
          img.style.float = 'right';
          img.style.marginLeft = '1rem';
          img.style.marginBottom = '0.5rem';
          break;
        case 'center':
          img.style.display = 'block';
          img.style.marginLeft = 'auto';
          img.style.marginRight = 'auto';
          break;
      }
    }
  }, []);

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
          `${API_BASE_URL}/api/files/presigned-upload?fileName=${encodeURIComponent(fileName)}&fileType=${encodeURIComponent(fileType)}&folder=blogs`,
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

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'image'],
          ['align-image-left', 'align-image-center', 'align-image-right'],
          ['clean'],
        ],
        handlers: {
          image: handleImageUpload,
          'align-image-left': () => alignImage('left'),
          'align-image-center': () => alignImage('center'),
          'align-image-right': () => alignImage('right'),
        },
      },
      imageResize: {
        parchment: Quill.import('parchment'),
        modules: ['Resize', 'DisplaySize'],
      },
    }),
    [handleImageUpload, alignImage]
  );

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <AdminSidebar />

      <div className='flex-1 p-8'>
        <h1 className='text-3xl font-bold text-gray-800 mb-6'>
          {filter === 'ALL' && `All Blogs (${blogsArray.length})`}
          {filter === 'PUBLISHED' && `Published Blogs (${filteredBlogs.length})`}
          {filter === 'DRAFTS' && `Draft Blogs (${filteredBlogs.length})`}
        </h1>

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
                placeholder='Search blogs...'
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
                        sortedBlogs.length > 0 && selectedBlogIds.length === sortedBlogs.length
                      }
                      onChange={handleSelectAll}
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
                  <th
                    className='px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100'
                    onClick={() => handleSort('author')}
                  >
                    <div className='flex items-center gap-2'>
                      Author
                      <SortIcon field='author' />
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
                {sortedBlogs.map(blog => (
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
                      {blog.tags && blog.tags.length > 0 ? (
                        <div className='flex flex-wrap gap-1'>
                          {blog.tags.map(tag => (
                            <span
                              key={tag.id}
                              className='px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200'
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className='text-sm text-gray-400'>-</span>
                      )}
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm text-gray-600'>
                        {blog.publishedDate
                          ? new Date(blog.publishedDate).toLocaleDateString()
                          : '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalBlogs / itemsPerPage)}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={totalBlogs}
            />
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
                      ref={quillRef}
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

                <FileUpload
                  attachmentUrls={newBlog.attachmentUrls}
                  onFilesChange={files => setNewBlog({ ...newBlog, attachmentUrls: files })}
                />

                <div className='flex gap-3 pt-4'>
                  <button
                    type='button'
                    onClick={() => handleCreateBlog(true)}
                    disabled={isSubmitting}
                    className='px-6 py-2.5 bg-[#D54242] hover:bg-[#b53a3a] disabled:bg-[#e88888] text-white rounded-lg font-medium disabled:cursor-not-allowed'
                  >
                    {isSubmitting ? 'Publishing...' : 'Publish'}
                  </button>
                  <button
                    type='button'
                    onClick={() => handleCreateBlog(false)}
                    disabled={isSubmitting}
                    className='px-6 py-2.5 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white rounded-lg font-medium disabled:cursor-not-allowed'
                  >
                    {isSubmitting ? 'Drafting...' : 'Save to Drafts'}
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
                        attachmentUrls: [],
                      });
                    }}
                    className='px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium'
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
            <div
              className='modal-backdrop bg-black/30'
              onClick={() => {
                setIsCreateModalOpen(false);
                setNewBlog({
                  title: '',
                  content: '',
                  author: '',
                  tagIds: [],
                  isPublished: false,
                  attachmentUrls: [],
                });
              }}
            ></div>
          </div>
        </>
      )}

      {isDetailModalOpen && selectedBlog && (
        <>
          <input type='checkbox' checked readOnly className='modal-toggle' />
          <div className='modal modal-open'>
            <div className='modal-box max-w-2xl max-h-[80vh] bg-white overflow-y-auto m-8'>
              <h3 className='font-bold text-xl text-gray-900 mb-3'>
                {isEditMode ? 'Edit Blog' : selectedBlog.title}
              </h3>

              {isEditMode ? (
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-1'>
                      Title <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='text'
                      required
                      value={editedBlog.title}
                      onChange={e => setEditedBlog({ ...editedBlog, title: e.target.value })}
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
                      value={editedBlog.author}
                      onChange={e => setEditedBlog({ ...editedBlog, author: e.target.value })}
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
                        ref={quillRef}
                        theme='snow'
                        value={editedBlog.content}
                        onChange={value => setEditedBlog({ ...editedBlog, content: value })}
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
                            const isSelected = editedBlog.tagIds.includes(tag.id);
                            return (
                              <button
                                key={tag.id}
                                type='button'
                                onClick={() => {
                                  if (isSelected) {
                                    setEditedBlog({
                                      ...editedBlog,
                                      tagIds: editedBlog.tagIds.filter(id => id !== tag.id),
                                    });
                                  } else {
                                    setEditedBlog({
                                      ...editedBlog,
                                      tagIds: [...editedBlog.tagIds, tag.id],
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
                  </div>

                  <FileUpload
                    attachmentUrls={editedBlog.attachmentUrls}
                    onFilesChange={files => setEditedBlog({ ...editedBlog, attachmentUrls: files })}
                  />

                  <div className='flex gap-3 pt-4'>
                    <button
                      type='button'
                      onClick={handleUpdateBlog}
                      disabled={isSubmitting}
                      className='px-6 py-2.5 bg-[#D54242] hover:bg-[#b53a3a] text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type='button'
                      onClick={() => {
                        setIsEditMode(false);
                        setEditedBlog({
                          title: selectedBlog.title,
                          content: selectedBlog.content,
                          author: selectedBlog.author,
                          tagIds: selectedBlog.tags.map(t => t.id),
                          attachmentUrls: selectedBlog.attachmentUrls || [],
                        });
                      }}
                      className='px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium'
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className='space-y-4'>
                  {/* Basic Info */}
                  <div>
                    <h4 className='font-semibold text-base text-gray-800 mb-2'>
                      Basic Information
                    </h4>
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

                  {selectedBlog.attachmentUrls && selectedBlog.attachmentUrls.length > 0 && (
                    <AttachmentList attachmentUrls={selectedBlog.attachmentUrls} />
                  )}

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
              )}

              {!isEditMode && (
                <div className='modal-action'>
                  {!selectedBlog.isPublished && (
                    <>
                      <button
                        onClick={async () => {
                          try {
                            await updateBlog.mutateAsync({
                              id: selectedBlog.id,
                              data: {
                                isPublished: true,
                                publishedDate: new Date().toISOString(),
                              },
                            });
                            setToast({ message: 'Blog published successfully', type: 'success' });
                            closeDetailModal();
                          } catch (err: any) {
                            setToast({
                              message: err.message || 'Failed to publish blog',
                              type: 'error',
                            });
                          }
                        }}
                        className='px-6 py-2.5 bg-[#D54242] hover:bg-[#b53a3a] text-white rounded-xl font-medium transition'
                      >
                        Publish
                      </button>
                      <button
                        onClick={() => {
                          setIsEditMode(true);
                          setEditedBlog({
                            title: selectedBlog.title,
                            content: selectedBlog.content,
                            author: selectedBlog.author,
                            tagIds: selectedBlog.tags.map(t => t.id),
                            attachmentUrls: selectedBlog.attachmentUrls || [],
                          });
                        }}
                        className='px-6 py-2.5 bg-[#D54242] hover:bg-[#b53a3a] text-white rounded-xl font-medium transition'
                      >
                        Edit
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      closeDetailModal();
                      setIsEditMode(false);
                    }}
                    className='px-6 py-2.5 bg-[#D54242] hover:bg-[#b53a3a] text-white rounded-xl font-medium transition'
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
            <div
              className='modal-backdrop bg-black/30'
              onClick={() => {
                closeDetailModal();
                setIsEditMode(false);
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

export default AdminBlogs;
