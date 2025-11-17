import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoFunnelOutline, IoSearchOutline } from 'react-icons/io5';

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

const BlogsPage = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'24h' | 'week' | 'month' | 'year' | null>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filterRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const MAX_LENGTH = 200;

  const getBlogs = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/blogs');
      setBlogs(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      setError('An unexpected error occurred');
    }
    setLoading(false);
  };

  const getTags = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/blogs/tags');
      setAllTags(response.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  useEffect(() => {
    getBlogs();
    getTags();
  }, []);

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

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }

    if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  };

  const filteredBlogs = blogs.filter(blog => {
    const now = new Date();

    if (timeFilter) {
      const createdAt = new Date(blog.createdAt);
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

    if (selectedTags.length > 0) {
      const selectedTagNames = selectedTags.map(t => t.name);
      const blogTagNames = blog.tags.map(t => t.name);
      if (!blogTagNames.some(tag => selectedTagNames.includes(tag))) {
        return false;
      }
    }

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

  return (
    <div className='mt-8'>
      <section>
        <div className='grid grid-cols-2 gap-0'>
          <div className='bg-white px-8 sm:px-12 py-20 flex items-center'>
            <div className='p-8'>
              <h2 className='font-[Open_Sans] text-[40px] font-bold leading-[100%] text-gray-800 mb-6'>
                Blogs
              </h2>
              <p className='font-[Open_Sans] text-[18px] font-normal leading-[150%] text-gray-800'>
                Read the latest insights, stories, and updates from the Tennessee Coalition for
                Better Aging. Our blog features expert perspectives on senior wellness, policy
                updates, and community highlights.
              </p>
            </div>
          </div>
          <div className='h-[400px] bg-slate-200 mr-12 rounded-lg' />
        </div>
      </section>

      <section className='mt-8'>
        <div className='bg-white px-20 py-4'>
          <p className='font-[Open_Sans] text-[18px] font-bold text-gray-800 mb-4'>
            {filteredBlogs.length} {filteredBlogs.length === 1 ? 'Blog' : 'Blogs'}
          </p>
          <div className='flex items-center justify-between'>
            <div className='flex gap-2 items-center'>
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

              <div className='relative' ref={filterRef}>
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`px-6 py-3 ${isFilterOpen ? 'bg-[#b53a3a]' : 'bg-[#D54242]'} text-white rounded-lg shadow-sm hover:bg-[#b53a3a] transition-colors flex items-center gap-2`}
                >
                  Filter
                  <IoFunnelOutline className='w-5 h-5' />
                </button>
                {isFilterOpen && (
                  <div
                    className={`${selectedTags.length > 0 ? 'max-h-70' : 'max-h-60'} absolute overflow-y-auto left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10`}
                  >
                    {allTags.length === 0 && (
                      <button className='w-full text-left px-4 py-2 hover:bg-[#EBF3FF] text-[#3C3C3C] font-[Open_Sans]'>
                        No Tags Available
                      </button>
                    )}
                    {selectedTags.length > 0 && (
                      <button
                        onClick={() => setSelectedTags([])}
                        className='w-full text-left px-4 py-2 border-b hover:bg-[#EBF3FF] text-[#3C3C3C] font-[Open_Sans]'
                      >
                        Clear All
                      </button>
                    )}
                    {allTags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => {
                          setSelectedTags(prev =>
                            prev.some(t => t.id === tag.id)
                              ? prev.filter(t => t.id !== tag.id)
                              : [...prev, tag]
                          );
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-[#EBF3FF] text-[#3C3C3C] font-[Open_Sans] ${
                          selectedTags.some(t => t.id === tag.id) && 'bg-[#EBF3FF] font-semibold'
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className='relative'>
              <input
                type='text'
                placeholder='Search...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='px-4 py-3 pl-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#194B90] focus:border-transparent'
              />
              <IoSearchOutline className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
            </div>
          </div>
        </div>
      </section>

      <div className='px-8 pb-8'>
        {loading && <p>Loading blogs...</p>}
        {error && <p>{error}</p>}
        {!loading && !error && blogs.length === 0 && (
          <p className='font-[Open_Sans] text-[32px] font-bold leading-[100%] text-[#AAAAAA] mb-6'>
            No blogs available.
          </p>
        )}
        {!loading && !error && blogs.length > 0 && (
          <div className='space-y-8'>
            {filteredBlogs.map(blog => {
              const shouldTruncate = blog.content.length > MAX_LENGTH;
              const displayedContent = !shouldTruncate
                ? blog.content
                : `${blog.content.slice(0, MAX_LENGTH)}...`;

              return (
                <div
                  key={blog.id}
                  onClick={() => navigate(`/blog/${blog.slug}`)}
                  className='flex gap-0 p-6 border border-gray-200 rounded-2xl transition-shadow duration-300 hover:shadow-[0_4px_12px_10px_#EBF3FFE5] cursor-pointer m-4'
                >
                  <div className='w-full'>
                    <h2 className='font-[Open_Sans] text-[24px] font-semibold leading-[150%] text-[#3C3C3C] mb-2'>
                      {blog.title}
                    </h2>
                    <div className='flex items-center gap-3 mb-4'>
                      <h3 className='font-[Open_Sans] text-[14px] font-normal leading-[150%] text-[#717171]'>
                        By {blog.author} • {getTimeAgo(blog.createdAt)}
                      </h3>
                      {blog.tags.length > 0 && (
                        <>
                          <span className='text-[#717171]'>•</span>
                          <div className='flex gap-2 flex-wrap'>
                            {blog.tags.map(tag => (
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
                      className='font-[Open_Sans] text-[14px] font-normal leading-[150%] text-[#3C3C3C] mb-2'
                      dangerouslySetInnerHTML={{ __html: displayedContent }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogsPage;
