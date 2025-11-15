import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';

interface ImageUploaderProps {
  label: string;
  currentImageUrl?: string;
  onChange: (imageUrl: string) => void;
  disabled?: boolean;
}

const ImageUploader = ({
  label,
  currentImageUrl,
  onChange,
  disabled = false,
}: ImageUploaderProps) => {
  const { getToken } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

  useEffect(() => {
    setPreview(currentImageUrl || null);
  }, [currentImageUrl]);

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

      const presignedResponse = await fetch(
        `${API_BASE_URL}/api/uploads/presigned-upload?fileName=${encodeURIComponent(fileName)}&fileType=${encodeURIComponent(fileType)}`,
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

      setProgress(100);

      const bucketName = import.meta.env.VITE_AWS_S3_BUCKET_NAME;
      const region = import.meta.env.VITE_AWS_REGION || 'us-east-2';
      const imageUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

      onChange(imageUrl);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image');
      setPreview(currentImageUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className='flex flex-col space-y-2 mb-6'>
      <label className='text-sm font-semibold text-gray-700'>{label}</label>

      {preview ? (
        <div className='relative w-full max-w-md'>
          <img
            src={preview}
            alt='Preview'
            className='w-full h-48 object-cover rounded-md border border-gray-300'
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
