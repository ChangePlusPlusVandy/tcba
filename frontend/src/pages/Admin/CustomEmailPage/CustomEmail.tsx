import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import AdminSidebar from '../../../components/AdminSidebar';
import Toast from '../../../components/Toast';
import Pagination from '../../../components/Pagination';
import { API_BASE_URL } from '../../../config/api';
import { useAdminOrganizations } from '../../../hooks/queries/useAdminOrganizations';
import { useEmailHistory } from '../../../hooks/queries/useEmailHistory';
import { useEmailMutations } from '../../../hooks/mutations/useEmailMutations';

type Organization = {
  id: string;
  name: string;
  email: string;
  region?: string;
  organizationSize?: string;
  tags: string[];
};

type EmailHistoryItem = {
  id: string;
  subject: string;
  body: string;
  recipientEmails: string[];
  recipientCount: number;
  filters?: Record<string, unknown>;
  scheduledFor?: string;
  sentAt?: string;
  status: 'SCHEDULED' | 'SENT' | 'FAILED';
  createdByAdminId: string;
  createdAt: string;
  updatedAt: string;
};

const CustomEmail = () => {
  const { getToken } = useAuth();
  const quillRef = useRef<ReactQuill>(null);

  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');
  const [emailTitle, setEmailTitle] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedOrgSize, setSelectedOrgSize] = useState<string>('');
  const [manuallyExcludedOrgs, setManuallyExcludedOrgs] = useState<string[]>([]);
  const [orgSearchQuery, setOrgSearchQuery] = useState<string>('');

  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');

  const { data: organizationsData, isLoading: loading } = useAdminOrganizations(1, 1000);
  const { data: emailHistoryData, isLoading: historyLoading } = useEmailHistory(currentPage, itemsPerPage);
  const { sendEmail } = useEmailMutations();

  const organizationsResponse = organizationsData || {};
  const organizations = organizationsResponse.data || organizationsResponse;
  const organizationsArray: Organization[] = Array.isArray(organizations) ? organizations : [];

  const emailHistory = emailHistoryData?.data || [];
  const totalEmails = emailHistoryData?.total || 0;

  const availableTags = Array.from(
    new Set(
      organizationsArray.flatMap((org: Organization) =>
        org.tags && Array.isArray(org.tags) ? org.tags.filter((tag): tag is string => typeof tag === 'string') : []
      )
    )
  ).sort();

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPG, PNG, or GIF)');
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        return;
      }

      try {
        const token = await getToken();
        const fileName = file.name;
        const fileType = file.type;

        const presignedResponse = await fetch(
          `${API_BASE_URL}/api/files/presigned-upload?fileName=${encodeURIComponent(fileName)}&fileType=${encodeURIComponent(fileType)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!presignedResponse.ok) {
          throw new Error('Failed to get upload URL');
        }

        const { uploadUrl, key } = await presignedResponse.json();

        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': fileType,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }

        const bucketName = import.meta.env.VITE_AWS_S3_BUCKET_NAME;
        const region = import.meta.env.VITE_AWS_REGION || 'us-east-2';
        const imageUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection();
          const index = range ? range.index : 0;
          quill.insertEmbed(index, 'image', imageUrl);
          quill.setSelection(index + 1);
        }
      } catch (err: any) {
        console.error('Upload error:', err);
        alert(err.message || 'Failed to upload image');
      }
    };
  };

  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: handleImageUpload,
      },
    },
  };

  const formats = ['header', 'bold', 'italic', 'underline', 'list', 'link', 'image'];

  useEffect(() => {
    setManuallyExcludedOrgs([]);
  }, [selectedTags, selectedRegion, selectedOrgSize]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFilteredOrganizations = () => {
    let filtered = organizationsArray;

    if (selectedTags.length > 0) {
      filtered = filtered.filter(
        org => org.tags && selectedTags.some(tag => org.tags.includes(tag))
      );
    }

    if (selectedRegion) {
      filtered = filtered.filter(org => org.region === selectedRegion);
    }

    if (selectedOrgSize) {
      filtered = filtered.filter(org => org.organizationSize === selectedOrgSize);
    }

    filtered = filtered.filter(org => !manuallyExcludedOrgs.includes(org.id));

    return filtered;
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  };

  const handleOrgToggle = (orgId: string) => {
    setManuallyExcludedOrgs(prev =>
      prev.includes(orgId) ? prev.filter(id => id !== orgId) : [...prev, orgId]
    );
  };

  const getBaseFilteredOrganizations = () => {
    let filtered = organizationsArray;

    if (selectedTags.length > 0) {
      filtered = filtered.filter(
        org => org.tags && selectedTags.some(tag => org.tags.includes(tag))
      );
    }

    if (selectedRegion) {
      filtered = filtered.filter(org => org.region === selectedRegion);
    }

    if (selectedOrgSize) {
      filtered = filtered.filter(org => org.organizationSize === selectedOrgSize);
    }

    return filtered;
  };

  const handleSend = async () => {
    if (!emailTitle.trim() || !emailBody.trim()) {
      setToast({ message: 'Please provide both email title and body', type: 'error' });
      return;
    }

    const recipients = getFilteredOrganizations();
    if (recipients.length === 0) {
      setToast({
        message: 'Please select at least one organization to send the email to',
        type: 'error',
      });
      return;
    }

    if (isScheduled && !scheduledDateTime) {
      setToast({ message: 'Please select a date and time for the scheduled email', type: 'error' });
      return;
    }

    if (isScheduled && new Date(scheduledDateTime) <= new Date()) {
      setToast({ message: 'Scheduled time must be in the future', type: 'error' });
      return;
    }

    try {
      setToast(null);

      const requestData: any = {
        subject: emailTitle,
        html: emailBody,
        recipientEmails: recipients.map(org => org.email),
      };

      if (isScheduled && scheduledDateTime) {
        requestData.scheduledFor = new Date(scheduledDateTime).toISOString();
      }

      await sendEmail.mutateAsync(requestData);

      const successMessage = isScheduled
        ? `Email scheduled for ${new Date(scheduledDateTime).toLocaleString()} to ${recipients.length} organization(s)!`
        : `Email sent successfully to ${recipients.length} organization(s)!`;

      setToast({
        message: successMessage,
        type: 'success',
      });

      setEmailTitle('');
      setEmailBody('');
      setSelectedTags([]);
      setSelectedRegion('');
      setSelectedOrgSize('');
      setManuallyExcludedOrgs([]);
      setOrgSearchQuery('');
      setIsScheduled(false);
      setScheduledDateTime('');
    } catch (err: any) {
      console.error('Error sending email:', err);
      setToast({ message: err.message || 'Failed to send email', type: 'error' });
    }
  };

  const filteredOrganizations = getFilteredOrganizations();

  if (loading) {
    return (
      <div className='flex min-h-screen bg-gray-50'>
        <AdminSidebar />
        <div className='flex-1 flex items-center justify-center'>
          <div className='text-lg'>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <AdminSidebar />
      <div className='flex-1 p-8'>
        <div className='max-w-6xl mx-auto'>
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>Custom Email</h1>
            <p className='text-gray-600'>Send custom emails to selected organizations</p>
          </div>

          {toast && (
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          )}

          {/* Tabs */}
          <div className='flex border-b border-gray-200 mb-6'>
            <button
              onClick={() => setActiveTab('compose')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'compose'
                  ? 'border-[#D54242] text-[#D54242]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Compose Email
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-[#D54242] text-[#D54242]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Past Emails
            </button>
          </div>

          {activeTab === 'compose' && (
            <>
              <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
                <h2 className='text-xl font-semibold text-gray-800 mb-4'>Select Recipients</h2>

                <div className='mb-6'>
                  <label className='text-sm font-semibold text-gray-700 mb-2 block'>
                    Filter by Tags
                  </label>
                  {availableTags.length > 0 ? (
                    <div className='flex flex-wrap gap-2'>
                      {availableTags.map(tag => (
                        <button
                          key={tag}
                          type='button'
                          onClick={() => handleTagToggle(tag)}
                          className={`px-3 py-1 rounded-full text-sm transition cursor-pointer ${
                            selectedTags.includes(tag)
                              ? 'bg-[#D54242] text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className='text-sm text-gray-500'>No tags available</p>
                  )}
                </div>

                <div className='mb-6'>
                  <label className='text-sm font-semibold text-gray-700 mb-2 block'>
                    Filter by Region
                  </label>
                  <select
                    value={selectedRegion}
                    onChange={e => setSelectedRegion(e.target.value)}
                    className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value=''>None</option>
                    <option value='EAST'>East</option>
                    <option value='MIDDLE'>Middle</option>
                    <option value='WEST'>West</option>
                  </select>
                </div>

                <div className='mb-6'>
                  <label className='text-sm font-semibold text-gray-700 mb-2 block'>
                    Filter by Organization Size
                  </label>
                  <select
                    value={selectedOrgSize}
                    onChange={e => setSelectedOrgSize(e.target.value)}
                    className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value=''>None</option>
                    <option value='SMALL'>Small (1-50 employees)</option>
                    <option value='MEDIUM'>Medium (51-200 employees)</option>
                    <option value='LARGE'>Large (201-1000 employees)</option>
                    <option value='EXTRA_LARGE'>Extra Large (1000+ employees)</option>
                  </select>
                </div>

                <div className='mb-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <label className='text-sm font-semibold text-gray-700'>Refine Selection</label>
                    <button
                      type='button'
                      onClick={() => {
                        const allOrgIds = getBaseFilteredOrganizations().map(org => org.id);
                        setManuallyExcludedOrgs(allOrgIds);
                      }}
                      className='text-sm text-[#D54242] hover:text-[#b53a3a] font-medium'
                    >
                      Unselect All
                    </button>
                  </div>

                  <input
                    type='text'
                    value={orgSearchQuery}
                    onChange={e => setOrgSearchQuery(e.target.value)}
                    placeholder='Search organizations...'
                    className='w-full px-4 py-2 mb-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                  <div className='border border-gray-300 rounded-md p-4 max-h-64 overflow-y-auto'>
                    {getBaseFilteredOrganizations()
                      .filter(org => org.name.toLowerCase().includes(orgSearchQuery.toLowerCase()))
                      .map(org => (
                        <label
                          key={org.id}
                          className='flex items-center gap-2 py-2 hover:bg-gray-50 px-2 rounded cursor-pointer'
                        >
                          <input
                            type='checkbox'
                            checked={!manuallyExcludedOrgs.includes(org.id)}
                            onChange={() => handleOrgToggle(org.id)}
                            className='w-4 h-4 text-[#D54242] border-gray-300 rounded focus:ring-[#D54242]'
                          />
                          <span className='text-gray-700'>{org.name}</span>
                          {org.region && (
                            <span className='text-xs text-gray-500'>({org.region})</span>
                          )}
                        </label>
                      ))}
                    {getBaseFilteredOrganizations().filter(org =>
                      org.name.toLowerCase().includes(orgSearchQuery.toLowerCase())
                    ).length === 0 && (
                      <p className='text-sm text-gray-500 text-center py-4'>
                        No organizations found
                      </p>
                    )}
                  </div>
                </div>

                <div className='bg-blue-50 border border-blue-200 rounded-md p-4'>
                  <p className='text-sm font-semibold text-gray-700 mb-2'>
                    Selected Recipients: {filteredOrganizations.length}
                  </p>
                  {filteredOrganizations.length > 0 && (
                    <div className='text-sm text-gray-600'>
                      {filteredOrganizations.slice(0, 5).map(org => (
                        <div key={org.id}>• {org.name}</div>
                      ))}
                      {filteredOrganizations.length > 5 && (
                        <div className='text-gray-500 mt-1'>
                          ... and {filteredOrganizations.length - 5} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
                <h2 className='text-xl font-semibold text-gray-800 mb-4'>Email Content</h2>

                <div className='flex flex-col space-y-2 mb-6'>
                  <label className='text-sm font-semibold text-gray-700'>Email Subject</label>
                  <input
                    type='text'
                    value={emailTitle}
                    onChange={e => setEmailTitle(e.target.value)}
                    placeholder='Enter email subject'
                    className='px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                <div className='flex flex-col space-y-2 mb-6'>
                  <label className='text-sm font-semibold text-gray-700'>Email Body</label>
                  <div className='border border-gray-300 rounded-md overflow-hidden'>
                    <ReactQuill
                      ref={quillRef}
                      theme='snow'
                      value={emailBody}
                      onChange={setEmailBody}
                      modules={modules}
                      formats={formats}
                      placeholder='Enter email content...'
                    />
                  </div>
                </div>

                {/* Schedule Email Section */}
                <div className='border-t border-gray-200 pt-6'>
                  <div className='flex items-center gap-3 mb-4'>
                    <label className='relative inline-flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={isScheduled}
                        onChange={e => {
                          setIsScheduled(e.target.checked);
                          if (!e.target.checked) {
                            setScheduledDateTime('');
                          }
                        }}
                        className='sr-only peer'
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D54242]"></div>
                    </label>
                    <span className='text-sm font-semibold text-gray-700'>Schedule for later</span>
                  </div>

                  {isScheduled && (
                    <div className='flex flex-col space-y-2'>
                      <label className='text-sm font-medium text-gray-600'>Send Date & Time</label>
                      <input
                        type='datetime-local'
                        value={scheduledDateTime}
                        onChange={e => setScheduledDateTime(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className='px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D54242] max-w-xs'
                      />
                      <p className='text-xs text-gray-500'>
                        The email will be sent at the scheduled time. Times are in your local
                        timezone.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className='flex justify-end space-x-4'>
                <button
                  onClick={() => {
                    setEmailTitle('');
                    setEmailBody('');
                    setSelectedTags([]);
                    setSelectedRegion('');
                    setSelectedOrgSize('');
                    setManuallyExcludedOrgs([]);
                    setOrgSearchQuery('');
                    setIsScheduled(false);
                    setScheduledDateTime('');
                    setToast(null);
                  }}
                  disabled={sendEmail.isPending}
                  className='px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                >
                  Clear
                </button>
                <button
                  onClick={handleSend}
                  disabled={
                    sendEmail.isPending ||
                    filteredOrganizations.length === 0 ||
                    (isScheduled && !scheduledDateTime)
                  }
                  className='px-6 py-2 bg-[#D54242] text-white rounded-md hover:bg-[#b53a3a] disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {sendEmail.isPending
                    ? isScheduled
                      ? 'Scheduling...'
                      : 'Sending...'
                    : isScheduled
                      ? `Schedule Email (${filteredOrganizations.length})`
                      : `Send Email (${filteredOrganizations.length})`}
                </button>
              </div>
            </>
          )}

          {/* Past Emails Tab */}
          {activeTab === 'history' && (
            <div className='bg-white rounded-lg shadow-md'>
              {historyLoading ? (
                <div className='p-8 text-center'>
                  <div className='text-lg text-gray-500'>Loading email history...</div>
                </div>
              ) : emailHistory.length === 0 ? (
                <div className='p-8 text-center'>
                  <div className='text-gray-500'>No emails have been sent yet.</div>
                </div>
              ) : (
                <div className='divide-y divide-gray-200'>
                  {emailHistory.map(email => (
                    <div key={email.id} className='p-4'>
                      <div
                        className='cursor-pointer'
                        onClick={() =>
                          setExpandedEmailId(expandedEmailId === email.id ? null : email.id)
                        }
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex-1'>
                            <h3 className='text-lg font-semibold text-gray-800'>{email.subject}</h3>
                            <div className='flex items-center gap-4 mt-1 text-sm text-gray-500'>
                              <span>
                                {email.sentAt
                                  ? formatDate(email.sentAt)
                                  : formatDate(email.createdAt)}
                              </span>
                              <span className='flex items-center gap-1'>
                                <svg
                                  className='w-4 h-4'
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                                  />
                                </svg>
                                {email.recipientCount} recipient
                                {email.recipientCount !== 1 ? 's' : ''}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  email.status === 'SENT'
                                    ? 'bg-green-100 text-green-800'
                                    : email.status === 'FAILED'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {email.status}
                              </span>
                            </div>
                          </div>
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform ${
                              expandedEmailId === email.id ? 'transform rotate-180' : ''
                            }`}
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
                        </div>
                      </div>

                      {expandedEmailId === email.id && (
                        <div className='mt-4 pt-4 border-t border-gray-200'>
                          <div className='mb-4'>
                            <h4 className='text-sm font-semibold text-gray-700 mb-2'>
                              Email Content
                            </h4>
                            <div
                              className='prose prose-sm max-w-none bg-gray-50 p-4 rounded-md'
                              dangerouslySetInnerHTML={{ __html: email.body }}
                            />
                          </div>
                          <div>
                            <h4 className='text-sm font-semibold text-gray-700 mb-2'>
                              Recipients ({email.recipientEmails.length})
                            </h4>
                            <div className='bg-gray-50 p-4 rounded-md max-h-48 overflow-y-auto'>
                              <div className='flex flex-wrap gap-2'>
                                {email.recipientEmails.map((recipientEmail, index) => (
                                  <span
                                    key={index}
                                    className='px-2 py-1 bg-white border border-gray-200 rounded text-sm text-gray-600'
                                  >
                                    {recipientEmail}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!historyLoading && emailHistory.length > 0 && (
                <div className='p-4 border-t border-gray-200'>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(totalEmails / itemsPerPage)}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalEmails}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomEmail;
