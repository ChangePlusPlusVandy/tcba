import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

type Organization = {
  id: string;
  name: string;
  email: string;
  primaryContactName: string;
  primaryContactPhone: string;
  region?: string;
  status: string;
  createdAt: string;
};

const OrganizationManagement = () => {
  const { getToken } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE'>('ALL');
  const [approving, setApproving] = useState<string | null>(null);
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
      template: 'jwt-template-tcba'
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

  const handleApprove = async (orgId: string, orgName: string) => {
    if (!confirm(`Are you sure you want to approve ${orgName}? This will create their account and send them login credentials via email.`)) {
      return;
    }

    setApproving(orgId);
    setError('');

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/organizations/${orgId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve organization');
      }

      alert('Organization approved successfully! Welcome email sent.');
      setError('');
      fetchOrganizations();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to approve organization';
      alert(errorMessage);
      setError(errorMessage);
    } finally {
      setApproving(null);
    }
  };

  const pendingOrgs = organizations.filter(org => org.status === 'PENDING');
  const activeOrgs = organizations.filter(org => org.status === 'ACTIVE');

  const filteredOrganizations =
    filter === 'PENDING' ? pendingOrgs :
    filter === 'ACTIVE' ? activeOrgs :
    organizations;

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
                  <tr key={org.id} className='hover:bg-gray-50'>
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
                    <td className='px-6 py-4 whitespace-nowrap text-sm'>
                      {org.status === 'PENDING' && (
                        <button
                          onClick={() => handleApprove(org.id, org.name)}
                          disabled={approving === org.id}
                          className='bg-[#D54242] text-white px-4 py-2 rounded-lg hover:bg-[#b53a3a] transition disabled:bg-gray-400 disabled:cursor-not-allowed'
                        >
                          {approving === org.id ? 'Approving...' : 'Approve'}
                        </button>
                      )}
                      {org.status === 'ACTIVE' && (
                        <span className='text-gray-500'>No actions</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationManagement;
