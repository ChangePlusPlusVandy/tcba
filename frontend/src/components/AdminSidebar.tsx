import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const AdminSidebar = () => {
  const location = useLocation();
  const isPageEditActive = location.pathname.startsWith('/admin/page-edit');
  const [pageEditExpanded, setPageEditExpanded] = useState(isPageEditActive);

  useEffect(() => {
    if (isPageEditActive) {
      setPageEditExpanded(true);
    }
  }, [isPageEditActive]);

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: (
        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z'
          />
        </svg>
      ),
    },
    {
      name: 'Organizations',
      path: '/admin/organizations',
      icon: (
        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
          />
        </svg>
      ),
    },
    {
      name: 'Announcements',
      path: '/admin/announcements',
      icon: (
        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z'
          />
        </svg>
      ),
    },
    {
      name: 'Blogs',
      path: '/admin/blogs',
      icon: (
        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z'
          />
        </svg>
      ),
    },
    {
      name: 'Alerts',
      path: '/admin/alerts',
      icon: (
        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
          />
        </svg>
      ),
    },
    {
      name: 'Surveys',
      path: '/admin/surveys',
      icon: (
        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
          />
        </svg>
      ),
    },
    {
      name: 'Email',
      path: '/admin/email',
      icon: (
        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
          />
        </svg>
      ),
    },
  ];

  const pageEditItems = [
    { name: 'Home Page', path: '/admin/page-edit/home' },
    { name: 'About Page', path: '/admin/page-edit/about' },
    { name: 'Get Involved', path: '/admin/page-edit/register' },
    { name: 'Contact Us', path: '/admin/page-edit/contact' },
    { name: 'Email Signup', path: '/admin/page-edit/signup' },
  ];

  return (
    <aside className='w-64 min-h-screen bg-gray-50 flex flex-col pt-8 px-4 pb-4'>
      <nav className='bg-white rounded-2xl p-4'>
        <div className='p-2 mb-4'>
          <h2 className='text-xl font-extrabold text-gray-800'>Admin Panel</h2>
        </div>
        {menuItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl transition ${
                isActive ? 'bg-[#EBF3FF] text-[#194B90]' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              <span className='font-medium'>{item.name}</span>
            </Link>
          );
        })}

        <div className='mb-2'>
          <button
            onClick={() => setPageEditExpanded(!pageEditExpanded)}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition ${
              isPageEditActive ? 'bg-[#EBF3FF] text-[#194B90]' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className='flex items-center gap-3'>
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                />
              </svg>
              <span className='font-medium'>Page Edit</span>
            </div>
            <svg
              className={`w-4 h-4 transition-transform ${pageEditExpanded ? 'rotate-180' : ''}`}
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

          {pageEditExpanded && (
            <div className='mt-1 ml-4 space-y-1'>
              {pageEditItems.map(subItem => {
                const isActive = location.pathname === subItem.path;
                return (
                  <Link
                    key={subItem.path}
                    to={subItem.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm ${
                      isActive
                        ? 'bg-[#EBF3FF] text-[#194B90] font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#D54242]' : 'bg-current opacity-50'}`}
                    ></span>
                    <span>{subItem.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
