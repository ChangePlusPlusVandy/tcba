import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import Toast from '../../../components/Toast';
import OrganizationSidebar from '../../../components/OrganizationSidebar';
import { API_BASE_URL } from '../../../config/api';

type Organization = {
  id: string;
  name: string;
  email: string;
  description?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  secondaryContactName?: string;
  secondaryContactEmail?: string;
  region?: string;
  organizationType?: string;
  organizationSize?: string;
  status: string;
  tags: string[];
  createdAt: string;
};

type SortField =
  | 'name'
  | 'region'
  | 'primaryContactName'
  | 'website'
  | 'organizationType'
  | 'createdAt';
type SortDirection = 'asc' | 'desc';

const OrganizationsList = () => {
  const { getToken } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  const fetchOrganizations = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/organizations/directory`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch organizations');

      const data = await response.json();
      setOrganizations(data);
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to load organizations', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
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
    };

    if (tagDropdownOpen || regionDropdownOpen || typeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [tagDropdownOpen, regionDropdownOpen, typeDropdownOpen]);

  const activeOrgs = organizations.filter(org => org.status === 'ACTIVE');

  const filteredOrganizations = activeOrgs.filter(org => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.primaryContactName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRegion = regionFilter === 'all' || org.region === regionFilter.toUpperCase();

    const matchesType = typeFilter === 'all' || org.organizationType === typeFilter;

    const matchesTags = tagsFilter.length === 0 || tagsFilter.some(tag => org.tags?.includes(tag));

    return matchesSearch && matchesRegion && matchesType && matchesTags;
  });

  const sortedOrganizations = [...filteredOrganizations].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'createdAt') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    } else {
      aValue = aValue?.toString().toLowerCase() || '';
      bValue = bValue?.toString().toLowerCase() || '';
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

  const allTags = Array.from(new Set(organizations.flatMap(org => org.tags || [])));
  const uniqueOrgTypes = Array.from(
    new Set(organizations.map(org => org.organizationType).filter(Boolean))
  ) as string[];

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
      <OrganizationSidebar />

      <div className='flex-1'>
        <div className='p-8'>
          <h1 className='text-3xl font-bold text-gray-800 mb-6'>
            Organizations ({sortedOrganizations.length})
          </h1>

          <div className='space-y-4 mb-6'>
            <div className='flex items-center gap-3 flex-wrap'>
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
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200'>
                    {sortedOrganizations.map(org => (
                      <tr key={org.id} className='hover:bg-gray-50'>
                        <td
                          className='px-6 py-4 cursor-pointer'
                          onClick={() => setSelectedOrg(org)}
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedOrg && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between p-6 border-b'>
              <h2 className='text-2xl font-bold text-gray-900'>{selectedOrg.name}</h2>
              <button
                onClick={() => setSelectedOrg(null)}
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

            <div className='p-6 space-y-6'>
              <div>
                <h3 className='text-lg font-semibold text-gray-800 mb-3'>Contact Information</h3>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <p className='text-sm text-gray-600'>Email</p>
                    <p className='text-sm font-medium text-gray-900'>{selectedOrg.email}</p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-600'>Website</p>
                    {selectedOrg.website ? (
                      <a
                        href={selectedOrg.website}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-sm text-[#194B90] hover:underline'
                      >
                        {selectedOrg.website}
                      </a>
                    ) : (
                      <p className='text-sm text-gray-500'>N/A</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className='text-lg font-semibold text-gray-800 mb-3'>Primary Contact</h3>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <p className='text-sm text-gray-600'>Name</p>
                    <p className='text-sm font-medium text-gray-900'>
                      {selectedOrg.primaryContactName}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-600'>Email</p>
                    <p className='text-sm font-medium text-gray-900'>
                      {selectedOrg.primaryContactEmail}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-600'>Phone</p>
                    <p className='text-sm font-medium text-gray-900'>
                      {selectedOrg.primaryContactPhone}
                    </p>
                  </div>
                </div>
              </div>

              {(selectedOrg.secondaryContactName || selectedOrg.secondaryContactEmail) && (
                <div>
                  <h3 className='text-lg font-semibold text-gray-800 mb-3'>Secondary Contact</h3>
                  <div className='grid grid-cols-2 gap-4'>
                    {selectedOrg.secondaryContactName && (
                      <div>
                        <p className='text-sm text-gray-600'>Name</p>
                        <p className='text-sm font-medium text-gray-900'>
                          {selectedOrg.secondaryContactName}
                        </p>
                      </div>
                    )}
                    {selectedOrg.secondaryContactEmail && (
                      <div>
                        <p className='text-sm text-gray-600'>Email</p>
                        <p className='text-sm font-medium text-gray-900'>
                          {selectedOrg.secondaryContactEmail}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h3 className='text-lg font-semibold text-gray-800 mb-3'>Organization Details</h3>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <p className='text-sm text-gray-600'>Type</p>
                    <p className='text-sm font-medium text-gray-900'>
                      {selectedOrg.organizationType || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-600'>Size</p>
                    <p className='text-sm font-medium text-gray-900'>
                      {selectedOrg.organizationSize || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-600'>Region</p>
                    <p className='text-sm font-medium text-gray-900'>
                      {selectedOrg.region || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {selectedOrg.description && (
                <div>
                  <h3 className='text-lg font-semibold text-gray-800 mb-3'>Description</h3>
                  <p className='text-sm text-gray-700'>{selectedOrg.description}</p>
                </div>
              )}

              {(selectedOrg.address ||
                selectedOrg.city ||
                selectedOrg.state ||
                selectedOrg.zipCode) && (
                <div>
                  <h3 className='text-lg font-semibold text-gray-800 mb-3'>Address</h3>
                  <p className='text-sm text-gray-900'>
                    {selectedOrg.address && (
                      <>
                        {selectedOrg.address}
                        <br />
                      </>
                    )}
                    {selectedOrg.city && selectedOrg.city}
                    {selectedOrg.state && `, ${selectedOrg.state}`}
                    {selectedOrg.zipCode && ` ${selectedOrg.zipCode}`}
                  </p>
                </div>
              )}

              {selectedOrg.tags && selectedOrg.tags.length > 0 && (
                <div>
                  <h3 className='text-lg font-semibold text-gray-800 mb-3'>Tags</h3>
                  <div className='flex flex-wrap gap-2'>
                    {selectedOrg.tags.map(tag => (
                      <span
                        key={tag}
                        className='px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full'
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default OrganizationsList;
