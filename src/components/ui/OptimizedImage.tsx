import { useState, useEffect } from 'react';
import { getPublicUrl } from '../../lib/storage';
import { Loader2, ImageOff } from 'lucide-react';
import { cn } from '../../lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  bucket?: string;
}

export function OptimizedImage({ src, alt, className, fallback, bucket = 'product-images' }: OptimizedImageProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setResolvedUrl(fallback || null);
      return;
    }

    // If it's already a full URL (http), use it directly
    if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:')) {
      setResolvedUrl(src);
      return;
    }

    // If it's a relative path starting with / or ./ or ../, it's likely a local asset
    if (src.startsWith('/') || src.startsWith('./') || src.startsWith('../')) {
      setResolvedUrl(src);
      return;
    }

    // Otherwise, assume it's a Supabase Storage path
    setLoading(true);
    setError(false);
    try {
      const url = getPublicUrl(bucket, src);
      if (url) {
        setResolvedUrl(url);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Failed to resolve image path:", src, err);
      setError(true);
    }
    setLoading(false);
  }, [src, fallback, bucket]);

  if (loading && !resolvedUrl) {
    return (
      <div className={cn("flex items-center justify-center bg-white/5 animate-pulse", className)}>
        <Loader2 className="animate-spin text-blue-500/50" size={24} />
      </div>
    );
  }

  if (error || !resolvedUrl) {
    return (
      <div className={cn("flex items-center justify-center bg-white/5 text-gray-700", className)}>
        <ImageOff size={24} />
      </div>
    );
  }

  return (
    <img 
      src={resolvedUrl} 
      alt={alt} 
      className={className}
      referrerPolicy="no-referrer"
    />
  );
}
