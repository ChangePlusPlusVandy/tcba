import { useAuth } from '@clerk/clerk-react';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import AdminSidebar from '../../../components/AdminSidebar';
import Toast from '../../../components/Toast';
import ConfirmModal from '../../../components/ConfirmModal';
import FileUpload from '../../../components/FileUpload';
import AttachmentList from '../../../components/AttachmentList';
import Pagination from '../../../components/Pagination';
import { useAdminAlerts } from '../../../hooks/queries/useAdminAlerts';
import { useAlertMutations } from '../../../hooks/mutations/useAlertMutations';
import { API_BASE_URL } from '../../../config/api';

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

  const [selectedAlertIds, setSelectedAlertIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<AlertPriority[]>([]);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const {
    data: alertsData,
    isLoading: loading,
    error: alertsError,
  } = useAdminAlerts(currentPage, itemsPerPage);
  const { createAlert, updateAlert, deleteAlert } = useAlertMutations();

  const alertsResponse = alertsData || {};
  const alerts = alertsResponse.data || alertsResponse;
  const alertsArray: Alert[] = Array.isArray(alerts) ? alerts : [];
  const totalAlerts =
    alertsResponse.total || alertsResponse.pagination?.total || alertsArray.length;
  const error = alertsError ? 'Failed to fetch alerts' : '';

  type SortField = 'title' | 'priority' | 'publishedDate' | 'createdAt';
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedAlert, setEditedAlert] = useState<{
    title: string;
    content: string;
    priority: AlertPriority;
    attachmentUrls: string[];
  }>({
    title: '',
    content: '',
    priority: 'MEDIUM',
    attachmentUrls: [],
  });

  const [newAlert, setNewAlert] = useState({
    title: '',
    content: '',
    priority: 'MEDIUM' as AlertPriority,
    isPublished: false,
    attachmentUrls: [] as string[],
  });

  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (!target.closest('.priority-dropdown-container')) {
        setPriorityDropdownOpen(false);
      }
    };

    if (priorityDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [priorityDropdownOpen]);

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
      setIsSubmitting(true);
      const alertData = {
        ...newAlert,
        isPublished: publish,
        publishedDate: publish ? new Date().toISOString() : null,
      };

      await createAlert.mutateAsync(alertData);

      setIsCreateModalOpen(false);
      setNewAlert({
        title: '',
        content: '',
        priority: 'MEDIUM',
        isPublished: false,
        attachmentUrls: [],
      });

      const successMessage = publish ? 'Alert created successfully' : 'Alert saved successfully';
      setToast({ message: successMessage, type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to create alert', type: 'error' });
    } finally {
      setIsSubmitting(false);
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
          setIsDeleting(true);
          await Promise.all(selectedAlertIds.map(id => deleteAlert.mutateAsync(id)));

          setSelectedAlertIds([]);
          setToast({
            message: `${count} alert${count > 1 ? 's' : ''} deleted successfully`,
            type: 'success',
          });
        } catch (err: any) {
          setToast({ message: err.message || 'Failed to delete alerts', type: 'error' });
        } finally {
          setIsDeleting(false);
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
    setIsEditMode(false);
  };

  const filteredAlerts = alertsArray.filter(alert => {
    if (filter === 'PUBLISHED' && !alert.isPublished) return false;
    if (filter === 'DRAFTS' && alert.isPublished) return false;

    const matchesPriority = priorityFilter.length === 0 || priorityFilter.includes(alert.priority);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (alert.title.toLowerCase().includes(query) ||
          alert.content.toLowerCase().includes(query)) &&
        matchesPriority
      );
    }

    return matchesPriority;
  });

  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'priority':
        const priorityOrder: Record<AlertPriority, number> = { URGENT: 3, MEDIUM: 2, LOW: 1 };
        aValue = priorityOrder[a.priority];
        bValue = priorityOrder[b.priority];
        break;
      case 'publishedDate':
        aValue = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
        bValue = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

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

  const quillRef = useRef<ReactQuill>(null);

  const alignImage = useCallback((alignment: 'left' | 'center' | 'right') => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const range = quill.getSelection();
    if (!range) return;

    const [leaf] = quill.getLeaf(range.index);
    if (leaf && leaf.domNode && (leaf.domNode as Element).tagName === 'IMG') {
      const img = leaf.domNode as HTMLImageElement;

      img.style.float = '';
      img.style.display = '';
      img.style.marginLeft = '';
      img.style.marginRight = '';

      switch (alignment) {
        case 'left':
          img.style.float = 'left';
          img.style.marginRight = '1rem';
          img.style.marginBottom = '0.5rem';
          break;
        case 'right':
          img.style.float = 'right';
          img.style.marginLeft = '1rem';
          img.style.marginBottom = '0.5rem';
          break;
        case 'center':
          img.style.display = 'block';
          img.style.marginLeft = 'auto';
          img.style.marginRight = 'auto';
          break;
      }
    }
  }, []);

  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPG, PNG, GIF, or WebP)');
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
          `${API_BASE_URL}/api/files/presigned-upload?fileName=${encodeURIComponent(fileName)}&fileType=${encodeURIComponent(fileType)}&folder=alerts`,
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

        // Get presigned URL for the uploaded image
        const publicImageResponse = await fetch(
          `${API_BASE_URL}/api/files/public-image/${encodeURIComponent(key)}`
        );

        if (!publicImageResponse.ok) {
          throw new Error('Failed to get image URL');
        }

        const { url: imageUrl } = await publicImageResponse.json();

        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection(true);
          const index = range ? range.index : quill.getLength();
          quill.insertEmbed(index, 'image', imageUrl);
          quill.setSelection(index + 1);
        }
      } catch (err: any) {
        console.error('Upload error:', err);
        alert(err.message || 'Failed to upload image');
      }
    };
  }, [getToken]);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'image'],
          ['align-image-left', 'align-image-center', 'align-image-right'],
          ['clean'],
        ],
        handlers: {
          image: handleImageUpload,
          'align-image-left': () => alignImage('left'),
          'align-image-center': () => alignImage('center'),
          'align-image-right': () => alignImage('right'),
        },
      },
    }),
    [handleImageUpload, alignImage]
  );

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <AdminSidebar />

      <div className='flex-1 p-8'>
        <h1 className='text-3xl font-bold text-gray-800 mb-6'>
          {filter === 'ALL' && `All Alerts (${alertsArray.length})`}
          {filter === 'PUBLISHED' && `Published Alerts (${filteredAlerts.length})`}
          {filter === 'DRAFTS' && `Draft Alerts (${filteredAlerts.length})`}
        </h1>

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

          <div className='relative priority-dropdown-container'>
            <button
              onClick={() => setPriorityDropdownOpen(!priorityDropdownOpen)}
              className='px-4 py-2 border border-gray-300 rounded-[10px] bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#194B90] hover:bg-gray-50 flex items-center gap-2'
            >
              <span>
                {priorityFilter.length > 0
                  ? `Priority (${priorityFilter.length})`
                  : 'Filter by Priority'}
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${priorityDropdownOpen ? 'rotate-180' : ''}`}
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

            {priorityDropdownOpen && (
              <div className='absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-[10px] shadow-lg z-50 min-w-[200px]'>
                <div className='py-2'>
                  {(['URGENT', 'MEDIUM', 'LOW'] as AlertPriority[]).map(priority => (
                    <label
                      key={priority}
                      className='flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer'
                    >
                      <input
                        type='checkbox'
                        checked={priorityFilter.includes(priority)}
                        onChange={e => {
                          if (e.target.checked) {
                            setPriorityFilter([...priorityFilter, priority]);
                          } else {
                            setPriorityFilter(priorityFilter.filter(p => p !== priority));
                          }
                        }}
                        className='w-4 h-4 text-[#194B90] border-gray-300 rounded focus:ring-[#194B90]'
                      />
                      <span className='ml-2 text-sm text-gray-700'>{priority}</span>
                    </label>
                  ))}
                </div>
                {priorityFilter.length > 0 && (
                  <div className='border-t border-gray-200 px-4 py-2'>
                    <button
                      onClick={() => {
                        setPriorityFilter([]);
                        setPriorityDropdownOpen(false);
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
                placeholder='Search alerts...'
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
                        sortedAlerts.length > 0 && selectedAlertIds.length === sortedAlerts.length
                      }
                      onChange={handleSelectAll}
                      className='w-4 h-4'
                    />
                  </th>
                  <th
                    className='px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100'
                    onClick={() => handleSort('title')}
                  >
                    <div className='flex items-center gap-2'>
                      Title
                      <SortIcon field='title' />
                    </div>
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                    Status
                  </th>
                  <th
                    className='px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100'
                    onClick={() => handleSort('priority')}
                  >
                    <div className='flex items-center gap-2'>
                      Priority
                      <SortIcon field='priority' />
                    </div>
                  </th>
                  <th
                    className='px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100'
                    onClick={() => handleSort('publishedDate')}
                  >
                    <div className='flex items-center gap-2'>
                      Published
                      <SortIcon field='publishedDate' />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200'>
                {sortedAlerts.map(alert => (
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
                        {alert.publishedDate
                          ? new Date(alert.publishedDate).toLocaleDateString()
                          : '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalAlerts / itemsPerPage)}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={totalAlerts}
            />
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <>
          <input type='checkbox' checked readOnly className='modal-toggle' />
          <div className='modal modal-open'>
            <div className='modal-box max-w-2xl max-h-[80vh] bg-white overflow-y-auto m-8'>
              <h3 className='font-bold text-xl text-gray-900 mb-4'>Create New Alert</h3>

              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1'>
                    Title <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    required
                    value={newAlert.title}
                    onChange={e => setNewAlert({ ...newAlert, title: e.target.value })}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                    placeholder='Enter alert title'
                  />
                </div>

                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-1'>
                    Priority <span className='text-red-500'>*</span>
                  </label>
                  <div className='relative'>
                    <button
                      type='button'
                      onClick={() => setIsPriorityDropdownOpen(!isPriorityDropdownOpen)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#194B90] hover:bg-gray-50 flex items-center justify-between text-sm'
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
                      <div className='absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 w-full'>
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

                <div className='mb-4'>
                  <label className='block text-sm font-semibold text-gray-700 mb-1'>
                    Content <span className='text-red-500'>*</span>
                  </label>
                  <div style={{ height: '250px' }}>
                    <ReactQuill
                      ref={quillRef}
                      theme='snow'
                      value={newAlert.content}
                      onChange={value => setNewAlert({ ...newAlert, content: value })}
                      placeholder='Enter alert content...'
                      modules={modules}
                      style={{ height: '200px' }}
                    />
                  </div>
                </div>

                <FileUpload
                  attachmentUrls={newAlert.attachmentUrls}
                  onFilesChange={files => setNewAlert({ ...newAlert, attachmentUrls: files })}
                />

                <div className='flex gap-3 pt-4'>
                  <button
                    type='button'
                    onClick={() => handleCreateAlert(true)}
                    disabled={isSubmitting}
                    className='px-6 py-2.5 bg-[#D54242] hover:bg-[#b53a3a] disabled:bg-[#e88888] text-white rounded-lg font-medium disabled:cursor-not-allowed'
                  >
                    {isSubmitting ? 'Publishing...' : 'Publish'}
                  </button>
                  <button
                    type='button'
                    onClick={() => handleCreateAlert(false)}
                    disabled={isSubmitting}
                    className='px-6 py-2.5 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white rounded-lg font-medium disabled:cursor-not-allowed'
                  >
                    {isSubmitting ? 'Drafting...' : 'Save to Drafts'}
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setNewAlert({
                        title: '',
                        content: '',
                        priority: 'MEDIUM',
                        isPublished: false,
                        attachmentUrls: [],
                      });
                    }}
                    className='px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium'
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
            <div
              className='modal-backdrop bg-black/30'
              onClick={() => {
                setIsCreateModalOpen(false);
                setNewAlert({
                  title: '',
                  content: '',
                  priority: 'MEDIUM',
                  isPublished: false,
                  attachmentUrls: [],
                });
              }}
            ></div>
          </div>
        </>
      )}

      {isDetailModalOpen && selectedAlert && (
        <>
          <input type='checkbox' checked readOnly className='modal-toggle' />
          <div className='modal modal-open'>
            <div className='modal-box max-w-2xl max-h-[80vh] bg-white overflow-y-auto m-8'>
              <h3 className='font-bold text-xl text-gray-900 mb-3'>
                {isEditMode ? 'Edit Alert' : selectedAlert.title}
              </h3>

              {isEditMode ? (
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-1'>Title</label>
                    <input
                      type='text'
                      value={editedAlert.title}
                      onChange={e => setEditedAlert({ ...editedAlert, title: e.target.value })}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                      placeholder='Alert title...'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-1'>
                      Priority
                    </label>
                    <select
                      value={editedAlert.priority}
                      onChange={e =>
                        setEditedAlert({
                          ...editedAlert,
                          priority: e.target.value as AlertPriority,
                        })
                      }
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#194B90]'
                    >
                      <option value='LOW'>Low</option>
                      <option value='MEDIUM'>Medium</option>
                      <option value='URGENT'>Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-1'>
                      Content
                    </label>
                    <div style={{ height: '250px' }}>
                      <ReactQuill
                        ref={quillRef}
                        theme='snow'
                        value={editedAlert.content}
                        onChange={content => setEditedAlert({ ...editedAlert, content })}
                        modules={modules}
                        placeholder='Write alert content...'
                        style={{ height: '200px' }}
                      />
                    </div>
                  </div>

                  <FileUpload
                    attachmentUrls={editedAlert.attachmentUrls}
                    onFilesChange={files =>
                      setEditedAlert({ ...editedAlert, attachmentUrls: files })
                    }
                  />
                </div>
              ) : (
                <div className='space-y-4'>
                  <div>
                    <h4 className='font-semibold text-base text-gray-800 mb-2'>
                      Basic Information
                    </h4>
                    <div className='grid grid-cols-2 gap-3'>
                      <div>
                        <span className='text-sm font-bold text-gray-600'>Priority:</span>
                        <p className='text-sm'>
                          <span
                            className={`px-2 py-1 inline-flex text-xs font-medium rounded-full ${getPriorityColor(
                              selectedAlert.priority
                            )}`}
                          >
                            {selectedAlert.priority}
                          </span>
                        </p>
                      </div>

                      <div>
                        <span className='text-sm font-bold text-gray-600'>Status:</span>
                        <p className='text-sm'>
                          <span
                            className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                              selectedAlert.isPublished
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {selectedAlert.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className='font-semibold text-base text-gray-800 mb-2'>Content</h4>
                    <div
                      className='prose max-w-none text-sm text-gray-900'
                      dangerouslySetInnerHTML={{ __html: selectedAlert.content }}
                    />
                  </div>

                  {selectedAlert.attachmentUrls && selectedAlert.attachmentUrls.length > 0 && (
                    <AttachmentList attachmentUrls={selectedAlert.attachmentUrls} />
                  )}

                  <div>
                    <h4 className='font-semibold text-base text-gray-800 mb-2'>Dates</h4>
                    <div className='grid grid-cols-2 gap-3'>
                      <div>
                        <span className='text-sm font-bold text-gray-600'>Created:</span>
                        <p className='text-sm text-gray-900'>
                          {new Date(selectedAlert.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className='text-sm font-bold text-gray-600'>Updated:</span>
                        <p className='text-sm text-gray-900'>
                          {new Date(selectedAlert.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isEditMode ? (
                <div className='modal-action'>
                  <button
                    onClick={async () => {
                      if (!editedAlert.title.trim()) {
                        setToast({ message: 'Title is required', type: 'error' });
                        return;
                      }
                      if (!editedAlert.content.trim()) {
                        setToast({ message: 'Content is required', type: 'error' });
                        return;
                      }

                      try {
                        await updateAlert.mutateAsync({
                          id: selectedAlert.id,
                          data: {
                            title: editedAlert.title,
                            content: editedAlert.content,
                            priority: editedAlert.priority,
                            attachmentUrls: editedAlert.attachmentUrls,
                          },
                        });
                        setToast({ message: 'Alert updated successfully', type: 'success' });
                        setIsEditMode(false);
                        closeDetailModal();
                      } catch (err: any) {
                        setToast({
                          message: err.message || 'Failed to update alert',
                          type: 'error',
                        });
                      }
                    }}
                    className='px-6 py-2.5 bg-[#D54242] hover:bg-[#b53a3a] text-white rounded-xl font-medium transition'
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditMode(false)}
                    className='px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition'
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className='modal-action'>
                  {!selectedAlert.isPublished && (
                    <>
                      <button
                        onClick={async () => {
                          try {
                            await updateAlert.mutateAsync({
                              id: selectedAlert.id,
                              data: {
                                isPublished: true,
                                publishedDate: new Date().toISOString(),
                              },
                            });
                            setToast({ message: 'Alert published successfully', type: 'success' });
                            closeDetailModal();
                          } catch (err: any) {
                            setToast({
                              message: err.message || 'Failed to publish alert',
                              type: 'error',
                            });
                          }
                        }}
                        className='px-6 py-2.5 bg-[#D54242] hover:bg-[#b53a3a] text-white rounded-xl font-medium transition'
                      >
                        Publish
                      </button>
                      <button
                        onClick={() => {
                          setIsEditMode(true);
                          setEditedAlert({
                            title: selectedAlert.title,
                            content: selectedAlert.content,
                            priority: selectedAlert.priority,
                            attachmentUrls: selectedAlert.attachmentUrls,
                          });
                        }}
                        className='px-6 py-2.5 bg-[#D54242] hover:bg-[#b53a3a] text-white rounded-xl font-medium transition'
                      >
                        Edit
                      </button>
                    </>
                  )}
                  <button
                    onClick={closeDetailModal}
                    className='px-6 py-2.5 bg-[#D54242] hover:bg-[#b53a3a] text-white rounded-xl font-medium transition'
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
            <div className='modal-backdrop bg-black/30' onClick={closeDetailModal}></div>
          </div>
        </>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
          isLoading={isDeleting}
          loadingText='Deleting...'
        />
      )}
    </div>
  );
};

export default AdminAlerts;
