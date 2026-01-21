import { useState } from 'react';
import { MutatingDots } from 'react-loader-spinner';
import AdminSidebar from '../../../components/AdminSidebar';
import Toast from '../../../components/Toast';
import ConfirmModal from '../../../components/ConfirmModal';
import { useAdminTags } from '../../../hooks/queries/useAdminTags';
import { useTagMutations } from '../../../hooks/mutations/useTagMutations';

type Tag = {
  id: string;
  name: string;
  _count?: {
    announcements: number;
  };
};

const Tags = () => {
  const { data: tags = [], isLoading: loading } = useAdminTags();
  const tagsArray = tags as Tag[];
  const { createTag, deleteTag } = useTagMutations();

  const [newTagName, setNewTagName] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTagName.trim()) {
      setToast({ message: 'Please enter a tag name', type: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      await createTag.mutateAsync({ name: newTagName.trim() });
      setToast({ message: 'Tag created successfully!', type: 'success' });
      setNewTagName('');
    } catch (err: any) {
      console.error('Error creating tag:', err);
      setToast({ message: err.message || 'Failed to create tag', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleDeleteSelected = async () => {
    try {
      setIsDeleting(true);
      const tagCount = selectedTagIds.length;

      await Promise.all(selectedTagIds.map(tagId => deleteTag.mutateAsync(tagId)));

      setToast({
        message: `${tagCount} tag${tagCount > 1 ? 's' : ''} deleted successfully!`,
        type: 'success',
      });
      setSelectedTagIds([]);
    } catch (err: any) {
      console.error('Error deleting tags:', err);
      setToast({ message: err.message || 'Failed to delete tags', type: 'error' });
    } finally {
      setIsDeleting(false);
      setShowConfirmModal(false);
    }
  };

  if (loading) {
    return (
      <div className='flex min-h-screen bg-gray-50'>
        <AdminSidebar />
        <div className='flex-1 flex items-center justify-center'>
          <MutatingDots
            visible={true}
            height='100'
            width='100'
            color='#D54242'
            secondaryColor='#D54242'
            radius='12.5'
            ariaLabel='mutating-dots-loading'
          />
        </div>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <AdminSidebar />
      <div className='flex-1 p-8'>
        <h1 className='text-3xl font-bold text-gray-800 mb-6'>Tag Management</h1>

        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}

        <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
          <h2 className='text-xl font-semibold text-gray-800 mb-4'>Add New Tag</h2>
          <form onSubmit={handleAddTag} className='flex gap-3'>
            <input
              type='text'
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              placeholder='Enter tag name...'
              className='flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#194B90]'
              disabled={submitting}
            />
            <button
              type='submit'
              disabled={submitting || !newTagName.trim()}
              className='px-6 py-2 bg-[#D54242] text-white rounded-md hover:bg-[#b53a3a] disabled:opacity-50 disabled:cursor-not-allowed transition font-medium'
            >
              {submitting ? 'Adding...' : 'Add Tag'}
            </button>
          </form>
        </div>

        <div className='bg-white rounded-lg shadow-md p-6'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-3'>
              <h2 className='text-xl font-semibold text-gray-800'>All Tags ({tagsArray.length})</h2>
              {selectedTagIds.length > 0 && (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isDeleting}
                  className='px-6 py-2 bg-[#D54242] text-white rounded-md hover:bg-[#b53a3a] disabled:opacity-50 disabled:cursor-not-allowed transition font-medium'
                >
                  Delete ({selectedTagIds.length})
                </button>
              )}
            </div>
            {tagsArray.length > 10 && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className='px-3 py-1.5 text-sm border border-[#194B90] text-[#194B90] bg-white rounded-md hover:bg-[#EBF3FF] transition font-medium'
              >
                {isCollapsed ? 'Expand All' : 'Collapse'}
              </button>
            )}
          </div>

          {tagsArray.length === 0 ? (
            <div className='text-center py-8'>
              <svg
                className='mx-auto h-12 w-12 text-gray-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'
                />
              </svg>
              <p className='mt-2 text-gray-500'>No tags created yet</p>
              <p className='text-sm text-gray-400'>Add your first tag using the form above</p>
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ${
                isCollapsed && tagsArray.length > 10 ? 'max-h-48 overflow-hidden' : ''
              }`}
            >
              {tagsArray.map((tag: Tag) => (
                <div
                  key={tag.id}
                  className='flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition'
                >
                  <div className='flex items-center gap-2 flex-1 min-w-0'>
                    <input
                      type='checkbox'
                      checked={selectedTagIds.includes(tag.id)}
                      onChange={() => handleToggleTag(tag.id)}
                      className='w-4 h-4 text-[#D54242] border-gray-300 rounded focus:ring-[#D54242]'
                    />
                    <span className='w-2 h-2 rounded-full bg-[#D54242] flex-shrink-0'></span>
                    <span className='text-gray-800 font-medium truncate'>{tag.name}</span>
                    {tag._count && tag._count.announcements > 0 && (
                      <span className='text-xs text-gray-500 flex-shrink-0'>
                        ({tag._count.announcements})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isCollapsed && tagsArray.length > 10 && (
            <div className='mt-4 text-center'>
              <button
                onClick={() => setIsCollapsed(false)}
                className='px-3 py-1.5 text-sm border border-[#194B90] text-[#194B90] bg-white rounded-md hover:bg-[#EBF3FF] transition font-medium'
              >
                Show all {tagsArray.length} tags
              </button>
            </div>
          )}
        </div>

        {showConfirmModal && (
          <ConfirmModal
            title='Delete Tags'
            message={`Are you sure you want to delete ${selectedTagIds.length} tag${selectedTagIds.length > 1 ? 's' : ''}? This action cannot be undone.`}
            confirmText='Delete'
            onConfirm={handleDeleteSelected}
            onCancel={() => setShowConfirmModal(false)}
            type='danger'
            isLoading={isDeleting}
            loadingText='Deleting...'
          />
        )}
      </div>
    </div>
  );
};

export default Tags;
