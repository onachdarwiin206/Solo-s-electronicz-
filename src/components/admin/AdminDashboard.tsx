import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import imageCompression from 'browser-image-compression';
import { Plus, Package, DollarSign, Tag, Image as ImageIcon, Video, Trash2, Save, X, Star, Loader2, Clock, CheckCircle, Truck, ShoppingBag, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { Product, Category, Order, OrderStatus } from '../../types';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { Tooltip } from '../ui/Tooltip';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../AuthContext';
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
        <div className="absolute top-2 left-0 w-full h-0.5 bg-white/10" />
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
                isCompleted ? "bg-blue-500 border-blue-500 scale-110" : "bg-gray-900 border-white/20",
                isCurrent && "shadow-[0_0_12px_rgba(59,130,246,0.6)] border-white"
              )} />
              <span className={cn(
                "text-[8px] font-black uppercase tracking-widest mt-3 transition-colors",
                isCompleted ? "text-blue-400" : "text-gray-600"
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
  const [loadingOrders, setLoadingOrders] = useState(false);
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
           console.error("[Supabase] Admins Fetch Error:", error.message || error);
           if (error.code === '42P01') {
             setMissingTables(prev => Array.from(new Set([...prev, 'admins'])));
           }
           setAllowedEmails([]);
        } else if (data) {
           setAllowedEmails(data.map(a => a.email));
        }
        setIsSyncing(true);
      } catch (e: any) {
        setIsSyncing(false);
      }
    };
    fetchAdmins();
  }, []);

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
    price: 0,
    category: 'Phones',
    image: '',
    images: [],
    videos: [],
    stock: 0,
    featured: false,
    is_verified: true
  });

  const fetchOrders = async () => {
    if (!isSupabaseConfigured) {
      setLoadingOrders(false);
      return;
    }
    setLoadingOrders(true);
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
          console.error("[Supabase] Orders Fetch Error:", error.message || error);
        }
      } else {
        setMissingTables(prev => prev.filter(t => t !== 'orders'));
        setOrders(data as Order[]);
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
         console.error("[Supabase] Connection Failure in orders: Check network.");
      } else {
         console.error("[Supabase] Dynamic order error", err);
      }
    }
    setLoadingOrders(false);
  };

  useEffect(() => {
    if (isSupabaseConfigured) {
      fetchOrders();
      const channel = supabase.channel('orders_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          fetchOrders();
        })
        .subscribe();
      return () => { if (channel) supabase.removeChannel(channel); };
    }
  }, []);

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);
    } catch (e) {
      console.error("Order Update Error:", e);
    }
  };

  const shareReceiptToCustomer = (order: Order) => {
    const cartSummary = order.items.map(i => `• ${i.name} (x${i.quantity}) - UGX ${(i.price * i.quantity).toLocaleString()}`).join('\n');
    const receiptTemplate = `
140: 🧾 *SOLO ELECTRONICS - DIGITAL RECEIPT*
141: ---------------------------------------
142: *Order ID:* ${order.id}
143: *Customer:* ${order.customer_name}
144: 
145: *ITEMS:*
146: ${cartSummary}
147: 
148: ---------------------------------------
149: *TOTAL:* UGX ${order.total.toLocaleString()}
150: 
151: *DELIVERY TO:*
152: ${order.district}, ${order.delivery_address}
153: 
154: _Thank you for choosing Solo Electronics!_
155:     `.trim();
    
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

      if (!filePath) throw new Error("Upload failed");

      const publicUrl = getPublicUrl(bucket, filePath);
      
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
      id: Math.random().toString(36).substr(2, 9),
      type,
      file,
      status: 'queued' as const,
      progress: 0
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

    const completedImages = uploadingMedia.filter(m => m.type === 'image' && m.status === 'done').map(m => m.path!);
    const completedVideos = uploadingMedia.filter(m => m.type === 'video' && m.status === 'done').map(m => m.path!);

    setSubmitting(true);
    
    try {
      const finalImages = [...(newProduct.images || []), ...completedImages];
      const finalVideos = [...(newProduct.videos || []), ...completedVideos];

      if (finalImages.length === 0) {
        alert("At least one product image is required.");
        setSubmitting(false);
        return;
      }

      const data: any = {
        name,
        description,
        price,
        stock,
        category: newProduct.category,
        image: finalImages[0], // Use the first image as main
        video_url: finalVideos[0] || '',
        images: finalImages,
        videos: finalVideos,
        featured: newProduct.featured,
        is_verified: newProduct.is_verified,
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
    setNewProduct({ name: '', description: '', price: 0, category: 'Phones', image: '', images: [], videos: [], stock: 0, featured: false, is_verified: true });
    setUploadingMedia([]);
  };

  const SetupMessage = () => (
    <div className="mb-12 p-8 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] space-y-4">
      <div className="flex items-center gap-3 text-amber-500 font-black italic uppercase italic tracking-tighter">
        <AlertCircle size={24} />
        <h3 className="text-xl">System Initialization Required</h3>
      </div>
      <p className="text-gray-400 text-sm leading-relaxed">
        Required database tables or storage buckets were not detected. 
        Please run the code from <code className="bg-white/5 px-1.5 py-0.5 rounded text-amber-400">supabase-setup.sql</code> in your 
        <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline mx-1">Supabase SQL Editor</a>.
      </p>
      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Important Security Note</p>
        <p className="text-gray-500 text-[9px] leading-relaxed">
          Storage uploads are protected by Row Level Security (RLS). You <strong>must</strong> be signed in via Google to upload assets. 
          PIN login alone does not provide a secure Supabase session for file operations.
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
    <div className="max-w-7xl mx-auto py-20 px-4 text-white">
      <button 
        onClick={() => window.dispatchEvent(new CustomEvent('changeView', { detail: 'shop' }))}
        className="mb-8 flex items-center gap-2 text-gray-500 hover:text-white transition-all text-sm font-black uppercase tracking-widest group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Exit Command Center
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Command Center</h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
               <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isSyncing ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]")} />
               <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">{isSyncing ? "SYNCED" : "OFFLINE"}</p>
            </div>
            {!user && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20">
                <AlertCircle size={10} className="text-red-500" />
                <p className="text-[9px] font-black uppercase tracking-widest text-red-500">Sign in with Google required</p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {['inventory', 'orders', 'admins'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={cn("px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all", activeTab === tab ? "bg-blue-600 text-white" : "bg-white/5 text-gray-500 border border-white/10 hover:bg-white/10")}>{tab}</button>
            ))}
          </div>
        </div>
        {activeTab === 'inventory' && (
          <button onClick={() => { resetForm(); setIsAdding(true); }} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl flex items-center gap-3">
            <Plus size={20} /> IMPORT ASSET
          </button>
        )}
      </div>

      {missingTables.length > 0 && <SetupMessage />}

      {isAdding && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 mb-12 relative">
          <button onClick={resetForm} className="absolute top-8 right-8 text-gray-500 hover:text-white"><X size={24} /></button>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <input placeholder="Product Name" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-blue-500 font-bold" />
              <textarea placeholder="Technical Specifications" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} rows={4} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-blue-500 text-sm" />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Price" value={newProduct.price || ''} onChange={e => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })} className="bg-black/40 border border-white/10 rounded-xl p-4 text-white font-mono" />
                <input type="number" placeholder="Stock" value={newProduct.stock || ''} onChange={e => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })} className="bg-black/40 border border-white/10 rounded-xl p-4 text-white font-mono" />
              </div>
              <select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value as Category })} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white">
                <option value="Phones">Phones</option>
                <option value="Computers">Computers</option>
                <option value="Electronics">Electronics</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <label className="h-32 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all">
                  <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleFileUpload(e, 'image')} />
                  <ImageIcon size={24} className="text-blue-500 mb-2" />
                  <span className="text-[9px] font-black uppercase text-gray-400">Add Images</span>
                </label>
                <label className="h-32 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all">
                  <input type="file" className="hidden" accept="video/*" multiple onChange={(e) => handleFileUpload(e, 'video')} />
                  <Video size={24} className="text-green-500 mb-2" />
                  <span className="text-[9px] font-black uppercase text-gray-400">Add Videos</span>
                </label>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {/* Existing Images */}
                {newProduct.images?.map((img, idx) => (
                  <div key={`existing-img-${idx}`} className="relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10 group/item">
                    <OptimizedImage src={img} alt="Existing" className="w-full h-full object-cover opacity-50" />
                    <button 
                      onClick={() => setNewProduct(prev => ({ ...prev, images: prev.images?.filter((_, i) => i !== idx) }))}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <span className="text-[6px] font-black uppercase bg-black/40 px-1 rounded text-gray-400">Stored</span>
                    </div>
                  </div>
                ))}
                
                {/* Existing Videos */}
                {newProduct.videos?.map((vid, idx) => (
                  <div key={`existing-vid-${idx}`} className="relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10 group/item">
                    <div className="w-full h-full bg-green-500/10 flex items-center justify-center opacity-50">
                      <Video size={16} className="text-green-500" />
                    </div>
                    <button 
                      onClick={() => setNewProduct(prev => ({ ...prev, videos: prev.videos?.filter((_, i) => i !== idx) }))}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <span className="text-[6px] font-black uppercase bg-black/40 px-1 rounded text-green-500/50">Stored</span>
                    </div>
                  </div>
                ))}

                {uploadingMedia.map((item) => (
                  <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10 group/item">
                    {item.status === 'done' && item.url ? (
                      <>
                        {item.type === 'image' ? (
                          <OptimizedImage src={item.url} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-green-500/20 flex items-center justify-center"><Video className="text-green-500" size={16} /></div>
                        )}
                        <button onClick={() => removeMedia(item.url, item.id)} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity"><X size={10} /></button>
                      </>
                    ) : item.status === 'error' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-red-500 bg-red-500/5">
                        <AlertCircle size={20} />
                        <span className="text-[7px] font-black uppercase mt-1 text-center leading-tight truncate w-full">{item.error || 'Upload failed'}</span>
                        <button onClick={() => setUploadingMedia(prev => prev.map(m => m.id === item.id ? { ...m, status: 'queued', error: undefined } : m))} className="text-[8px] underline mt-1 font-black">Retry</button>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2">
                        <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mb-2">
                          <motion.div className="bg-blue-600 h-full" initial={{ width: 0 }} animate={{ width: `${item.progress}%` }} />
                        </div>
                        <p className="text-[8px] font-black">{Math.round(item.progress)}%</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button 
                onClick={handleSave} 
                disabled={submitting || uploadingMedia.some(m => m.status === 'uploading')}
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-xl italic uppercase flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
                {editingId ? 'Modify Cloud Asset' : 'Commit to Cloud Inventory'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialProducts.map(p => (
            <div key={p.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center gap-6 relative group overflow-hidden">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                <OptimizedImage src={p.image} alt={p.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-black uppercase italic tracking-tighter truncate">{p.name}</h4>
                <p className="text-blue-500 font-mono text-sm font-bold">UGX {p.price.toLocaleString()}</p>
                <div className="flex items-center gap-4 mt-2">
                    <button onClick={() => { setNewProduct(p); setEditingId(p.id); setIsAdding(true); }} className="text-[10px] font-black text-gray-500 hover:text-white uppercase">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-[10px] font-black text-red-500/50 hover:text-red-500 uppercase">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6">
          {loadingOrders ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
          ) : orders.length === 0 ? (
            <div className="py-20 text-center text-gray-500 font-black uppercase tracking-widest bg-white/5 rounded-[3rem] border border-white/10">No Orders</div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {orders.map((order) => (
                <div key={order.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest">{order.id}</span>
                        <span className="text-gray-500 text-xs font-bold">{format(new Date(order.created_at), 'MMM dd, HH:mm')}</span>
                      </div>
                      <h4 className="text-lg font-bold text-white uppercase">{order.delivery_address}</h4>
                      <p className="text-blue-500 font-mono text-sm">{order.customer_phone}</p>
                    </div>
                    <div className="w-full lg:w-96 bg-black/20 rounded-2xl p-4 border border-white/5">
                      <StatusProgress currentStatus={order.status} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(['pending', 'confirmed', 'delivering', 'delivered'] as OrderStatus[]).map((status) => (
                        <button key={status} onClick={() => updateOrderStatus(order.id, status)} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", order.status === status ? "bg-white text-black" : "bg-white/5 text-gray-500 hover:bg-white/10")}>{status}</button>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-white/5 pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                          <OptimizedImage src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white uppercase">{item.name}</p>
                          <p className="text-[10px] text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                    <div className="lg:col-start-4 text-right flex flex-col items-end">
                       <p className="text-white font-black text-xl italic tracking-tighter mb-4">UGX {order.total.toLocaleString()}</p>
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
        <div className="max-w-2xl bg-white/5 border border-white/10 rounded-[2.5rem] p-10">
          <div className="flex items-center gap-4 mb-8"><ShieldCheck className="text-blue-500" size={24} /><div><h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Whiltelist</h3></div></div>
          <div className="space-y-6">
            <div className="flex gap-4">
              <input placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none" />
              <button onClick={handleAddEmail} className="px-8 bg-blue-600 text-white font-black text-[10px] uppercase rounded-2xl">Whitelist</button>
            </div>
            <div className="space-y-3">
              {allowedEmails.map((email) => (
                <div key={email} className="flex justify-between items-center p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <span className="text-sm font-bold text-white">{email}</span>
                  <button onClick={() => handleRemoveEmail(email)} className="text-red-500/50 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
