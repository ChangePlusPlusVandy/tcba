import AdminSidebar from '../../../components/AdminSidebar';
// import { type FormEvent, useState, useEffect } from 'react';

const mockSurveys = [
  // Sample data, will be replaced with database data in the future
  {
    id: '1',
    title: 'Title of announcement',
    by: 'Ashrit Ram Anala',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi u...',
    status: 'DRAFT',
    createdAt: '2 days ago',
  },
  {
    id: '2',
    title: 'Title of announcement',
    by: 'Ashrit Ram Anala',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi u...',
    status: 'ACTIVE',
    createdAt: '2 days ago',
  },
  {
    id: '3',
    title: 'Title of announcement',
    by: 'Ashrit Ram Anala',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi u...',
    status: 'CLOSED',
    createdAt: '2 days ago',
  },

  {
    id: '4',
    title: 'Title of announcement',
    by: 'Ashrit Ram Anala',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi u...',
    status: 'DRAFT',
    createdAt: '2 days ago',
  },
  {
    id: '5',
    title: 'Title of announcement',
    by: 'Ashrit Ram Anala',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi u...',
    status: 'ACTIVE',
    createdAt: '2 days ago',
  },
  {
    id: '6',
    title: 'Title of announcement',
    by: 'Ashrit Ram Anala',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi u...',
    status: 'CLOSED',
    createdAt: '2 days ago',
  },
];

const AdminSurveys = () => {
  return (
    <div className='flex min-h-screen bg-gray-50'>
      <AdminSidebar />
      <div className='flex-1 p-8'>
        <div className='flex items-center justify-between'>
          <h1 className='text-3xl font-bold text-gray-800'>Surveys</h1>
          <button className='bg-[#D54242] hover:bg-[#b53a3a] text-white px-4 py-2 mr-4 rounded'>
            Create New
          </button>
        </div>

        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-12 pt-10 mr-4 mt-6 pb-60'>
          <div className='space-y-3'>
            {mockSurveys.map(survey => (
              <div key={survey.id} className='border-b border-gray-200 pb-4 pt-4'>
                <div className='flex items-start justify-between'>
                  <div className='flex items-center gap-2'>
                    <h3 className='text-base font-semibold text-gray-900'>{survey.title}</h3>

                    <span
                      className={`
            text-xs font-medium px-2 py-0.5 rounded-full
            ${
              survey.status === 'ACTIVE'
                ? 'bg-green-100 text-green-700'
                : survey.status === 'DRAFT'
                  ? 'bg-yellow-100 text-yellow-700'
                  : survey.status === 'CLOSED'
                    ? 'bg-gray-200 text-gray-700'
                    : 'bg-slate-200 text-slate-700'
            }
          `}
                    >
                      {survey.status}
                    </span>
                  </div>

                  <p className='text-xs text-gray-400 mt-1'>{survey.createdAt}</p>
                </div>

                {survey.description && (
                  <p className='text-sm text-gray-600 mt-1'>{survey.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSurveys;
