import { useAuth } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import AdminSidebar from '../../../components/AdminSidebar';
import Toast from '../../../components/Toast';
import ConfirmModal from '../../../components/ConfirmModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

type AlertPriority = 'URGENT' | 'LOW' | 'MEDIUM';

type Alert = {
  id: string;
  title: string;
  content: string;
  priority: AlertPriority;
  publishedDate?: string;
  isPublished: boolean;
  attachmentUrls: string[];
  tags: string[];
  createdByAdminId: string;
  createdAt: string;
  updatedAt: string;
};

type Filter = 'ALL' | 'PUBLISHED' | 'DRAFTS';

const AdminAlerts = () => {
  const { getToken } = useAuth();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAlertIds, setSelectedAlertIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const [newAlert, setNewAlert] = useState({
    title: '',
    content: '',
    priority: 'MEDIUM' as AlertPriority,
    isPublished: false,
  });

  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
  } | null>(null);

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = await getToken({ template: 'jwt-template-tcba' });
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

  const fetchAlerts = async () => {
    try {
      setError('');
      const data = await fetchWithAuth(`${API_BASE_URL}/api/alerts`);
      console.log('Fetched alerts:', data);
      console.log('Alerts count:', data.length);
      console.log(
        'Drafts:',
        data.filter((a: any) => !a.isPublished)
      );
      console.log(
        'Published:',
        data.filter((a: any) => a.isPublished)
      );
      setAlerts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleCreateAlert = async (publish: boolean) => {
    if (!newAlert.title.trim()) {
      setToast({ message: 'Title is required', type: 'error' });
      return;
    }
    if (!newAlert.content.trim()) {
      setToast({ message: 'Content is required', type: 'error' });
      return;
    }

    try {
      setError('');
      const alertData = {
        ...newAlert,
        isPublished: publish,
        publishedDate: publish ? new Date().toISOString() : null,
      };

      console.log('Creating alert with data:', alertData);

      await fetchWithAuth(`${API_BASE_URL}/api/alerts`, {
        method: 'POST',
        body: JSON.stringify(alertData),
      });

      await fetchAlerts();
      setIsCreateModalOpen(false);
      setNewAlert({
        title: '',
        content: '',
        priority: 'MEDIUM',
        isPublished: false,
      });

      const successMessage = publish ? 'Alert created successfully' : 'Alert saved successfully';
      setToast({ message: successMessage, type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to create alert', type: 'error' });
    }
  };

  const handleDeleteSelected = () => {
    if (selectedAlertIds.length === 0) return;

    const count = selectedAlertIds.length;
    setConfirmModal({
      title: 'Delete Alerts',
      message: `Are you sure you want to delete ${count} alert${count > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          setError('');
          await Promise.all(
            selectedAlertIds.map(id =>
              fetchWithAuth(`${API_BASE_URL}/api/alerts/${id}`, {
                method: 'DELETE',
              })
            )
          );

          await fetchAlerts();
          setSelectedAlertIds([]);
          setToast({
            message: `${count} alert${count > 1 ? 's' : ''} deleted successfully`,
            type: 'success',
          });
        } catch (err: any) {
          setToast({ message: err.message || 'Failed to delete alerts', type: 'error' });
        } finally {
          setConfirmModal(null);
        }
      },
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedAlertIds(filteredAlerts.map(a => a.id));
    } else {
      setSelectedAlertIds([]);
    }
  };

  const handleSelectAlert = (id: string) => {
    setSelectedAlertIds(prev =>
      prev.includes(id) ? prev.filter(alertId => alertId !== id) : [...prev, id]
    );
  };

  const openDetailModal = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedAlert(null);
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'PUBLISHED' && !alert.isPublished) return false;
    if (filter === 'DRAFTS' && alert.isPublished) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        alert.title.toLowerCase().includes(query) || alert.content.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const getPriorityColor = (priority: AlertPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
  };

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <AdminSidebar />

      <div className='flex-1 p-8'>
        <h1 className='text-3xl font-bold text-gray-800 mb-6'>All Alerts ({alerts.length})</h1>

        <div className='flex items-center gap-4 mb-6'>
          <div className='flex gap-2'>
            <button
              onClick={() => setFilter('ALL')}
              className={`px-6 py-2.5 rounded-[10px] font-medium transition ${
                filter === 'ALL'
                  ? 'bg-[#EBF3FF] text-[#194B90] border border-[#194B90]'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              } cursor-pointer`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('PUBLISHED')}
              className={`px-6 py-2.5 rounded-[10px] font-medium transition ${
                filter === 'PUBLISHED'
                  ? 'bg-[#EBF3FF] text-[#194B90] border border-[#194B90]'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              } cursor-pointer`}
            >
              Published
            </button>
            <button
              onClick={() => setFilter('DRAFTS')}
              className={`px-6 py-2.5 rounded-[10px] font-medium transition ${
                filter === 'DRAFTS'
                  ? 'bg-[#EBF3FF] text-[#194B90] border border-[#194B90]'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              } cursor-pointer`}
            >
              Drafts
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className='px-6 py-2.5 rounded-[10px] font-medium transition bg-[#D54242] text-white hover:bg-[#b53a3a] cursor-pointer'
          >
            Create
          </button>

          {selectedAlertIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className='px-6 py-2.5 rounded-[10px] font-medium transition bg-[#D54242] text-white hover:bg-[#b53a3a] cursor-pointer'
            >
              Delete Selected ({selectedAlertIds.length})
            </button>
          )}

          <div className='flex-1 max-w-xl ml-auto'>
            <div className='relative'>
              <input
                type='text'
                placeholder='Search alerts'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#194B90]'
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
            <p className='text-gray-600'>Loading alerts...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-600'>No alerts found</p>
          </div>
        ) : (
          <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
            <table className='min-w-full'>
              <thead className='bg-gray-50 border-b border-gray-200'>
                <tr>
                  <th className='px-6 py-4 w-12'>
                    <input
                      type='checkbox'
                      checked={
                        filteredAlerts.length > 0 &&
                        selectedAlertIds.length === filteredAlerts.length
                      }
                      onChange={handleSelectAll}
                      className='w-4 h-4'
                    />
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Title</th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                    Status
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                    Priority
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                    Published
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200'>
                {filteredAlerts.map(alert => (
                  <tr key={alert.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4' onClick={e => e.stopPropagation()}>
                      <input
                        type='checkbox'
                        checked={selectedAlertIds.includes(alert.id)}
                        onChange={() => handleSelectAlert(alert.id)}
                        className='w-4 h-4'
                      />
                    </td>
                    <td
                      className='px-6 py-4 text-[#194B90] font-medium hover:underline cursor-pointer'
                      onClick={() => openDetailModal(alert)}
                    >
                      {alert.title}
                    </td>
                    <td className='px-6 py-4'>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          alert.isPublished
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {alert.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                          alert.priority
                        )}`}
                      >
                        {alert.priority}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm text-gray-600'>
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <div className='modal modal-open'>
          <div className='modal-box max-w-4xl'>
            <h3 className='font-bold text-lg mb-4'>Create New Alert</h3>

            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Title *</label>
                <input
                  type='text'
                  value={newAlert.title}
                  onChange={e => setNewAlert({ ...newAlert, title: e.target.value })}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                  placeholder='Enter alert title'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Priority *</label>
                <div className='relative'>
                  <button
                    type='button'
                    onClick={() => setIsPriorityDropdownOpen(!isPriorityDropdownOpen)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#194B90] hover:bg-gray-50 flex items-center justify-between text-sm'
                  >
                    <span>{newAlert.priority}</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${isPriorityDropdownOpen ? 'rotate-180' : ''}`}
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

                  {isPriorityDropdownOpen && (
                    <div className='absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-md shadow-lg z-50 w-full'>
                      {(['URGENT', 'MEDIUM', 'LOW'] as AlertPriority[]).map(priority => (
                        <button
                          key={priority}
                          type='button'
                          onClick={() => {
                            setNewAlert({ ...newAlert, priority });
                            setIsPriorityDropdownOpen(false);
                          }}
                          className='w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700'
                        >
                          {priority}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Content *</label>
                <ReactQuill
                  theme='snow'
                  value={newAlert.content}
                  onChange={value => setNewAlert({ ...newAlert, content: value })}
                  modules={modules}
                  className='bg-white'
                />
              </div>
            </div>

            <div className='modal-action'>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setNewAlert({
                    title: '',
                    content: '',
                    priority: 'MEDIUM',
                    isPublished: false,
                  });
                }}
                className='btn btn-ghost'
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreateAlert(false)}
                className='btn bg-gray-600 text-white hover:bg-gray-700'
              >
                Save to Drafts
              </button>
              <button
                onClick={() => handleCreateAlert(true)}
                className='btn bg-[#194B90] text-white hover:bg-[#153a70]'
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {isDetailModalOpen && selectedAlert && (
        <div className='modal modal-open'>
          <div className='modal-box max-w-4xl'>
            <h3 className='font-bold text-2xl mb-2'>{selectedAlert.title}</h3>

            <div className='flex gap-2 mb-4'>
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(
                  selectedAlert.priority
                )}`}
              >
                Priority: {selectedAlert.priority}
              </span>
            </div>

            <div
              className='prose max-w-none mb-4'
              dangerouslySetInnerHTML={{ __html: selectedAlert.content }}
            />

            <div className='flex items-center justify-between mt-6 pt-4 border-t'>
              <div>
                <p className='text-sm text-gray-600'>
                  Status:{' '}
                  <span
                    className={`font-medium ${
                      selectedAlert.isPublished ? 'text-green-600' : 'text-yellow-600'
                    }`}
                  >
                    {selectedAlert.isPublished ? 'Published' : 'Draft'}
                  </span>
                </p>
                <p className='text-sm text-gray-600'>
                  Created: {new Date(selectedAlert.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className='modal-action'>
              <button onClick={closeDetailModal} className='btn'>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
};

export default AdminAlerts;
