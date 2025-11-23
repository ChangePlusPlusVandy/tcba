import { useAuth } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminSidebar from '../../../components/AdminSidebar';
import Toast from '../../../components/Toast';
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

type Survey = {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
};

type SurveyResponse = {
  responses: Record<string, any>;
  organization: {
    name: string;
  };
};

interface ResponseStats {
  totalResponses: number;
  questionStats: {
    [questionId: string]: {
      question: Question;
      stats: {
        [answer: string]: {
          count: number;
          organizations: string[];
        };
      };
      textResponses?: Array<{ text: string; orgName: string }>;
      averageRating?: number;
    };
  };
}

const COLORS = [
  '#D54242',
  '#194B90',
  '#22C55E',
  '#EAB308',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
];

const SurveySummary = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { surveyId } = useParams<{ surveyId: string }>();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [stats, setStats] = useState<ResponseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredSegment, setHoveredSegment] = useState<{
    questionId: string;
    answer: string;
  } | null>(null);

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

  const calculateStats = (survey: Survey, responses: SurveyResponse[]): ResponseStats => {
    const questionStats: ResponseStats['questionStats'] = {};

    survey.questions.forEach(question => {
      const stats: ResponseStats['questionStats'][string]['stats'] = {};
      const textResponses: Array<{ text: string; orgName: string }> = [];
      let ratingSum = 0;
      let ratingCount = 0;

      responses.forEach(response => {
        const answer = response.responses[question.id];
        const orgName = response.organization.name;

        if (question.type === 'checkbox' && Array.isArray(answer)) {
          answer.forEach(option => {
            if (!stats[option]) {
              stats[option] = { count: 0, organizations: [] };
            }
            stats[option].count++;
            stats[option].organizations.push(orgName);
          });
        } else if (question.type === 'multipleChoice' && answer) {
          if (!stats[answer]) {
            stats[answer] = { count: 0, organizations: [] };
          }
          stats[answer].count++;
          stats[answer].organizations.push(orgName);
        } else if (question.type === 'rating' && answer !== undefined && answer !== null) {
          const value = Number(answer);
          if (!stats[value]) {
            stats[value] = { count: 0, organizations: [] };
          }
          stats[value].count++;
          stats[value].organizations.push(orgName);
          ratingSum += value;
          ratingCount++;
        } else if (question.type === 'text' && answer) {
          textResponses.push({ text: answer, orgName });
        }
      });

      if (question.type === 'multipleChoice' || question.type === 'checkbox') {
        question.options?.forEach(option => {
          if (!stats[option]) {
            stats[option] = { count: 0, organizations: [] };
          }
        });
      } else if (question.type === 'rating') {
        const min = question.minValue || 1;
        const max = question.maxValue || 5;
        for (let i = min; i <= max; i++) {
          if (!stats[i]) {
            stats[i] = { count: 0, organizations: [] };
          }
        }
      }

      questionStats[question.id] = {
        question,
        stats,
        textResponses: textResponses.length > 0 ? textResponses : undefined,
        averageRating: ratingCount > 0 ? ratingSum / ratingCount : undefined,
      };
    });

    return {
      totalResponses: responses.length,
      questionStats,
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [surveyData, responsesData] = await Promise.all([
        fetchWithAuth(`${API_BASE_URL}/api/surveys/${surveyId}`),
        fetchWithAuth(`${API_BASE_URL}/api/survey-responses/survey/${surveyId}`),
      ]);
      setSurvey(surveyData);
      const calculatedStats = calculateStats(surveyData, responsesData);
      setStats(calculatedStats);
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to fetch data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (surveyId) {
      fetchData();
    }
  }, [surveyId]);

  const renderPieChart = (
    questionId: string,
    statsData: ResponseStats['questionStats'][string]['stats'],
    colors: string[]
  ) => {
    const sortedEntries = Object.entries(statsData).sort((a, b) => b[1].count - a[1].count);
    const total = sortedEntries.reduce((sum, [, data]) => sum + data.count, 0);
    if (total === 0) return null;

    let cumulativePercentage = 0;

    return (
      <div className='flex gap-8 items-center'>
        <div className='relative w-64 h-64 flex-shrink-0'>
          <svg viewBox='0 0 100 100' className='transform -rotate-90'>
            {sortedEntries.map(([answer, data], index) => {
              const percentage = (data.count / total) * 100;
              const offset = cumulativePercentage;
              cumulativePercentage += percentage;

              return (
                <g
                  key={answer}
                  onMouseEnter={() => setHoveredSegment({ questionId, answer })}
                  onMouseLeave={() => setHoveredSegment(null)}
                  className='cursor-pointer transition-opacity'
                  style={{
                    opacity:
                      hoveredSegment &&
                      hoveredSegment.questionId === questionId &&
                      hoveredSegment.answer !== answer
                        ? 0.3
                        : 1,
                  }}
                >
                  <circle
                    cx='50'
                    cy='50'
                    r='25'
                    fill='transparent'
                    stroke={colors[index % colors.length]}
                    strokeWidth='50'
                    strokeDasharray={`${percentage} ${100 - percentage}`}
                    strokeDashoffset={-offset}
                  />
                </g>
              );
            })}
          </svg>

          {hoveredSegment && hoveredSegment.questionId === questionId && (
            <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4 max-w-xs z-10 pointer-events-none'>
              <p className='font-semibold text-gray-900 mb-2'>{hoveredSegment.answer}</p>
              <p className='text-sm text-gray-600 mb-2'>
                {statsData[hoveredSegment.answer].count} response
                {statsData[hoveredSegment.answer].count !== 1 ? 's' : ''}
              </p>
              <div className='max-h-32 overflow-y-auto'>
                <p className='text-xs font-semibold text-gray-700 mb-1'>Organizations:</p>
                <ul className='text-xs text-gray-600 space-y-1'>
                  {statsData[hoveredSegment.answer].organizations.map((org, idx) => (
                    <li key={idx}>• {org}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className='flex-1 space-y-2'>
          <p className='text-sm font-semibold text-gray-700 mb-3'>Total Responses: {total}</p>
          {sortedEntries.map(([answer, data], index) => (
            <div
              key={answer}
              className='flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition cursor-pointer'
              onMouseEnter={() => setHoveredSegment({ questionId, answer })}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div
                className='w-4 h-4 rounded flex-shrink-0'
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className='text-sm text-gray-700 flex-1'>{answer}</span>
              <span className='text-sm font-medium text-gray-900'>
                {data.count} ({((data.count / total) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBarChart = (
    questionId: string,
    statsData: ResponseStats['questionStats'][string]['stats'],
    colors: string[]
  ) => {
    const sortedEntries = Object.entries(statsData).sort((a, b) => Number(a[0]) - Number(b[0]));
    const maxCount = Math.max(...sortedEntries.map(([, data]) => data.count));

    return (
      <div className='space-y-3'>
        {sortedEntries.map(([answer, data], index) => {
          const percentage = maxCount > 0 ? (data.count / maxCount) * 100 : 0;
          const isHovered =
            hoveredSegment?.questionId === questionId && hoveredSegment?.answer === answer;

          return (
            <div
              key={answer}
              className='space-y-1 relative'
              onMouseEnter={() => setHoveredSegment({ questionId, answer })}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div className='flex justify-between text-sm'>
                <span className='font-medium text-gray-700'>Rating {answer}</span>
                <span className='text-gray-600'>
                  {data.count} response{data.count !== 1 ? 's' : ''}
                </span>
              </div>
              <div className='w-full bg-gray-200 rounded-full h-6 overflow-hidden relative'>
                <div
                  className='h-full rounded-full flex items-center justify-end px-2 text-white text-xs font-medium transition-all duration-500 cursor-pointer'
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: colors[index % colors.length],
                  }}
                >
                  {percentage > 15 && `${percentage.toFixed(0)}%`}
                </div>
              </div>

              {isHovered && data.organizations.length > 0 && (
                <div className='absolute left-0 top-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-3 max-w-xs z-10'>
                  <p className='text-xs font-semibold text-gray-700 mb-1'>
                    Organizations ({data.count}):
                  </p>
                  <ul className='text-xs text-gray-600 space-y-1 max-h-32 overflow-y-auto'>
                    {data.organizations.map((org, idx) => (
                      <li key={idx}>• {org}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <AdminSidebar />

      <div className='flex-1 p-8'>
        <div className='mb-6'>
          <button
            onClick={() => navigate(`/admin/surveys/${surveyId}/responses`)}
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
            Back to Responses
          </button>

          <h1 className='text-3xl font-bold text-gray-800'>{survey?.title}</h1>
          <p className='text-gray-600 mt-1'>
            Survey Summary - {stats?.totalResponses || 0} Total Responses
          </p>
        </div>

        {loading ? (
          <div className='text-center py-12'>
            <p className='text-gray-600'>Loading summary...</p>
          </div>
        ) : !stats || stats.totalResponses === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-600'>No responses to summarize</p>
          </div>
        ) : (
          <div className='space-y-8'>
            {survey?.questions.map((question, index) => {
              const questionStat = stats.questionStats[question.id];
              if (!questionStat) return null;

              return (
                <div key={question.id} className='bg-white rounded-lg border border-gray-200 p-6'>
                  <h3 className='text-lg font-semibold text-gray-800 mb-4'>
                    {index + 1}. {question.text}
                  </h3>
                  <p className='text-sm text-gray-600 mb-4'>
                    Type:{' '}
                    {question.type === 'multipleChoice'
                      ? 'Multiple Choice'
                      : question.type === 'checkbox'
                        ? 'Checkbox'
                        : question.type === 'text'
                          ? 'Text Response'
                          : 'Rating Scale'}
                  </p>

                  {(question.type === 'multipleChoice' || question.type === 'checkbox') && (
                    <div className='mt-4'>
                      {renderPieChart(question.id, questionStat.stats, COLORS)}
                    </div>
                  )}

                  {question.type === 'rating' && (
                    <div className='mt-4'>
                      <div className='mb-6 p-4 bg-red-50 rounded-lg border border-red-200'>
                        <p className='text-sm font-semibold text-gray-700'>
                          Average Rating:{' '}
                          <span className='text-3xl text-[#D54242] font-bold'>
                            {questionStat.averageRating?.toFixed(2) || 'N/A'}
                          </span>
                          <span className='text-gray-600 text-xl'> / {question.maxValue || 5}</span>
                        </p>
                      </div>
                      {renderBarChart(question.id, questionStat.stats, COLORS)}
                    </div>
                  )}

                  {question.type === 'text' && questionStat.textResponses && (
                    <div className='mt-4 space-y-2'>
                      <p className='text-sm font-semibold text-gray-700 mb-3'>
                        Responses ({questionStat.textResponses.length}):
                      </p>
                      <div className='max-h-96 overflow-y-auto space-y-2'>
                        {questionStat.textResponses.map((response, idx) => (
                          <div
                            key={idx}
                            className='p-3 bg-gray-50 rounded-lg border border-gray-200'
                          >
                            <p className='text-sm text-gray-900 mb-1'>{response.text}</p>
                            <p className='text-xs text-gray-500'>— {response.orgName}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default SurveySummary;
