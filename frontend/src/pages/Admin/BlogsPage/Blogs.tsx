import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import AdminSidebar from '../../../components/AdminSidebar';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// Remove template blogs, use real data from backend

const Badge = ({ status }: { status: string }) => {
  if (status === 'Published') {
    return (
      <span className='text-sm font-medium bg-green-100 text-green-800 px-3 py-1 rounded-full'>
        Published
      </span>
    );
  }
  return (
    <span className='text-sm font-medium bg-gray-100 text-gray-700 px-3 py-1 rounded-full'>
      Draft
    </span>
  );
};

const AdminBlogs = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [tags, setTags] = useState<string[]>(['Tag #1', 'Tag #2']);
  const [newTag, setNewTag] = useState('');
  const [content, setContent] = useState('');
  const quillRef = useRef<ReactQuill>(null);

  const addTag = () => {
    const t = newTag.trim();
    if (t && !tags.includes(t)) {
      setTags(s => [...s, t]);
    }
    setNewTag('');
  };

  const removeTag = (t: string) => setTags(s => s.filter(x => x !== t));

  const plainText = (content || '').replace(/<[^>]+>/g, '').trim();
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;

  const modules = {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline', 'strike'],
        [{ header: [1, 2, 3, false] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: function () {
          const url = prompt('Enter image URL');
          if (url) {
            const editor = quillRef.current?.getEditor();
            const range = editor?.getSelection()?.index ?? editor?.getLength() ?? 0;
            editor?.insertEmbed(range, 'image', url);
            editor?.setSelection((range ?? 0) + 1);
          }
        },
      },
    },
  };

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'link',
    'image',
  ];

  const [errors, setErrors] = useState({ title: false, author: false, content: false });
  const [blogs, setBlogs] = useState<any[]>([]);
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFTS'>('ALL');

  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      setFetchError('');
      try {
        const token = await getToken({ skipCache: true, template: 'jwt-template-tcba' });
        const res = await axios.get('/api/blogs', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // Defensive: ensure blogs is always an array
        const data = Array.isArray(res.data) ? res.data : [];
        setBlogs(data);
      } catch (err: any) {
        setFetchError('Failed to fetch blogs');
        setBlogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const validate = () => {
    const tErr = !title.trim();
    const aErr = !author.trim();
    const pt = (content || '').replace(/<[^>]+>/g, '').trim();
    const cErr = !pt;
    setErrors({ title: tErr, author: aErr, content: cErr });
    return !(tErr || aErr || cErr);
  };

  const handleSaveDraft = () => {
    if (!validate()) return;
    // simulate save draft (replace with API call)
    setShowCreate(false);
  };

  const handlePublish = async () => {
    if (!validate()) return;
    try {
      const token = await getToken({ skipCache: true, template: 'jwt-template-tcba' });
      // 1. Create blog (draft)
      const createRes = await axios.post(
        '/api/blogs',
        {
          title,
          author,
          content,
          tags: [], // TODO: map tag names to IDs if needed
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const blogId = createRes.data.id;
      // 2. Publish blog
      const publishRes = await axios.put(`/api/blogs/${blogId}/publish`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // 3. Update UI: add new blog to top
      setBlogs(prev => [publishRes.data, ...prev]);
      // 4. Reset modal state
      setTitle('');
      setAuthor('');
      setTags(['Tag #1', 'Tag #2']);
      setContent('');
      setShowCreate(false);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        alert('Unauthorized. Please sign in as an admin to publish.');
      } else {
        alert('Failed to publish blog.');
      }
    }
  };

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <AdminSidebar />

      <div className='flex-1 p-8'>
        <div className='flex items-start justify-between mb-6'>
          <div>
            <h2 className='text-2xl font-bold text-gray-800'>
              {filter === 'ALL' ? 'All Blogs' : filter === 'PUBLISHED' ? 'Published' : 'Drafts'}{' '}
              <span className='text-2xl font-bold text-gray-800'>
                (
                {filter === 'ALL'
                  ? blogs.length
                  : filter === 'PUBLISHED'
                    ? blogs.filter(b => b.isPublished).length
                    : blogs.filter(b => !b.isPublished).length}
                )
              </span>
            </h2>
          </div>

          {/* Create new button moved next to search input */}
        </div>

        <div className='flex items-center justify-between p-2 mb-4 bg-transparent'>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-md text-sm ${
                filter === 'ALL'
                  ? 'bg-blue-50 text-blue-700 border border-blue-300 shadow-inner'
                  : 'border border-gray-200 bg-transparent'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('PUBLISHED')}
              className={`px-3 py-1 rounded-md text-sm ${
                filter === 'PUBLISHED'
                  ? 'bg-blue-50 text-blue-700 border border-blue-300 shadow-inner'
                  : 'border border-gray-200 bg-transparent'
              }`}
            >
              Published
            </button>
            <button
              onClick={() => setFilter('DRAFTS')}
              className={`px-3 py-1 rounded-md text-sm ${
                filter === 'DRAFTS'
                  ? 'bg-blue-50 text-blue-700 border border-blue-300 shadow-inner'
                  : 'border border-gray-200 bg-transparent'
              }`}
            >
              Drafts
            </button>
          </div>

          <div className='flex items-center gap-3'>
            <div className='relative'>
              <input
                className='border border-gray-200 rounded-md px-3 py-2 w-80 text-sm bg-white'
                placeholder='Search blogs'
                aria-label='search'
              />
            </div>
            <div className='flex items-center'>
              <button
                onClick={() => setShowCreate(true)}
                className='ml-3 px-4 py-2 rounded-md text-sm bg-blue-50 text-blue-700 border border-blue-300 shadow-inner'
              >
                Create new
              </button>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-md shadow-sm overflow-hidden'>
          {loading ? (
            <div className='p-8 text-center text-gray-500'>Loading blogs...</div>
          ) : fetchError ? (
            <div className='p-8 text-center text-red-500'>{fetchError}</div>
          ) : (
            <table className='w-full table-fixed'>
              <thead className='bg-gray-50'>
                <tr className='text-left text-sm text-gray-600'>
                  <th className='px-6 py-4'>Title</th>
                  <th className='px-6 py-4'>Status</th>
                  <th className='px-6 py-4'>Tags</th>
                  <th className='px-6 py-4'>Published</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filteredBlogs =
                    filter === 'ALL'
                      ? blogs
                      : filter === 'PUBLISHED'
                        ? blogs.filter(b => b.isPublished)
                        : blogs.filter(b => !b.isPublished);
                  return filteredBlogs.map((b, i) => (
                    <tr key={b.id} className={`${i % 2 === 0 ? '' : 'bg-gray-50'}`}>
                      <td className='px-6 py-4'>
                        <Link to='#' className='text-sm text-blue-600 hover:underline'>
                          {b.title}
                        </Link>
                      </td>
                      <td className='px-6 py-4'>
                        <Badge status={b.isPublished ? 'Published' : 'Draft'} />
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-600'>
                        {b.tags?.map((t: any) => t.name).join(', ') || 'None'}
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-500'>
                        {b.publishedDate ? new Date(b.publishedDate).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          )}
        </div>
        {/* Create modal */}
        {showCreate && (
          <div
            className='fixed inset-0 z-50 flex items-start justify-center pt-28'
            aria-modal='true'
            role='dialog'
          >
            <div className='absolute inset-0 bg-black/40' onClick={() => setShowCreate(false)} />

            <div className='relative z-10 w-[90%] max-w-4xl bg-white rounded-lg shadow-lg p-6 max-h-[85vh] overflow-auto'>
              <div className='flex items-start justify-between mb-4'>
                <h3 className='text-xl font-semibold'>Create New Blog</h3>
                <button
                  onClick={() => setShowCreate(false)}
                  className='text-gray-500 hover:text-gray-800'
                  aria-label='Close'
                >
                  ✕
                </button>
              </div>

              <div className='space-y-4'>
                <div>
                  <label className='block text-sm text-gray-700 mb-1'>
                    Title <span className='text-red-500'>*</span>
                  </label>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className={`w-full rounded-md px-3 py-2 ${errors.title ? 'border-red-500' : 'border border-gray-300'}`}
                  />
                  {errors.title && (
                    <div className='text-sm text-red-500 mt-1'>Title is required</div>
                  )}
                </div>

                <div>
                  <label className='block text-sm text-gray-700 mb-1'>
                    Author <span className='text-red-500'>*</span>
                  </label>
                  <input
                    value={author}
                    onChange={e => setAuthor(e.target.value)}
                    className={`w-full rounded-md px-3 py-2 ${errors.author ? 'border-red-500' : 'border border-gray-300'}`}
                  />
                  {errors.author && (
                    <div className='text-sm text-red-500 mt-1'>Author is required</div>
                  )}
                </div>

                <div>
                  <div className='flex items-center gap-2 mb-2'>
                    {tags.map(t => (
                      <div
                        key={t}
                        className='flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm'
                      >
                        <span>{t}</span>
                        <button onClick={() => removeTag(t)} className='text-blue-700'>
                          ×
                        </button>
                      </div>
                    ))}

                    <div className='flex items-center border border-gray-300 rounded-md px-2 py-1'>
                      <input
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        placeholder='New Tag'
                        className='text-sm outline-none px-2'
                      />
                      <button onClick={addTag} className='text-gray-600 px-2'>
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className='block text-sm text-gray-700 mb-1'>
                    Blog <span className='text-red-500'>*</span>
                  </label>
                  <div
                    className={`${errors.content ? 'border-red-500' : 'border border-gray-300'} rounded-md`}
                  >
                    <div className='min-h-[96px]'>
                      <ReactQuill
                        ref={quillRef}
                        value={content}
                        onChange={setContent}
                        modules={modules}
                        formats={formats}
                        theme='snow'
                        style={{ minHeight: '96px', height: '96px' }}
                      />
                    </div>
                    <div className='text-right text-xs text-gray-400 pr-3 pb-2'>
                      {wordCount} words
                    </div>
                  </div>
                  {errors.content && (
                    <div className='text-sm text-red-500 mt-1'>Blog content is required</div>
                  )}
                </div>
              </div>

              <div className='mt-6 flex items-center justify-center gap-4'>
                <button
                  onClick={handleSaveDraft}
                  className='px-6 py-2 border border-gray-300 rounded-md bg-white text-sm'
                >
                  Save Draft
                </button>
                <button
                  onClick={handlePublish}
                  className='px-6 py-2 bg-red-600 text-white rounded-md text-sm'
                >
                  Publish
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBlogs;
