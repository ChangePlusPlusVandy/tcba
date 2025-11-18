import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import 'react-quill-new/dist/quill.snow.css';

export default function Announcement() {
  const { slug } = useParams<{ slug: string }>();
  const [announcement, setAnnouncement] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/announcements/slug/${slug}`);
        setAnnouncement(res.data);
      } catch (error) {
        console.error('Error fetching announcement:', error);
        setAnnouncement(null);
      }
      setLoading(false);
    };

    fetchAnnouncement();
  }, [slug]);

  if (loading) return <p>Loading...</p>;
  if (!announcement) return <p>Announcement not found.</p>;

  // FORMAT TIME AGO
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
        to='/announcements'
        className='inline-flex items-center gap-2 text-[#3C3C3C] hover:text-black font-medium mb-6'
      >
        <IoArrowBack size={20} />
        Back to Announcements
      </Link>
      <div className='px-8 py-10'>
        <h1 className='font-[Open_Sans] text-[40px] font-bold mb-4'>{announcement.title}</h1>
        <div className='flex items-center gap-3 mb-4'>
          <h3 className='font-[Open_Sans] text-[16px] font-normal leading-[150%] text-[#717171]'>
            {getTimeAgo(announcement.createdAt)}
          </h3>
          {announcement.tags && announcement.tags.length > 0 && (
            <>
              <span className='text-[#717171]'>•</span>
              <div className='flex gap-2 flex-wrap'>
                {announcement.tags.map((tag: any) => (
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
          dangerouslySetInnerHTML={{ __html: announcement.content }}
        />
      </div>
    </div>
  );
}
