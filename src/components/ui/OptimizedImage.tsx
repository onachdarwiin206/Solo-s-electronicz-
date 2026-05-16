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

  const DEFAULT_PLACEHOLDER = "https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=800&auto=format&fit=crop";

  useEffect(() => {
    // 5. Add console debugging
    console.log("IMAGE SRC:", src, typeof src);

    // 2 & 3. Ensure src is a valid string
    if (!src || typeof src !== 'string') {
      setResolvedUrl(fallback || DEFAULT_PLACEHOLDER);
      return;
    }

    // 26: If it's already a full URL (http), use it directly
    if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:')) {
      setResolvedUrl(src);
      return;
    }

    // 32: If it's a relative path starting with / or ./ or ../, it's likely a local asset
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
        console.warn("Could not resolve Supabase URL for:", src);
        setResolvedUrl(fallback || DEFAULT_PLACEHOLDER);
      }
    } catch (err) {
      console.error("Failed to resolve image path:", src, err);
      setResolvedUrl(fallback || DEFAULT_PLACEHOLDER);
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

  // 8. Add onError fallback handling for broken images
  const handleError = () => {
    console.error("Image failed to load:", resolvedUrl);
    setError(true);
    setResolvedUrl(fallback || DEFAULT_PLACEHOLDER);
  };

  return (
    <div className={cn("relative overflow-hidden group/optimg", className)}>
      {error && !resolvedUrl ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5 text-gray-700">
          <ImageOff size={24} />
        </div>
      ) : (
        <img 
          src={resolvedUrl || DEFAULT_PLACEHOLDER} 
          alt={alt} 
          className={cn(
            "w-full h-full transition-transform duration-700",
            className?.includes('object-contain') ? 'object-contain' : 'object-cover'
          )}
          referrerPolicy="no-referrer"
          onError={handleError}
        />
      )}
    </div>
  );
}
