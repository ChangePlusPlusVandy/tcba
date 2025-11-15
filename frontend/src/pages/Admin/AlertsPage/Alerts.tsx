import { useState } from 'react';
import AdminSidebar from '../../../components/AdminSidebar';

const AdminAlerts = () => {
  const alerts: any[] = [
    {
      title: 'Title',
      content: 'content aspodfiejpaosdifjepoijdfpoeis',
      date: new Date('2024-06-01T10:00:00Z'),
    },
    {
      title: 'Title',
      content: 'content aspodfiejpaosdifjepoijdfpoeis',
      date: new Date('2024-06-01T10:00:00Z'),
    },
    {
      title: 'Title',
      content: 'content aspodfiejpaosdifjepoijdfpoeis',
      date: new Date('2024-06-01T10:00:00Z'),
    },
  ]; // TODO: Fetch alerts from backend

  const tags: string[] = ['Tag1', 'Tag2', 'Tag3']; // TODO: add preset tags later + filtering

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <AdminSidebar />
      <div className='flex-1 p-8 space-y-4 '>
        <div className='flex w-full items-center justify-between'>
          <h1 className='text-3xl font-bold text-gray-800'>Alerts</h1>
          <a
            className='flex items-center justify-center w-[164px] h-[52px] rounded-[10px] bg-[#D54242] text-white hover:bg-[#b53a3a] transition disabled:bg-gray-400 disabled:cursor-not-allowed'
            href='/admin/alerts/create-alert'
          >
            Create New
          </a>
        </div>

        <div className='flex space-x-2'>
          {tags.map(tag => (
            <label key={tag} className='cursor-pointer'>
              <input type='checkbox' className='peer hidden' />
              <div className='flex h-12 min-w-18 justify-center items-center w-fit bg-white rounded-[15px] shadow-md shadow-x1/15 shadow-[#84848226] px-4 transition-all peer-checked:bg-[#EBF3FF] peer-checked:text-[#194B90] hover:text-[#194B90]'>
                {tag}
              </div>
            </label>
          ))}
        </div>

        <div className='flex flex-col w-full bg-white rounded-[15px] shadow-lg shadow-x1/15 shadow-[#84848226]'>
          {alerts.map((alert, index) => {
            return (
              <a
                key={index}
                className='w-full items-center hover:bg-[#EBF3FF] text-black hover:text-[#194B90] first:rounded-t-[15px] last:[&>div]:border-b-0'
              >
                <div className='p-5 border-b border-[#848482]'>
                  <div className='flex justify-between items-center'>
                    <p className='font-semibold text-4'>{alert.title}</p>
                    <p className='text-gray-400 mt-2 text-sm'>{alert.date.toDateString()}</p>
                  </div>
                  <p className='mt-2'>{alert.content}</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminAlerts;
