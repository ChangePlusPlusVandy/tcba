import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../../components/AdminSidebar';
import Toast from '../../../components/Toast';
import ConfirmModal from '../../../components/ConfirmModal';
import { useAdminSurveys } from '../../../hooks/queries/useAdminSurveys';
import { useSurveyMutations } from '../../../hooks/mutations/useSurveyMutations';

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
  description: string;
  questions: Question[];
  dueDate?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

type Filter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'DRAFTS';

const AdminSurveys = () => {
  const navigate = useNavigate();

  const { data: surveys = [], isLoading: loading, error: surveysError } = useAdminSurveys();
  const surveysArray = surveys as Survey[];
  const { deleteSurvey, publishSurvey } = useSurveyMutations();

  const error = surveysError ? 'Failed to fetch surveys' : '';
  const [selectedSurveyIds, setSelectedSurveyIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  type SortField = 'title' | 'dueDate' | 'createdAt';
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
  } | null>(null);

  const handleDeleteSelected = () => {
    if (selectedSurveyIds.length === 0) return;

    const count = selectedSurveyIds.length;
    setConfirmModal({
      title: 'Delete Surveys',
      message: `Are you sure you want to delete ${count} survey${count > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          setIsDeleting(true);
          await Promise.all(selectedSurveyIds.map(id => deleteSurvey.mutateAsync(id)));

          setSelectedSurveyIds([]);
          setToast({
            message: `${count} survey${count > 1 ? 's' : ''} deleted successfully`,
            type: 'success',
          });
        } catch (err: any) {
          setToast({ message: err.message || 'Failed to delete surveys', type: 'error' });
        } finally {
          setIsDeleting(false);
          setConfirmModal(null);
        }
      },
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedSurveyIds(sortedSurveys.map(s => s.id));
    } else {
      setSelectedSurveyIds([]);
    }
  };

  const handleSelectSurvey = (id: string) => {
    setSelectedSurveyIds(prev =>
      prev.includes(id) ? prev.filter(surveyId => surveyId !== id) : [...prev, id]
    );
  };

  const openDetailModal = (survey: Survey) => {
    setSelectedSurvey(survey);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedSurvey(null);
  };

  const handlePublishSurvey = async () => {
    if (!selectedSurvey || isPublishing) return;

    try {
      setIsPublishing(true);
      await publishSurvey.mutateAsync(selectedSurvey.id);
      setToast({ message: 'Survey published successfully', type: 'success' });
      closeDetailModal();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to publish survey', type: 'error' });
    } finally {
      setIsPublishing(false);
    }
  };

  const filteredSurveys = surveysArray.filter(survey => {
    const now = new Date();
    const isInactive = survey.dueDate && new Date(survey.dueDate) < now;
    const isActive = survey.isPublished && (!survey.dueDate || new Date(survey.dueDate) >= now);

    if (filter === 'ACTIVE' && !isActive) return false;
    if (filter === 'INACTIVE' && (!survey.isPublished || !isInactive)) return false;
    if (filter === 'DRAFTS' && survey.isPublished) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        survey.title.toLowerCase().includes(query) ||
        survey.description.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const sortedSurveys = [...filteredSurveys].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'dueDate':
        aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
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

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <AdminSidebar />

      <div className='flex-1 p-8'>
        <h1 className='text-3xl font-bold text-gray-800 mb-6'>
          {filter === 'ALL' && `All Surveys (${filteredSurveys.length})`}
          {filter === 'ACTIVE' && `Active Surveys (${filteredSurveys.length})`}
          {filter === 'INACTIVE' && `Inactive Surveys (${filteredSurveys.length})`}
          {filter === 'DRAFTS' && `Draft Surveys (${filteredSurveys.length})`}
        </h1>

        <div className='flex items-center gap-4 mb-6'>
          <div className='flex gap-2'>
            <button
              onClick={() => setFilter('ALL')}
              className={`px-6 py-2.5 rounded-[10px] font-medium transition ${
                filter === 'ALL'
                  ? 'bg-[#EBF3FF] text-[#194B90] border border-[#194B90]'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              } cursor-pointer`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('ACTIVE')}
              className={`px-6 py-2.5 rounded-[10px] font-medium transition ${
                filter === 'ACTIVE'
                  ? 'bg-[#EBF3FF] text-[#194B90] border border-[#194B90]'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              } cursor-pointer`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('INACTIVE')}
              className={`px-6 py-2.5 rounded-[10px] font-medium transition ${
                filter === 'INACTIVE'
                  ? 'bg-[#EBF3FF] text-[#194B90] border border-[#194B90]'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              } cursor-pointer`}
            >
              Inactive
            </button>
            <button
              onClick={() => setFilter('DRAFTS')}
              className={`px-6 py-2.5 rounded-[10px] font-medium transition ${
                filter === 'DRAFTS'
                  ? 'bg-[#EBF3FF] text-[#194B90] border border-[#194B90]'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              } cursor-pointer`}
            >
              Drafts
            </button>
          </div>

          <button
            onClick={() => navigate('/admin/surveys/create')}
            className='px-6 py-2.5 rounded-[10px] font-medium transition bg-[#D54242] text-white hover:bg-[#b53a3a] cursor-pointer'
          >
            Create Survey
          </button>

          {selectedSurveyIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className='px-6 py-2.5 rounded-[10px] font-medium transition bg-[#D54242] text-white hover:bg-[#b53a3a] cursor-pointer'
            >
              Delete Selected ({selectedSurveyIds.length})
            </button>
          )}

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

        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6'>
            {error}
          </div>
        )}

        {loading ? (
          <div className='text-center py-12'>
            <p className='text-gray-600'>Loading surveys...</p>
          </div>
        ) : filteredSurveys.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-600'>No surveys found</p>
          </div>
        ) : (
          <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
            <table className='min-w-full'>
              <thead className='bg-gray-50 border-b border-gray-200'>
                <tr>
                  <th className='px-6 py-4 w-12'>
                    <input
                      type='checkbox'
                      checked={
                        sortedSurveys.length > 0 &&
                        selectedSurveyIds.length === sortedSurveys.length
                      }
                      onChange={handleSelectAll}
                      className='w-4 h-4'
                    />
                  </th>
                  <th
                    className='px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100'
                    onClick={() => handleSort('title')}
                  >
                    <div className='flex items-center gap-2'>
                      Title
                      <SortIcon field='title' />
                    </div>
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                    Status
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                    Questions
                  </th>
                  <th
                    className='px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100'
                    onClick={() => handleSort('dueDate')}
                  >
                    <div className='flex items-center gap-2'>
                      Due Date
                      <SortIcon field='dueDate' />
                    </div>
                  </th>
                  <th
                    className='px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100'
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className='flex items-center gap-2'>
                      Created
                      <SortIcon field='createdAt' />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200'>
                {sortedSurveys.map(survey => (
                  <tr key={survey.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4' onClick={e => e.stopPropagation()}>
                      <input
                        type='checkbox'
                        checked={selectedSurveyIds.includes(survey.id)}
                        onChange={() => handleSelectSurvey(survey.id)}
                        className='w-4 h-4'
                      />
                    </td>
                    <td
                      className='px-6 py-4 text-[#194B90] font-medium hover:underline cursor-pointer'
                      onClick={() => openDetailModal(survey)}
                    >
                      {survey.title}
                    </td>
                    <td className='px-6 py-4'>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          survey.isPublished
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {survey.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm text-gray-900'>{survey.questions.length}</span>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm text-gray-600'>
                        {survey.dueDate ? new Date(survey.dueDate).toLocaleDateString() : '-'}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm text-gray-600'>
                        {new Date(survey.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isDetailModalOpen && selectedSurvey && (
        <>
          <input type='checkbox' checked readOnly className='modal-toggle' />
          <div className='modal modal-open'>
            <div className='modal-box max-w-3xl max-h-[80vh] bg-white overflow-y-auto m-8'>
              <h3 className='font-bold text-xl text-gray-900 mb-3'>{selectedSurvey.title}</h3>

              <div className='space-y-4'>
                <div>
                  <h4 className='font-semibold text-base text-gray-800 mb-2'>Basic Information</h4>
                  <div className='grid grid-cols-2 gap-3'>
                    <div>
                      <span className='text-sm font-bold text-gray-600'>Status:</span>
                      <p className='text-sm'>
                        <span
                          className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                            selectedSurvey.isPublished
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {selectedSurvey.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </p>
                    </div>

                    <div>
                      <span className='text-sm font-bold text-gray-600'>Due Date:</span>
                      <p className='text-sm text-gray-900'>
                        {selectedSurvey.dueDate
                          ? new Date(selectedSurvey.dueDate).toLocaleDateString()
                          : 'No due date'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className='font-semibold text-base text-gray-800 mb-2'>Description</h4>
                  <p className='text-sm text-gray-900'>
                    {selectedSurvey.description || 'No description'}
                  </p>
                </div>

                <div>
                  <h4 className='font-semibold text-base text-gray-800 mb-2'>
                    Questions ({selectedSurvey.questions.length})
                  </h4>
                  <div className='space-y-4'>
                    {selectedSurvey.questions.map((question, index) => (
                      <div key={question.id} className='border border-gray-200 rounded-lg p-4'>
                        <div className='flex items-start justify-between mb-2'>
                          <div className='flex-1'>
                            <p className='font-medium text-gray-900'>
                              {index + 1}. {question.text}
                              {question.required && <span className='text-red-500 ml-1'>*</span>}
                            </p>
                            <p className='text-xs text-gray-500 mt-1'>
                              Type:{' '}
                              {question.type === 'multipleChoice'
                                ? 'Multiple Choice'
                                : question.type === 'checkbox'
                                  ? 'Checkboxes'
                                  : question.type === 'text'
                                    ? 'Text'
                                    : 'Rating'}
                            </p>
                          </div>
                        </div>

                        {(question.type === 'multipleChoice' || question.type === 'checkbox') &&
                          question.options && (
                            <div className='mt-2 ml-4'>
                              <p className='text-xs text-gray-600 mb-1'>Options:</p>
                              <ul className='list-disc list-inside space-y-1'>
                                {question.options.map((option, idx) => (
                                  <li key={idx} className='text-sm text-gray-700'>
                                    {option}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                        {question.type === 'text' && question.textType && (
                          <div className='mt-2 ml-4'>
                            <p className='text-xs text-gray-600'>
                              Response Type:{' '}
                              {question.textType === 'short' ? 'Short Response' : 'Long Response'}
                            </p>
                          </div>
                        )}

                        {question.type === 'rating' && (
                          <div className='mt-2 ml-4'>
                            <p className='text-xs text-gray-600'>
                              Scale: {question.minValue} to {question.maxValue}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className='font-semibold text-base text-gray-800 mb-2'>Dates</h4>
                  <div className='grid grid-cols-2 gap-3'>
                    <div>
                      <span className='text-sm font-bold text-gray-600'>Created:</span>
                      <p className='text-sm text-gray-900'>
                        {new Date(selectedSurvey.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className='text-sm font-bold text-gray-600'>Updated:</span>
                      <p className='text-sm text-gray-900'>
                        {new Date(selectedSurvey.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className='modal-action'>
                <button
                  onClick={() => {
                    closeDetailModal();
                    navigate(`/admin/surveys/${selectedSurvey.id}/responses`);
                  }}
                  className='px-6 py-2.5 bg-[#D54242] hover:bg-[#b53a3a] text-white rounded-xl font-medium transition'
                >
                  View Responses
                </button>
                {!selectedSurvey.isPublished && (
                  <button
                    onClick={handlePublishSurvey}
                    disabled={isPublishing}
                    className={`px-6 py-2.5 text-white rounded-xl font-medium transition ${
                      isPublishing
                        ? 'bg-[#E57373] cursor-not-allowed'
                        : 'bg-[#D54242] hover:bg-[#b53a3a]'
                    }`}
                  >
                    {isPublishing ? 'Publishing...' : 'Publish'}
                  </button>
                )}
                {!selectedSurvey.isPublished && (
                  <button
                    onClick={() => {
                      closeDetailModal();
                      navigate(`/admin/surveys/edit/${selectedSurvey.id}`);
                    }}
                    className='px-6 py-2.5 bg-[#D54242] hover:bg-[#b53a3a] text-white rounded-xl font-medium transition'
                  >
                    Edit
                  </button>
                )}
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

      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
          isLoading={isDeleting}
          loadingText='Deleting...'
        />
      )}
    </div>
  );
};

export default AdminSurveys;
