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

const getSmartFallbackUrl = (urlOrPath: string, altText: string): string => {
  const cleanStr = (urlOrPath + " " + altText).toLowerCase();
  
  if (cleanStr.includes('iphone 16') || cleanStr.includes('iphone16')) {
    return 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=800&auto=format&fit=crop';
  }
  if (cleanStr.includes('lenovo tab') || cleanStr.includes('lenovotab') || cleanStr.includes('lenovo')) {
    return 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=800&auto=format&fit=crop';
  }
  if (cleanStr.includes('laptop') || cleanStr.includes('macbook') || cleanStr.includes('computer') || cleanStr.includes('thinkpad') || cleanStr.includes('hp spectre')) {
    return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop';
  }
  if (cleanStr.includes('phone') || cleanStr.includes('galaxy') || cleanStr.includes('samsung') || cleanStr.includes('pixel') || cleanStr.includes('infinix') || cleanStr.includes('tecno')) {
    return 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=800&auto=format&fit=crop';
  }
  if (cleanStr.includes('watch') || cleanStr.includes('smartwatch') || cleanStr.includes('wearable')) {
    return 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=800&auto=format&fit=crop';
  }
  if (cleanStr.includes('gaming') || cleanStr.includes('console') || cleanStr.includes('playstation') || cleanStr.includes('xbox') || cleanStr.includes('switch')) {
    return 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=800&auto=format&fit=crop';
  }
  if (cleanStr.includes('headphone') || cleanStr.includes('audio') || cleanStr.includes('earbud') || cleanStr.includes('soundbar') || cleanStr.includes('speaker') || cleanStr.includes('airpods')) {
    return 'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=800&auto=format&fit=crop';
  }
  if (cleanStr.includes('tablet') || cleanStr.includes('ipad') || cleanStr.includes('android tab')) {
    return 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=800&auto=format&fit=crop';
  }
  if (cleanStr.includes('tv') || cleanStr.includes('television') || cleanStr.includes('monitor') || cleanStr.includes('oled')) {
    return 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?q=80&w=800&auto=format&fit=crop';
  }
  if (cleanStr.includes('camera') || cleanStr.includes('gopro') || cleanStr.includes('security')) {
    return 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop';
  }
  return 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop';
};

export function OptimizedImage({ src, alt, className, fallback, bucket = 'product-images' }: OptimizedImageProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const DEFAULT_PLACEHOLDER = "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop";

  useEffect(() => {
    // 5. Add console debugging
    console.log("IMAGE SRC:", src, typeof src);

    // 2 & 3. Ensure src is a valid string
    if (!src || typeof src !== 'string') {
      setResolvedUrl(fallback || DEFAULT_PLACEHOLDER);
      return;
    }

    // Intercept known broken or missing Supabase images with highly polished equivalents
    if (isKnownBrokenUrl(src)) {
      const smartUrl = getSmartFallbackUrl(src, alt);
      setResolvedUrl(smartUrl);
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

  const SoloFallback = () => (
    <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center overflow-hidden border border-white/5">
      <div className="w-full relative overflow-hidden whitespace-nowrap py-2 bg-blue-600/10 border-y border-blue-500/20">
        <div className="animate-marquee inline-block">
          <span className="text-[10px] font-black uppercase tracking-tighter text-blue-500 px-4">Solo's Electronics — Global Tech Hub — Solo's Electronics — Premium Hardware — </span>
          <span className="text-[10px] font-black uppercase tracking-tighter text-blue-500 px-4">Solo's Electronics — Global Tech Hub — Solo's Electronics — Premium Hardware — </span>
        </div>
      </div>
      <div className="mt-2 text-[8px] font-black uppercase text-gray-600 tracking-widest opacity-50">Visual Pending</div>
    </div>
  );

  return (
    <div className={cn("relative overflow-hidden group/optimg bg-neutral-900", className)}>
      {((error && !resolvedUrl) || (!loading && !resolvedUrl)) ? (
        <SoloFallback />
      ) : (
        <img 
          src={resolvedUrl || DEFAULT_PLACEHOLDER} 
          alt={alt} 
          className={cn(
            "w-full h-full transition-transform duration-700",
            className?.includes('object-contain') ? 'object-contain' : 'object-cover'
          )}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={handleError}
        />
      )}
    </div>
  );
}
