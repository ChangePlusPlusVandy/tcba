import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminSidebar from '../../../components/AdminSidebar';
import Toast from '../../../components/Toast';
import { useAlert, useAlertResponsesByAlert } from '../../../hooks/queries/useAlertResponse';

type QuestionType = 'multipleChoice' | 'text';

type AlertPriority = 'URGENT' | 'LOW' | 'MEDIUM';

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  options?: string[];
  textType?: 'short' | 'long';
}

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
  questions: Question[];
};

type AlertResponse = {
  id: string;
  alertId: string;
  organizationId: string;
  responses: Record<string, any>;
  submittedDate?: string;
  createdAt: string;
  updatedAt: string;
  organization: {
    name: string;
    email: string;
    tags: string[];
  };
};

const AlertResponses = () => {
  const navigate = useNavigate();
  const { alertId } = useParams<{ alertId: string }>();

  const { data: alert = null, isLoading: alertLoading } = useAlert(alertId);
  const alertData = alert as Alert | null;
  const { data: responses = [], isLoading: responsesLoading } = useAlertResponsesByAlert(alertId);
  const responsesArray = responses as AlertResponse[];

  const loading = alertLoading || responsesLoading;
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedResponse, setSelectedResponse] = useState<AlertResponse | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const openDetailModal = (response: AlertResponse) => {
    setSelectedResponse(response);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedResponse(null);
  };

  const filteredResponses = responsesArray.filter((response: AlertResponse) => {
    return response.organization.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getAnswerDisplay = (question: Question, answer: any) => {
    if (answer === undefined || answer === null || answer === '') {
      return <span className='text-gray-400 italic'>No answer</span>;
    }
    return String(answer);
  };

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <AdminSidebar />

      <div className='flex-1 p-8'>
        <div className='mb-6'>
          <button
            onClick={() => navigate('/admin/alerts')}
            className='flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 19l-7-7 7-7'
              />
            </svg>
            Back to Alerts
          </button>

          <div>
            <h1 className='text-3xl font-bold text-gray-800'>{alertData?.title}</h1>
            <p className='text-gray-600 mt-1'>Alert Responses ({responsesArray.length})</p>
          </div>
        </div>

        <div className='mb-6 flex items-center gap-3 flex-wrap'>
          <button
            onClick={() => navigate(`/admin/alerts/${alertId}/responses/summary`)}
            className='px-6 py-2.5 bg-[#D54242] hover:bg-[#b53a3a] text-white rounded-lg font-medium transition'
          >
            Show Summary
          </button>

          <div className='relative flex-1 max-w-xl ml-auto'>
            <input
              type='text'
              placeholder='Search organizations...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='w-full px-4 py-2 pl-10 border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#194B90]'
            />
            <svg
              className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400'
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

        {loading ? (
          <div className='text-center py-12'>
            <p className='text-gray-600'>Loading responses...</p>
          </div>
        ) : filteredResponses.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-600'>No responses found</p>
          </div>
        ) : (
          <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
            <table className='min-w-full'>
              <thead className='bg-gray-50 border-b border-gray-200'>
                <tr>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                    Organization
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Email</th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                    Submitted
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Tags</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200'>
                {filteredResponses.map(response => (
                  <tr
                    key={response.id}
                    className='hover:bg-gray-50 cursor-pointer'
                    onClick={() => openDetailModal(response)}
                  >
                    <td className='px-6 py-4 text-[#194B90] font-medium hover:underline'>
                      {response.organization.name}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      {response.organization.email}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      {response.submittedDate
                        ? new Date(response.submittedDate).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex flex-wrap gap-1'>
                        {response.organization.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className='px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full'
                          >
                            {tag}
                          </span>
                        ))}
                        {response.organization.tags.length > 3 && (
                          <span className='px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full'>
                            +{response.organization.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isDetailModalOpen && selectedResponse && alert && (
        <>
          <input type='checkbox' checked readOnly className='modal-toggle' />
          <div className='modal modal-open'>
            <div className='modal-box max-w-4xl max-h-[80vh] bg-white overflow-y-auto m-8'>
              <h3 className='font-bold text-xl text-gray-900 mb-4'>
                {selectedResponse.organization.name}
              </h3>

              <div className='space-y-6'>
                {alertData?.questions.map((question: Question, index: number) => (
                  <div key={question.id} className='border-b border-gray-200 pb-4 last:border-b-0'>
                    <div className='mb-2'>
                      <p className='font-semibold text-gray-800'>
                        {index + 1}. {question.text}
                        {question.required && <span className='text-red-500 ml-1'>*</span>}
                      </p>
                      <p className='text-xs text-gray-500 mt-1'>
                        Type: {question.type === 'multipleChoice' ? 'Multiple Choice' : 'Text'}
                      </p>
                    </div>

                    {question.type === 'multipleChoice' && (
                      <div className='ml-4 space-y-1'>
                        <p className='text-sm text-gray-600 mb-2'>Options:</p>
                        {question.options?.map((option: string) => {
                          const answer = selectedResponse.responses[question.id];
                          const isSelected = answer === option;

                          return (
                            <div key={option} className='flex items-center gap-2'>
                              <span
                                className={`w-4 h-4 rounded rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-[#194B90] border-[#194B90]' : 'border-gray-300'}`}
                              >
                                {isSelected && (
                                  <svg
                                    className='w-3 h-3 text-white'
                                    fill='currentColor'
                                    viewBox='0 0 20 20'
                                  >
                                    <path
                                      fillRule='evenodd'
                                      d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                      clipRule='evenodd'
                                    />
                                  </svg>
                                )}
                              </span>
                              <span
                                className={`text-sm ${isSelected ? 'font-medium text-gray-900' : 'text-gray-600'}`}
                              >
                                {option}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className='mt-3 p-3 bg-gray-50 rounded-lg'>
                      <p className='text-sm font-semibold text-gray-700 mb-1'>Answer:</p>
                      <p className='text-sm text-gray-900'>
                        {getAnswerDisplay(question, selectedResponse.responses[question.id])}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className='modal-action mt-6'>
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

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AlertResponses;
