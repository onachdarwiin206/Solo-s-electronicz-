import { useState, ChangeEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Package, DollarSign, Tag, Image as ImageIcon, Video, Trash2, Save, X, Star, Upload, Loader2, Zap, BadgeCheck, ShoppingBag, Clock, CheckCircle, Truck, Ban, CreditCard } from 'lucide-react';
import { Product, Category, Order, OrderStatus } from '../../types';
import { db, storage } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/error-handler';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

interface AdminDashboardProps {
  products: Product[];
  onProductAdded: (product: Product) => void;
}

export function AdminDashboard({ products, onProductAdded }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    category: 'Phones',
    image: '',
    videoUrl: '',
    stock: 0,
    featured: false,
    isVerified: true
  });

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() }) as Order));
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const fastCompress = async (file: File): Promise<Blob | File> => {
    return new Promise((resolve) => {
      if (file.size < 200000) return resolve(file); 
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1080;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve(blob || file);
          }, 'image/jpeg', 0.85);
        } else {
          resolve(file);
        }
      };
      img.onerror = () => resolve(file);
    });
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setLocalPreview(previewUrl);
    setUploading(true);
    try {
      const processedFile = await fastCompress(file);
      const storageRef = ref(storage, `products/${Date.now()}-${file.name.replace(/\s+/g, '_')}`);
      const snapshot = await uploadBytes(storageRef, processedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setNewProduct(prev => ({ ...prev, image: downloadURL }));
    } catch (error) {
      console.error("Upload error:", error);
      alert("System connection interrupted. Please try again.");
      setLocalPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.image) return;
    const path = editingId ? `products/${editingId}` : 'products';
    try {
      const productData = {
        ...newProduct,
        updatedAt: serverTimestamp(),
      };
      if (editingId) {
        const productRef = doc(db, 'products', editingId);
        await updateDoc(productRef, productData);
        window.location.reload();
      } else {
        const productDataWithCreated = {
          ...productData,
          createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, 'products'), productDataWithCreated);
        onProductAdded({
          ...productDataWithCreated,
          id: docRef.id,
        } as Product);
      }
      resetForm();
    } catch (error) {
       handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to decommission this hardware asset?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      window.location.reload();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `products/${id}`);
    }
  };

  const handleEdit = (product: Product) => {
    setNewProduct(product);
    setEditingId(product.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewProduct({
      name: '',
      description: '',
      price: 0,
      category: 'Phones',
      image: '',
      videoUrl: '',
      stock: 0,
      featured: false,
      isVerified: true
    });
  };

  const orderStatuses: { status: OrderStatus, icon: any, color: string }[] = [
    { status: 'Pending', icon: Clock, color: 'text-amber-500' },
    { status: 'Confirmed', icon: CheckCircle, color: 'text-blue-500' },
    { status: 'Paid', icon: CreditCard, color: 'text-green-500' },
    { status: 'Packing', icon: Package, color: 'text-purple-500' },
    { status: 'Out for Delivery', icon: Truck, color: 'text-orange-500' },
    { status: 'Delivered', icon: ShoppingBag, color: 'text-emerald-500' },
    { status: 'Cancelled', icon: Ban, color: 'text-red-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto py-20 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic">Command Center</h2>
          <div className="flex gap-4 mt-4">
             <button 
               onClick={() => setActiveTab('inventory')}
               className={cn("text-[10px] uppercase font-black tracking-widest px-4 py-2 rounded-full border transition-all", activeTab === 'inventory' ? "bg-blue-600 text-white border-blue-500" : "bg-white/5 text-gray-500 border-white/10 hover:bg-white/10")}
             >
               Inventory
             </button>
             <button 
               onClick={() => setActiveTab('orders')}
               className={cn("text-[10px] uppercase font-black tracking-widest px-4 py-2 rounded-full border transition-all", activeTab === 'orders' ? "bg-blue-600 text-white border-blue-500" : "bg-white/5 text-gray-500 border-white/10 hover:bg-white/10")}
             >
               Orders ({orders.length})
             </button>
          </div>
        </div>
        {activeTab === 'inventory' && (
          <button 
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl flex items-center gap-3 transition-all shadow-xl shadow-blue-900/40"
          >
            <Plus size={20} />
            NEW ASSET IMPORT
          </button>
        )}
      </div>

      {activeTab === 'inventory' ? (
        <>
          {isAdding && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] p-8 md:p-12 mb-12 relative overflow-hidden"
            >
               <button onClick={resetForm} className="absolute top-8 right-8 text-gray-500 hover:text-white"><X size={24} /></button>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                 <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Model Designation</label>
                      <input type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Technical Description</label>
                      <textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} rows={4} className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white outline-none focus:ring-2 focus:ring-blue-500 font-light resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">UGX Price</label>
                        <input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Stock Level</label>
                        <input type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Category</label>
                      <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value as Category})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white outline-none focus:ring-2 focus:ring-blue-500 appearance-none font-bold">
                        <option value="Phones">Phones</option>
                        <option value="Computers">Computers</option>
                        <option value="Electronics">Electronics</option>
                      </select>
                    </div>
                 </div>
                 <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Media</label>
                      <div className="space-y-4">
                        <input type="text" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs" />
                        <input type="file" id="asset-upload" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                        <label htmlFor="asset-upload" className="flex items-center justify-center gap-3 w-full p-5 rounded-2xl border-2 border-dashed border-blue-600/30 hover:bg-blue-600/10 cursor-pointer">
                          <Upload size={20} className="text-blue-500" />
                          <span className="text-xs font-black text-blue-500 uppercase tracking-widest">{uploading ? 'Processing...' : 'Upload Asset'}</span>
                        </label>
                        {(localPreview || newProduct.image) && (
                          <div className="aspect-video rounded-2xl overflow-hidden border border-white/10"><img src={localPreview || newProduct.image} className="w-full h-full object-cover" /></div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-2xl flex items-center justify-between border border-white/5">
                        <p className="text-[10px] font-bold uppercase text-gray-500">Featured</p>
                        <button onClick={() => setNewProduct({...newProduct, featured: !newProduct.featured})} className={cn("w-10 h-6 rounded-full relative transition-all", newProduct.featured ? "bg-blue-600" : "bg-white/10")}><div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all", newProduct.featured ? "left-5" : "left-1")} /></button>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl flex items-center justify-between border border-white/5">
                        <p className="text-[10px] font-bold uppercase text-gray-500">Verified</p>
                        <button onClick={() => setNewProduct({...newProduct, isVerified: !newProduct.isVerified})} className={cn("w-10 h-6 rounded-full relative transition-all", newProduct.isVerified ? "bg-green-600" : "bg-white/10")}><div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all", newProduct.isVerified ? "left-5" : "left-1")} /></button>
                      </div>
                    </div>
                    <button onClick={handleSave} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3"><Save size={20} />{editingId ? 'COMMIT CHANGES' : 'DEPLOY ASSET'}</button>
                 </div>
               </div>
            </motion.div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <div key={product.id} className="bg-white/5 border border-white/10 rounded-[2rem] p-8 hover:border-white/20 transition-all flex flex-col gap-6 relative">
                 <div className="flex items-center gap-6">
                    <img src={product.image} className="w-20 h-20 rounded-2xl object-cover" />
                    <div className="flex-1 min-w-0">
                       <h4 className="font-black text-xl text-white mb-1 tracking-tighter truncate uppercase italic leading-tight">{product.name}</h4>
                       <span className="text-blue-500 font-mono text-[9px] uppercase font-black tracking-widest">UGX {product.price.toLocaleString()}</span>
                       <div className="mt-2 flex items-center gap-2">
                          <BadgeCheck size={12} className={product.isVerified ? "text-green-500" : "text-gray-500"} />
                          <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">{product.isVerified ? 'Verified' : 'Unverified'}</span>
                       </div>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center bg-black/40 rounded-xl border border-white/10 px-3 overflow-hidden">
                       <button 
                         onClick={async () => {
                           const newStock = Math.max(0, (product.stock || 0) - 1);
                           await updateDoc(doc(db, 'products', product.id), { stock: newStock });
                           window.location.reload();
                         }}
                         className="p-2 text-gray-500 hover:text-white transition-colors"
                       >
                         -
                       </button>
                       <span className="flex-1 text-center font-mono text-[10px] text-white font-bold">{product.stock || 0}</span>
                       <button 
                         onClick={async () => {
                           const newStock = (product.stock || 0) + 1;
                           await updateDoc(doc(db, 'products', product.id), { stock: newStock });
                           window.location.reload();
                         }}
                         className="p-2 text-gray-500 hover:text-white transition-colors"
                       >
                         +
                       </button>
                    </div>
                    <button onClick={() => handleEdit(product)} className="py-3 bg-white/5 hover:bg-white text-gray-400 hover:text-black font-black text-[10px] uppercase rounded-xl border border-white/10">Edit</button>
                 </div>
                 <button onClick={() => handleDelete(product.id)} className="w-full py-2 bg-red-500/5 hover:bg-red-500/10 text-red-900/40 hover:text-red-500/40 font-bold text-[8px] uppercase rounded-lg border border-red-500/5 transition-all">Decommission Asset</button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-6">
           {loadingOrders ? (
             <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
           ) : orders.length > 0 ? (
             <div className="grid grid-cols-1 gap-6">
                {orders.map(order => (
                  <div key={order.id} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all shadow-xl">
                     <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                        <div>
                           <div className="flex items-center gap-3 mb-1">
                             <span className="text-sm font-black text-blue-500 font-mono">{order.id}</span>
                             <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", 
                               orderStatuses.find(s => s.status === order.status)?.color.replace('text-', 'bg-').replace('500', '500/20')
                             )}>
                               {order.status}
                             </span>
                           </div>
                           <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">{order.customerName}</h4>
                           <p className="text-gray-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                             <Clock size={12} /> {format(order.createdAt, 'MMM dd, HH:mm')} | <MapPin size={12} /> {order.district}
                           </p>
                        </div>
                        <div className="text-right">
                           <p className="text-3xl font-black text-white tracking-tighter">UGX {order.total.toLocaleString()}</p>
                           <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{order.paymentMethod}</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {orderStatuses.map(os => (
                          <button 
                            key={os.status}
                            onClick={() => updateOrderStatus(order.id, os.status)}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest",
                              order.status === os.status 
                                ? "bg-white text-black border-white" 
                                : "bg-white/5 border-white/5 text-gray-500 hover:bg-white/10 hover:border-white/10"
                            )}
                          >
                            <os.icon size={16} className={order.status === os.status ? "text-black" : os.color} />
                            {os.status}
                          </button>
                        ))}
                     </div>

                     <div className="bg-black/20 rounded-2xl p-6 border border-white/5">
                        <div className="flex flex-col md:flex-row justify-between gap-8">
                           <div className="flex-1">
                              <h5 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4">Ordered Items</h5>
                              <div className="space-y-4">
                                 {order.items.map(item => (
                                   <div key={item.id} className="flex items-center gap-4">
                                      <img src={item.image} className="w-12 h-12 rounded-lg object-cover border border-white/10" />
                                      <div className="flex-1">
                                         <p className="text-white font-bold text-sm uppercase leading-tight">{item.name}</p>
                                         <p className="text-gray-500 text-[10px] font-mono">{item.quantity} x UGX {item.price.toLocaleString()}</p>
                                      </div>
                                   </div>
                                 ))}
                              </div>
                           </div>
                           <div className="flex-1">
                              <h5 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4">Delivery & Contact</h5>
                              <div className="space-y-3 text-sm">
                                 <p className="text-gray-300 font-medium">Phone: <span className="text-blue-500">{order.customerPhone}</span></p>
                                 <p className="text-gray-300 font-medium">Address: <span className="text-white">{order.deliveryAddress}</span></p>
                                 <p className="text-gray-300 font-medium italic">"{order.notes || 'No customer notes provided'}"</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
           ) : (
             <div className="py-20 text-center bg-white/5 rounded-[2rem] border border-dashed border-white/10">
               <ShoppingBag size={40} className="mx-auto text-gray-700 mb-4" />
               <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">No incoming orders detected</p>
             </div>
           )}
        </div>
      )}
    </div>
  );
}

const MapPin = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
);
