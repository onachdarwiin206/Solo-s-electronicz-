import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Package, DollarSign, Tag, Image as ImageIcon, Video, Trash2, Save, X, Star, Loader2, Clock, CheckCircle, Truck, ShoppingBag, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { Product, Category, Order, OrderStatus } from '../../types';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { Tooltip } from '../ui/Tooltip';
import { db, storage } from '../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, onSnapshot, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { handleFirestoreError, OperationType } from '../../lib/error-handler';

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

export function AdminDashboard({ products }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'admins'>('inventory');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [allowedEmails, setAllowedEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    const checkSync = async () => {
      try {
        const adminDoc = await getDoc(doc(db, 'system', 'admin'));
        if (adminDoc.exists()) {
          setAllowedEmails(adminDoc.data().allowedEmails || []);
        }
        setIsSyncing(true);
      } catch (e) {
        setIsSyncing(false);
      }
    };
    checkSync();
  }, []);

  const updateAllowedEmails = async (newList: string[]) => {
    if (newList.length > 5) return;
    try {
      await updateDoc(doc(db, 'system', 'admin'), { allowedEmails: newList });
      setAllowedEmails(newList);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'system/admin');
    }
  };

  const handleAddEmail = () => {
    if (!newEmail || allowedEmails.length >= 5 || allowedEmails.includes(newEmail)) return;
    updateAllowedEmails([...allowedEmails, newEmail]);
    setNewEmail('');
  };

  const handleRemoveEmail = (email: string) => {
    updateAllowedEmails(allowedEmails.filter(e => e !== email));
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
    isVerified: true
  });

  useEffect(() => {
    setLoadingOrders(true);
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoadingOrders(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setLoadingOrders(false);
    });
    return () => unsubscribe();
  }, []);

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const shareReceiptToCustomer = (order: Order) => {
    const cartSummary = order.items.map(i => `• ${i.name} (x${i.quantity}) - UGX ${(i.price * i.quantity).toLocaleString()}`).join('\n');
    const receiptTemplate = `
🧾 *SOLO ELECTRONICS - DIGITAL RECEIPT*
---------------------------------------
*Order ID:* ${order.id}
*Customer:* ${order.customerName}

*ITEMS:*
${cartSummary}

---------------------------------------
*TOTAL:* UGX ${order.total.toLocaleString()}

*DELIVERY TO:*
${order.district}, ${order.deliveryAddress}

_Thank you for choosing Solo Electronics!_
    `.trim();
    
    const whatsappUrl = `https://wa.me/${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(receiptTemplate)}`;
    window.open(whatsappUrl, '_blank');
  };

  const [uploadingMedia, setUploadingMedia] = useState<{ id: string; type: 'image' | 'video'; progress: number; url?: string }[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Convert FileList to Array and process each
    Array.from(files).forEach(async (file: any) => {
      const uploadId = Math.random().toString(36).substr(2, 9);
      
      setUploadingMedia(prev => [...prev, { id: uploadId, type, progress: 0 }]);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');

        const result = await response.json();
        const url = result.url;

        setUploadingMedia(prev => prev.map(item => item.id === uploadId ? { ...item, progress: 100, url } : item));

        if (type === 'video') {
          setNewProduct(prev => ({
            ...prev,
            videoUrl: prev.videoUrl || url, // First one is primary
            videos: [...(prev.videos || []), url]
          }));
        } else {
          setNewProduct(prev => ({
            ...prev,
            image: prev.image || url, // First one is primary
            images: [...(prev.images || []), url]
          }));
        }
      } catch (err) {
        console.error("Upload error:", err);
        setUploadingMedia(prev => prev.filter(item => item.id !== uploadId));
      }
    });
  };

  const removeMedia = (url: string, type: 'image' | 'video') => {
    if (type === 'video') {
      setNewProduct(prev => {
        const filtered = (prev.videos || []).filter(v => v !== url);
        return {
          ...prev,
          videos: filtered,
          videoUrl: prev.videoUrl === url ? (filtered[0] || '') : prev.videoUrl
        };
      });
    } else {
      setNewProduct(prev => {
        const filtered = (prev.images || []).filter(i => i !== url);
        return {
          ...prev,
          images: filtered,
          image: prev.image === url ? (filtered[0] || '') : prev.image
        };
      });
    }
    setUploadingMedia(prev => prev.filter(item => item.url !== url));
  };
  const handleSave = async () => {
    if (!newProduct.name || !newProduct.price || (!newProduct.image && !newProduct.videoUrl)) return;
    setSubmitting(true);
    
    try {
      const data = {
        ...newProduct,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        console.log(`[Admin] Updating product: ${editingId}`, data);
        await updateDoc(doc(db, 'products', editingId), data);
      } else {
        console.log("[Admin] Adding new product", data);
        await addDoc(collection(db, 'products'), {
          ...data,
          createdAt: serverTimestamp(),
          rating: 5
        });
      }
      console.log("[Admin] Product operation successful");
      resetForm();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'products');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this asset?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `products/${id}`);
    }
  };

  const resetForm = () => {
    setIsAdding(false); setEditingId(null);
    setNewProduct({ name: '', description: '', price: 0, category: 'Phones', image: '', stock: 0, featured: false, isVerified: true });
  };

  const statusMap: { [key in OrderStatus]: { icon: any, color: string } } = {
    'pending': { icon: Clock, color: 'text-amber-500' },
    'confirmed': { icon: CheckCircle, color: 'text-blue-500' },
    'delivering': { icon: Truck, color: 'text-orange-500' },
    'delivered': { icon: ShoppingBag, color: 'text-emerald-500' },
  };

  return (
    <div className="max-w-7xl mx-auto py-20 px-4">
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
               <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                 {isSyncing ? "SYNCED" : "OFFLINE"}
               </p>
            </div>
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

      {isAdding && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 mb-12 relative">
          <button onClick={resetForm} className="absolute top-8 right-8 text-gray-500 hover:text-white"><X size={24} /></button>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <input placeholder="Product Name" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-blue-500 font-bold" />
              <textarea placeholder="Technical Specifications" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} rows={4} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-blue-500 text-sm no-scrollbar" />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="number" 
                  placeholder="Price (UGX)" 
                  value={isNaN(newProduct.price as number) ? '' : newProduct.price} 
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    setNewProduct({ ...newProduct, price: isNaN(val) ? 0 : val });
                  }} 
                  className="bg-black/40 border border-white/10 rounded-xl p-4 text-white font-mono" 
                />
                <input 
                  type="number" 
                  placeholder="Stock" 
                  value={isNaN(newProduct.stock as number) ? '' : newProduct.stock} 
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    setNewProduct({ ...newProduct, stock: isNaN(val) ? 0 : val });
                  }} 
                  className="bg-black/40 border border-white/10 rounded-xl p-4 text-white font-mono" 
                />
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

              {/* Upload Previews */}
              <div className="grid grid-cols-4 gap-3">
                {uploadingMedia.map((item) => (
                  <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10">
                    {item.url ? (
                      <>
                        {item.type === 'image' ? (
                          <img src={item.url} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-green-500/20 flex items-center justify-center">
                            <Video className="text-green-500" size={16} />
                          </div>
                        )}
                        <button 
                          onClick={() => removeMedia(item.url!, item.type)}
                          className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-red-500"
                        >
                          <X size={10} />
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="animate-spin text-blue-500" size={16} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button 
                onClick={handleSave} 
                disabled={submitting || uploadingMedia.some(m => !m.url)}
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
          {products.map(p => (
            <div key={p.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center gap-6 relative group overflow-hidden">
              <img src={p.image} className="w-20 h-20 rounded-2xl object-cover" />
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-black uppercase italic tracking-tighter truncate">{p.name}</h4>
                <p className="text-blue-500 font-mono text-sm font-bold">UGX {p.price.toLocaleString()}</p>
                <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center bg-black/40 rounded-lg px-2 border border-white/10">
                      <button 
                        onClick={() => updateDoc(doc(db, 'products', p.id), { stock: Math.max(0, (p.stock || 0) - 1) })}
                        className="px-2 py-1 text-gray-500 hover:text-white"
                      >-</button>
                      <span className="px-2 font-mono text-xs text-white">{p.stock}</span>
                      <button 
                        onClick={() => updateDoc(doc(db, 'products', p.id), { stock: (p.stock || 0) + 1 })}
                        className="px-2 py-1 text-gray-500 hover:text-white"
                      >+</button>
                   </div>
                   <button onClick={() => { setNewProduct(p); setEditingId(p.id); setIsAdding(true); }} className="text-[10px] font-black text-gray-500 hover:text-white uppercase">Edit</button>
                </div>
              </div>
                <Tooltip content="Remove (Cloud)" position="left">
                  <button onClick={() => handleDelete(p.id)} className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} className="text-red-500/50 hover:text-red-500" />
                  </button>
                </Tooltip>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6">
          {loadingOrders ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-20 text-center text-gray-500 font-black uppercase tracking-widest bg-white/5 rounded-[3rem] border border-white/10">
               No Active Logistical Requests
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {orders.map((order) => (
                <div key={order.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                  {/* ... order content exists ... */}
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest">{order.id}</span>
                        <span className="text-gray-500 text-xs font-bold">{format(order.createdAt?.toDate ? order.createdAt.toDate() : new Date(), 'MMM dd, HH:mm')}</span>
                      </div>
                      <h4 className="text-lg font-bold text-white uppercase">{order.deliveryAddress}</h4>
                      <p className="text-blue-500 font-mono text-sm">{order.customerPhone}</p>
                    </div>
                    <div className="w-full lg:w-96 bg-black/20 rounded-2xl p-4 border border-white/5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Transit Lifecycle</p>
                      <StatusProgress currentStatus={order.status} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(['pending', 'confirmed', 'delivering', 'delivered'] as OrderStatus[]).map((status) => {
                        const Icon = statusMap[status].icon;
                        return (
                          <button
                            key={status}
                            onClick={() => updateOrderStatus(order.id, status)}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                              order.status === status 
                                ? "bg-white text-black" 
                                : "bg-white/5 text-gray-500 hover:bg-white/10"
                            )}
                          >
                            <Icon size={12} />
                            {status}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="border-t border-white/5 pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <img src={item.image} className="w-12 h-12 rounded-xl object-cover" />
                        <div>
                          <p className="text-xs font-bold text-white uppercase">{item.name}</p>
                          <p className="text-[10px] text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                    <div className="lg:col-start-4 text-right flex flex-col items-end">
                       <p className="text-[10px] text-gray-500 font-black uppercase mb-1">Total Payload</p>
                       <p className="text-white font-black text-xl italic tracking-tighter mb-4">UGX {order.total.toLocaleString()}</p>
                       <button 
                         onClick={() => shareReceiptToCustomer(order)}
                         className="flex items-center gap-2 px-6 py-2 bg-green-600/10 hover:bg-green-600/20 text-green-500 text-[9px] font-black uppercase tracking-widest rounded-xl border border-green-500/20 transition-all"
                       >
                         <ShoppingBag size={12} /> Send WhatsApp Receipt
                       </button>
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
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
               <ShieldCheck className="text-blue-500" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Identity Whitelist</h3>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Restricted to 5 Authorized Personnel</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <input 
                placeholder="Google Account Email (e.g. name@gmail.com)"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-700"
              />
              <button 
                onClick={handleAddEmail}
                disabled={allowedEmails.length >= 5 || !newEmail}
                className="px-8 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:grayscale text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg transition-all"
              >
                Whitelist
              </button>
            </div>

            <div className="space-y-3">
              {allowedEmails.map((email) => (
                <div key={email} className="flex justify-between items-center p-4 bg-white/5 border border-white/10 rounded-2xl group">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-sm font-bold text-white">{email}</span>
                  </div>
                  <button onClick={() => handleRemoveEmail(email)} className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500/50 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              
              {[...Array(5 - allowedEmails.length)].map((_, i) => (
                <div key={i} className="p-4 border border-dashed border-white/5 rounded-2xl flex items-center justify-center">
                  <span className="text-[8px] font-black text-gray-700 uppercase tracking-[0.3em]">Identity Slot {allowedEmails.length + i + 1} Available</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-start gap-4">
             <AlertCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
             <p className="text-[10px] font-medium text-blue-300 leading-relaxed uppercase tracking-wider">
               *Note:* These individuals will be required to verify their identity via Secure Google Sign-In to access the Command Center.
             </p>
          </div>
        </div>
      )}
    </div>
  );
}
