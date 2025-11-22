interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  loadingText?: string;
}

const ConfirmModal = ({
  title,
  message,
  confirmText,
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning',
  isLoading = false,
  loadingText = 'Processing...',
}: ConfirmModalProps) => {
  return (
    <>
      <input type='checkbox' checked={true} readOnly className='modal-toggle' />
      <div className='modal modal-open'>
        <div className='modal-box bg-white' data-type={type}>
          <h3 className='font-bold text-lg text-gray-900 mb-2'>{title}</h3>
          <p className='py-4 text-gray-600'>{message}</p>
          <div className='modal-action'>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className='btn bg-gray-200 hover:bg-gray-300 text-gray-800 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className='btn bg-[#D54242] hover:bg-[#b53a3a] disabled:bg-[#e88888] text-white border-none disabled:cursor-not-allowed'
            >
              {isLoading ? loadingText : confirmText}
            </button>
          </div>
        </div>
        <div className='modal-backdrop bg-black/30' onClick={onCancel}></div>
      </div>
    </>
  );
};

export default ConfirmModal;
