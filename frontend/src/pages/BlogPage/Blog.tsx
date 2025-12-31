import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import { API_BASE_URL } from '../../config/api';
import PublicAttachmentList from '../../components/PublicAttachmentList';
import 'react-quill-new/dist/quill.snow.css';

type Tag = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type BlogType = {
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

const Blog = () => {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<BlogType | null>(null);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/blogs/slug/${slug}`);
        setBlog(response.data);
      } catch (error) {
        console.error('Error fetching blog:', error);
        setBlog(null);
      }
    };

    fetchBlog();
  }, [slug]);

  // Removed blocking loader
  if (!blog) return <p>Blog not found.</p>;

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }

    if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} ${Math.floor(diffInMinutes / 60) === 1 ? 'hour' : 'hours'} ago`;
    }
    return `${Math.floor(diffInMinutes / 1440)} ${Math.floor(diffInMinutes / 1440) === 1 ? 'day' : 'days'} ago`;
  };

  return (
    <div className='p-8'>
      <Link
        to='/blogs'
        className='inline-flex items-center gap-2 text-[#3C3C3C] hover:text-black font-medium mb-6'
      >
        <IoArrowBack size={20} />
        Back to Blogs
      </Link>
      <div className='px-8 py-10'>
        <h1 className='font-[Open_Sans] text-[40px] font-bold mb-4'>{blog.title}</h1>
        <div className='flex items-center gap-3 mb-4'>
          <h3 className='font-[Open_Sans] text-[16px] font-normal leading-[150%] text-[#717171]'>
            By {blog.author} • {getTimeAgo(blog.createdAt)}
          </h3>
          {blog.tags && blog.tags.length > 0 && (
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
          className='font-[Open_Sans] text-[18px] font-normal leading-[150%] text-[#3C3C3C] py-8 ql-editor'
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
        {blog.attachmentUrls && blog.attachmentUrls.length > 0 && (
          <PublicAttachmentList attachmentUrls={blog.attachmentUrls} className='mt-6' />
        )}
      </div>
    </div>
  );
};

export default Blog;
