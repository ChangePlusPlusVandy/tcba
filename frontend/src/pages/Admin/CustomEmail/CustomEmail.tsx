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

const CustomEmail = () => {
  const { getToken } = useAuth();
  const quillRef = useRef<ReactQuill>(null);

  
  const [emailTitle, setEmailTitle] = useState('');
  const [emailBody, setEmailBody] = useState('');

  
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedOrgSize, setSelectedOrgSize] = useState<string>('');
  const [manuallyExcludedOrgs, setManuallyExcludedOrgs] = useState<string[]>([]);
  const [orgSearchQuery, setOrgSearchQuery] = useState<string>('');

  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
    fetchOrganizations();
  }, []);

  
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
      setToast({ message: err.message || 'Failed to load organizations', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredOrganizations = () => {
    
    let filtered = organizations;

    
    if (selectedTags.length > 0) {
      filtered = filtered.filter(org =>
        org.tags && selectedTags.some(tag => org.tags.includes(tag))
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
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleOrgToggle = (orgId: string) => {
    setManuallyExcludedOrgs(prev =>
      prev.includes(orgId) ? prev.filter(id => id !== orgId) : [...prev, orgId]
    );
  };

  
  const getBaseFilteredOrganizations = () => {
    let filtered = organizations;

    if (selectedTags.length > 0) {
      filtered = filtered.filter(org =>
        org.tags && selectedTags.some(tag => org.tags.includes(tag))
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
      setToast({ message: 'Please select at least one organization to send the email to', type: 'error' });
      return;
    }

    try {
      setSending(true);
      setToast(null);

      const token = await getToken();


      const requestData: any = {
        subject: emailTitle,
        html: emailBody,
      };


      requestData.recipientEmails = recipients.map(org => org.email);

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

      setToast({ message: `Email sent successfully to ${recipients.length} organization(s)!`, type: 'success' });

      setEmailTitle('');
      setEmailBody('');
      setSelectedTags([]);
      setSelectedRegion('');
      setSelectedOrgSize('');
      setManuallyExcludedOrgs([]);
      setOrgSearchQuery('');
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
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}

          
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
              <label className='text-sm font-semibold text-gray-700 mb-2 block'>
                Refine Selection
              </label>
              
              <input
                type='text'
                value={orgSearchQuery}
                onChange={e => setOrgSearchQuery(e.target.value)}
                placeholder='Search organizations...'
                className='w-full px-4 py-2 mb-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
              <div className='border border-gray-300 rounded-md p-4 max-h-64 overflow-y-auto'>
                {getBaseFilteredOrganizations()
                  .filter(org =>
                    org.name.toLowerCase().includes(orgSearchQuery.toLowerCase())
                  )
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
                setToast(null);
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
              {sending ? 'Sending...' : `Send Email (${filteredOrganizations.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomEmail;
