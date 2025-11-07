import { useEffect, useState } from 'react';
import { IoClose, IoNotifications } from 'react-icons/io5';
import { Link } from 'react-router-dom';

interface Notification {
  id: string;
  type: 'BLOG' | 'ANNOUNCEMENT' | 'ALERT' | 'SURVEY';
  title: string;
  contentId: string;
  createdAt: string;
}

interface NotificationsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const NotificationsSidebar = ({ isOpen, onClose }: NotificationsSidebarProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      updateLastChecked();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications`);
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateLastChecked = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastCheckedAt: new Date().toISOString() }),
      });
      localStorage.setItem('lastCheckedNotifications', new Date().toISOString());
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const getNotificationRoute = (notification: Notification) => {
    switch (notification.type) {
      case 'BLOG':
        return `/blog/${notification.contentId}`;
      case 'ANNOUNCEMENT':
        return `/announcements/${notification.contentId}`;
      case 'ALERT':
        return `/alerts`;
      case 'SURVEY':
        return `/surveys`;
      default:
        return '/';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {isOpen && (
        <div className='fixed inset-0 bg-black/20 z-40 transition-opacity' onClick={onClose} />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className='flex flex-col h-full'>
          <div className='flex items-center justify-between p-4 border-b border-gray-200'>
            <h2 className='text-xl font-bold text-gray-800'>Notifications</h2>
            <button
              onClick={onClose}
              className='p-2 hover:bg-gray-100 rounded-full transition'
              aria-label='Close notifications'
            >
              <IoClose className='text-2xl text-gray-600' />
            </button>
          </div>

          <div className='flex-1 overflow-y-auto'>
            {loading ? (
              <div className='flex items-center justify-center h-full'>
                <div className='text-gray-500'>Loading...</div>
              </div>
            ) : notifications.length === 0 ? (
              <div className='flex items-center justify-center h-full'>
                <div className='text-center text-gray-500'>
                  <IoNotifications className='text-5xl mx-auto mb-2' />
                  <p>No notifications yet</p>
                </div>
              </div>
            ) : (
              <div className='divide-y divide-gray-100'>
                {notifications.map(notification => (
                  <Link
                    key={notification.id}
                    to={getNotificationRoute(notification)}
                    onClick={onClose}
                    className='block p-4 hover:bg-gray-50 transition'
                  >
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-gray-900 mb-1'>{notification.title}</p>
                      <div className='flex items-center gap-2'>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            notification.type === 'ANNOUNCEMENT'
                              ? 'bg-rose-100 text-rose-700'
                              : notification.type === 'ALERT'
                                ? 'bg-yellow-100 text-yellow-700'
                                : notification.type === 'SURVEY'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {notification.type.charAt(0).toUpperCase() +
                            notification.type.slice(1).toLowerCase()}
                        </span>
                        <span className='text-xs text-gray-500'>
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationsSidebar;
