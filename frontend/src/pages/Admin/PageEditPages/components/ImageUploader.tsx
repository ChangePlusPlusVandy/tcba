import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { API_BASE_URL } from '../../../../config/api';

interface ImageUploaderProps {
  label: string;
  currentImageUrl?: string;
  onChange: (imageUrl: string) => void;
  disabled?: boolean;
  folder?: string;
}

const ImageUploader = ({
  label,
  currentImageUrl,
  onChange,
  disabled = false,
  folder,
}: ImageUploaderProps) => {
  const { getToken } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loadingPresignedUrl, setLoadingPresignedUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadImage = async () => {
      if (!currentImageUrl) {
        setPreview(null);
        return;
      }

      // If it's a data URL or full HTTP URL, use it directly
      if (currentImageUrl.startsWith('data:') || currentImageUrl.startsWith('http')) {
        setPreview(currentImageUrl);
        return;
      }

      // Otherwise, it's an S3 key - get public image URL (no auth needed)
      setLoadingPresignedUrl(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/files/public-image/${encodeURIComponent(currentImageUrl)}`
        );

        if (response.ok) {
          const { url } = await response.json();
          setPreview(url);
        } else {
          console.error('Failed to get presigned URL for image');
          setPreview(null);
        }
      } catch (err) {
        console.error('Error loading image:', err);
        setPreview(null);
      } finally {
        setLoadingPresignedUrl(false);
      }
    };

    loadImage();
  }, [currentImageUrl, getToken, API_BASE_URL]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPG, PNG, or GIF)');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      const token = await getToken();
      const fileName = file.name;
      const fileType = file.type;

      let presignedUrl = `${API_BASE_URL}/api/files/presigned-upload?fileName=${encodeURIComponent(fileName)}&fileType=${encodeURIComponent(fileType)}`;
      if (folder) {
        presignedUrl += `&folder=${encodeURIComponent(folder)}`;
      }

      const presignedResponse = await fetch(presignedUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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

      setProgress(100);

      console.log('Upload successful! S3 Key:', key);

      // Keep the local preview (data URL) until we can load from S3
      // The parent component will store the key, and we'll use presigned URLs to display
      onChange(key);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image');
      setPreview(currentImageUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    // If there's a current image URL and it's an S3 key, delete it from S3
    if (
      currentImageUrl &&
      !currentImageUrl.startsWith('data:') &&
      !currentImageUrl.startsWith('http')
    ) {
      try {
        const token = await getToken();
        const response = await fetch(
          `${API_BASE_URL}/api/files/page-image/${encodeURIComponent(currentImageUrl)}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          console.error('Failed to delete image from S3');
          // Continue anyway to clear the UI
        }
      } catch (err) {
        console.error('Error deleting image from S3:', err);
        // Continue anyway to clear the UI
      }
    }

    setPreview(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className='flex flex-col space-y-2 mb-6'>
      <label className='text-sm font-semibold text-gray-700'>{label}</label>

      {loadingPresignedUrl ? (
        <div className='w-full max-w-md h-48 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center'>
          <p className='text-gray-400'>Loading image...</p>
        </div>
      ) : preview ? (
        <div className='relative w-full max-w-md'>
          <img
            src={preview}
            alt='Preview'
            className='w-full h-48 object-cover rounded-md border border-gray-300'
            onLoad={() => console.log('Image loaded successfully:', preview)}
            onError={e => {
              console.error('Image failed to load:', preview);
              console.error('Error event:', e);
              setError('Failed to load image. Please try again.');
            }}
          />
          {!disabled && (
            <button
              type='button'
              onClick={handleRemove}
              disabled={uploading}
              className='absolute top-2 right-2 bg-[#D54242] text-white px-3 py-1 rounded-md text-sm hover:bg-[#b53a3a] disabled:bg-gray-400'
            >
              Remove
            </button>
          )}
        </div>
      ) : (
        <div className='w-full max-w-md h-48 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center'>
          <p className='text-gray-400'>No image uploaded</p>
        </div>
      )}

      {!disabled && (
        <div className='flex flex-col space-y-2'>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/jpeg,image/jpg,image/png,image/gif'
            onChange={handleFileSelect}
            disabled={uploading}
            className='text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#D54242] file:text-white hover:file:bg-[#b53a3a] disabled:opacity-50'
          />

          {uploading && (
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className='bg-[#D54242] h-2 rounded-full transition-all duration-300'
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {error && <p className='text-red-500 text-sm'>{error}</p>}

          <p className='text-xs text-gray-500'>Accepted formats: JPG, PNG, GIF (max 5MB)</p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
