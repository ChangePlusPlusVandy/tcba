import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import Toast from '../../../components/Toast';
import ConfirmModal from '../../../components/ConfirmModal';

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

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-7xl mx-auto'>
        <h1 className='text-3xl font-bold text-gray-800 mb-8'>Organization Management</h1>

        <div className='flex gap-4 mb-6 border-b border-gray-200'>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 font-medium transition ${
              filter === 'ALL'
                ? 'text-[#D54242] border-b-2 border-[#D54242]'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            All Organizations ({organizations.length})
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-4 py-2 font-medium transition ${
              filter === 'PENDING'
                ? 'text-[#D54242] border-b-2 border-[#D54242]'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Pending Requests ({pendingOrgs.length})
          </button>
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`px-4 py-2 font-medium transition ${
              filter === 'ACTIVE'
                ? 'text-[#D54242] border-b-2 border-[#D54242]'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Active Members ({activeOrgs.length})
          </button>
          <button
            onClick={() => setFilter('INACTIVE')}
            className={`px-4 py-2 font-medium transition ${
              filter === 'INACTIVE'
                ? 'text-[#D54242] border-b-2 border-[#D54242]'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Archived ({inactiveOrgs.length})
          </button>
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
        ) : filteredOrganizations.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-600'>No organizations found.</p>
          </div>
        ) : (
          <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Organization
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Contact
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Region
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {filteredOrganizations.map(org => (
                  <tr key={org.id} className='hover:bg-gray-50 cursor-pointer' onClick={() => setSelectedOrg(org)}>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm font-medium text-gray-900'>{org.name}</div>
                      <div className='text-sm text-gray-500'>{org.email}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>{org.primaryContactName}</div>
                      <div className='text-sm text-gray-500'>{org.primaryContactPhone}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>{org.region || 'N/A'}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
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
                    <td className='px-6 py-4 whitespace-nowrap text-sm' onClick={(e) => e.stopPropagation()}>
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
                            e.target.value = ''; // Reset dropdown
                          }
                        }}
                        disabled={actioningOrg === org.id}
                        className='bg-[#D54242] text-white px-4 py-2 pr-8 rounded-lg hover:bg-[#b53a3a] transition disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D54242] appearance-none bg-[length:1.5em] bg-[right_0.5rem_center] bg-no-repeat'
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        }}
                      >
                        <option value='' className='bg-white text-gray-900'>
                          {actioningOrg === org.id ? 'Processing...' : 'Actions'}
                        </option>
                        {org.status === 'PENDING' && (
                          <>
                            <option value='approve' className='bg-white text-gray-900'>
                              Approve
                            </option>
                            <option value='decline' className='bg-white text-gray-900'>
                              Decline
                            </option>
                          </>
                        )}
                        {org.status === 'ACTIVE' && (
                          <>
                            <option value='archive' className='bg-white text-gray-900'>
                              Archive
                            </option>
                            <option value='delete' className='bg-white text-gray-900'>
                              Delete
                            </option>
                          </>
                        )}
                        {org.status === 'INACTIVE' && (
                          <>
                            <option value='unarchive' className='bg-white text-gray-900'>
                              Unarchive
                            </option>
                            <option value='delete' className='bg-white text-gray-900'>
                              Delete
                            </option>
                          </>
                        )}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
                      <p className="text-sm text-gray-900">{selectedOrg.primaryContactName}</p>
                      <p className="text-sm text-gray-600">{selectedOrg.primaryContactEmail}</p>
                      <p className="text-sm text-gray-600">{selectedOrg.primaryContactPhone}</p>
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
                      <span className="text-sm font-bold text-gray-600">State:</span>
                      <p className="text-sm text-gray-900">{selectedOrg.state || 'N/A'}</p>
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
                <button onClick={() => setSelectedOrg(null)} className="btn bg-[#D54242] hover:bg-[#b53a3a] text-white border-none">
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
