import { useUser } from '@clerk/clerk-react';
import { useState } from 'react';
import { MutatingDots } from 'react-loader-spinner';
import OrganizationSidebar from '../../../components/OrganizationSidebar';
import Toast from '../../../components/Toast';
import { useOrgActiveSurveys, useOrgSurveyResponses } from '../../../hooks/queries/useOrgSurveys';
import { useSurveyResponseMutations } from '../../../hooks/mutations/useSurveyResponseMutations';

type QuestionType = 'multipleChoice' | 'checkbox' | 'text' | 'rating';

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  options?: string[];
  textType?: 'short' | 'long';
  minValue?: number;
  maxValue?: number;
}

type Survey = {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  dueDate?: string;
  isActive: boolean;
  isPublished: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type SurveyResponse = {
  id: string;
  surveyId: string;
  organizationId: string;
  responses: Record<string, any>;
  submittedDate?: string;
  createdAt: string;
  updatedAt: string;
};

type FilterType = 'ACTIVE' | 'COMPLETED';

const OrgSurveysPage = () => {
  const { user } = useUser();
  const organizationId = user?.publicMetadata?.organizationId as string | undefined;

  const { data: surveys = [], isLoading: loadingSurveys } = useOrgActiveSurveys();
  const { data: myResponses = [], isLoading: loadingResponses } =
    useOrgSurveyResponses(organizationId);
  const { submitResponse } = useSurveyResponseMutations();

  const loading = loadingSurveys || loadingResponses;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterType>('ACTIVE');

  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [currentResponses, setCurrentResponses] = useState<Record<string, any>>({});

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const surveysArray = surveys as Survey[];
  const responsesArray = myResponses as SurveyResponse[];

  const hasResponded = (surveyId: string) => {
    return responsesArray.some(r => r.surveyId === surveyId);
  };

  const filteredSurveys = surveysArray
    .filter(survey => {
      const matchesSearch =
        survey.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (survey.description &&
          survey.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const responded = hasResponded(survey.id);

      if (statusFilter === 'ACTIVE') {
        return matchesSearch && !responded;
      } else {
        return matchesSearch && responded;
      }
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const openResponseModal = (survey: Survey) => {
    setSelectedSurvey(survey);
    setCurrentResponses({});
    setIsResponseModalOpen(true);
  };

  const closeResponseModal = () => {
    setIsResponseModalOpen(false);
    setSelectedSurvey(null);
    setCurrentResponses({});
  };

  const handleResponseChange = (questionId: string, value: any) => {
    setCurrentResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmitResponse = async () => {
    if (!selectedSurvey || !organizationId) return;

    const missingRequired = selectedSurvey.questions.filter(q => {
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
        surveyId: selectedSurvey.id,
        organizationId,
        responses: currentResponses,
      });

      setToast({ message: 'Survey response submitted successfully!', type: 'success' });
      closeResponseModal();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to submit response', type: 'error' });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <OrganizationSidebar />

      <div className='flex-1 p-8'>
        <h1 className='text-3xl font-bold text-gray-800 mb-6'>
          {statusFilter === 'ACTIVE' && `Active Surveys (${filteredSurveys.length})`}
          {statusFilter === 'COMPLETED' && `Completed Surveys (${filteredSurveys.length})`}
        </h1>

        <div className='flex items-center gap-4 mb-6'>
          <div className='flex gap-2'>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-6 py-2.5 rounded-[10px] font-medium transition ${
                statusFilter === 'ACTIVE'
                  ? 'bg-[#EBF3FF] text-[#194B90] border border-[#194B90]'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              } cursor-pointer`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-6 py-2.5 rounded-[10px] font-medium transition ${
                statusFilter === 'COMPLETED'
                  ? 'bg-[#EBF3FF] text-[#194B90] border border-[#194B90]'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              } cursor-pointer`}
            >
              Completed
            </button>
          </div>

          <div className='flex-1 max-w-xl ml-auto'>
            <div className='relative'>
              <input
                type='text'
                placeholder='Search surveys...'
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
        ) : filteredSurveys.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-600'>
              {statusFilter === 'ACTIVE'
                ? 'No active surveys available'
                : 'No completed surveys found'}
            </p>
          </div>
        ) : (
          <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
            <table className='min-w-full'>
              <thead className='bg-gray-50 border-b border-gray-200'>
                <tr>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Title</th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                    Questions
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                    Due Date
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                    Status
                  </th>
                  {statusFilter === 'ACTIVE' && (
                    <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                      Action
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200'>
                {filteredSurveys.map(survey => (
                  <tr key={survey.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4'>
                      <div>
                        <div className='text-[#194B90] font-medium'>{survey.title}</div>
                        {survey.description && (
                          <div className='text-sm text-gray-500 mt-1 line-clamp-1'>
                            {survey.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm text-gray-600'>{survey.questions.length}</span>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm text-gray-600'>{formatDate(survey.dueDate)}</span>
                    </td>
                    <td className='px-6 py-4'>
                      {hasResponded(survey.id) ? (
                        <span className='px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800'>
                          Completed
                        </span>
                      ) : (
                        <span className='px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800'>
                          Pending
                        </span>
                      )}
                    </td>
                    {statusFilter === 'ACTIVE' && (
                      <td className='px-6 py-4'>
                        <button
                          onClick={() => openResponseModal(survey)}
                          className='px-4 py-2 bg-[#D54242] hover:bg-[#b53a3a] text-white rounded-lg text-sm font-medium transition'
                        >
                          Respond
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isResponseModalOpen && selectedSurvey && (
        <>
          <input type='checkbox' checked readOnly className='modal-toggle' />
          <div className='modal modal-open'>
            <div className='modal-box max-w-3xl w-full max-h-[90vh] bg-white overflow-y-auto p-0'>
              <div className='sticky top-0 bg-white border-b border-gray-200 p-6 z-10'>
                <div className='flex justify-between items-start'>
                  <div>
                    <h2 className='text-2xl font-bold text-gray-800'>{selectedSurvey.title}</h2>
                    {selectedSurvey.description && (
                      <p className='text-gray-600 mt-2'>{selectedSurvey.description}</p>
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
                {selectedSurvey.questions.map((question, index) => (
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
                              onChange={e => handleResponseChange(question.id, e.target.value)}
                              className='w-4 h-4 text-[#D54242] focus:ring-[#D54242]'
                            />
                            <span className='text-gray-700'>{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {question.type === 'checkbox' && (
                      <div className='space-y-2'>
                        {question.options?.map(option => (
                          <label
                            key={option}
                            className='flex items-center space-x-3 cursor-pointer'
                          >
                            <input
                              type='checkbox'
                              value={option}
                              checked={((currentResponses[question.id] as string[]) || []).includes(
                                option
                              )}
                              onChange={e => {
                                const current = (currentResponses[question.id] as string[]) || [];
                                const updated = e.target.checked
                                  ? [...current, option]
                                  : current.filter(v => v !== option);
                                handleResponseChange(question.id, updated);
                              }}
                              className='w-4 h-4 text-[#D54242] focus:ring-[#D54242] rounded'
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

                    {question.type === 'rating' && (
                      <div className='flex gap-2 items-center'>
                        <div className='flex gap-2'>
                          {Array.from(
                            { length: (question.maxValue || 5) - (question.minValue || 1) + 1 },
                            (_, i) => (question.minValue || 1) + i
                          ).map(value => (
                            <button
                              key={value}
                              type='button'
                              onClick={() => handleResponseChange(question.id, value)}
                              className={`w-10 h-10 rounded-lg border-2 font-medium transition ${
                                currentResponses[question.id] === value
                                  ? 'bg-[#D54242] text-white border-[#D54242]'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#D54242]'
                              }`}
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      </div>
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

export default OrgSurveysPage;
