import OrganizationSidebar from '../../../components/OrganizationSidebar';

const AlertsPage = () => {
  const alerts: any[] = [
      {
        title: 'Title',
        content: 'line clamp\ntest\ncontent',
        date: new Date('2024-06-01T10:00:00Z'),
        tags: ['Tag1', 'Tag2'],
    },
    {
      title: 'Title',
      content: 'content aspodfiejpaosdifjepoijdfpoeis',
      date: new Date('2024-06-01T10:00:00Z'),
      tags: ['Tag3'],
    },
    {
      title: 'Title',
      content: 'content aspodfiejpaosdifjepoijdfpoeis',
      date: new Date('2024-06-01T10:00:00Z'),
      tags: [],
    },
  ]; // TODO: Fetch alerts from backend

  

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <OrganizationSidebar />
      <div className='flex-1 p-8 space-y-4 '>
        <div className='flex w-full items-center justify-between'>
          <h1 className='text-3xl font-bold text-gray-800'>Alerts</h1>
        </div>

        <div className='flex flex-col min-h-screen w-full bg-white rounded-[15px] shadow-lg shadow-x1/15 shadow-[#84848226]'>
          {alerts.map((alert, index) => {
            return (
              <a
                key={index}
                className='w-full items-center px-5 hover:bg-[#EBF3FF] text-black hover:text-[#194B90] first:rounded-t-[15px]'
              >
                <div className='p-5 border-b border-[#848482]'>
                  <div className='flex justify-between items-center'>
                    <div className='flex items-center space-x-5'>
                      <p className='font-semibold text-4'>{alert.title}</p>
                      <div className='flex space-x-2  '>
                        {alert.tags.map((tag: string) => {
                          return (
                            <div className='bg-[#D9D9D9] h-5 rounded-[5px] px-4 py-[0.5px] text-[12px] justify-center text-center'>
                              {tag.toLowerCase()}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <p className='text-gray-400 mt-2 text-sm text-[16px]'>
                      {alert.date.toDateString()}
                    </p>
                  </div>
                  <p className='mt-2 line-clamp-2 whitespace-pre-line'>{alert.content}</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AlertsPage;
