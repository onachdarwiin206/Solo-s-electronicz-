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

const isKnownBrokenUrl = (url: string): boolean => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('iphone%2016%20pro%20max') ||
    lower.includes('iphone 16 pro max') ||
    lower.includes('lenovo%20tab') ||
    lower.includes('lenovo tab')
  );
};

const isFakeOrPlaceholder = (url: string | null | undefined): boolean => {
  if (!url) return true;
  const lower = url.toLowerCase();
  return (
    lower.includes('photo-1518770660439-4636190af475') ||
    lower.includes('photo-1550745165-9bc0b252726f') ||
    lower.includes('placeholder') ||
    lower.trim() === ''
  );
};

export function OptimizedImage({ src, alt, className, fallback, bucket = 'product-images' }: OptimizedImageProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // 5. Add console debugging
    console.log("IMAGE SRC:", src, typeof src);

    // 2 & 3. Ensure src is a valid string
    if (!src || typeof src !== 'string' || isFakeOrPlaceholder(src)) {
      setResolvedUrl(null);
      return;
    }

    // Intercept known broken or missing Supabase images with null / blank representation
    if (isKnownBrokenUrl(src)) {
      setResolvedUrl(null);
      return;
    }

    // 26: If it's already a full URL (http), use it directly
    if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:')) {
      if (isFakeOrPlaceholder(src)) {
        setResolvedUrl(null);
      } else {
        setResolvedUrl(src);
      }
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
      if (url && !isFakeOrPlaceholder(url)) {
        setResolvedUrl(url);
      } else {
        console.warn("Could not resolve Supabase URL for:", src);
        setResolvedUrl(null);
      }
    } catch (err) {
      console.error("Failed to resolve image path:", src, err);
      setResolvedUrl(null);
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
    console.info("[OptimizedImage] Image placeholder fallback applied for:", resolvedUrl);
    setError(true);
    setResolvedUrl(null);
  };

  if (!resolvedUrl || error || isFakeOrPlaceholder(resolvedUrl)) {
    return (
      <div className={cn("w-full h-full bg-zinc-950/40 border border-white/[0.02] flex items-center justify-center text-zinc-700/50", className)}>
        {/* Completely blank - no fake/mock images as requested */}
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden group/optimg bg-neutral-900", className)}>
      <img 
        src={resolvedUrl} 
        alt={alt} 
        className={cn(
          "w-full h-full transition-transform duration-700",
          className?.includes('object-contain') ? 'object-contain' : 'object-cover'
        )}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={handleError}
      />
    </div>
  );
}
