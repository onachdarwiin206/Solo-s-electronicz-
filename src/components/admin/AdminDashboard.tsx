import { useState, ChangeEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Package, DollarSign, Tag, Image as ImageIcon, Video, Trash2, Save, X, Star, Loader2, Clock, CheckCircle, Truck, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Product, Category, Order, OrderStatus } from '../../types';
import { db, storage } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../lib/error-handler';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDocs, orderBy, query, increment } from 'firebase/firestore';
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
  const [videoUploading, setVideoUploading] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    category: 'Phones',
    image: '',
    stock: 0,
    featured: false,
    isVerified: true
  });

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
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

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const isVideo = file.type.startsWith('video/');
    if (isVideo) {
      setVideoUploading(true);
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = async () => {
          const duration = video.duration;
          if (duration > 31) {
            alert("Video rejected. Max duration is 30 seconds.");
            setVideoUploading(false);
            return;
          }
          const storageRef = ref(storage, `videos/${Date.now()}_${file.name}`);
          const snap = await uploadBytes(storageRef, file);
          const url = await getDownloadURL(snap.ref);
          setNewProduct(prev => ({ ...prev, videoUrl: url, videoDuration: Math.round(duration) }));
          setVideoUploading(false);
        };
        video.src = URL.createObjectURL(file);
      } catch (err) { setVideoUploading(false); }
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
      const snap = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snap.ref);
      setNewProduct(prev => ({ ...prev, image: url }));
    } catch (err) { alert("Upload failed."); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.image) return;
    try {
      const data = { ...newProduct, updatedAt: serverTimestamp() };
      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), data);
        window.location.reload();
      } else {
        const docRef = await addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp() });
        onProductAdded({ ...data, id: docRef.id } as Product);
      }
      resetForm();
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'products'); }
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
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Command Center</h2>
          <div className="flex gap-2">
            {['inventory', 'orders'].map((tab) => (
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
                <input type="number" placeholder="Price (UGX)" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })} className="bg-black/40 border border-white/10 rounded-xl p-4 text-white font-mono" />
                <input type="number" placeholder="Stock" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) })} className="bg-black/40 border border-white/10 rounded-xl p-4 text-white font-mono" />
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
                <label className="h-40 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all">
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                  <ImageIcon size={32} className="text-blue-500 mb-2" />
                  <span className="text-[10px] font-black uppercase text-gray-400">{uploading ? 'Uploading...' : 'Featured Image'}</span>
                </label>
                <label className="h-40 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all">
                  <input type="file" className="hidden" accept="video/*" onChange={handleFileUpload} disabled={videoUploading} />
                  <Video size={32} className="text-green-500 mb-2" />
                  <span className="text-[10px] font-black uppercase text-gray-400">{videoUploading ? 'Analysing...' : '30s Demo Clip'}</span>
                </label>
              </div>
              <button onClick={handleSave} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-xl italic uppercase">Commit to Inventory</button>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'inventory' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(p => (
            <div key={p.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center gap-6 relative group overflow-hidden">
              <img src={p.image} className="w-20 h-20 rounded-2xl object-cover" />
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-black uppercase italic tracking-tighter truncate">{p.name}</h4>
                <p className="text-blue-500 font-mono text-sm font-bold">UGX {p.price.toLocaleString()}</p>
                <div className="flex items-center gap-4 mt-2">
                   <div className="flex items-center bg-black/40 rounded-lg px-2 border border-white/10">
                      <button onClick={async () => await updateDoc(doc(db, 'products', p.id), { stock: increment(-1) })} className="px-2 py-1 text-gray-500">-</button>
                      <span className="px-2 font-mono text-xs text-white">{p.stock}</span>
                      <button onClick={async () => await updateDoc(doc(db, 'products', p.id), { stock: increment(1) })} className="px-2 py-1 text-gray-500">+</button>
                   </div>
                   <button onClick={() => { setNewProduct(p); setEditingId(p.id); setIsAdding(true); }} className="text-[10px] font-black text-gray-500 hover:text-white uppercase">Modify</button>
                </div>
              </div>
              <button onClick={async () => { if(confirm("Delist asset?")) await deleteDoc(doc(db, 'products', p.id)); }} className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} className="text-red-500/50 hover:text-red-500" /></button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {loadingOrders ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div> : 
            orders.map(o => (
              <div key={o.id} className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem]">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <span className="text-xs font-mono text-blue-500 font-bold">{o.id}</span>
                    <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter mt-1">{o.customerName}</h4>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><Clock size={12} /> {format(o.createdAt, 'MMM dd, HH:mm')} | {o.customerPhone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-white italic tracking-tighter">UGX {o.total.toLocaleString()}</p>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{o.status}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap mb-6">
                  {Object.keys(statusMap).map((s) => (
                    <button key={s} onClick={() => updateOrderStatus(o.id, s as any)} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all", o.status === s ? "bg-white text-black border-white" : "bg-white/5 text-gray-500 border-white/10")}>{s}</button>
                  ))}
                  <a href={`https://wa.me/${o.customerPhone.replace(/\D/g, '')}`} target="_blank" className="ml-auto px-6 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">WhatsApp Client</a>
                </div>
                <div className="space-y-3 bg-black/20 p-4 rounded-2xl border border-white/5">
                   {o.items.map(i => <div key={i.id} className="flex justify-between text-xs font-bold uppercase"><span className="text-gray-400">{i.quantity} x {i.name}</span><span className="text-white">UGX {(i.price * i.quantity).toLocaleString()}</span></div>)}
                   <p className="text-[10px] text-gray-500 pt-3 border-t border-white/5 italic">Delivery: {o.deliveryAddress}</p>
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
