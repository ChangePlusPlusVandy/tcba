import { useEffect, useMemo, useState } from 'react';

type Blog = {
  id: string;
  title: string;
  content: string;
  author: string;
  tags: string[];
  featuredImageUrl?: string | null;
  isPublished: boolean;
  publishedDate?: string | null;
  createdAt: string;
  updatedAt: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

const filterOptions = [
  { id: '24h', label: 'Last 24 hours', maxHours: 24 },
  { id: 'week', label: 'Last week', maxHours: 24 * 7 },
  { id: 'month', label: 'Last month', maxHours: 24 * 30 },
  { id: 'year', label: 'Last year', maxHours: 24 * 365 },
];

const formatRelativeTime = (date: Date) => {
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
};

const getPublishedAt = (blog: Blog) =>
  blog.publishedDate ? new Date(blog.publishedDate) : new Date(blog.createdAt);

const BlogPage = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [activeFilter, setActiveFilter] = useState(filterOptions[1].id);
  const [filterControlsOpen, setFilterControlsOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBlogs = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/api/blogs?published=true`);
        if (!response.ok) throw new Error(`Failed to fetch blogs: ${response.statusText}`);
        const data: Blog[] = await response.json();
        setBlogs(data);
      } catch (err) {
        console.error('Error fetching blogs:', err);
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    loadBlogs();
  }, []);

  const filteredBlogs = useMemo(() => {
    const filter = filterOptions.find(option => option.id === activeFilter);
    if (!filter) return blogs;

    return blogs.filter(blog => {
      const publishedAt = getPublishedAt(blog);
      const diffHours = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
      return diffHours <= filter.maxHours;
    });
  }, [blogs, activeFilter]);

  useEffect(() => {
    setVisibleCount(3);
  }, [activeFilter]);

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 3, filteredBlogs.length));
  };

  const visibleBlogs = filteredBlogs.slice(0, visibleCount);

  return (
    <div className='bg-slate-50 min-h-screen'>
      <section>
        <div className='grid grid-cols-2 gap-0'>
          <div className='bg-white px-8 sm:px-12 py-20 flex items-center'>
            <div className='p-8'>
              <h2 className='font-[Open_Sans] text-[40px] font-bold leading-[100%] text-[#3C3C3C] mb-6'>
                Blogs
              </h2>
              <p className='font-[Open_Sans] text-[18px] font-normal leading-[150%] text-[#3C3C3C]'>
                The Tennessee Coalition for Better Aging exists to promote the general welfare of
                older Tennesseans and their families through partnerships that mobilize resources to
                educate and advocate for important policies and programs.
              </p>
            </div>
          </div>
          <div className='bg-[#e5e5e5] min-h-[320px] h-full w-full' />
        </div>
      </section>

      <section className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-16'>
        <div className='bg-white flex-col justify-center py-0'>
        </div>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div className='flex items-center gap-4 text-sm text-slate-600'>
            <span className='font-semibold text-slate-900 whitespace-nowrap'>
              {filteredBlogs.length} Blog{filteredBlogs.length === 1 ? '' : 's'}
            </span>
            <div className='flex flex-wrap gap-3'>
              {filterOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => setActiveFilter(option.id)}
                  className={`px-5 py-2 rounded-2xl border border-slate-200 transition shadow-sm ${
                    activeFilter === option.id
                      ? 'bg-white text-sky-700 shadow-[0_56px_140px_rgba(59,130,246,0.35),0_-24px_72px_rgba(59,130,246,0.12)] ring-2 ring-sky-100'
                      : 'bg-white text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setFilterControlsOpen(prev => !prev)}
              className={`px-5 py-2 rounded-2xl border border-slate-200 bg-white text-slate-600 transition flex items-center gap-2 shadow-sm ${
                filterControlsOpen
                  ? 'text-sky-700 shadow-[0_0_0_3px_rgba(59,130,246,0.2)]'
                  : 'hover:text-slate-900'
              }`}
            >
              Filter
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-4 w-4'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <polygon points='3 4 21 4 14 12.46 14 20 10 22 10 12.46 3 4' />
              </svg>
            </button>
          </div>
          <div className='flex items-center gap-3 w-full md:w-auto'>
            <div className='flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-2 w-full'>
              <input
                type='text'
                placeholder='Search tags, blogs, authors'
                className='bg-transparent text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none flex-1'
              />
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-4 w-4 text-slate-400'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <circle cx='11' cy='11' r='8' />
                <line x1='21' y1='21' x2='16.65' y2='16.65' />
              </svg>
            </div>
          </div>
        </div>

        <div className='space-y-6'>
          {loading && <p className='text-center text-slate-500'>Loading blogs...</p>}

          {!loading && error && (
            <p className='text-center text-rose-600 font-semibold'>An unexpected error occurred.</p>
          )}

          {!loading && !error && filteredBlogs.length === 0 && (
            <p className='text-center text-2xl font-semibold text-slate-300'>No blogs available.</p>
          )}

          {!loading &&
            !error &&
            filteredBlogs.length > 0 &&
            visibleBlogs.map((blog, index) => (
              <article
                key={blog.id}
                className={`bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row gap-6 p-6 ${
                  index % 2 === 0 ? '' : 'outline outline-1 outline-slate-100'
                }`}
              >
                <div className='flex-1 space-y-4'>
                  <div>
                    <h2 className='text-xl font-semibold text-slate-900'>{blog.title}</h2>
                    <p className='text-sm text-slate-500'>
                      {blog.author} • {formatRelativeTime(getPublishedAt(blog))}
                    </p>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    {blog.tags.map(tag => (
                      <span
                        key={tag}
                        className='text-xs uppercase tracking-wide px-3 py-1 rounded-full border border-slate-200 text-slate-500'
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className='text-sm text-slate-600 leading-relaxed'>
                    {blog.content.length > 360 ? `${blog.content.slice(0, 360)}…` : blog.content}
                  </p>
                </div>
                <div className='w-full lg:w-56 h-40 bg-slate-200 rounded-2xl flex-shrink-0' />
              </article>
            ))}
        </div>

        {visibleCount < filteredBlogs.length && !loading && !error && (
          <div className='flex justify-center pt-4'>
            <button
              onClick={loadMore}
              className='px-6 py-3 rounded-full border border-slate-300 text-sm font-semibold text-slate-600 bg-white hover:border-slate-400 transition flex items-center gap-2'
            >
              Load more
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-4 w-4'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <polyline points='6 9 12 15 18 9' />
              </svg>
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default BlogPage;
