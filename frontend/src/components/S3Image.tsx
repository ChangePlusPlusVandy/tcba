import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

interface S3ImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  loading?: 'lazy' | 'eager';
}

const S3Image = ({ src, alt, className, fallbackSrc, loading = 'lazy' }: S3ImageProps) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      if (!src) {
        setImageSrc(fallbackSrc || '');
        setLoading(false);
        return;
      }

      if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
        setImageSrc(src);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/files/public-image/${encodeURIComponent(src)}`
        );

        if (response.ok) {
          const { url } = await response.json();
          setImageSrc(url);
        } else {
          console.error('Failed to get presigned URL for image:', src);
          if (fallbackSrc) {
            setImageSrc(fallbackSrc);
          }
          setError(true);
        }
      } catch (err) {
        console.error('Error loading image:', err);
        if (fallbackSrc) {
          setImageSrc(fallbackSrc);
        }
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [src, fallbackSrc]);

  const handleError = () => {
    console.error('Failed to load image:', imageSrc);
    setError(true);
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
    }
  };

  if (loading) {
    return <div className={className} style={{ backgroundColor: '#f3f4f6' }} />;
  }

  if (!imageSrc && !fallbackSrc) {
    return null;
  }

  return (
    <img
      src={imageSrc || fallbackSrc || ''}
      alt={alt}
      className={className}
      loading={loading}
      onError={handleError}
    />
  );
};

export default S3Image;
