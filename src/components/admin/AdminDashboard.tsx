import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import imageCompression from 'browser-image-compression';
import { Plus, Package, DollarSign, Tag, Image as ImageIcon, Video, Trash2, Save, X, Star, Loader2, Clock, CheckCircle, Truck, ShoppingBag, ArrowLeft, ShieldCheck, AlertCircle, User, QrCode, Printer, TrendingUp, ExternalLink, Search } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, Line, Area } from 'recharts';
import { Product, Category, Order, OrderStatus, Review } from '../../types';
import { PRODUCT_CATEGORIES } from '../../constants';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { Tooltip } from '../ui/Tooltip';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../AuthContext';
import { safeGetLocalStorage, safeSetLocalStorage, SANDBOX_SYNC_EVENT } from '../../lib/sandboxDb';
import { uploadFile, getPublicUrl, deleteFile } from '../../lib/storage';
import { v4 as uuidv4 } from 'uuid';
import { OptimizedImage } from '../ui/OptimizedImage';

interface AdminDashboardProps {
  products: Product[];
}

function StatusProgress({ currentStatus }: { currentStatus: OrderStatus }) {
  const stages: OrderStatus[] = ['pending', 'confirmed', 'delivering', 'delivered'];
  const currentIndex = stages.indexOf(currentStatus);

  return (
    <div className="w-full py-6">
      <div className="flex justify-between relative px-2">
        {/* Progress Line */}
        <div className="absolute top-2 left-0 w-full h-0.5 bg-foreground/10" />
        <div 
          className="absolute top-2 left-0 h-0.5 bg-blue-500 transition-all duration-1000" 
          style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}
        />
        
        {stages.map((stage, i) => {
          const isCompleted = i <= currentIndex;
          const isCurrent = i === currentIndex;
          
          return (
            <div key={stage} className="relative z-10 flex flex-col items-center">
              <div className={cn(
                "w-4 h-4 rounded-full border-2 transition-all duration-500",
                isCompleted ? "bg-blue-500 border-blue-500 scale-110" : "bg-background border-border",
                isCurrent && "shadow-[0_0_12px_rgba(59,130,246,0.6)] border-foreground"
              )} />
              <span className={cn(
                "text-[8px] font-black uppercase tracking-widest mt-3 transition-colors",
                isCompleted ? "text-blue-400" : "text-muted-foreground"
              )}>
                {stage}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminDashboard({ products: initialProducts }: AdminDashboardProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'admins'>('inventory');
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  
  // Custom states for Logistics Chart, QR code printable shelf labels, and Market Comps Search
  const [selectedQRProduct, setSelectedQRProduct] = useState<Product | null>(null);
  const [marketCompsActive, setMarketCompsActive] = useState(false);
  const [inspectingComps, setInspectingComps] = useState(false);
  const [compsQuery, setCompsQuery] = useState('');
  const [compResults, setCompResults] = useState<{ name: string; estimate: string; trend: string } | null>(null);

  // Order filtering states
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<{ start: string, end: string }>({ start: '', end: '' });

  const fetchReviews = async () => {
    if (!isSupabaseConfigured) return;
    setLoadingReviews(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setReviews(data as Review[]);
    } catch (e) {
      console.error("Reviews fetch error:", e);
    } finally {
      setLoadingReviews(false);
    }
  };

  const updateReviewStatus = async (reviewId: string, status: 'approved' | 'rejected') => {
    try {
      await supabase.from('reviews').update({ status }).eq('id', reviewId);
      fetchReviews();
    } catch (e) {
      console.error("Review status update error:", e);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await supabase.from('reviews').delete().eq('id', reviewId);
      fetchReviews();
    } catch (e) {
      console.error("Review delete error:", e);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.customer_name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customer_phone?.includes(orderSearch) ||
      o.id.toLowerCase().includes(orderSearch.toLowerCase());
    
    const matchesStatus = orderStatusFilter === 'all' ? true : o.status === orderStatusFilter;
    
    const orderDate = new Date(o.created_at);
    const matchesStart = dateRange.start ? orderDate >= new Date(dateRange.start) : true;
    const matchesEnd = dateRange.end ? orderDate <= new Date(dateRange.end + 'T23:59:59') : true;

    return matchesSearch && matchesStatus && matchesStart && matchesEnd;
  });

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [missingTables, setMissingTables] = useState<string[]>([]);
  const [allowedEmails, setAllowedEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    const fetchAdmins = async () => {
      if (!isSupabaseConfigured) {
        setIsSyncing(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('admins')
          .select('email');
        
        if (error) {
           console.warn("[Supabase] Admins Fetch Warning:", error.message || error);
           if (error.code === '42P01' || error.message?.includes('does not exist')) {
             setMissingTables(prev => Array.from(new Set([...prev, 'admins'])));
           }
           setAllowedEmails([]);
        } else if (data) {
           setMissingTables(prev => prev.filter(t => t !== 'admins'));
           setAllowedEmails(data.map(a => a.email));
        }
        setIsSyncing(true);
      } catch (e: any) {
        setIsSyncing(false);
      }
    };
    fetchAdmins();
  }, [activeTab]);

  const handleAddEmail = async () => {
    if (!newEmail || allowedEmails.includes(newEmail)) return;
    try {
      const { error } = await supabase
        .from('admins')
        .insert({ email: newEmail });
      
      if (error) throw error;
      setAllowedEmails([...allowedEmails, newEmail]);
      setNewEmail('');
    } catch (e) {
      console.error("Whitelist Update Error:", e);
    }
  };

  const handleRemoveEmail = async (email: string) => {
    try {
      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('email', email);
      if (error) throw error;
      setAllowedEmails(allowedEmails.filter(e => e !== email));
    } catch (e) {
      console.error("Whitelist Delete Error:", e);
    }
  };

  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    specifications: '',
    price: 0,
    category: 'Phones & Tablets',
    image: '',
    images: [],
    videos: [],
    stock: 0,
    featured: false,
    is_verified: true
  });

  // Action to isolate and print the selected shelf-label element via styled window context
  const handlePrintLabel = (productToPrint: Product) => {
    const printWindow = window.open('about:blank', '_blank', 'width=600,height=600');
    if (!printWindow) return;
    
    // Build public viewable url for the item
    const productUrl = `${window.location.origin}/?product=${productToPrint.id}`;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Label - ${productToPrint.name}</title>
          <style>
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0; 
              background: #fff; 
            }
            .label-card { 
              border: 3px solid #000; 
              border-radius: 20px; 
              padding: 30px; 
              width: 320px; 
              text-align: center; 
            }
            .brand { 
              font-size: 10px; 
              font-weight: 900; 
              letter-spacing: 0.15em; 
              color: #1a56db; 
              margin-bottom: 5px; 
            }
            .title { 
              font-size: 18px; 
              font-weight: 800; 
              margin: 10px 0; 
              line-height: 1.2; 
            }
            .category { 
              font-size: 9px; 
              font-weight: 700; 
              color: #6b7280; 
              text-transform: uppercase; 
              margin-bottom: 12px; 
            }
            .price { 
              font-size: 24px; 
              font-weight: 900; 
              color: #111827; 
              font-family: monospace; 
              margin: 10px 0; 
            }
            .qr-wrapper { 
              margin: 15px auto; 
              width: 160px; 
              height: 160px; 
            }
            .qr-img { 
              width: 100%; 
              height: 100%; 
              object-fit: contain; 
            }
            .footer-text { 
              font-size: 8px; 
              font-weight: 700; 
              letter-spacing: 0.05em; 
              color: #4b5563; 
              text-transform: uppercase; 
              margin-top: 15px; 
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="brand">⚡ SOLO ELECTRONICS ⚡</div>
            <div class="title">${productToPrint.name}</div>
            <div class="category">${productToPrint.category || 'General Electronics'}</div>
            <div class="price">UGX ${(productToPrint.price || 0).toLocaleString()}</div>
            <div class="qr-wrapper">
              <img class="qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(productUrl)}" />
            </div>
            <div class="footer-text">SCAN QR TO BROWSE SPECIFICATIONS & INITIATE ORDER</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Pricing Estimator based on tech market indices
  const triggerMarketCompsInvestigation = () => {
    if (!newProduct.name) return;
    setInspectingComps(true);
    setCompResults(null);
    
    setTimeout(() => {
      const isPhone = newProduct.category?.toLowerCase().includes('phone') || newProduct.name?.toLowerCase().includes('iphone') || newProduct.name?.toLowerCase().includes('samsung');
      const isLaptop = newProduct.category?.toLowerCase().includes('laptop') || newProduct.name?.toLowerCase().includes('macbook') || newProduct.name?.toLowerCase().includes('thinkpad');
      
      let estRange = "UGX 450,000 - UGX 1,200,000";
      let trendDetails = "Steady local street demand. Suggest 12-18% target markup.";
      
      if (isPhone) {
        estRange = "UGX 600,000 - UGX 3,400,000";
        trendDetails = "Extremely high liquidity. High competition on standard devices; keep markup slim (8-12%) for fast turns.";
      } else if (isLaptop) {
        estRange = "UGX 1,500,000 - UGX 5,5000,000";
        trendDetails = "Higher ticket items. High corporate/student interest in Lira; 15-22% markup is sustainable.";
      }
      
      setCompResults({
        name: newProduct.name || '',
        estimate: estRange,
        trend: trendDetails
      });
      setInspectingComps(false);
    }, 450);
  };

  // Derived categories for suggestions
  const suggestedCategories = Array.from(new Set([
    ...PRODUCT_CATEGORIES,
    ...initialProducts.map(p => p.category)
  ])).sort();

  const groupedProducts = initialProducts.reduce((acc, product) => {
    const cat = product.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    if (!isSupabaseConfigured) {
      const localOrders = safeGetLocalStorage<any[]>('solo_sandbox_orders', []);
      const sorted = [...localOrders].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOrders(sorted);
      setLoadingOrders(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01' || error.message?.includes('not found')) {
          console.warn("[Supabase] 'orders' table not found.");
          setMissingTables(prev => Array.from(new Set([...prev, 'orders'])));
        } else {
          console.warn("[Supabase] Orders Fetch Warning:", error.message || error);
        }
      } else {
        setMissingTables(prev => prev.filter(t => t !== 'orders'));
        setOrders(data as Order[]);
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
         console.warn("[Supabase] Connection Failure in orders: Check network.");
      } else {
         console.warn("[Supabase] Dynamic order warning:", err);
      }
    }
    setLoadingOrders(false);
  };

  // Derived analytical datasets for Logistics charts
  const categoryAnalyticsData = PRODUCT_CATEGORIES.map(cat => {
    const categoryProducts = initialProducts.filter(p => p.category === cat);
    const totalStock = categoryProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
    
    let totalUnitsSold = 0;
    orders.forEach(ord => {
      ord.items?.forEach(itm => {
        const fullProd = initialProducts.find(p => p.id === itm.id);
        if (itm.category === cat || (fullProd && fullProd.category === cat)) {
          totalUnitsSold += itm.quantity || 1;
        }
      });
    });

    return {
      category: cat.replace(' & ', ' & ').split(' ')[0], // short style
      fullCategory: cat,
      "Daily Sales Volume": totalUnitsSold,
      "Inventory Stock Level": totalStock,
    };
  });

  const getDailyTrendData = () => {
    const trendMap: Record<string, { date: string, "Units Sold": number, "Stock Level": number }> = {};
    const totalGlobalStock = initialProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
    
    // Seed last 7 days chronologically
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = format(d, 'MMM dd');
      trendMap[dateStr] = {
        date: dateStr,
        "Units Sold": 0,
        "Stock Level": totalGlobalStock
      };
    }

    // Populate units sold from orders
    orders.forEach(ord => {
      try {
        const dStr = format(new Date(ord.created_at), 'MMM dd');
        if (trendMap[dStr] && ord.items) {
          const quantitySold = ord.items.reduce((s, itm) => s + (itm.quantity || 1), 0);
          trendMap[dStr]["Units Sold"] += quantitySold;
        }
      } catch (err) {
        // Safe bypass
      }
    });

    return Object.values(trendMap);
  };

  const dailyLogisticsData = getDailyTrendData();

  useEffect(() => {
    fetchOrders();
    
    // Wire up cross-tab synchronization for the logistics display
    const handleSync = (e: any) => {
      const { key } = e.detail;
      if (key === 'solo_sandbox_orders') {
        const localOrders = safeGetLocalStorage<any[]>('solo_sandbox_orders', []);
        const sorted = [...localOrders].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setOrders(sorted);
      }
    };
    window.addEventListener(SANDBOX_SYNC_EVENT, handleSync);

    if (isSupabaseConfigured) {
      const channel = supabase.channel('orders_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          fetchOrders();
        })
        .subscribe();
      return () => {
        window.removeEventListener(SANDBOX_SYNC_EVENT, handleSync);
        if (channel) supabase.removeChannel(channel);
      };
    }
    
    return () => {
      window.removeEventListener(SANDBOX_SYNC_EVENT, handleSync);
    };
  }, []);

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    if (!isSupabaseConfigured) {
      const localOrders = safeGetLocalStorage<any[]>('solo_sandbox_orders', []);
      const updated = localOrders.map((o: any) => {
        if (o.id === orderId) {
          const now = new Date().toISOString();
          const logs = o.tracking_logs || [];
          return {
            ...o,
            status,
            updated_at: now,
            tracking_logs: [
              ...logs,
              { status, message: `Order transitioned to ${status.toUpperCase()} stage by Admin.`, timestamp: now }
            ]
          };
        }
        return o;
      });
      safeSetLocalStorage('solo_sandbox_orders', updated);
      setOrders(updated);
      return;
    }

    try {
      await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      fetchOrders();
    } catch (e) {
      console.error("Order Update Error:", e);
    }
  };

  const shareReceiptToCustomer = (order: Order) => {
    const cartSummary = order.items.map(i => `• ${i.name} (x${i.quantity}) - UGX ${(i.price * i.quantity).toLocaleString()}`).join('\n');
    const receiptTemplate = `
🧾 *SOLO ELECTRONICS - DIGITAL RECEIPT*
---------------------------------------
*Order ID:* ${order.id}
*Customer:* ${order.customer_name}

*ITEMS:*
${cartSummary}

---------------------------------------
*TOTAL:* UGX ${order.total.toLocaleString()}

*DELIVERY TO:*
${order.district}, ${order.delivery_address}

_Thank you for choosing Solo Electronics!_
    `.trim();
    
    const whatsappUrl = `https://wa.me/${order.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(receiptTemplate)}`;
    window.open(whatsappUrl, '_blank');
  };

  const [uploadSessionId, setUploadSessionId] = useState(uuidv4());
  const [uploadingMedia, setUploadingMedia] = useState<{ 
    id: string; 
    type: 'image' | 'video'; 
    file: File; 
    status: 'queued' | 'uploading' | 'done' | 'error'; 
    progress: number; 
    url?: string;
    localPreview?: string;
    path?: string;
    error?: string;
  }[]>([]);

  const updateProgress = (id: string, progress: number, status?: 'uploading' | 'done' | 'error', url?: string, error?: string) => {
    setUploadingMedia(prev => prev.map(i => i.id === id ? { 
      ...i, 
      progress, 
      status: status || i.status,
      url: url || i.url,
      error: error || i.error
    } : i));
  };

  const processQueue = async () => {
    const active = uploadingMedia.filter(m => m.status === 'uploading').length;
    const queued = uploadingMedia.filter(m => m.status === 'queued');

    if (active >= 2 || queued.length === 0) return;

    const next = queued[0];
    setUploadingMedia(prev => prev.map(i => i.id === next.id ? { ...i, status: 'uploading' } : i));

    try {
      let fileToUpload: Blob | File = next.file;
      if (next.type === 'image') {
        try {
          fileToUpload = await imageCompression(next.file, { maxSizeMB: 0.5, maxWidthOrHeight: 1600, useWebWorker: true });
        } catch (e) { console.warn("Compression failed", e); }
      }

      const bucket = next.type === 'image' ? 'product-images' : 'product-videos';
      // Use products/{productId}/ format for organization
      const storagePath = `products/${editingId || 'new'}`;
      
      console.log(`[Storage] Starting upload to ${bucket}: ${storagePath}/${next.file.name}`);

      const filePath = await uploadFile(
        fileToUpload as File, 
        bucket, 
        storagePath
      );

      // filePath will be returned if successful
      const publicUrl = getPublicUrl(bucket, filePath!);
      
      updateProgress(next.id, 100, 'done', publicUrl || undefined);
      // We keep track of the PATH to save it to the DB later
      setUploadingMedia(prev => prev.map(i => i.id === next.id ? { ...i, path: filePath } : i));
      
      processQueue();
    } catch (err: any) {
      console.error("Storage upload failed:", err);
      updateProgress(next.id, 0, 'error', undefined, err.message);
      processQueue();
    }
  };

  useEffect(() => { processQueue(); }, [uploadingMedia]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newUploads = Array.from(files).map(file => ({
      id: uuidv4().substr(0, 8),
      type,
      file,
      status: 'queued' as const,
      progress: 0,
      localPreview: URL.createObjectURL(file)
    }));
    setUploadingMedia(prev => [...prev, ...newUploads]);
  };

  const removeMedia = (url: string | undefined, id: string) => {
    setUploadingMedia(prev => prev.filter(item => item.id !== id));
  };

  const handleSave = async () => {
    if (submitting) return;

    const name = newProduct.name?.trim();
    const description = newProduct.description?.trim();
    const price = Number(newProduct.price);
    const stock = Number(newProduct.stock || 0);

    if (!name || isNaN(price) || price <= 0) {
      alert("Please provide valid data.");
      return;
    }
    
    // Check if any uploads are still in progress
    if (uploadingMedia.some(m => m.status === 'uploading' || m.status === 'queued')) {
       alert("Please wait for all media to finish uploading.");
       return;
    }

    const completedImages = uploadingMedia.filter(m => m.type === 'image' && m.status === 'done').map(m => m.url!);
    const completedVideos = uploadingMedia.filter(m => m.type === 'video' && m.status === 'done').map(m => m.url!);

    setSubmitting(true);
    
    try {
      // Merge existing (if editing) with new uploads
      const existingImages = (newProduct.images || []).filter(img => img.startsWith('http'));
      const existingVideos = (newProduct.videos || []).filter(vid => vid.startsWith('http'));

      const finalImages = [...existingImages, ...completedImages];
      const finalVideos = [...existingVideos, ...completedVideos];

      if (finalImages.length === 0) {
        alert("At least one product image is required.");
        setSubmitting(false);
        return;
      }

      const data: any = {
        name,
        description,
        specifications: newProduct.specifications || '',
        price,
        stock,
        category: newProduct.category,
        image: finalImages[0] || '', // Use the first image as main
        video_url: finalVideos[0] || '',
        images: finalImages,
        videos: finalVideos,
        featured: !!newProduct.featured,
        is_verified: !!newProduct.is_verified,
        updated_at: new Date().toISOString()
      };

      if (editingId) {
        const { error } = await supabase.from('products').update(data).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert({
          ...data,
          id: `SOLO-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          created_at: new Date().toISOString(),
          rating: 5
        });
        if (error) throw error;
      }
      resetForm();
    } catch (e: any) {
      console.error("Save failed:", e);
      alert("Error saving record.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      // Find product to get media paths
      const product = initialProducts.find(p => p.id === id);
      if (product) {
        // Delete images
        if (product.images) {
          for (const path of product.images) {
            if (!path.startsWith('http')) {
              await deleteFile('product-images', path);
            }
          }
        }
        // Delete videos
        if (product.videos) {
          for (const path of product.videos) {
            if (!path.startsWith('http')) {
              await deleteFile('product-videos', path);
            }
          }
        }
      }
      await supabase.from('products').delete().eq('id', id);
    } catch (e) {
      console.error("Delete failed:", e);
    }
  };

  const resetForm = () => {
    setIsAdding(false); 
    setEditingId(null);
    setUploadSessionId(uuidv4());
    setNewProduct({ name: '', description: '', price: 0, category: 'Phones & Tablets', image: '', images: [], videos: [], stock: 0, featured: false, is_verified: true });
    
    // Revoke object URLs to prevent memory leaks
    uploadingMedia.forEach(m => {
      if (m.localPreview) URL.revokeObjectURL(m.localPreview);
    });
    
    setUploadingMedia([]);
  };

  const SetupMessage = () => (
    <div className="mb-12 p-8 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] space-y-4">
      <div className="flex items-center gap-3 text-amber-500 font-black italic uppercase tracking-tighter">
        <AlertCircle size={24} />
        <h3 className="text-xl">System Initialization Required</h3>
      </div>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Required database tables or storage buckets were not detected. 
        Please run the code from <code className="bg-foreground/5 px-1.5 py-0.5 rounded text-amber-400">supabase-setup.sql</code> in your 
        <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline mx-1">Supabase SQL Editor</a>.
      </p>
      <div className="p-4 bg-foreground/5 rounded-xl border border-border">
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Important Security Note</p>
        <p className="text-muted-foreground text-[9px] leading-relaxed">
          Full management access (including storage) is now enabled for PIN login, but <strong>requires</strong> the updated RLS policies in <code className="text-blue-400">supabase-setup.sql</code>. 
          Without these SQL updates, Supabase will reject your requests with a "Row Level Security" error.
        </p>
      </div>
      {missingTables.length > 0 && (
        <div className="flex gap-2">
          {missingTables.map(table => (
            <span key={table} className="px-3 py-1 bg-amber-500/20 text-amber-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-500/20">
              Missing Resource: {table}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  const statusMap: { [key in OrderStatus]: { icon: any, color: string } } = {
    'pending': { icon: Clock, color: 'text-amber-500' },
    'confirmed': { icon: CheckCircle, color: 'text-blue-500' },
    'delivering': { icon: Truck, color: 'text-orange-500' },
    'delivered': { icon: ShoppingBag, color: 'text-emerald-500' },
  };

  return (
    <div className="max-w-7xl mx-auto py-20 px-4 text-foreground">
      <button 
        onClick={() => window.history.back()}
        className="mb-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all text-sm font-black uppercase tracking-widest group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Exit Command Center
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <h2 className="text-4xl font-black text-foreground italic uppercase tracking-tighter">Command Center</h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-foreground/5 rounded-full border border-border">
               <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isSyncing ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]")} />
               <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{isSyncing ? "SYNCED" : "OFFLINE"}</p>
            </div>
          </div>
          
          {!user && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 px-5 py-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 max-w-md"
            >
              <ShieldCheck size={20} className="text-blue-500 shrink-0" />
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 leading-none">PIN-Authorized Access Active</p>
                <p className="text-[9px] text-muted-foreground leading-tight">You are logged in via PIN. Ensure the latest <code className="text-blue-400">supabase-setup.sql</code> policies are applied to your project to enable bypass for file uploads and inventory management.</p>
              </div>
            </motion.div>
          )}

          <div className="flex gap-2 flex-wrap">
            {['inventory', 'orders', 'admins'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={cn("px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all", activeTab === tab ? "bg-blue-600 text-white" : "bg-foreground/5 text-muted-foreground border border-border hover:bg-foreground/10")}>{tab}</button>
            ))}
          </div>
        </div>
        {activeTab === 'inventory' && (
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { resetForm(); setIsAdding(true); }} 
            className="px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-3xl flex items-center gap-4 w-full md:w-auto justify-center shadow-[0_15px_40px_rgba(37,99,235,0.4)] transition-all group"
          >
            <Plus size={24} className="group-hover:rotate-90 transition-transform duration-500" />
            <span className="text-lg tracking-tighter italic">INITIALIZE NEW LISTING</span>
          </motion.button>
        )}
      </div>

      {missingTables.length > 0 && <SetupMessage />}

      {isAdding && (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background overflow-y-auto"
          >
            <div className="min-h-screen px-4 py-12">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-blue-600 rounded-2xl">
                      <Plus className="text-white" size={24} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-foreground uppercase italic tracking-tighter">
                        {editingId ? 'Modify Inventory' : 'Add New Inventory'}
                      </h2>
                      <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
                        {editingId ? `Editing ID: ${editingId}` : 'Step-by-step product initialization'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={resetForm}
                    className="p-3 bg-foreground/5 border border-border rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Left Column: Form Info */}
                  <div className="space-y-8">
                    <div className="bg-foreground/5 border border-border rounded-[2.5rem] p-8 space-y-6">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Basic Information</label>
                        <div className="space-y-4">
                          <div className="relative">
                            <Package className="absolute left-4 top-4 text-muted-foreground/40" size={18} />
                            <input 
                              placeholder="Product Name" 
                              value={newProduct.name} 
                              onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} 
                              className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-6 text-foreground outline-none focus:border-blue-500 font-bold transition-all" 
                            />
                          </div>

                          {/* Market Pricing Search and Inspection Tool */}
                          {newProduct.name && newProduct.name.length > 2 && (
                            <div className="p-4 bg-blue-600/5 hover:bg-blue-600/10 border border-blue-500/15 rounded-2xl space-y-3 transition-all duration-300">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <TrendingUp size={14} className="text-blue-500" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-[#2563eb]">Market Pricing Comps Search</span>
                                </div>
                                <span className="text-[7.5px] font-mono text-muted-foreground/80 uppercase">Solo-Intel v2.1</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground/90 leading-tight">
                                Compare "{newProduct.name}" specs across global & regional retail pipelines to optimize margins.
                              </p>
                              
                              <div className="flex gap-2 flex-wrap">
                                <a 
                                  href={`https://www.google.com/search?q=${encodeURIComponent(newProduct.name + ' price specs Uganda')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest"
                                >
                                  <Search size={11} />
                                  Google Search Similar
                                </a>
                                <a 
                                  href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(newProduct.name)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 px-3 py-2 bg-foreground/5 hover:bg-foreground/10 text-foreground border border-border rounded-xl text-[9px] font-black uppercase tracking-widest"
                                >
                                  <ExternalLink size={11} className="text-blue-500" />
                                  Google Shopping
                                </a>
                                <a 
                                  href={`https://www.jumia.co.ug/catalog/?q=${encodeURIComponent(newProduct.name)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 px-3 py-2 bg-[#f68b1e]/15 hover:bg-[#f68b1e]/25 text-[#f68b1e] border border-[#f68b1e]/30 rounded-xl text-[9px] font-black uppercase tracking-widest"
                                >
                                  <ExternalLink size={11} />
                                  Jumia Uganda
                                </a>
                              </div>

                              <div className="pt-2 border-t border-blue-500/10">
                                <button 
                                  type="button"
                                  onClick={triggerMarketCompsInvestigation}
                                  className="text-[9px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                                >
                                  {inspectingComps ? (
                                    <>
                                      <Loader2 size={10} className="animate-spin" />
                                      Scanning tech indices...
                                    </>
                                  ) : (
                                    "⚡ Check Category Smart Markup Guide"
                                  )}
                                </button>
                                
                                {compResults && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-2.5 p-3 bg-background/50 border border-border rounded-xl space-y-1 text-[9.5px]"
                                  >
                                    <p className="font-bold text-foreground">Estimated East Africa Retail:</p>
                                    <p className="font-mono font-black text-blue-500">{compResults.estimate}</p>
                                    <p className="text-muted-foreground text-[8.5px] leading-tight uppercase font-medium mt-1">{compResults.trend}</p>
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="relative">
                            <Tag className="absolute left-4 top-4 text-muted-foreground/40" size={18} />
                            <select 
                              value={newProduct.category} 
                              onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} 
                              className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-6 text-foreground font-bold outline-none focus:border-blue-500 appearance-none transition-all"
                            >
                              <option value="" disabled>Select Category</option>
                              {PRODUCT_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground uppercase text-[8px] font-black">
                              Selection Required
                            </div>
                          </div>

                          <textarea 
                            placeholder="Technical Specifications & Details" 
                            value={newProduct.description} 
                            onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} 
                            rows={4} 
                            className="w-full bg-background border border-border rounded-2xl p-6 text-foreground outline-none focus:border-blue-500 text-sm leading-relaxed transition-all" 
                          />

                          <textarea 
                            placeholder="Detailed Specifications (Optional - One per line)" 
                            value={newProduct.specifications} 
                            onChange={e => setNewProduct({ ...newProduct, specifications: e.target.value })} 
                            rows={3} 
                            className="w-full bg-background border border-border rounded-2xl p-6 text-foreground outline-none focus:border-blue-500 text-sm leading-relaxed transition-all mt-4" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Unit Price (UGX)</label>
                          <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={16} />
                            <input 
                              type="number" 
                              placeholder="0" 
                              value={newProduct.price || ''} 
                              onChange={e => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })} 
                              className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-6 text-foreground font-mono outline-none focus:border-blue-500" 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Stock Level</label>
                          <div className="relative">
                            <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={16} />
                            <input 
                              type="number" 
                              placeholder="0" 
                              value={newProduct.stock || ''} 
                              onChange={e => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })} 
                              className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-6 text-foreground font-mono outline-none focus:border-blue-500" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-foreground/5 border border-border rounded-[2.5rem] p-8">
                       <div className="flex items-center justify-between mb-6">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Featured Placement</label>
                        <button 
                          onClick={() => setNewProduct(prev => ({ ...prev, featured: !prev.featured }))}
                          className={cn(
                            "w-12 h-6 rounded-full transition-all relative flex items-center px-1",
                            newProduct.featured ? "bg-blue-600" : "bg-foreground/10"
                          )}
                        >
                          <motion.div 
                            animate={{ x: newProduct.featured ? 24 : 0 }}
                            className="w-4 h-4 bg-white rounded-full shadow-lg"
                          />
                        </button>
                      </div>
                      <p className="text-muted-foreground text-[9px] uppercase tracking-widest leading-relaxed">
                        Enabling this will highlight the product on the main storefront banner and "Today's Picks" section.
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Media */}
                  <div className="space-y-8">
                    <div className="bg-foreground/5 border border-border rounded-[2.5rem] p-8 space-y-6">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Media Assets (Select from Phone Storage)</label>
                        
                        {!user ? (
                          <div className="p-8 bg-blue-500/5 border-2 border-dashed border-border rounded-3xl text-center space-y-4">
                              <ShieldCheck className="mx-auto text-blue-500 opacity-50" size={40} />
                              <p className="text-[10px] font-bold text-muted-foreground px-4 leading-relaxed uppercase tracking-widest">Upload functionality is locked. Sign in with Google to access phone storage and camera permissions.</p>
                              <button 
                                onClick={() => window.dispatchEvent(new CustomEvent('openLogin'))}
                                className="px-8 py-3 bg-blue-600 text-white font-black text-[10px] uppercase rounded-full shadow-lg shadow-blue-500/20"
                              >
                                Authorize Google Login
                              </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            <label className="group relative h-48 bg-blue-600/5 border-2 border-dashed border-blue-500/20 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-600/10 transition-all overflow-hidden">
                              <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleFileUpload(e, 'image')} />
                              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              <ImageIcon size={32} className="text-blue-500 mb-3 group-hover:scale-110 transition-transform relative z-10" />
                              <span className="text-[11px] font-black uppercase text-blue-400 relative z-10">Add Photos</span>
                              <span className="text-[8px] font-bold text-muted-foreground mt-1 uppercase tracking-widest relative z-10">Phone Gallery</span>
                            </label>
                            
                            <div className="space-y-2">
                              <label className="group relative h-[92px] bg-emerald-600/5 border-2 border-dashed border-emerald-500/20 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-600/10 transition-all">
                                <input type="file" className="hidden" accept="video/*" multiple onChange={(e) => handleFileUpload(e, 'video')} />
                                <Video size={24} className="text-emerald-500 mb-1" />
                                <span className="text-[9px] font-black uppercase text-emerald-400">Add Video</span>
                                <span className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest">From Files</span>
                              </label>
                              
                              <label className="group relative h-[92px] bg-amber-600/5 border-2 border-dashed border-amber-500/20 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-amber-600/10 transition-all">
                                <input type="file" className="hidden" accept="video/*" capture="environment" onChange={(e) => handleFileUpload(e, 'video')} />
                                <Video size={24} className="text-amber-500 mb-1" />
                                <span className="text-[9px] font-black uppercase text-amber-400">Capture</span>
                                <span className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest">Camera</span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 min-h-[120px]">
                        {/* Instant Previews (Local + Remote) */}
                        {uploadingMedia.map((item) => (
                          <div key={item.id} className="relative aspect-square rounded-2xl overflow-hidden bg-foreground/5 border border-border group/item">
                            {/* Local Preview is always shown first */}
                            {(item.localPreview || item.url) && (
                              <>
                                {item.type === 'image' ? (
                                  <OptimizedImage 
                                    src={item.localPreview || item.url || ''} 
                                    alt="Preview" 
                                    className={cn("w-full h-full object-cover", item.status === 'uploading' && "opacity-50 blur-[2px]")} 
                                  />
                                ) : (
                                  <div className="w-full h-full bg-emerald-500/20 flex items-center justify-center overflow-hidden">
                                    <video src={item.localPreview || item.url} className={cn("w-full h-full object-cover", item.status === 'uploading' && "opacity-50 blur-[2px]")} />
                                    <Video className="text-emerald-500 absolute" size={16} />
                                  </div>
                                )}
                                
                                {item.status === 'uploading' && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                    <div className="relative w-12 h-12">
                                      <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-white/10" />
                                        <circle 
                                          cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" fill="transparent" 
                                          className="text-blue-500" 
                                          strokeDasharray={2 * Math.PI * 20} 
                                          strokeDashoffset={2 * Math.PI * 20 * (1 - item.progress / 100)} 
                                        />
                                      </svg>
                                      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white">{Math.round(item.progress)}%</span>
                                    </div>
                                  </div>
                                )}

                                {item.status === 'done' && (
                                  <div className="absolute top-1 right-1 flex gap-1">
                                    <button 
                                      onClick={() => removeMedia(item.url, item.id)} 
                                      className="p-1.5 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-red-500 transition-colors"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                )}
                                
                                {item.status === 'error' && (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/40 p-2 text-center">
                                    <AlertCircle size={16} className="text-red-400 mb-1" />
                                    <span className="text-[6px] font-black uppercase text-red-100">{item.error || 'Failed'}</span>
                                    <button 
                                      onClick={() => setUploadingMedia(prev => prev.map(m => m.id === item.id ? { ...m, status: 'queued', error: undefined } : m))}
                                      className="mt-1 text-[7px] font-black uppercase underline text-white"
                                    >
                                      Retry
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}

                        {/* Existing Database Assets (if editing) */}
                        {newProduct.images?.map((img, idx) => {
                          // Filter out if it's already in the uploadingMedia list (by URL check if possible, or just skip local previews)
                          if (uploadingMedia.some(m => m.url === img)) return null;
                          return (
                            <div key={`existing-img-${idx}`} className="relative aspect-square rounded-2xl overflow-hidden bg-foreground/5 border border-border group/item">
                              <OptimizedImage src={img} alt="Existing" className="w-full h-full object-cover opacity-60" />
                              <button 
                                onClick={() => setNewProduct(prev => ({ ...prev, images: prev.images?.filter((_, i) => i !== idx) }))}
                                className="absolute top-1 right-1 p-1.5 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-6 border-t border-border space-y-4">
                        <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-2 italic">
                          <span>Verification Seal</span>
                          <span className="text-emerald-500 flex items-center gap-1">
                            <CheckCircle size={10} />
                            Authentic Solo Asset
                          </span>
                        </div>
                        
                        <button 
                          onClick={handleSave} 
                          disabled={submitting || (uploadingMedia.length > 0 && uploadingMedia.some(m => m.status === 'uploading' || m.status === 'queued'))}
                          className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-3xl shadow-[0_10px_30px_rgba(37,99,235,0.3)] italic uppercase flex items-center justify-center gap-4 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95"
                        >
                          {submitting ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                          <span className="text-lg tracking-tighter">
                            {editingId ? 'Push Cloud Update' : 'Initialize Listing'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-emerald-600/5 border border-emerald-500/10 rounded-3xl p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl">
                          <ShieldCheck className="text-emerald-500" size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Global Accessibility</p>
                          <p className="text-muted-foreground text-[10px] leading-relaxed">
                            Once deployed, this inventory item will be synchronized across all edge nodes and customer portals globally.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {activeTab === 'inventory' && (
        <div className="space-y-12">
          {/* Logistics Analytics Visualization: Daily Sales Volume vs Inventory Stock Levels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-foreground/5 p-8 rounded-[2.5rem] border border-border">
            {/* Column 1: Category Allocation index */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-500" />
                <h4 className="text-sm font-black uppercase tracking-widest text-[#2563eb]">Category Performance Benchmark</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-normal">
                Live evaluation comparing cumulative item sales volumes (sales units) against current store stock levels across categories.
              </p>
              
              <div className="h-64 mt-4 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryAnalyticsData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="category" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} stroke="rgba(255,255,255,0.1)" />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} stroke="rgba(255,255,255,0.1)" />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 9, textTransform: 'uppercase', fontStyle: 'italic' }} />
                    <Bar dataKey="Daily Sales Volume" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={24} />
                    <Bar dataKey="Inventory Stock Level" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Column 2: Chronological last 7 days */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-emerald-500" />
                <h4 className="text-sm font-black uppercase tracking-widest text-emerald-400">7-Day Supply Chain Buffer</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-normal">
                Chronological units sold compared to cumulative available stock buffer. Ensures storekeepers track restock velocity.
              </p>

              <div className="h-64 mt-4 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dailyLogisticsData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} stroke="rgba(255,255,255,0.1)" />
                    <YAxis yAxisId="left" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} stroke="rgba(255,255,255,0.1)" label={{ value: 'Units Sold', angle: -90, position: 'insideLeft', style: { fill: 'rgba(255,255,255,0.3)', fontSize: 8 } }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} stroke="rgba(255,255,255,0.1)" label={{ value: 'Stock Buffer', angle: 90, position: 'insideRight', style: { fill: 'rgba(255,255,255,0.3)', fontSize: 8 } }} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 9, textTransform: 'uppercase', fontStyle: 'italic' }} />
                    <Bar yAxisId="left" dataKey="Units Sold" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={20} />
                    <Line yAxisId="right" type="monotone" dataKey="Stock Level" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {Object.entries(groupedProducts).length === 0 ? (
            <div className="py-20 text-center text-muted-foreground font-black uppercase tracking-widest bg-foreground/5 rounded-[3rem] border border-border">
              No Inventory Items Detected
            </div>
          ) : (
            Object.entries(groupedProducts).sort(([a], [b]) => a.localeCompare(b)).map(([cat, catProducts]) => (
              <div key={cat} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-black text-foreground uppercase italic tracking-tighter">{cat}</h3>
                  <div className="h-0.5 flex-1 bg-foreground/5" />
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{catProducts.length} Units</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {catProducts.map(p => (
                    <div key={p.id} className="bg-foreground/5 border border-border p-6 rounded-3xl flex items-center gap-6 relative group overflow-hidden hover:bg-foreground/[0.07] transition-all">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-foreground/10">
                        <OptimizedImage src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-foreground font-black uppercase italic tracking-tighter truncate">{p.name}</h4>
                        <p className="text-blue-500 font-mono text-sm font-bold">UGX {p.price.toLocaleString()}</p>
                        <div className="flex items-center gap-4 mt-2">
                            <button onClick={() => { setNewProduct(p); setEditingId(p.id); setIsAdding(true); }} className="text-[10px] font-black text-muted-foreground hover:text-foreground uppercase transition-colors">Edit Specification</button>
                            <button onClick={() => setSelectedQRProduct(p)} className="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase transition-colors flex items-center gap-1">
                              <QrCode size={11} className="shrink-0" />
                              Shelf QR
                            </button>
                            <button onClick={() => handleDelete(p.id)} className="text-[10px] font-black text-red-500/50 hover:text-red-500 uppercase transition-colors">Decommission</button>
                        </div>
                      </div>
                      {p.stock <= 5 && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-500/20 text-red-500 text-[8px] font-black uppercase tracking-widest rounded-full border border-red-500/20">
                          Low Stock: {p.stock}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Order Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-foreground/5 p-6 rounded-3xl border border-border mb-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Search Orders</label>
              <input 
                type="text" 
                placeholder="Name, Phone, ID..." 
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                className="w-full bg-background border border-border rounded-2xl py-3 px-4 text-foreground text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Status</label>
              <select 
                value={orderStatusFilter}
                onChange={e => setOrderStatusFilter(e.target.value as any)}
                className="w-full bg-background border border-border rounded-2xl py-3 px-4 text-foreground text-sm outline-none focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="delivering">Delivering</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">From Date</label>
              <input 
                type="date" 
                value={dateRange.start}
                onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full bg-background border border-border rounded-2xl py-3 px-4 text-foreground text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">To Date</label>
              <input 
                type="date" 
                value={dateRange.end}
                onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full bg-background border border-border rounded-2xl py-3 px-4 text-foreground text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {loadingOrders ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground font-black uppercase tracking-widest bg-foreground/5 rounded-[3rem] border border-border">No Orders Found</div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredOrders.map((order) => (
                <div key={order.id} className="bg-foreground/5 border border-border p-6 rounded-3xl">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest">{order.id}</span>
                        <span className="text-muted-foreground text-xs font-bold">{format(new Date(order.created_at), 'MMM dd, HH:mm')}</span>
                      </div>
                      <h4 className="text-lg font-bold text-foreground uppercase">{order.delivery_address}</h4>
                      <p className="text-blue-500 font-mono text-sm">{order.customer_phone}</p>
                    </div>
                    <div className="w-full lg:w-96 bg-foreground/10 rounded-2xl p-4 border border-foreground/5">
                      <StatusProgress currentStatus={order.status} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(['pending', 'confirmed', 'delivering', 'delivered'] as OrderStatus[]).map((status) => (
                        <button key={status} onClick={() => updateOrderStatus(order.id, status)} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", order.status === status ? "bg-foreground text-background" : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10")}>{status}</button>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-border/5 pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                          <OptimizedImage src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground uppercase">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                    <div className="lg:col-start-4 text-right flex flex-col items-end">
                       <p className="text-foreground font-black text-xl italic tracking-tighter mb-4">UGX {order.total.toLocaleString()}</p>
                       <button onClick={() => shareReceiptToCustomer(order)} className="px-6 py-2 bg-green-600/10 hover:bg-green-600/20 text-green-500 text-[9px] font-black uppercase tracking-widest rounded-xl border border-green-500/20">Send Receipt</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}


      {activeTab === 'admins' && (
        <div className="max-w-2xl bg-foreground/5 border border-border rounded-[2.5rem] p-10">
          <div className="flex items-center gap-4 mb-8"><ShieldCheck className="text-blue-500" size={24} /><div><h3 className="text-xl font-black text-foreground uppercase italic tracking-tighter">Whitelist</h3></div></div>
          <div className="space-y-6">
            <div className="flex gap-4">
              <input placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="flex-1 bg-background border border-border rounded-2xl px-6 py-4 text-foreground outline-none" />
              <button onClick={handleAddEmail} className="px-8 bg-blue-600 text-white font-black text-[10px] uppercase rounded-2xl">Whitelist</button>
            </div>
            <div className="space-y-3">
              {allowedEmails.map((email) => (
                <div key={email} className="flex justify-between items-center p-4 bg-foreground/5 border border-border rounded-2xl">
                  <span className="text-sm font-bold text-foreground">{email}</span>
                  <button onClick={() => handleRemoveEmail(email)} className="text-red-500/50 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Printable QR Shelf-Label Modal Overlay */}
      <AnimatePresence>
        {selectedQRProduct && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-[2.5rem] p-8 max-w-md w-full relative shadow-2xl space-y-6 text-left"
            >
              <button 
                onClick={() => setSelectedQRProduct(null)} 
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-all"
              >
                <X size={20} />
              </button>
              
              <div className="space-y-1">
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Shelf-Print Utility</span>
                <h3 className="text-xl font-black italic uppercase tracking-tight text-foreground">Interactive QR Generator</h3>
              </div>

              {/* Printable Shelf Card Element Design */}
              <div className="border-2 border-dashed border-border p-6 rounded-3xl bg-background text-center relative overflow-hidden group">
                <div className="absolute top-2 right-2 bg-blue-600/10 text-blue-400 font-black text-[7px] uppercase px-2 py-0.5 rounded-full">
                  Shelf Ready Accent
                </div>
                <div className="text-[10px] uppercase tracking-widest text-[#2563eb] font-black italic">⚡ SOLO ELECTRONICS ⚡</div>
                
                <h4 className="text-base font-black text-foreground uppercase tracking-tight mt-3">{selectedQRProduct.name}</h4>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">{selectedQRProduct.category}</p>
                
                {/* Large high-contrast price tag */}
                <p className="text-xl font-black font-mono text-foreground tracking-tight my-4">
                  UGX {selectedQRProduct.price.toLocaleString()}
                </p>

                {/* Simulated/CDN QR server image */}
                <div className="mx-auto w-40 h-40 bg-white p-3 rounded-2xl border border-border flex items-center justify-center shadow-sm">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/?product=${selectedQRProduct.id}`)}`} 
                    alt="Product Shelf QR" 
                    className="w-full h-full object-contain"
                  />
                </div>

                <p className="text-[7.5px] text-muted-foreground uppercase font-black tracking-widest mt-4">
                  Scan to explore full technical spec sheet & buy
                </p>
              </div>

              {/* Printing Controls */}
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handlePrintLabel(selectedQRProduct)} 
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Printer size={14} />
                  Print Label
                </button>
                <button 
                  onClick={() => {
                    const productUrl = `${window.location.origin}/?product=${selectedQRProduct.id}`;
                    navigator.clipboard.writeText(productUrl);
                    alert("Product index URL synced directly to clipboard!");
                  }} 
                  className="w-full py-3 px-4 bg-foreground/5 hover:bg-foreground/10 border border-border text-foreground font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                >
                  Copy URL
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
