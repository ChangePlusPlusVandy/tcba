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

type SortField =
  | 'name'
  | 'region'
  | 'primaryContactName'
  | 'website'
  | 'organizationType'
  | 'status'
  | 'createdAt';
type SortDirection = 'asc' | 'desc';

const OrganizationManagement = () => {
  const { getToken } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actioningOrg, setActioningOrg] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    action: 'approve' | 'decline' | 'archive' | 'unarchive' | 'delete';
    orgId: string;
    orgName: string;
  } | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [rejectionModal, setRejectionModal] = useState<{
    orgId: string;
    orgName: string;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [deletionModal, setDeletionModal] = useState<{
    orgId: string;
    orgName: string;
  } | null>(null);
  const [deletionReason, setDeletionReason] = useState('');
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [actionDropdownOpen, setActionDropdownOpen] = useState<string | null>(null);
  const [editTagDropdownOpen, setEditTagDropdownOpen] = useState(false);
  const [editRegionDropdownOpen, setEditRegionDropdownOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

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
      const response = await fetchWithAuth(`${API_BASE_URL}/api/organizations`);

      if (!response.ok) throw new Error('Failed to fetch organizations');

      const data = await response.json();
      setOrganizations(data);
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to load organizations', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tags`);
      if (!response.ok) throw new Error('Failed to fetch tags');
      const data = await response.json();
      console.log('Fetched tags from API:', data);
      const tagNames = data.map((tag: { name: string }) => tag.name);
      console.log('Tag names:', tagNames);
      setAvailableTags(tagNames);
    } catch (err: any) {
      console.error('Error fetching tags:', err);
      const orgTags = Array.from(new Set(organizations.flatMap(org => org.tags || [])));
      console.log('Using fallback tags from organizations:', orgTags);
      setAvailableTags(orgTags);
    }
  };

  useEffect(() => {
    fetchOrganizations();
    fetchTags();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (!target.closest('.tag-dropdown-container')) {
        setTagDropdownOpen(false);
      }
      if (!target.closest('.region-dropdown-container')) {
        setRegionDropdownOpen(false);
      }
      if (!target.closest('.type-dropdown-container')) {
        setTypeDropdownOpen(false);
      }
      if (!target.closest('.action-dropdown-container')) {
        setActionDropdownOpen(null);
      }
      if (!target.closest('.edit-tag-dropdown-container')) {
        setEditTagDropdownOpen(false);
      }
      if (!target.closest('.edit-region-dropdown-container')) {
        setEditRegionDropdownOpen(false);
      }
    };

    if (
      tagDropdownOpen ||
      regionDropdownOpen ||
      typeDropdownOpen ||
      actionDropdownOpen ||
      editTagDropdownOpen ||
      editRegionDropdownOpen
    ) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [
    tagDropdownOpen,
    regionDropdownOpen,
    typeDropdownOpen,
    actionDropdownOpen,
    editTagDropdownOpen,
    editRegionDropdownOpen,
  ]);

  const handleActionClick = (
    action: 'approve' | 'decline' | 'archive' | 'unarchive' | 'delete',
    orgId: string,
    orgName: string
  ) => {
    if (action === 'decline') {
      setRejectionModal({ orgId, orgName });
      return;
    }

    if (action === 'delete') {
      setDeletionModal({ orgId, orgName });
      return;
    }
    setConfirmModal({ action, orgId, orgName });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const executeAction = async () => {
    if (!confirmModal) return;

    const { action, orgId } = confirmModal;
    setConfirmModal(null);
    setActioningOrg(orgId);

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
      fetchOrganizations();
    } catch (err: any) {
      const errorMessage = err.message || `Failed to ${action} organization`;
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setActioningOrg(null);
    }
  };

  const handleRejectWithReason = async () => {
    if (!rejectionModal) return;

    const { orgId } = rejectionModal;
    setRejectionModal(null);
    setActioningOrg(orgId);

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/organizations/${orgId}/decline`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to decline organization');
      }

      setToast({
        message: 'Organization request declined and notification sent.',
        type: 'success',
      });
      setRejectionReason('');
      fetchOrganizations();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to decline organization';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setActioningOrg(null);
    }
  };

  const handleDeleteWithReason = async () => {
    if (!deletionModal) return;

    const { orgId } = deletionModal;
    setDeletionModal(null);
    setActioningOrg(orgId);

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/organizations/${orgId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: deletionReason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete organization');
      }

      setToast({
        message: 'Organization deleted and notification sent.',
        type: 'success',
      });
      setDeletionReason('');
      fetchOrganizations();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete organization';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setActioningOrg(null);
    }
  };

  const handleUpdateOrganization = async () => {
    if (!editingOrg) return;

    setActioningOrg(editingOrg.id);

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/organizations/${editingOrg.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingOrg),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update organization');
      }

      setToast({ message: 'Organization updated successfully!', type: 'success' });
      setEditingOrg(null);
      fetchOrganizations();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update organization';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setActioningOrg(null);
    }
  };

  const convertToCSV = (data: Organization[]): string => {
    if (data.length === 0) return '';

    const headers = [
      'Name',
      'Email',
      'Status',
      'Region',
      'Organization Type',
      'Organization Size',
      'Primary Contact Name',
      'Primary Contact Email',
      'Primary Contact Phone',
      'Secondary Contact Name',
      'Secondary Contact Email',
      'Address',
      'City',
      'State',
      'Zip Code',
      'Website',
      'Description',
      'Tags',
      'Membership Active',
      'Membership Date',
      'Membership Renewal Date',
      'Created At',
      'Updated At',
    ];

    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);

      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const formatDate = (dateString?: string): string => {
      if (!dateString) return '';
      try {
        return new Date(dateString).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return dateString;
      }
    };

    const rows = data.map(org => [
      escapeCSV(org.name),
      escapeCSV(org.email),
      escapeCSV(org.status),
      escapeCSV(org.region),
      escapeCSV(org.organizationType),
      escapeCSV(org.organizationSize),
      escapeCSV(org.primaryContactName),
      escapeCSV(org.primaryContactEmail),
      escapeCSV(org.primaryContactPhone),
      escapeCSV(org.secondaryContactName),
      escapeCSV(org.secondaryContactEmail),
      escapeCSV(org.address),
      escapeCSV(org.city),
      escapeCSV(org.state),
      escapeCSV(org.zipCode),
      escapeCSV(org.website),
      escapeCSV(org.description),
      escapeCSV(org.tags.join('; ')),
      escapeCSV(org.membershipActive ? 'Yes' : 'No'),
      escapeCSV(formatDate(org.membershipDate)),
      escapeCSV(formatDate(org.membershipRenewalDate)),
      escapeCSV(formatDate(org.createdAt)),
      escapeCSV(formatDate(org.updatedAt)),
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  const exportToCSV = () => {
    if (sortedOrganizations.length === 0) {
      setToast({
        message: 'No organizations to export',
        type: 'info',
      });
      return;
    }

    try {
      const csv = convertToCSV(sortedOrganizations);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      const filterName = filter.toLowerCase();
      const date = new Date().toISOString().split('T')[0];
      const filename = `organizations-${filterName}-${date}.csv`;

      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      setToast({
        message: `Exported ${sortedOrganizations.length} organization${sortedOrganizations.length === 1 ? '' : 's'} to CSV`,
        type: 'success',
      });
    } catch (error) {
      console.error('CSV export error:', error);
      setToast({
        message: 'Failed to export CSV',
        type: 'error',
      });
    }
  };

  const uniqueOrgTypes = Array.from(
    new Set(organizations.map(org => org.organizationType).filter(Boolean))
  ) as string[];

  const allTags = Array.from(new Set(organizations.flatMap(org => org.tags || [])));

  const combinedTags = Array.from(new Set([...availableTags, ...allTags]));

  useEffect(() => {
    if (regionFilter !== 'all') {
      console.log('Region Filter Active:', regionFilter);
      console.log(
        'Organizations with regions:',
        organizations.map(o => ({ name: o.name, region: o.region }))
      );
    }
  }, [regionFilter, organizations]);

  const filteredOrganizations = organizations.filter(org => {
    if (filter === 'PENDING' && org.status !== 'PENDING') return false;
    if (filter === 'ACTIVE' && org.status !== 'ACTIVE') return false;
    if (filter === 'INACTIVE' && org.status !== 'INACTIVE') return false;

    if (regionFilter !== 'all') {
      const orgRegion = org.region?.trim().toLowerCase();
      const filterRegion = regionFilter.trim().toLowerCase();
      if (orgRegion !== filterRegion) return false;
    }

    if (typeFilter !== 'all' && org.organizationType !== typeFilter) return false;

    if (tagsFilter.length > 0) {
      const hasAnyTag = tagsFilter.some(tag => org.tags?.includes(tag));
      if (!hasAnyTag) return false;
    }

    return true;
  });

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

  const sortedOrganizations = [...searchedOrganizations].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'name':
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
        break;
      case 'region':
        aValue = a.region?.toLowerCase() || '';
        bValue = b.region?.toLowerCase() || '';
        break;
      case 'primaryContactName':
        aValue = a.primaryContactName?.toLowerCase() || '';
        bValue = b.primaryContactName?.toLowerCase() || '';
        break;
      case 'website':
        aValue = a.website?.toLowerCase() || '';
        bValue = b.website?.toLowerCase() || '';
        break;
      case 'organizationType':
        aValue = a.organizationType?.toLowerCase() || '';
        bValue = b.organizationType?.toLowerCase() || '';
        break;
      case 'status':
        aValue = a.status?.toLowerCase() || '';
        bValue = b.status?.toLowerCase() || '';
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

  const currentFilterCount = sortedOrganizations.length;

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

      <div className='flex-1'>
        <div className='p-8'>
          <h1 className='text-3xl font-bold text-gray-800 mb-6'>
            {filter === 'ALL' && `All Organizations (${currentFilterCount})`}
            {filter === 'PENDING' && `Pending (${currentFilterCount})`}
            {filter === 'ACTIVE' && `Active (${currentFilterCount})`}
            {filter === 'INACTIVE' && `Inactive (${currentFilterCount})`}
          </h1>

          <div className='space-y-4 mb-6'>
            <div className='flex items-center gap-3 flex-wrap'>
              <div className='flex gap-2'>
                <button
                  onClick={() => setFilter('ALL')}
                  className={`px-4 py-2 rounded-[10px] font-medium transition ${
                    filter === 'ALL'
                      ? 'bg-[#D54242] text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('PENDING')}
                  className={`px-4 py-2 rounded-[10px] font-medium transition ${
                    filter === 'PENDING'
                      ? 'bg-[#D54242] text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilter('ACTIVE')}
                  className={`px-4 py-2 rounded-[10px] font-medium transition ${
                    filter === 'ACTIVE'
                      ? 'bg-[#D54242] text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilter('INACTIVE')}
                  className={`px-4 py-2 rounded-[10px] font-medium transition ${
                    filter === 'INACTIVE'
                      ? 'bg-[#D54242] text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Inactive
                </button>
              </div>

              <div className='relative region-dropdown-container'>
                <button
                  onClick={() => setRegionDropdownOpen(!regionDropdownOpen)}
                  className='px-4 py-2 border border-gray-300 rounded-[10px] bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#194B90] hover:bg-gray-50 flex items-center gap-2'
                >
                  <span>{regionFilter === 'all' ? 'All Regions' : regionFilter}</span>
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
                  <div className='absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-[10px] shadow-lg z-50 min-w-[160px]'>
                    <div className='py-2'>
                      {['all', 'East', 'Middle', 'West'].map(region => (
                        <button
                          key={region}
                          onClick={() => {
                            setRegionFilter(region);
                            setRegionDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                            regionFilter === region
                              ? 'bg-blue-50 text-[#194B90] font-medium'
                              : 'text-gray-700'
                          }`}
                        >
                          {region === 'all' ? 'All Regions' : region}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className='relative type-dropdown-container'>
                <button
                  onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                  className='px-4 py-2 border border-gray-300 rounded-[10px] bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#194B90] hover:bg-gray-50 flex items-center gap-2'
                >
                  <span>{typeFilter === 'all' ? 'All Types' : typeFilter}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${typeDropdownOpen ? 'rotate-180' : ''}`}
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

                {typeDropdownOpen && (
                  <div className='absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-[10px] shadow-lg z-50 min-w-[200px] max-h-[300px] overflow-y-auto'>
                    <div className='py-2'>
                      <button
                        onClick={() => {
                          setTypeFilter('all');
                          setTypeDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                          typeFilter === 'all'
                            ? 'bg-blue-50 text-[#194B90] font-medium'
                            : 'text-gray-700'
                        }`}
                      >
                        All Types
                      </button>
                      {uniqueOrgTypes.map(type => (
                        <button
                          key={type}
                          onClick={() => {
                            setTypeFilter(type);
                            setTypeDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                            typeFilter === type
                              ? 'bg-blue-50 text-[#194B90] font-medium'
                              : 'text-gray-700'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className='flex items-center gap-2'>
                <div className='relative tag-dropdown-container'>
                  <button
                    onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
                    className='px-4 py-2 border border-gray-300 rounded-[10px] bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#194B90] hover:bg-gray-50 flex items-center gap-2'
                  >
                    <span>
                      {tagsFilter.length > 0 ? `Tags (${tagsFilter.length})` : 'Filter by Tags'}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform ${tagDropdownOpen ? 'rotate-180' : ''}`}
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

                  {tagDropdownOpen && (
                    <div className='absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-[10px] shadow-lg z-50 min-w-[200px] max-h-[300px] overflow-y-auto'>
                      {allTags.length === 0 ? (
                        <div className='px-4 py-3 text-sm text-gray-500'>No tags available</div>
                      ) : (
                        <div className='py-2'>
                          {allTags.map(tag => (
                            <label
                              key={tag}
                              className='flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer'
                            >
                              <input
                                type='checkbox'
                                checked={tagsFilter.includes(tag)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setTagsFilter([...tagsFilter, tag]);
                                  } else {
                                    setTagsFilter(tagsFilter.filter(t => t !== tag));
                                  }
                                }}
                                className='w-4 h-4 text-[#194B90] border-gray-300 rounded focus:ring-[#194B90]'
                              />
                              <span className='ml-2 text-sm text-gray-700'>{tag}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {tagsFilter.length > 0 && (
                        <div className='border-t border-gray-200 px-4 py-2'>
                          <button
                            onClick={() => {
                              setTagsFilter([]);
                              setTagDropdownOpen(false);
                            }}
                            className='text-sm text-[#D54242] hover:text-[#b53a3a] font-medium'
                          >
                            Clear All
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className='flex items-center'>
              <div className='relative flex-1 max-w-md'>
                <input
                  type='text'
                  placeholder='Search organizations...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='w-full px-4 py-2 pl-10 border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                />
                <svg
                  className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400'
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

            {tagsFilter.length > 0 && (
              <div className='flex items-center gap-2 flex-wrap'>
                {tagsFilter.map(tag => (
                  <span
                    key={tag}
                    className='px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center gap-2'
                  >
                    {tag}
                    <button
                      onClick={() => setTagsFilter(tagsFilter.filter(t => t !== tag))}
                      className='text-blue-600 hover:text-blue-800'
                    >
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
                          d='M6 18L18 6M6 6l12 12'
                        />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <div className='text-center py-12'>
              <p className='text-gray-600'>Loading organizations...</p>
            </div>
          ) : sortedOrganizations.length === 0 ? (
            <div className='text-center py-12'>
              <p className='text-gray-600'>No organizations found.</p>
            </div>
          ) : (
            <>
              <div className='bg-white rounded-lg border border-gray-200 overflow-visible'>
                <table className='min-w-full'>
                  <thead className='bg-gray-50 border-b border-gray-200'>
                    <tr>
                      <th
                        className='px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100'
                        onClick={() => handleSort('name')}
                      >
                        <div className='flex items-center gap-1'>
                          Name
                          <SortIcon field='name' />
                        </div>
                      </th>
                      <th
                        className='px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100'
                        onClick={() => handleSort('region')}
                      >
                        <div className='flex items-center gap-1'>
                          Region
                          <SortIcon field='region' />
                        </div>
                      </th>
                      <th
                        className='px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100'
                        onClick={() => handleSort('primaryContactName')}
                      >
                        <div className='flex items-center gap-1'>
                          Primary Contact
                          <SortIcon field='primaryContactName' />
                        </div>
                      </th>
                      <th
                        className='px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100'
                        onClick={() => handleSort('website')}
                      >
                        <div className='flex items-center gap-1'>
                          Website
                          <SortIcon field='website' />
                        </div>
                      </th>
                      <th
                        className='px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100'
                        onClick={() => handleSort('organizationType')}
                      >
                        <div className='flex items-center gap-1'>
                          Type
                          <SortIcon field='organizationType' />
                        </div>
                      </th>
                      <th
                        className='px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100'
                        onClick={() => handleSort('status')}
                      >
                        <div className='flex items-center gap-1'>
                          Status
                          <SortIcon field='status' />
                        </div>
                      </th>
                      <th
                        className='px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100'
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className='flex items-center gap-1'>
                          Joined
                          <SortIcon field='createdAt' />
                        </div>
                      </th>
                      <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200'>
                    {sortedOrganizations.map(org => (
                      <tr key={org.id} className='hover:bg-gray-50'>
                        <td
                          className='px-6 py-4 cursor-pointer'
                          onClick={() => setEditingOrg({ ...org })}
                        >
                          <div className='text-sm font-medium text-[#194B90] hover:underline'>
                            {org.name}
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='text-sm text-gray-900'>{org.region || 'N/A'}</div>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='text-sm text-gray-900'>
                            <div>{org.primaryContactName || 'N/A'}</div>
                            {org.primaryContactEmail && (
                              <div className='text-xs text-gray-600'>{org.primaryContactEmail}</div>
                            )}
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          {org.website ? (
                            <a
                              href={org.website}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-sm text-[#194B90] hover:underline'
                              onClick={e => e.stopPropagation()}
                            >
                              Link
                            </a>
                          ) : (
                            <div className='text-sm text-gray-500'>N/A</div>
                          )}
                        </td>
                        <td className='px-6 py-4'>
                          <div className='text-sm text-gray-900'>
                            {org.organizationType || 'N/A'}
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
                        <td className='px-6 py-4'>
                          <div className='text-sm text-gray-900'>
                            {new Date(org.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className='px-6 py-4 text-sm' onClick={e => e.stopPropagation()}>
                          <div className='relative inline-block action-dropdown-container'>
                            <button
                              onClick={() =>
                                setActionDropdownOpen(actionDropdownOpen === org.id ? null : org.id)
                              }
                              disabled={actioningOrg === org.id}
                              className='bg-[#D54242] border border-[#D54242] text-white px-4 py-2 rounded-[10px] hover:bg-[#b53a3a] transition disabled:bg-gray-100 disabled:text-gray-500 disabled:border-gray-300 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D54242] flex items-center gap-2'
                            >
                              <span>{actioningOrg === org.id ? 'Processing...' : 'Actions'}</span>
                              <svg
                                className={`w-4 h-4 transition-transform ${actionDropdownOpen === org.id ? 'rotate-180' : ''}`}
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

                            {actionDropdownOpen === org.id && (
                              <div className='absolute right-0 top-full mt-2 bg-white border border-gray-300 rounded-[10px] shadow-lg z-50 min-w-[140px]'>
                                <div className='py-2'>
                                  {org.status === 'PENDING' && (
                                    <>
                                      <button
                                        onClick={() => {
                                          handleActionClick('approve', org.id, org.name);
                                          setActionDropdownOpen(null);
                                        }}
                                        className='w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700'
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleActionClick('decline', org.id, org.name);
                                          setActionDropdownOpen(null);
                                        }}
                                        className='w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-red-600'
                                      >
                                        Decline
                                      </button>
                                    </>
                                  )}
                                  {org.status === 'ACTIVE' && (
                                    <>
                                      <button
                                        onClick={() => {
                                          handleActionClick('archive', org.id, org.name);
                                          setActionDropdownOpen(null);
                                        }}
                                        className='w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700'
                                      >
                                        Archive
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleActionClick('delete', org.id, org.name);
                                          setActionDropdownOpen(null);
                                        }}
                                        className='w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-red-600'
                                      >
                                        Delete
                                      </button>
                                    </>
                                  )}
                                  {org.status === 'INACTIVE' && (
                                    <>
                                      <button
                                        onClick={() => {
                                          handleActionClick('unarchive', org.id, org.name);
                                          setActionDropdownOpen(null);
                                        }}
                                        className='w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700'
                                      >
                                        Unarchive
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleActionClick('delete', org.id, org.name);
                                          setActionDropdownOpen(null);
                                        }}
                                        className='w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-red-600'
                                      >
                                        Delete
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className='flex justify-end mt-6'>
                <button
                  onClick={exportToCSV}
                  disabled={sortedOrganizations.length === 0}
                  className='flex items-center gap-2 px-4 py-2 rounded-[10px] transition bg-white text-[#D54242] border border-[#D54242] hover:bg-[#D54242] hover:text-white disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300 disabled:cursor-not-allowed'
                >
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                  Export ({sortedOrganizations.length})
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

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
          <input type='checkbox' checked={true} readOnly className='modal-toggle' />
          <div className='modal modal-open'>
            <div className='modal-box max-w-2xl max-h-[80vh] bg-white overflow-y-auto m-8'>
              <h3 className='font-bold text-xl text-gray-900 mb-3'>{selectedOrg.name}</h3>

              <div className='space-y-3'>
                <div>
                  <h4 className='font-semibold text-base text-gray-800 mb-1.5'>
                    Basic Information
                  </h4>
                  <div className='grid grid-cols-2 gap-2'>
                    <div>
                      <span className='text-sm font-bold text-gray-600'>Email:</span>
                      <p className='text-sm text-gray-900'>{selectedOrg.email}</p>
                    </div>
                    <div>
                      <span className='text-sm font-bold text-gray-600'>Status:</span>
                      <p className='text-sm'>
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            selectedOrg.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : selectedOrg.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {selectedOrg.status}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className='text-sm font-bold text-gray-600'>Role:</span>
                      <p className='text-sm text-gray-900'>{selectedOrg.role}</p>
                    </div>
                    <div>
                      <span className='text-sm font-bold text-gray-600'>Membership Active:</span>
                      <p className='text-sm text-gray-900'>
                        {selectedOrg.membershipActive ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div className='col-span-2'>
                      <span className='text-sm font-bold text-gray-600'>Website:</span>
                      {selectedOrg.website ? (
                        <p className='text-sm text-blue-600 hover:underline'>
                          <a href={selectedOrg.website} target='_blank' rel='noopener noreferrer'>
                            {selectedOrg.website}
                          </a>
                        </p>
                      ) : (
                        <p className='text-sm text-gray-500'>N/A</p>
                      )}
                    </div>
                    <div className='col-span-2'>
                      <span className='text-sm font-bold text-gray-600'>Description:</span>
                      <p className='text-sm text-gray-900'>{selectedOrg.description || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className='font-semibold text-base text-gray-800 mb-1.5'>
                    Contact Information
                  </h4>
                  <div className='grid grid-cols-2 gap-2'>
                    <div>
                      <span className='text-sm font-bold text-gray-600'>Primary Contact:</span>
                      <p className='text-sm text-gray-900'>
                        {selectedOrg.primaryContactName || 'N/A'}
                      </p>
                      <p className='text-sm text-gray-600'>
                        {selectedOrg.primaryContactEmail || 'N/A'}
                      </p>
                      <p className='text-sm text-gray-600'>
                        {selectedOrg.primaryContactPhone || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className='text-sm font-bold text-gray-600'>Secondary Contact:</span>
                      <p className='text-sm text-gray-900'>
                        {selectedOrg.secondaryContactName || 'N/A'}
                      </p>
                      <p className='text-sm text-gray-600'>
                        {selectedOrg.secondaryContactEmail || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className='font-semibold text-base text-gray-800 mb-1.5'>Location</h4>
                  <div className='grid grid-cols-2 gap-2'>
                    <div className='col-span-2'>
                      <span className='text-sm font-bold text-gray-600'>Address:</span>
                      <p className='text-sm text-gray-900'>{selectedOrg.address || 'N/A'}</p>
                    </div>
                    <div>
                      <span className='text-sm font-bold text-gray-600'>City:</span>
                      <p className='text-sm text-gray-900'>{selectedOrg.city || 'N/A'}</p>
                    </div>
                    <div>
                      <span className='text-sm font-bold text-gray-600'>Zip Code:</span>
                      <p className='text-sm text-gray-900'>{selectedOrg.zipCode || 'N/A'}</p>
                    </div>
                    <div>
                      <span className='text-sm font-bold text-gray-600'>Region:</span>
                      <p className='text-sm text-gray-900'>{selectedOrg.region || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className='font-semibold text-base text-gray-800 mb-1.5'>
                    Organization Details
                  </h4>
                  <div className='grid grid-cols-2 gap-2'>
                    <div>
                      <span className='text-sm font-bold text-gray-600'>Type:</span>
                      <p className='text-sm text-gray-900'>
                        {selectedOrg.organizationType || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className='text-sm font-bold text-gray-600'>Size:</span>
                      <p className='text-sm text-gray-900'>
                        {selectedOrg.organizationSize || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className='font-semibold text-base text-gray-800 mb-1.5'>Tags</h4>
                  {selectedOrg.tags && selectedOrg.tags.length > 0 ? (
                    <div className='flex flex-wrap gap-1.5'>
                      {selectedOrg.tags.map((tag, index) => (
                        <span
                          key={index}
                          className='px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200'
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className='text-sm text-gray-900'>N/A</p>
                  )}
                </div>

                <div>
                  <h4 className='font-semibold text-base text-gray-800 mb-1.5'>Dates</h4>
                  <div className='grid grid-cols-3 gap-2'>
                    <div>
                      <span className='text-sm font-bold text-gray-600'>Created:</span>
                      <p className='text-sm text-gray-900'>
                        {new Date(selectedOrg.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className='text-sm font-bold text-gray-600'>Updated:</span>
                      <p className='text-sm text-gray-900'>
                        {new Date(selectedOrg.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className='text-sm font-bold text-gray-600'>Membership Date:</span>
                      <p className='text-sm text-gray-900'>
                        {selectedOrg.membershipDate
                          ? new Date(selectedOrg.membershipDate).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className='text-sm font-bold text-gray-600'>Renewal Date:</span>
                      <p className='text-sm text-gray-900'>
                        {selectedOrg.membershipRenewalDate
                          ? new Date(selectedOrg.membershipRenewalDate).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className='modal-action'>
                <button
                  onClick={() => setSelectedOrg(null)}
                  className='btn bg-[#D54242] hover:bg-[#b53a3a] text-white border-none'
                >
                  Close
                </button>
              </div>
            </div>
            <div className='modal-backdrop bg-black/30' onClick={() => setSelectedOrg(null)}></div>
          </div>
        </>
      )}

      {editingOrg && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4'>
          <div className='bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
            <div className='flex items-center justify-between p-6 bg-white'>
              <h2 className='text-xl font-bold text-gray-900'>Edit Organization Details</h2>
              <button
                onClick={() => setEditingOrg(null)}
                className='text-gray-500 hover:text-gray-700'
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

            <div className='overflow-y-auto flex-1 p-6'>
              <div className='space-y-6'>
                <div>
                  <h3 className='text-lg font-semibold text-gray-800 mb-3'>Basic Information</h3>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='col-span-2'>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Organization Name
                      </label>
                      <input
                        type='text'
                        value={editingOrg.name}
                        onChange={e => setEditingOrg({ ...editingOrg, name: e.target.value })}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                      />
                    </div>
                    <div className='col-span-2'>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>Email</label>
                      <input
                        type='email'
                        value={editingOrg.email}
                        onChange={e => setEditingOrg({ ...editingOrg, email: e.target.value })}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Website
                      </label>
                      <input
                        type='url'
                        value={editingOrg.website || ''}
                        onChange={e => setEditingOrg({ ...editingOrg, website: e.target.value })}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Organization Type
                      </label>
                      <input
                        type='text'
                        value={editingOrg.organizationType || ''}
                        onChange={e =>
                          setEditingOrg({ ...editingOrg, organizationType: e.target.value })
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                      />
                    </div>
                    <div className='col-span-2'>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Description
                      </label>
                      <textarea
                        value={editingOrg.description || ''}
                        onChange={e =>
                          setEditingOrg({ ...editingOrg, description: e.target.value })
                        }
                        rows={3}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className='text-lg font-semibold text-gray-800 mb-3'>Contact Information</h3>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Primary Contact Name
                      </label>
                      <input
                        type='text'
                        value={editingOrg.primaryContactName || ''}
                        onChange={e =>
                          setEditingOrg({ ...editingOrg, primaryContactName: e.target.value })
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Primary Contact Email
                      </label>
                      <input
                        type='email'
                        value={editingOrg.primaryContactEmail || ''}
                        onChange={e =>
                          setEditingOrg({ ...editingOrg, primaryContactEmail: e.target.value })
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Primary Contact Phone
                      </label>
                      <input
                        type='tel'
                        value={editingOrg.primaryContactPhone || ''}
                        onChange={e =>
                          setEditingOrg({ ...editingOrg, primaryContactPhone: e.target.value })
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Secondary Contact Name
                      </label>
                      <input
                        type='text'
                        value={editingOrg.secondaryContactName || ''}
                        onChange={e =>
                          setEditingOrg({ ...editingOrg, secondaryContactName: e.target.value })
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Secondary Contact Email
                      </label>
                      <input
                        type='email'
                        value={editingOrg.secondaryContactEmail || ''}
                        onChange={e =>
                          setEditingOrg({ ...editingOrg, secondaryContactEmail: e.target.value })
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className='text-lg font-semibold text-gray-800 mb-3'>Location</h3>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='col-span-2'>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Address
                      </label>
                      <input
                        type='text'
                        value={editingOrg.address || ''}
                        onChange={e => setEditingOrg({ ...editingOrg, address: e.target.value })}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>City</label>
                      <input
                        type='text'
                        value={editingOrg.city || ''}
                        onChange={e => setEditingOrg({ ...editingOrg, city: e.target.value })}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Zip Code
                      </label>
                      <input
                        type='text'
                        value={editingOrg.zipCode || ''}
                        onChange={e => setEditingOrg({ ...editingOrg, zipCode: e.target.value })}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>Region</label>
                      <div className='relative edit-region-dropdown-container'>
                        <button
                          type='button'
                          onClick={() => setEditRegionDropdownOpen(!editRegionDropdownOpen)}
                          className='w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#194B90] hover:bg-gray-50 flex items-center justify-between text-sm'
                        >
                          <span>{editingOrg.region || 'Select Region'}</span>
                          <svg
                            className={`w-4 h-4 transition-transform ${editRegionDropdownOpen ? 'rotate-180' : ''}`}
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

                        {editRegionDropdownOpen && (
                          <div className='absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-md shadow-lg z-50 w-full'>
                            <div className='py-2'>
                              {['East', 'Middle', 'West'].map(region => (
                                <button
                                  key={region}
                                  type='button'
                                  onClick={() => {
                                    setEditingOrg({ ...editingOrg, region });
                                    setEditRegionDropdownOpen(false);
                                  }}
                                  className='w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700'
                                >
                                  {region}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className='text-lg font-semibold text-gray-800 mb-3'>Membership</h3>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Membership Date
                      </label>
                      <input
                        type='date'
                        value={
                          editingOrg.membershipDate
                            ? new Date(editingOrg.membershipDate).toISOString().split('T')[0]
                            : ''
                        }
                        onChange={e =>
                          setEditingOrg({
                            ...editingOrg,
                            membershipDate: e.target.value ? e.target.value : undefined,
                          })
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Renewal Date
                      </label>
                      <input
                        type='date'
                        value={
                          editingOrg.membershipRenewalDate
                            ? new Date(editingOrg.membershipRenewalDate).toISOString().split('T')[0]
                            : ''
                        }
                        onChange={e =>
                          setEditingOrg({
                            ...editingOrg,
                            membershipRenewalDate: e.target.value ? e.target.value : undefined,
                          })
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className='text-lg font-semibold text-gray-800 mb-3'>Tags</h3>
                  <div className='space-y-2'>
                    <div className='flex flex-wrap gap-2'>
                      {editingOrg.tags && editingOrg.tags.length > 0 ? (
                        editingOrg.tags.map((tag, index) => (
                          <span
                            key={index}
                            className='px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200 flex items-center gap-2'
                          >
                            {tag}
                            <button
                              type='button'
                              onClick={() => {
                                const newTags = editingOrg.tags.filter((_, i) => i !== index);
                                setEditingOrg({ ...editingOrg, tags: newTags });
                              }}
                              className='text-red-600 hover:text-red-800'
                            >
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
                                  d='M6 18L18 6M6 6l12 12'
                                />
                              </svg>
                            </button>
                          </span>
                        ))
                      ) : (
                        <p className='text-sm text-gray-500'>No tags assigned</p>
                      )}
                    </div>
                    <div className='flex gap-2 items-start'>
                      <div className='relative flex-1 edit-tag-dropdown-container'>
                        <button
                          type='button'
                          onClick={() => setEditTagDropdownOpen(!editTagDropdownOpen)}
                          className='w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#194B90] hover:bg-gray-50 flex items-center justify-between text-sm'
                        >
                          <span>Select a tag...</span>
                          <svg
                            className={`w-4 h-4 transition-transform ${editTagDropdownOpen ? 'rotate-180' : ''}`}
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

                        {editTagDropdownOpen && (
                          <div className='absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-md shadow-lg z-50 w-full max-h-[200px] overflow-y-auto'>
                            {combinedTags.filter(tag => !editingOrg.tags?.includes(tag)).length ===
                            0 ? (
                              <div className='px-4 py-3 text-sm text-gray-500'>
                                No tags available
                              </div>
                            ) : (
                              <div className='py-2'>
                                {combinedTags
                                  .filter(tag => !editingOrg.tags?.includes(tag))
                                  .map(tag => (
                                    <button
                                      key={tag}
                                      type='button'
                                      onClick={() => {
                                        setEditingOrg({
                                          ...editingOrg,
                                          tags: [...(editingOrg.tags || []), tag],
                                        });
                                        setEditTagDropdownOpen(false);
                                      }}
                                      className='w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700'
                                    >
                                      {tag}
                                    </button>
                                  ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        type='button'
                        onClick={() => setEditTagDropdownOpen(!editTagDropdownOpen)}
                        className='px-4 py-2 bg-[#D54242] text-white rounded-md hover:bg-[#b53a3a] text-sm whitespace-nowrap'
                      >
                        Add Tag
                      </button>
                    </div>
                    <p className='text-xs text-gray-500'>
                      Select a tag from the dropdown to add it
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className='flex justify-end gap-3 p-6 bg-gray-50'>
              <button
                onClick={() => setEditingOrg(null)}
                disabled={actioningOrg === editingOrg.id}
                className='px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateOrganization}
                disabled={actioningOrg === editingOrg.id}
                className='px-6 py-2 bg-[#D54242] text-white rounded-md hover:bg-[#b53a3a] disabled:opacity-50'
              >
                {actioningOrg === editingOrg.id ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectionModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4'>
          <div className='bg-white rounded-lg max-w-lg w-full'>
            <div className='flex items-center justify-between p-6 border-b'>
              <h2 className='text-xl font-bold text-gray-900'>Decline Organization Request</h2>
              <button
                onClick={() => {
                  setRejectionModal(null);
                  setRejectionReason('');
                }}
                className='text-gray-500 hover:text-gray-700'
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

            <div className='p-6'>
              <p className='text-sm text-gray-600 mb-4'>
                You are about to decline{' '}
                <span className='font-semibold'>{rejectionModal.orgName}</span>. Please provide a
                reason that will be sent to the organization via email.
              </p>

              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Reason for Decline
              </label>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                rows={5}
                placeholder='Enter the reason for declining this organization...'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#194B90]'
              />
            </div>

            <div className='flex justify-end gap-3 p-6 border-t bg-gray-50'>
              <button
                onClick={() => {
                  setRejectionModal(null);
                  setRejectionReason('');
                }}
                disabled={actioningOrg === rejectionModal.orgId}
                className='px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                onClick={handleRejectWithReason}
                disabled={actioningOrg === rejectionModal.orgId || !rejectionReason.trim()}
                className='px-6 py-2 bg-[#D54242] text-white rounded-md hover:bg-[#b53a3a] disabled:opacity-50'
              >
                {actioningOrg === rejectionModal.orgId ? 'Sending...' : 'Send Email & Decline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletionModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4'>
          <div className='bg-white rounded-lg max-w-lg w-full'>
            <div className='flex items-center justify-between p-6 border-b'>
              <h2 className='text-xl font-bold text-gray-900'>Delete Organization</h2>
              <button
                onClick={() => {
                  setDeletionModal(null);
                  setDeletionReason('');
                }}
                className='text-gray-500 hover:text-gray-700'
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

            <div className='p-6'>
              <p className='text-sm text-gray-600 mb-4'>
                You are about to permanently delete{' '}
                <span className='font-semibold'>{deletionModal.orgName}</span>. You can optionally
                provide a reason that will be sent to the organization via email.
              </p>

              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Reason for Deletion (Optional)
              </label>
              <textarea
                value={deletionReason}
                onChange={e => setDeletionReason(e.target.value)}
                rows={5}
                placeholder='Enter the reason for deleting this organization (optional)...'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#194B90]'
              />
            </div>

            <div className='flex justify-end gap-3 p-6 border-t bg-gray-50'>
              <button
                onClick={() => {
                  setDeletionModal(null);
                  setDeletionReason('');
                }}
                disabled={actioningOrg === deletionModal.orgId}
                className='px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteWithReason}
                disabled={actioningOrg === deletionModal.orgId}
                className='px-6 py-2 bg-[#D54242] text-white rounded-md hover:bg-[#b53a3a] disabled:opacity-50'
              >
                {actioningOrg === deletionModal.orgId ? 'Deleting...' : 'Delete Organization'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationManagement;
