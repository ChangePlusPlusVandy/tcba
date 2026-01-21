import { useAuth } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MutatingDots } from 'react-loader-spinner';
import AdminSidebar from '../../../components/AdminSidebar';
import Toast from '../../../components/Toast';
import { useSurveyMutations } from '../../../hooks/mutations/useSurveyMutations';
import { API_BASE_URL } from '../../../config/api';

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

const CreateSurvey = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const { createSurvey, updateSurvey } = useSurveyMutations();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = await getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    if (response.status === 204) return null;
    return response.json();
  };

  useEffect(() => {
    if (isEditMode && id) {
      fetchSurvey();
    }
  }, [id, isEditMode]);

  const fetchSurvey = async () => {
    try {
      const data = await fetchWithAuth(`${API_BASE_URL}/api/surveys/${id}`);
      setTitle(data.title);
      setDescription(data.description || '');
      setDueDate(data.dueDate ? data.dueDate.split('T')[0] : '');
      setQuestions(data.questions || []);
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to fetch survey', type: 'error' });
      setTimeout(() => navigate('/admin/surveys'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const generateQuestionId = () => {
    return `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: generateQuestionId(),
      type: 'multipleChoice',
      text: '',
      required: false,
      options: ['Option 1', 'Option 2'],
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => (q.id === id ? { ...q, ...updates } : q)));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options) {
      const newOptionNumber = question.options.length + 1;
      updateQuestion(questionId, {
        options: [...question.options, `Option ${newOptionNumber}`],
      });
    }
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options && question.options.length > 2) {
      const newOptions = question.options.filter((_, idx) => idx !== optionIndex);
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const changeQuestionType = (questionId: string, newType: QuestionType) => {
    const updates: Partial<Question> = { type: newType };

    if (newType === 'multipleChoice' || newType === 'checkbox') {
      updates.options = ['Option 1', 'Option 2'];
      updates.textType = undefined;
      updates.minValue = undefined;
      updates.maxValue = undefined;
    } else if (newType === 'text') {
      updates.textType = 'short';
      updates.options = undefined;
      updates.minValue = undefined;
      updates.maxValue = undefined;
    } else if (newType === 'rating') {
      updates.minValue = 1;
      updates.maxValue = 5;
      updates.options = undefined;
      updates.textType = undefined;
    }

    updateQuestion(questionId, updates);
  };

  const handleSubmit = async (publish: boolean) => {
    if (!title.trim()) {
      setToast({ message: 'Title is required', type: 'error' });
      return;
    }
    if (questions.length === 0) {
      setToast({ message: 'At least one question is required', type: 'error' });
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setToast({ message: `Question ${i + 1} text is required`, type: 'error' });
        return;
      }
      if (
        (q.type === 'multipleChoice' || q.type === 'checkbox') &&
        (!q.options || q.options.length < 2)
      ) {
        setToast({ message: `Question ${i + 1} must have at least 2 options`, type: 'error' });
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const surveyData = {
        title,
        description,
        dueDate: dueDate || null,
        questions,
        isPublished: publish,
      };

      if (isEditMode) {
        await updateSurvey.mutateAsync({ id: id!, data: surveyData });
      } else {
        await createSurvey.mutateAsync(surveyData);
      }

      const successMessage = isEditMode
        ? publish
          ? 'Survey updated and published successfully'
          : 'Survey updated successfully'
        : publish
          ? 'Survey created and published successfully'
          : 'Survey saved to drafts successfully';

      setToast({ message: successMessage, type: 'success' });
      setTimeout(() => navigate('/admin/surveys'), 1500);
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to save survey', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className='flex min-h-screen bg-gray-50'>
        <AdminSidebar />
        <div className='flex-1 flex items-center justify-center'>
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
      </div>
    );
  }

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <AdminSidebar />

      <div className='flex-1 p-8'>
        <div className='mb-6'>
          <button
            onClick={() => navigate('/admin/surveys')}
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
            Back to Surveys
          </button>

          <div className='flex justify-between items-center mb-6'>
            <h1 className='text-3xl font-bold text-gray-800'>
              {isEditMode ? 'Edit Survey' : 'Create New Survey'}
            </h1>

            <div className='flex gap-3'>
              <button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className='px-6 py-2.5 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white rounded-lg font-medium disabled:cursor-not-allowed'
              >
                {isSubmitting ? 'Saving...' : 'Save to Drafts'}
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className='px-6 py-2.5 bg-[#D54242] hover:bg-[#b53a3a] disabled:bg-[#e88888] text-white rounded-lg font-medium disabled:cursor-not-allowed'
              >
                {isSubmitting ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg border border-gray-200 p-6 mb-6'>
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-1'>
                Title <span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                value={title}
                onChange={e => setTitle(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                placeholder='Enter survey title'
              />
            </div>

            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-1'>Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                placeholder='Enter survey description (optional)'
              />
            </div>

            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-1'>Due Date</label>
              <input
                type='date'
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194B90]'
              />
            </div>
          </div>
        </div>

        <div className='space-y-4 mb-6'>
          {questions.map((question, index) => (
            <div key={question.id} className='bg-white rounded-lg border border-gray-200 p-6'>
              <div className='flex items-start justify-between mb-4'>
                <h3 className='text-lg font-semibold text-gray-800'>Question {index + 1}</h3>
                <button
                  onClick={() => deleteQuestion(question.id)}
                  className='text-red-600 hover:text-red-800'
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                    />
                  </svg>
                </button>
              </div>

              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1'>
                    Question Text <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={question.text}
                    onChange={e => updateQuestion(question.id, { text: e.target.value })}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                    placeholder='Enter your question'
                  />
                </div>

                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>
                    Question Type
                  </label>
                  <div className='flex gap-2'>
                    {[
                      { type: 'multipleChoice', label: 'Multiple Choice' },
                      { type: 'checkbox', label: 'Checkboxes' },
                      { type: 'text', label: 'Text' },
                      { type: 'rating', label: 'Rating' },
                    ].map(({ type, label }) => (
                      <button
                        key={type}
                        onClick={() => changeQuestionType(question.id, type as QuestionType)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          question.type === type
                            ? 'bg-[#D54242] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {(question.type === 'multipleChoice' || question.type === 'checkbox') && (
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>
                      Options
                    </label>
                    <div className='space-y-2'>
                      {question.options?.map((option, optionIndex) => (
                        <div key={optionIndex} className='flex items-center gap-2'>
                          <input
                            type='text'
                            value={option}
                            onChange={e => updateOption(question.id, optionIndex, e.target.value)}
                            className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                            placeholder={`Option ${optionIndex + 1}`}
                          />
                          {question.options && question.options.length > 2 && (
                            <button
                              onClick={() => removeOption(question.id, optionIndex)}
                              className='text-red-600 hover:text-red-800'
                            >
                              <svg
                                className='w-5 h-5'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M6 18L18 6M6 6l12 12'
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => addOption(question.id)}
                        className='text-sm text-[#194B90] hover:text-[#0f3464] font-medium'
                      >
                        + Add Option
                      </button>
                    </div>
                  </div>
                )}

                {question.type === 'text' && (
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>
                      Response Type
                    </label>
                    <select
                      value={question.textType || 'short'}
                      onChange={e =>
                        updateQuestion(question.id, {
                          textType: e.target.value as 'short' | 'long',
                        })
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                    >
                      <option value='short'>Short Response</option>
                      <option value='long'>Long Response</option>
                    </select>
                  </div>
                )}

                {question.type === 'rating' && (
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-semibold text-gray-700 mb-1'>
                        Min Value
                      </label>
                      <select
                        value={question.minValue || 1}
                        onChange={e =>
                          updateQuestion(question.id, { minValue: Number(e.target.value) })
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className='block text-sm font-semibold text-gray-700 mb-1'>
                        Max Value
                      </label>
                      <select
                        value={question.maxValue || 5}
                        onChange={e =>
                          updateQuestion(question.id, { maxValue: Number(e.target.value) })
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    id={`required-${question.id}`}
                    checked={question.required}
                    onChange={e => updateQuestion(question.id, { required: e.target.checked })}
                    className='w-4 h-4 text-[#D54242] border-gray-300 rounded focus:ring-[#D54242]'
                  />
                  <label
                    htmlFor={`required-${question.id}`}
                    className='ml-2 text-sm font-medium text-gray-700'
                  >
                    Make required
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className='flex justify-center mb-8'>
          <button
            onClick={addQuestion}
            className='flex items-center justify-center w-12 h-12 bg-[#D54242] hover:bg-[#b53a3a] text-white rounded-full shadow-lg transition'
          >
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 4v16m8-8H4'
              />
            </svg>
          </button>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default CreateSurvey;
