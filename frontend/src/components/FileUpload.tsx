import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { API_BASE_URL } from '../config/api';

interface FileUploadProps {
  attachmentUrls: string[];
  onFilesChange: (files: string[]) => void;
  maxFiles?: number;
}

const FileUpload = ({ attachmentUrls, onFilesChange, maxFiles }: FileUploadProps) => {
  const { getToken } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (maxFiles && attachmentUrls.length + files.length > maxFiles) {
      setUploadError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const uploadedKeys: string[] = [];

      for (const file of Array.from(files)) {
        const token = await getToken();
        const response = await fetch(
          `${API_BASE_URL}/api/files/presigned-upload?fileName=${encodeURIComponent(
            file.name
          )}&fileType=${encodeURIComponent(file.type)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to get upload URL');
        }

        const { uploadUrl, key } = await response.json();

        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }

        uploadedKeys.push(key);
      }

      onFilesChange([...attachmentUrls, ...uploadedKeys]);
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadError('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);

      event.target.value = '';
    }
  };

  const removeFile = (fileKey: string) => {
    onFilesChange(attachmentUrls.filter(key => key !== fileKey));
  };

  const getFileName = (fileKey: string) => {
    const parts = fileKey.split('/');
    const fileName = parts[parts.length - 1];

    return fileName.replace(/^\d+-/, '');
  };

  return (
    <div>
      <label className='block text-sm font-semibold text-gray-700 mb-1'>Attachments</label>

      <div className='mb-4'>
        <label className='inline-block cursor-pointer'>
          <input
            type='file'
            multiple
            accept='.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt'
            onChange={handleFileUpload}
            disabled={uploading || (maxFiles ? attachmentUrls.length >= maxFiles : false)}
            className='hidden'
          />
          <span
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
              uploading || (maxFiles && attachmentUrls.length >= maxFiles)
                ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer'
            }`}
          >
            {uploading
              ? 'Uploading...'
              : maxFiles
                ? `Choose Files (${attachmentUrls.length}/${maxFiles})`
                : `Choose Files (${attachmentUrls.length})`}
          </span>
        </label>
        <p className='text-xs text-gray-500 mt-2'>
          Allowed: PDF, DOC, DOCX, JPG, PNG, GIF, TXT
          {maxFiles && ` (Max ${maxFiles} files)`}
        </p>
      </div>

      {uploadError && (
        <div className='text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-2'>
          {uploadError}
        </div>
      )}

      {attachmentUrls.length > 0 && (
        <div className='space-y-2'>
          {attachmentUrls.map((fileKey, index) => (
            <div
              key={index}
              className='flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2'
            >
              <div className='flex items-center gap-2 flex-1 min-w-0'>
                <svg
                  className='w-4 h-4 text-gray-500 flex-shrink-0'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13'
                  />
                </svg>
                <span className='text-sm text-gray-700 truncate'>{getFileName(fileKey)}</span>
              </div>
              <button
                type='button'
                onClick={() => removeFile(fileKey)}
                className='ml-2 text-red-600 hover:text-red-800 flex-shrink-0'
                disabled={uploading}
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
