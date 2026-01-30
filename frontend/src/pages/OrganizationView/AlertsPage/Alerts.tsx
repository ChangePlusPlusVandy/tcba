import { useState } from 'react';
import { MutatingDots } from 'react-loader-spinner';
import OrganizationSidebar from '../../../components/OrganizationSidebar';
import Toast from '../../../components/Toast';
import Pagination from '../../../components/Pagination';
import PublicAttachmentList from '../../../components/PublicAttachmentList';
import { useOrgAlerts } from '../../../hooks/queries/useOrgAlerts';
import { useUser } from '@clerk/clerk-react';
import { useAlertResponseMutations } from '../../../hooks/mutations/useAlertResponseMutations';

type AlertPriority = 'URGENT' | 'LOW' | 'MEDIUM';

type Alert = {
  id: string;
  title: string;
  content: string;
  priority: AlertPriority;
  publishedDate?: string;
  isPublished: boolean;
  attachmentUrls: string[];
  tags: string[];
  createdByAdminId: string;
  createdAt: string;
  updatedAt: string;
  questions?: Question[];
};

type QuestionType = 'multipleChoice' | 'text';

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  options?: string[];
  textType?: 'short' | 'long';
}

type PriorityFilter = 'ALL' | 'URGENT' | 'MEDIUM' | 'LOW';

const AlertsPage = () => {
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  type SortField = 'title' | 'priority' | 'publishedDate';
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>('publishedDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [currentResponses, setCurrentResponses] = useState<Record<string, any>>({});
  const { submitResponse } = useAlertResponseMutations();

  const { user } = useUser();
  const organizationId = user?.publicMetadata?.organizationId as string | undefined;

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const {
    data: alertsData,
    isLoading: loading,
    error: alertsError,
  } = useOrgAlerts(currentPage, itemsPerPage);

  const alerts = (alertsData?.data || []) as Alert[];
  const totalAlerts = alertsData?.total || 0;
  const error = alertsError ? 'Failed to fetch alerts' : '';

  const openDetailModal = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedAlert(null);
  };

  const openResponseModal = () => {
    setIsResponseModalOpen(true);
    setIsDetailModalOpen(false);
  };

  const closeResponseModal = () => {
    setIsResponseModalOpen(false);
    setIsDetailModalOpen(true);
  };

  const filteredAlerts = alerts.filter(alert => {
    if (priorityFilter !== 'ALL' && alert.priority !== priorityFilter) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        alert.title.toLowerCase().includes(query) || alert.content.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'priority':
        const priorityOrder: Record<AlertPriority, number> = { URGENT: 3, MEDIUM: 2, LOW: 1 };
        aValue = priorityOrder[a.priority];
        bValue = priorityOrder[b.priority];
        break;
      case 'publishedDate':
        aValue = a.publishedDate
          ? new Date(a.publishedDate).getTime()
          : new Date(a.createdAt).getTime();
        bValue = b.publishedDate
          ? new Date(b.publishedDate).getTime()
          : new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg
          className='w-4 h-4 text-gray-400'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
        </svg>
      );
    }
    if (sortDirection === 'asc') {
      return (
        <svg
          className='w-4 h-4 text-[#D54242]'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 15l7-7 7 7' />
        </svg>
      );
    }
    return (
      <svg className='w-4 h-4 text-[#D54242]' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
      </svg>
    );
  };

  const getPriorityColor = (priority: AlertPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleResponseChange = (questionId: string, value: any) => {
    setCurrentResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmitResponse = async () => {
    if (!selectedAlert || !organizationId || !selectedAlert.questions) return;

    const missingRequired = selectedAlert.questions.filter(q => {
      if (!q.required) return false;
      const response = currentResponses[q.id];
      if (response === undefined || response === null || response === '') return true;
      if (Array.isArray(response) && response.length === 0) return true;
      return false;
    });

    if (missingRequired.length > 0) {
      setToast({
        message: `Please answer all required questions`,
        type: 'error',
      });
      return;
    }

    try {
      await submitResponse.mutateAsync({
        alertId: selectedAlert.id,
        organizationId,
        responses: currentResponses,
      });

      setToast({ message: 'Survey response submitted successfully!', type: 'success' });
      closeResponseModal();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to submit response', type: 'error' });
    }
  };

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <OrganizationSidebar />

      <div className='flex-1 p-8'>
        <h1 className='text-3xl font-bold text-gray-800 mb-6'>
          {priorityFilter === 'ALL' && `All Alerts (${alerts.length})`}
          {priorityFilter === 'URGENT' && `Urgent Alerts (${filteredAlerts.length})`}
          {priorityFilter === 'MEDIUM' && `Medium Priority Alerts (${filteredAlerts.length})`}
          {priorityFilter === 'LOW' && `Low Priority Alerts (${filteredAlerts.length})`}
        </h1>

        <div className='flex items-center gap-4 mb-6'>
          <div className='flex gap-2'>
            <button
              onClick={() => setPriorityFilter('ALL')}
              className={`px-6 py-2.5 rounded-[10px] font-medium transition ${
                priorityFilter === 'ALL'
                  ? 'bg-[#EBF3FF] text-[#194B90] border border-[#194B90]'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              } cursor-pointer`}
            >
              All
            </button>
            <button
              onClick={() => setPriorityFilter('URGENT')}
              className={`px-6 py-2.5 rounded-[10px] font-medium transition ${
                priorityFilter === 'URGENT'
                  ? 'bg-[#EBF3FF] text-[#194B90] border border-[#194B90]'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              } cursor-pointer`}
            >
              Urgent
            </button>
            <button
              onClick={() => setPriorityFilter('MEDIUM')}
              className={`px-6 py-2.5 rounded-[10px] font-medium transition ${
                priorityFilter === 'MEDIUM'
                  ? 'bg-[#EBF3FF] text-[#194B90] border border-[#194B90]'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              } cursor-pointer`}
            >
              Medium
            </button>
            <button
              onClick={() => setPriorityFilter('LOW')}
              className={`px-6 py-2.5 rounded-[10px] font-medium transition ${
                priorityFilter === 'LOW'
                  ? 'bg-[#EBF3FF] text-[#194B90] border border-[#194B90]'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              } cursor-pointer`}
            >
              Low
            </button>
          </div>

          <div className='flex-1 max-w-xl ml-auto'>
            <div className='relative'>
              <input
                type='text'
                placeholder='Search alerts...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#194B90]'
              />
              <svg
                className='absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
            </div>
          </div>
        </div>

        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6'>
            {error}
          </div>
        )}

        {loading ? (
          <div className='flex justify-center items-center py-12'>
            <MutatingDots
              visible={true}
              height='100'
              width='100'
              color='#D54242'
              secondaryColor='#D54242'
              radius='12.5'
              ariaLabel='mutating-dots-loading'
            />
          </div>
        ) : sortedAlerts.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-600'>No alerts found</p>
          </div>
        ) : (
          <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
            <table className='min-w-full'>
              <thead className='bg-gray-50 border-b border-gray-200'>
                <tr>
                  <th
                    className='px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100'
                    onClick={() => handleSort('title')}
                  >
                    <div className='flex items-center gap-2'>
                      Title
                      <SortIcon field='title' />
                    </div>
                  </th>
                  <th
                    className='px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100'
                    onClick={() => handleSort('priority')}
                  >
                    <div className='flex items-center gap-2'>
                      Priority
                      <SortIcon field='priority' />
                    </div>
                  </th>
                  <th
                    className='px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100'
                    onClick={() => handleSort('publishedDate')}
                  >
                    <div className='flex items-center gap-2'>
                      Published
                      <SortIcon field='publishedDate' />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200'>
                {sortedAlerts.map(alert => (
                  <tr key={alert.id} className='hover:bg-gray-50'>
                    <td
                      className='px-6 py-4 text-[#194B90] font-medium hover:underline cursor-pointer'
                      onClick={() => openDetailModal(alert)}
                    >
                      {alert.title}
                    </td>
                    <td className='px-6 py-4'>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                          alert.priority
                        )}`}
                      >
                        {alert.priority}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm text-gray-600'>
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && sortedAlerts.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalAlerts / itemsPerPage)}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={totalAlerts}
          />
        )}
      </div>

      {isDetailModalOpen && selectedAlert && (
        <>
          <input type='checkbox' checked readOnly className='modal-toggle' />
          <div className='modal modal-open'>
            <div className='modal-box max-w-2xl max-h-[80vh] bg-white overflow-y-auto m-8'>
              <h3 className='font-bold text-xl text-gray-900 mb-3'>{selectedAlert.title}</h3>

              <div className='space-y-4'>
                <div>
                  <h4 className='font-semibold text-base text-gray-800 mb-2'>Basic Information</h4>
                  <div className='grid grid-cols-2 gap-3'>
                    <div>
                      <span className='text-sm font-bold text-gray-600'>Priority:</span>
                      <p className='text-sm'>
                        <span
                          className={`px-2 py-1 inline-flex text-xs font-medium rounded-full ${getPriorityColor(
                            selectedAlert.priority
                          )}`}
                        >
                          {selectedAlert.priority}
                        </span>
                      </p>
                    </div>

                    <div>
                      <span className='text-sm font-bold text-gray-600'>Status:</span>
                      <p className='text-sm'>
                        <span
                          className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                            selectedAlert.isPublished
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {selectedAlert.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className='font-semibold text-base text-gray-800 mb-2'>Content</h4>
                  <div
                    className='prose max-w-none text-sm text-gray-900'
                    dangerouslySetInnerHTML={{ __html: selectedAlert.content }}
                  />
                </div>

                {selectedAlert.attachmentUrls && selectedAlert.attachmentUrls.length > 0 && (
                  <PublicAttachmentList
                    attachmentUrls={selectedAlert.attachmentUrls}
                    requireAuth={true}
                  />
                )}

                <div>
                  <h4 className='font-semibold text-base text-gray-800 mb-2'>Dates</h4>
                  <div className='grid grid-cols-2 gap-3'>
                    <div>
                      <span className='text-sm font-bold text-gray-600'>Created:</span>
                      <p className='text-sm text-gray-900'>
                        {new Date(selectedAlert.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className='text-sm font-bold text-gray-600'>Updated:</span>
                      <p className='text-sm text-gray-900'>
                        {new Date(selectedAlert.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className='modal-action'>
                <button
                  onClick={openResponseModal}
                  className='px-6 py-2.5 bg-[#D54242] hover:bg-[#b53a3a] text-white rounded-xl font-medium transition'
                >
                  Respond
                </button>
                <button
                  onClick={closeDetailModal}
                  className='px-6 py-2.5 bg-[#D54242] hover:bg-[#b53a3a] text-white rounded-xl font-medium transition'
                >
                  Close
                </button>
              </div>
            </div>
            <div className='modal-backdrop bg-black/30' onClick={closeDetailModal}></div>
          </div>
        </>
      )}

      {isResponseModalOpen && selectedAlert && selectedAlert.questions && (
        <>
          <input type='checkbox' checked readOnly className='modal-toggle' />
          <div className='modal modal-open'>
            <div className='modal-box max-w-3xl w-full max-h-[90vh] bg-white overflow-y-auto p-0'>
              <div className='sticky top-0 bg-white border-b border-gray-200 p-6 z-10'>
                <div className='flex justify-between items-start'>
                  <div>
                    <h2 className='text-2xl font-bold text-gray-800'>{selectedAlert.title}</h2>
                    {selectedAlert.content && (
                      <p className='text-gray-600 mt-2'>{selectedAlert.content}</p>
                    )}
                  </div>
                  <button
                    onClick={closeResponseModal}
                    className='text-gray-400 hover:text-gray-600'
                    disabled={submitResponse.isPending}
                  >
                    <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M6 18L18 6M6 6l12 12'
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className='p-6 space-y-6'>
                {selectedAlert.questions.map((question, index) => (
                  <div key={question.id} className='border-b border-gray-200 pb-6 last:border-b-0'>
                    <label className='block text-lg font-semibold text-gray-800 mb-3'>
                      {index + 1}. {question.text}
                      {question.required && <span className='text-red-500 ml-1'>*</span>}
                    </label>

                    {question.type === 'multipleChoice' && (
                      <div className='space-y-2'>
                        {question.options?.map(option => (
                          <label
                            key={option}
                            className='flex items-center space-x-3 cursor-pointer'
                          >
                            <input
                              type='radio'
                              name={question.id}
                              value={option}
                              checked={currentResponses[question.id] === option}
                              //TOOD: uncomment when func is ready
                              // onChange={e => handleResponseChange(question.id, e.target.value)}
                              className='w-4 h-4 text-[#D54242] focus:ring-[#D54242]'
                            />
                            <span className='text-gray-700'>{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {question.type === 'text' && (
                      <>
                        {question.textType === 'short' ? (
                          <input
                            type='text'
                            value={currentResponses[question.id] || ''}
                            onChange={e => handleResponseChange(question.id, e.target.value)}
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                            placeholder='Your answer'
                          />
                        ) : (
                          <textarea
                            value={currentResponses[question.id] || ''}
                            onChange={e => handleResponseChange(question.id, e.target.value)}
                            rows={4}
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                            placeholder='Your answer'
                          />
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className='sticky bottom-0 bg-white border-t border-gray-200 p-6 flex justify-end gap-3'>
                <button
                  onClick={closeResponseModal}
                  disabled={submitResponse.isPending}
                  className='px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitResponse}
                  disabled={submitResponse.isPending}
                  className='px-6 py-2 bg-[#D54242] hover:bg-[#b53a3a] disabled:bg-[#e88888] text-white rounded-lg disabled:cursor-not-allowed'
                >
                  {submitResponse.isPending ? 'Submitting...' : 'Submit Response'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AlertsPage;
