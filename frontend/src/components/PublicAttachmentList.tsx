import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { API_BASE_URL } from '../config/api';

interface PublicAttachmentListProps {
  attachmentUrls: string[];
  className?: string;
  requireAuth?: boolean;
}

const PublicAttachmentList = ({
  attachmentUrls,
  className = '',
  requireAuth = false,
}: PublicAttachmentListProps) => {
  const { getToken } = useAuth();
  const [downloading, setDownloading] = useState<string | null>(null);

  const getFileName = (fileKey: string) => {
    const parts = fileKey.split('/');
    const fileName = parts[parts.length - 1];

    return fileName.replace(/^\d+-/, '');
  };

  const getFileExtension = (fileKey: string) => {
    const fileName = getFileName(fileKey);
    const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    return ext.substring(1);
  };

  const getFileIcon = (fileKey: string) => {
    const ext = getFileExtension(fileKey);

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return (
        <svg
          className='w-5 h-5 text-blue-500'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
          />
        </svg>
      );
    }

    if (ext === 'pdf') {
      return (
        <svg className='w-5 h-5 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'
          />
        </svg>
      );
    }

    if (['doc', 'docx'].includes(ext)) {
      return (
        <svg
          className='w-5 h-5 text-blue-600'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
          />
        </svg>
      );
    }

    return (
      <svg className='w-5 h-5 text-gray-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'
        />
      </svg>
    );
  };

  const handleDownload = async (fileKey: string) => {
    try {
      setDownloading(fileKey);

      let response;
      if (requireAuth) {
        const token = await getToken();
        response = await fetch(
          `${API_BASE_URL}/api/files/authenticated-download/${encodeURIComponent(fileKey)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        response = await fetch(
          `${API_BASE_URL}/api/files/public-download/${encodeURIComponent(fileKey)}`
        );
      }

      if (!response.ok) {
        throw new Error('Failed to get download URL');
      }

      const { downloadUrl } = await response.json();

      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  if (attachmentUrls.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <h4 className='font-semibold text-base text-gray-800 mb-2'>Attachments</h4>
      <div className='space-y-2'>
        {attachmentUrls.map((fileKey, index) => (
          <button
            key={index}
            onClick={() => handleDownload(fileKey)}
            disabled={downloading === fileKey}
            className='w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition text-left disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {getFileIcon(fileKey)}
            <span className='flex-1 text-sm font-medium text-gray-700 truncate'>
              {getFileName(fileKey)}
            </span>
            <span className='text-xs text-gray-500 uppercase'>{getFileExtension(fileKey)}</span>
            {downloading === fileKey ? (
              <svg className='w-5 h-5 text-gray-400 animate-spin' fill='none' viewBox='0 0 24 24'>
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                />
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                />
              </svg>
            ) : (
              <svg
                className='w-5 h-5 text-gray-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
                />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PublicAttachmentList;
