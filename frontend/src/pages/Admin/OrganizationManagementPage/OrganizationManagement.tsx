import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import Toast from '../../../components/Toast';
import ConfirmModal from '../../../components/ConfirmModal';
import AdminSidebar from '../../../components/AdminSidebar';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

type Organization = {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  description?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  secondaryContactName?: string;
  secondaryContactEmail?: string;
  region?: string;
  organizationType?: string;
  membershipActive: boolean;
  membershipDate?: string;
  membershipRenewalDate?: string;
  organizationSize?: string;
  role: string;
  status: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

const OrganizationManagement = () => {
  const { getToken } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actioningOrg, setActioningOrg] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(
    null
  );
  const [confirmModal, setConfirmModal] = useState<{
    action: 'approve' | 'decline' | 'archive' | 'unarchive' | 'delete';
    orgId: string;
    orgName: string;
  } | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const isTokenExpiringSoon = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const now = Date.now();
      const timeUntilExpiry = expirationTime - now;
      return timeUntilExpiry < 5 * 60 * 1000;
    } catch (e) {
      return true;
    }
  };

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    let token = await getToken({
      skipCache: true,
      template: 'jwt-template-tcba',
    });

    if (!token) {
      throw new Error('No authentication token available');
    }

    if (isTokenExpiringSoon(token)) {
      console.log('Token expiring soon, proactively refreshing...');
      token = await getToken({ skipCache: true });

      if (!token) {
        throw new Error('No authentication token available');
      }
    }

    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      console.log('Token expired, refreshing and retrying...');

      token = await getToken({ skipCache: true });

      if (!token) {
        throw new Error('No authentication token available');
      }

      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        throw new Error('Authentication failed. Please try logging in again.');
      }
    }

    return response;
  };

  const fetchOrganizations = async () => {
    try {
      setError('');
      const response = await fetchWithAuth(`${API_BASE_URL}/api/organizations`);

      if (!response.ok) throw new Error('Failed to fetch organizations');

      const data = await response.json();
      setOrganizations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleActionClick = (
    action: 'approve' | 'decline' | 'archive' | 'unarchive' | 'delete',
    orgId: string,
    orgName: string
  ) => {
    setConfirmModal({ action, orgId, orgName });
  };

  const executeAction = async () => {
    if (!confirmModal) return;

    const { action, orgId } = confirmModal;
    setConfirmModal(null);
    setActioningOrg(orgId);
    setError('');

    try {
      let response;
      if (action === 'delete') {
        response = await fetchWithAuth(`${API_BASE_URL}/api/organizations/${orgId}`, {
          method: 'DELETE',
        });
      } else {
        response = await fetchWithAuth(`${API_BASE_URL}/api/organizations/${orgId}/${action}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} organization`);
      }

      const successMessages = {
        approve: 'Organization approved successfully! Welcome email sent.',
        decline: 'Organization request declined.',
        archive: 'Organization archived successfully.',
        unarchive: 'Organization unarchived successfully.',
        delete: 'Organization deleted successfully.',
      };

      setToast({ message: successMessages[action], type: 'success' });
      setError('');
      fetchOrganizations();
    } catch (err: any) {
      const errorMessage = err.message || `Failed to ${action} organization`;
      setToast({ message: errorMessage, type: 'error' });
      setError(errorMessage);
    } finally {
      setActioningOrg(null);
    }
  };

  const pendingOrgs = organizations.filter(org => org.status === 'PENDING');
  const activeOrgs = organizations.filter(org => org.status === 'ACTIVE');
  const inactiveOrgs = organizations.filter(org => org.status === 'INACTIVE');

  const filteredOrganizations =
    filter === 'PENDING'
      ? pendingOrgs
      : filter === 'ACTIVE'
        ? activeOrgs
        : filter === 'INACTIVE'
          ? inactiveOrgs
          : organizations;

  const searchedOrganizations = filteredOrganizations.filter(org => {
    const query = searchQuery.toLowerCase();
    return (
      org.name.toLowerCase().includes(query) ||
      org.email.toLowerCase().includes(query) ||
      org.primaryContactName?.toLowerCase().includes(query) ||
      org.primaryContactEmail?.toLowerCase().includes(query) ||
      org.primaryContactPhone?.toLowerCase().includes(query)
    );
  });

  const currentFilterCount =
    filter === 'ALL'
      ? organizations.length
      : filter === 'PENDING'
        ? pendingOrgs.length
        : filter === 'ACTIVE'
          ? activeOrgs.length
          : inactiveOrgs.length;

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <AdminSidebar />

      <div className='flex-1'>
        <div className='p-8'>
          <h1 className='text-3xl font-bold text-gray-800 mb-6'>
            {filter === 'ALL' && `All Organizations (${currentFilterCount})`}
            {filter === 'PENDING' && `Pending (${currentFilterCount})`}
            {filter === 'ACTIVE' && `Active (${currentFilterCount})`}
            {filter === 'INACTIVE' && `Inactive (${currentFilterCount})`}
          </h1>

          <div className='flex items-center gap-4 mb-6'>
            <div className='flex gap-2'>
              <button
                onClick={() => setFilter('ALL')}
                className={`px-6 py-2.5 rounded-[10px] font-medium transition ${
                  filter === 'ALL'
                    ? 'bg-[#EBF3FF] text-[#194B90] border border-[#194B90]'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('PENDING')}
                className={`px-6 py-2.5 rounded-[10px] font-medium transition ${
                  filter === 'PENDING'
                    ? 'bg-[#EBF3FF] text-[#194B90] border border-[#194B90]'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('ACTIVE')}
                className={`px-6 py-2.5 rounded-[10px] font-medium transition ${
                  filter === 'ACTIVE'
                    ? 'bg-[#EBF3FF] text-[#194B90] border border-[#194B90]'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('INACTIVE')}
                className={`px-6 py-2.5 rounded-[10px] font-medium transition ${
                  filter === 'INACTIVE'
                    ? 'bg-[#EBF3FF] text-[#194B90] border border-[#194B90]'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Inactive
              </button>
            </div>

            <div className='flex-1 max-w-xl ml-auto'>
              <div className='relative'>
                <input
                  type='text'
                  placeholder='Search organization, contact, or email'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#194B90] focus:border-transparent'
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
              <p className='text-gray-600'>Loading organizations...</p>
            </div>
          ) : searchedOrganizations.length === 0 ? (
            <div className='text-center py-12'>
              <p className='text-gray-600'>No organizations found.</p>
            </div>
          ) : (
            <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
              <table className='min-w-full'>
                <thead className='bg-gray-50 border-b border-gray-200'>
                  <tr>
                    <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                      <div className='flex items-center gap-1'>
                        Name
                        <svg className='w-4 h-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                        </svg>
                      </div>
                    </th>
                    <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                      <div className='flex items-center gap-1'>
                        Region
                        <svg className='w-4 h-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                        </svg>
                      </div>
                    </th>
                    <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                      <div className='flex items-center gap-1'>
                        Contact
                        <svg className='w-4 h-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                        </svg>
                      </div>
                    </th>
                    <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                      <div className='flex items-center gap-1'>
                        Status
                        <svg className='w-4 h-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                        </svg>
                      </div>
                    </th>
                    <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                      <div className='flex items-center gap-1'>
                        Action
                        <svg className='w-4 h-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                        </svg>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200'>
                  {searchedOrganizations.map(org => (
                    <tr key={org.id} className='hover:bg-gray-50 cursor-pointer' onClick={() => setSelectedOrg(org)}>
                      <td className='px-6 py-4'>
                        <div className='text-sm font-medium text-[#194B90] hover:underline'>{org.name}</div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='text-sm text-gray-900'>{org.region || 'N/A'}</div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='text-sm text-gray-900'>
                          {org.primaryContactPhone ? (
                            <>
                              <div>Phone</div>
                              <div className='text-gray-600'>{org.primaryContactPhone}</div>
                            </>
                          ) : org.primaryContactEmail ? (
                            <>
                              <div>Email</div>
                              <div className='text-[#194B90]'>{org.primaryContactEmail}</div>
                            </>
                          ) : org.email ? (
                            <>
                              <div>Email</div>
                              <div className='text-[#194B90]'>{org.email}</div>
                            </>
                          ) : (
                            'N/A'
                          )}
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            org.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : org.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {org.status}
                        </span>
                      </td>
                      <td className='px-6 py-4 text-sm' onClick={(e) => e.stopPropagation()}>
                        <div className='relative inline-block'>
                          <select
                            value=''
                            onChange={e => {
                              const action = e.target.value as
                                | 'approve'
                                | 'decline'
                                | 'archive'
                                | 'unarchive'
                                | 'delete';
                              if (action) {
                                handleActionClick(action, org.id, org.name);
                                e.target.value = '';
                              }
                            }}
                            disabled={actioningOrg === org.id}
                            className='appearance-none bg-white border border-gray-300 text-gray-700 px-4 py-2 pr-8 rounded-[10px] hover:bg-gray-50 transition disabled:bg-gray-100 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                          >
                            <option value=''>
                              {actioningOrg === org.id ? 'Processing...' : 'Actions'}
                            </option>
                            {org.status === 'PENDING' && (
                              <>
                                <option value='approve'>Approve</option>
                                <option value='decline'>Decline</option>
                              </>
                            )}
                            {org.status === 'ACTIVE' && (
                              <>
                                <option value='archive'>Archive</option>
                                <option value='delete'>Delete</option>
                              </>
                            )}
                            {org.status === 'INACTIVE' && (
                              <>
                                <option value='unarchive'>Unarchive</option>
                                <option value='delete'>Delete</option>
                              </>
                            )}
                          </select>
                          <svg
                            className='absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                          </svg>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {confirmModal && (
        <ConfirmModal
          title={`${confirmModal.action.charAt(0).toUpperCase() + confirmModal.action.slice(1)} Organization`}
          message={
            confirmModal.action === 'approve'
              ? `Are you sure you want to approve ${confirmModal.orgName}? This will create their account and send them login credentials via email.`
              : confirmModal.action === 'decline'
                ? `Are you sure you want to decline ${confirmModal.orgName}'s request? This will permanently remove them from the system.`
                : confirmModal.action === 'archive'
                  ? `Are you sure you want to archive ${confirmModal.orgName}? They will no longer have access but can be unarchived later.`
                  : confirmModal.action === 'unarchive'
                    ? `Are you sure you want to unarchive ${confirmModal.orgName}? This will restore their access.`
                    : `Are you sure you want to permanently delete ${confirmModal.orgName}? This action cannot be undone and will also delete their Clerk account.`
          }
          confirmText={confirmModal.action.charAt(0).toUpperCase() + confirmModal.action.slice(1)}
          onConfirm={executeAction}
          onCancel={() => setConfirmModal(null)}
          type={
            confirmModal.action === 'delete' || confirmModal.action === 'decline'
              ? 'danger'
              : confirmModal.action === 'archive'
                ? 'warning'
                : 'info'
          }
        />
      )}

      {selectedOrg && (
        <>
          <input type="checkbox" checked={true} readOnly className="modal-toggle" />
          <div className="modal modal-open">
            <div className="modal-box max-w-2xl max-h-[80vh] bg-white overflow-y-auto m-8">
              <h3 className="font-bold text-xl text-gray-900 mb-3">{selectedOrg.name}</h3>

              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-base text-gray-800 mb-1.5">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-sm font-bold text-gray-600">Email:</span>
                      <p className="text-sm text-gray-900">{selectedOrg.email}</p>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-600">Status:</span>
                      <p className="text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          selectedOrg.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : selectedOrg.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedOrg.status}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-600">Role:</span>
                      <p className="text-sm text-gray-900">{selectedOrg.role}</p>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-600">Membership Active:</span>
                      <p className="text-sm text-gray-900">{selectedOrg.membershipActive ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm font-bold text-gray-600">Website:</span>
                      {selectedOrg.website ? (
                        <p className="text-sm text-blue-600 hover:underline">
                          <a href={selectedOrg.website} target="_blank" rel="noopener noreferrer">{selectedOrg.website}</a>
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">N/A</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm font-bold text-gray-600">Description:</span>
                      <p className="text-sm text-gray-900">{selectedOrg.description || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-base text-gray-800 mb-1.5">Contact Information</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-sm font-bold text-gray-600">Primary Contact:</span>
                      <p className="text-sm text-gray-900">{selectedOrg.primaryContactName || 'N/A'}</p>
                      <p className="text-sm text-gray-600">{selectedOrg.primaryContactEmail || 'N/A'}</p>
                      <p className="text-sm text-gray-600">{selectedOrg.primaryContactPhone || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-600">Secondary Contact:</span>
                      <p className="text-sm text-gray-900">{selectedOrg.secondaryContactName || 'N/A'}</p>
                      <p className="text-sm text-gray-600">{selectedOrg.secondaryContactEmail || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-base text-gray-800 mb-1.5">Location</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <span className="text-sm font-bold text-gray-600">Address:</span>
                      <p className="text-sm text-gray-900">{selectedOrg.address || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-600">City:</span>
                      <p className="text-sm text-gray-900">{selectedOrg.city || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-600">Zip Code:</span>
                      <p className="text-sm text-gray-900">{selectedOrg.zipCode || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-600">Region:</span>
                      <p className="text-sm text-gray-900">{selectedOrg.region || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-base text-gray-800 mb-1.5">Organization Details</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-sm font-bold text-gray-600">Type:</span>
                      <p className="text-sm text-gray-900">{selectedOrg.organizationType || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-600">Size:</span>
                      <p className="text-sm text-gray-900">{selectedOrg.organizationSize || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-base text-gray-800 mb-1.5">Tags</h4>
                  {selectedOrg.tags && selectedOrg.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedOrg.tags.map((tag, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900">N/A</p>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-base text-gray-800 mb-1.5">Dates</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-sm font-bold text-gray-600">Created:</span>
                      <p className="text-sm text-gray-900">{new Date(selectedOrg.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-600">Updated:</span>
                      <p className="text-sm text-gray-900">{new Date(selectedOrg.updatedAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-600">Membership Date:</span>
                      <p className="text-sm text-gray-900">
                        {selectedOrg.membershipDate ? new Date(selectedOrg.membershipDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-600">Renewal Date:</span>
                      <p className="text-sm text-gray-900">
                        {selectedOrg.membershipRenewalDate ? new Date(selectedOrg.membershipRenewalDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-action">
                <button onClick={() => setSelectedOrg(null)} className="btn bg-[#194B90] hover:bg-[#133a72] text-white border-none">
                  Close
                </button>
              </div>
            </div>
            <div className="modal-backdrop bg-black/30" onClick={() => setSelectedOrg(null)}></div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrganizationManagement;
