import { useState, useEffect } from 'react';
import { getPublicUrl } from '../../lib/storage';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  bucket?: string;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

const getFallbackProductImage = (name: string): string => {
  const n = (name || '').toLowerCase();
  
  if (n.includes('s24') || n.includes('samsung') || n.includes('galaxy') || n.includes('phone') || n.includes('iphone') || n.includes('mobile')) {
    return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop';
  }
  if (n.includes('macbook') || n.includes('laptop') || n.includes('computer') || n.includes('spectre') || n.includes('xps') || n.includes('dell') || n.includes('hp') || n.includes('desktop') || n.includes('pro') || n.includes('m3')) {
    return 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?q=80&w=800&auto=format&fit=crop';
  }
  if (n.includes('airpods') || n.includes('wh-1000') || n.includes('headphones') || n.includes('earphone') || n.includes('audio') || n.includes('max') || n.includes('sound') || n.includes('speaker') || n.includes('sony')) {
    return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop';
  }
  if (n.includes('console') || n.includes('ps5') || n.includes('xbox') || n.includes('switch') || n.includes('gaming') || n.includes('game') || n.includes('playstation')) {
    return 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=800&auto=format&fit=crop';
  }
  if (n.includes('watch') || n.includes('band') || n.includes('smartwatch') || n.includes('apple watch') || n.includes('fitbit')) {
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop';
  }
  return 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=800&auto=format&fit=crop'; // default beautiful premium tech accessories
};

const isFakeOrPlaceholder = (url: string | null | undefined): boolean => {
  if (!url) return true;
  return url.trim() === '';
};

export function OptimizedImage({ src, alt, className, fallback, bucket = 'product-images', onLoad }: OptimizedImageProps) {
  // Initialize with the URL immediately if it's already a full web URL to avoid mount flickering
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(() => {
    if (src && typeof src === 'string' && !isFakeOrPlaceholder(src)) {
      if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:') || src.startsWith('/') || src.startsWith('./') || src.startsWith('../')) {
        return src;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (src && typeof src === 'string' && !isFakeOrPlaceholder(src)) {
      if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:') || src.startsWith('/') || src.startsWith('./') || src.startsWith('../')) {
        return false;
      }
      return true;
    }
    return false;
  });
  const [error, setError] = useState(false);

  useEffect(() => {
    console.log("IMAGE SRC:", src, typeof src);

    if (!src || typeof src !== 'string' || isFakeOrPlaceholder(src)) {
      setResolvedUrl(null);
      return;
    }

    if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:')) {
      setResolvedUrl(src);
      setError(false);
      return;
    }

    if (src.startsWith('/') || src.startsWith('./') || src.startsWith('../')) {
      setResolvedUrl(src);
      setError(false);
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
        setResolvedUrl(src); // Fallback to raw src
      }
    } catch (err) {
      console.error("Failed to resolve image path:", src, err);
      setResolvedUrl(src); // Fallback to raw src
    }
    setLoading(false);
  }, [src, alt, fallback, bucket]);

  if (loading && !resolvedUrl) {
    return (
      <div className={cn("flex items-center justify-center bg-white/5 animate-pulse", className)}>
        <Loader2 className="animate-spin text-blue-500/50" size={24} />
      </div>
    );
  }

  const handleError = () => {
    console.info("[OptimizedImage] Fallback to premium category image for:", alt);
    setError(true);
  };

  // Render the real image linked to Supabase first; only use a fallback if the link is completely empty
  const currentUrl = resolvedUrl || src || getFallbackProductImage(alt);

  return (
    <div className={cn("relative overflow-hidden group/optimg bg-transparent", className)}>
      <img 
        src={currentUrl} 
        alt={alt} 
        className={cn(
          "w-full h-full transition-transform duration-700",
          className?.includes('object-contain') ? 'object-contain' : 'object-cover'
        )}
        referrerPolicy="no-referrer"
        loading="lazy"
        onLoad={onLoad}
        onError={handleError}
      />
    </div>
  );
}
