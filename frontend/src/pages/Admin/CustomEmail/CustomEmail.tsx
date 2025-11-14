import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import AdminSidebar from '../../../components/AdminSidebar';
import Toast from '../../../components/Toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

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
  filters: {
    tags?: string[];
    region?: string;
    orgSize?: string;
  } | null;
  scheduledFor: string | null;
  sentAt: string | null;
  status: 'SCHEDULED' | 'SENT' | 'FAILED';
  createdAt: string;
};

const CustomEmail = () => {
  const { getToken } = useAuth();
  const quillRef = useRef<ReactQuill>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

  // Email content
  const [emailTitle, setEmailTitle] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Schedule state
  const [scheduleType, setScheduleType] = useState<'now' | 'scheduled'>('now');
  const [scheduledDateTime, setScheduledDateTime] = useState('');

  // Filters
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedOrgSize, setSelectedOrgSize] = useState<string>('');
  const [manuallyExcludedOrgs, setManuallyExcludedOrgs] = useState<string[]>([]);
  const [orgSearchQuery, setOrgSearchQuery] = useState<string>('');

  // Data
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [emailHistory, setEmailHistory] = useState<EmailHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [expandedEmailIds, setExpandedEmailIds] = useState<Set<string>>(new Set());
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [orgSizeDropdownOpen, setOrgSizeDropdownOpen] = useState(false);

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

        // Get presigned URL
        const presignedResponse = await fetch(
          `${API_BASE_URL}/api/uploads/presigned-upload?fileName=${encodeURIComponent(fileName)}&fileType=${encodeURIComponent(fileType)}`,
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

        // Upload to S3
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

        // Construct the image URL
        const bucketName = import.meta.env.VITE_AWS_S3_BUCKET_NAME;
        const region = import.meta.env.VITE_AWS_REGION || 'us-east-2';
        const imageUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

        // Insert image into editor
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
    fetchOrganizations();
    fetchEmailHistory();
  }, []);

  // Refresh email history when switching to history tab
  useEffect(() => {
    if (activeTab === 'history') {
      fetchEmailHistory();
    }
  }, [activeTab]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (!target.closest('.region-dropdown-container')) {
        setRegionDropdownOpen(false);
      }
      if (!target.closest('.org-size-dropdown-container')) {
        setOrgSizeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Clear manual exclusions when filters change
  useEffect(() => {
    setManuallyExcludedOrgs([]);
  }, [selectedTags, selectedRegion, selectedOrgSize]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/organizations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }

      const data = await response.json();
      console.log('Fetched organizations:', data);
      setOrganizations(data);

      // Extract unique tags
      const tags = new Set<string>();
      data.forEach((org: Organization) => {
        console.log('Org:', org.name, 'Tags:', org.tags);
        if (org.tags && Array.isArray(org.tags)) {
          org.tags.forEach(tag => {
            if (tag && typeof tag === 'string') {
              tags.add(tag);
            }
          });
        }
      });
      console.log('Available tags:', Array.from(tags));
      setAvailableTags(Array.from(tags).sort());
    } catch (err: any) {
      console.error('Error fetching organizations:', err);
      setError(err.message || 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailHistory = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/email-notifications/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch email history');
      }

      const data = await response.json();
      setEmailHistory(data);
    } catch (err: any) {
      console.error('Error fetching email history:', err);
      // Don't show error for history fetch failure
    }
  };

  const getFilteredOrganizations = () => {
    // Start with all organizations
    let filtered = organizations;

    // Apply tag filter (if active)
    if (selectedTags.length > 0) {
      filtered = filtered.filter(
        org => org.tags && selectedTags.some(tag => org.tags.includes(tag))
      );
    }

    // Apply region filter (if active)
    if (selectedRegion) {
      filtered = filtered.filter(org => org.region === selectedRegion);
    }

    // Apply organization size filter (if active)
    if (selectedOrgSize) {
      filtered = filtered.filter(org => org.organizationSize === selectedOrgSize);
    }

    // Remove manually excluded organizations
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

  // Get base filtered list (before manual exclusions) for display in checkbox list
  const getBaseFilteredOrganizations = () => {
    let filtered = organizations;

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

    if (scheduleType === 'scheduled' && !scheduledDateTime) {
      setToast({ message: 'Please select a schedule date and time', type: 'error' });
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

    try {
      setSending(true);

      const token = await getToken();

      // Prepare data to match backend API
      const requestData: any = {
        subject: emailTitle,
        html: emailBody,
        recipientEmails: recipients.map(org => org.email),
        filters: {
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          region: selectedRegion || undefined,
          orgSize: selectedOrgSize || undefined,
        },
        scheduledFor: scheduleType === 'scheduled' ? scheduledDateTime : null,
      };

      const response = await fetch(`${API_BASE_URL}/api/email-notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      if (scheduleType === 'scheduled') {
        setToast({
          message: `Email scheduled successfully for ${recipients.length} organization(s)!`,
          type: 'success',
        });
      } else {
        setToast({
          message: `Email sent successfully to ${recipients.length} organization(s)!`,
          type: 'success',
        });
      }

      // Refresh email history
      fetchEmailHistory();

      // Reset form
      setEmailTitle('');
      setEmailBody('');
      setSelectedTags([]);
      setSelectedRegion('');
      setSelectedOrgSize('');
      setManuallyExcludedOrgs([]);
      setOrgSearchQuery('');
      setScheduleType('now');
      setScheduledDateTime('');
    } catch (err: any) {
      console.error('Error sending email:', err);
      setToast({ message: err.message || 'Failed to send email', type: 'error' });
    } finally {
      setSending(false);
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

  const toggleEmailExpanded = (emailId: string) => {
    setExpandedEmailIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <AdminSidebar />
      <div className='flex-1 p-8'>
        <div className='max-w-6xl mx-auto'>
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>Custom Email</h1>
            <p className='text-gray-600'>Send custom emails to selected organizations</p>
          </div>

          {/* Tabs */}
          <div className='mb-6 border-b border-gray-200'>
            <nav className='-mb-px flex space-x-8'>
              <button
                onClick={() => setActiveTab('new')}
                className={`${
                  activeTab === 'new'
                    ? 'border-[#D54242] text-[#D54242]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                New Email
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`${
                  activeTab === 'history'
                    ? 'border-[#D54242] text-[#D54242]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Past Emails
              </button>
            </nav>
          </div>

          {activeTab === 'new' && (
            <>
              {/* Filters Section */}
              <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
                <h2 className='text-xl font-semibold text-gray-800 mb-4'>Select Recipients</h2>

                {/* Tags Filter */}
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

                {/* Region Filter */}
                <div className='mb-6'>
                  <label className='text-sm font-semibold text-gray-700 mb-2 block'>
                    Filter by Region
                  </label>
                  <div className='relative region-dropdown-container'>
                    <button
                      type='button'
                      onClick={() => setRegionDropdownOpen(!regionDropdownOpen)}
                      className='w-full px-4 py-2 border border-gray-300 rounded-[10px] bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#194B90] hover:bg-gray-50 flex items-center justify-between'
                    >
                      <span>
                        {selectedRegion === ''
                          ? 'None'
                          : selectedRegion === 'EAST'
                            ? 'East'
                            : selectedRegion === 'MIDDLE'
                              ? 'Middle'
                              : 'West'}
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform ${regionDropdownOpen ? 'rotate-180' : ''}`}
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
                    </button>

                    {regionDropdownOpen && (
                      <div className='absolute top-full left-0 mt-2 w-full bg-white border border-gray-300 rounded-[10px] shadow-lg z-50'>
                        <div className='py-2'>
                          {[
                            { value: '', label: 'None' },
                            { value: 'EAST', label: 'East' },
                            { value: 'MIDDLE', label: 'Middle' },
                            { value: 'WEST', label: 'West' },
                          ].map(region => (
                            <button
                              key={region.value}
                              type='button'
                              onClick={() => {
                                setSelectedRegion(region.value);
                                setRegionDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                                selectedRegion === region.value
                                  ? 'bg-blue-50 text-[#194B90] font-medium'
                                  : 'text-gray-700'
                              }`}
                            >
                              {region.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Organization Size Filter */}
                <div className='mb-6'>
                  <label className='text-sm font-semibold text-gray-700 mb-2 block'>
                    Filter by Organization Size
                  </label>
                  <div className='relative org-size-dropdown-container'>
                    <button
                      type='button'
                      onClick={() => setOrgSizeDropdownOpen(!orgSizeDropdownOpen)}
                      className='w-full px-4 py-2 border border-gray-300 rounded-[10px] bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#194B90] hover:bg-gray-50 flex items-center justify-between'
                    >
                      <span>
                        {selectedOrgSize === ''
                          ? 'None'
                          : selectedOrgSize === 'SMALL'
                            ? 'Small (1-50 employees)'
                            : selectedOrgSize === 'MEDIUM'
                              ? 'Medium (51-200 employees)'
                              : selectedOrgSize === 'LARGE'
                                ? 'Large (201-1000 employees)'
                                : 'Extra Large (1000+ employees)'}
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform ${orgSizeDropdownOpen ? 'rotate-180' : ''}`}
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
                    </button>

                    {orgSizeDropdownOpen && (
                      <div className='absolute top-full left-0 mt-2 w-full bg-white border border-gray-300 rounded-[10px] shadow-lg z-50'>
                        <div className='py-2'>
                          {[
                            { value: '', label: 'None' },
                            { value: 'SMALL', label: 'Small (1-50 employees)' },
                            { value: 'MEDIUM', label: 'Medium (51-200 employees)' },
                            { value: 'LARGE', label: 'Large (201-1000 employees)' },
                            { value: 'EXTRA_LARGE', label: 'Extra Large (1000+ employees)' },
                          ].map(size => (
                            <button
                              key={size.value}
                              type='button'
                              onClick={() => {
                                setSelectedOrgSize(size.value);
                                setOrgSizeDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                                selectedOrgSize === size.value
                                  ? 'bg-blue-50 text-[#194B90] font-medium'
                                  : 'text-gray-700'
                              }`}
                            >
                              {size.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Manual Organization Selection */}
                <div className='mb-4'>
                  <label className='text-sm font-semibold text-gray-700 mb-2 block'>
                    Refine Selection (Uncheck to exclude specific organizations)
                  </label>
                  {/* Search Input */}
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

                {/* Selected Organizations Preview */}
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

              {/* Email Content Section */}
              <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
                <h2 className='text-xl font-semibold text-gray-800 mb-4'>Email Content</h2>

                {/* Email Title */}
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

                {/* Email Body */}
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

                {/* Schedule Section */}
                <div className='flex flex-col space-y-2 mb-6'>
                  <label className='text-sm font-semibold text-gray-700'>Schedule</label>
                  <div className='flex flex-col space-y-3'>
                    <label className='flex items-center gap-2 cursor-pointer'>
                      <input
                        type='radio'
                        name='schedule'
                        checked={scheduleType === 'now'}
                        onChange={() => setScheduleType('now')}
                        className='w-4 h-4 text-[#D54242] border-gray-300 focus:ring-[#D54242]'
                      />
                      <span className='text-gray-700'>Send now</span>
                    </label>
                    <label className='flex items-center gap-2 cursor-pointer'>
                      <input
                        type='radio'
                        name='schedule'
                        checked={scheduleType === 'scheduled'}
                        onChange={() => setScheduleType('scheduled')}
                        className='w-4 h-4 text-[#D54242] border-gray-300 focus:ring-[#D54242]'
                      />
                      <span className='text-gray-700'>Schedule for later</span>
                    </label>
                    {scheduleType === 'scheduled' && (
                      <input
                        type='datetime-local'
                        value={scheduledDateTime}
                        onChange={e => setScheduledDateTime(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className='px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ml-6'
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
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
                    setScheduleType('now');
                    setScheduledDateTime('');
                  }}
                  disabled={sending}
                  className='px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                >
                  Clear
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending || filteredOrganizations.length === 0}
                  className='px-6 py-2 bg-[#D54242] text-white rounded-md hover:bg-[#b53a3a] disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {sending
                    ? 'Sending...'
                    : scheduleType === 'scheduled'
                      ? `Schedule Email (${filteredOrganizations.length})`
                      : `Send Email (${filteredOrganizations.length})`}
                </button>
              </div>
            </>
          )}

          {/* Past Emails Tab */}
          {activeTab === 'history' && (
            <div className='bg-white rounded-lg shadow-md p-6'>
              <h2 className='text-xl font-semibold text-gray-800 mb-4'>Email History</h2>
              {emailHistory.length === 0 ? (
                <p className='text-gray-500 text-center py-8'>No emails sent yet</p>
              ) : (
                <div className='space-y-4'>
                  {emailHistory.map(email => {
                    const isExpanded = expandedEmailIds.has(email.id);
                    const displayedRecipients = isExpanded
                      ? email.recipientEmails
                      : email.recipientEmails.slice(0, 3);

                    return (
                      <div key={email.id} className='border border-gray-200 rounded-md p-4'>
                        {/* Email Header */}
                        <div className='flex justify-between items-start mb-3'>
                          <div className='flex-1'>
                            <h3 className='font-semibold text-gray-900 text-lg'>{email.subject}</h3>
                            <div className='flex items-center gap-4 mt-1 text-sm text-gray-600'>
                              <span>
                                {email.status === 'SENT' && `Sent: ${formatDateTime(email.sentAt)}`}
                                {email.status === 'SCHEDULED' &&
                                  `Scheduled: ${formatDateTime(email.scheduledFor)}`}
                                {email.status === 'FAILED' && 'Failed to send'}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  email.status === 'SENT'
                                    ? 'bg-green-100 text-green-800'
                                    : email.status === 'SCHEDULED'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {email.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Recipients */}
                        <div className='mb-3'>
                          <p className='text-sm font-semibold text-gray-700 mb-1'>
                            Recipients ({email.recipientCount}):
                          </p>
                          <div className='text-sm text-gray-600'>
                            {displayedRecipients.map((recipient, idx) => (
                              <div key={idx} className='py-0.5'>
                                • {recipient}
                              </div>
                            ))}
                            {email.recipientEmails.length > 3 && !isExpanded && (
                              <button
                                onClick={() => toggleEmailExpanded(email.id)}
                                className='text-[#D54242] hover:underline mt-1'
                              >
                                + {email.recipientEmails.length - 3} more
                              </button>
                            )}
                            {isExpanded && email.recipientEmails.length > 3 && (
                              <button
                                onClick={() => toggleEmailExpanded(email.id)}
                                className='text-[#D54242] hover:underline mt-1'
                              >
                                Show less
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Filters Applied */}
                        {email.filters && (
                          <div className='mb-3'>
                            <p className='text-sm font-semibold text-gray-700 mb-1'>
                              Filters Applied:
                            </p>
                            <div className='text-sm text-gray-600 space-y-1'>
                              {email.filters.tags && email.filters.tags.length > 0 && (
                                <div>
                                  <span className='font-medium'>Tags:</span>{' '}
                                  {email.filters.tags.join(', ')}
                                </div>
                              )}
                              {email.filters.region && (
                                <div>
                                  <span className='font-medium'>Region:</span>{' '}
                                  {email.filters.region}
                                </div>
                              )}
                              {email.filters.orgSize && (
                                <div>
                                  <span className='font-medium'>Organization Size:</span>{' '}
                                  {email.filters.orgSize}
                                </div>
                              )}
                              {!email.filters.tags &&
                                !email.filters.region &&
                                !email.filters.orgSize && (
                                  <div className='text-gray-500'>No filters applied</div>
                                )}
                            </div>
                          </div>
                        )}

                        {/* Email Body */}
                        <div className='mb-3'>
                          <p className='text-sm font-semibold text-gray-700 mb-1'>Content:</p>
                          <div
                            className='text-sm text-gray-600 border border-gray-200 rounded p-3 bg-gray-50 max-h-60 overflow-y-auto'
                            dangerouslySetInnerHTML={{ __html: email.body }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default CustomEmail;
