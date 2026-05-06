import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Package, DollarSign, Tag, Image as ImageIcon, Video, Trash2, Save, X, Star, Loader2, Clock, CheckCircle, Truck, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Product, Category, Order, OrderStatus } from '../../types';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { Tooltip } from '../ui/Tooltip';
import { db, storage } from '../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { handleFirestoreError, OperationType } from '../../lib/error-handler';

interface AdminDashboardProps {
  products: Product[];
}

export function AdminDashboard({ products }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubmitting(true);
    try {
      const storageRef = ref(storage, `products/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      if (file.type.startsWith('video/')) {
        setNewProduct(prev => ({ ...prev, videoUrl: url, videoDuration: 30 }));
      } else {
        setNewProduct(prev => ({ ...prev, image: url }));
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'storage');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.image) return;
    setSubmitting(true);
    
    try {
      const data = {
        ...newProduct,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), data);
      } else {
        await addDoc(collection(db, 'products'), {
          ...data,
          createdAt: serverTimestamp(),
          rating: 0
        });
      }
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
                <label className="h-40 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all">
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  <ImageIcon size={32} className="text-blue-500 mb-2" />
                  <span className="text-[10px] font-black uppercase text-gray-400">Featured Image</span>
                </label>
                <label className="h-40 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all">
                  <input type="file" className="hidden" accept="video/*" onChange={handleFileUpload} />
                  <Video size={32} className="text-green-500 mb-2" />
                  <span className="text-[10px] font-black uppercase text-gray-400">30s Demo Clip</span>
                </label>
              </div>
              <button 
                onClick={handleSave} 
                disabled={submitting}
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-xl italic uppercase flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
                {editingId ? 'Modify Cloud Asset' : 'Commit to Cloud Inventory'}
              </button>
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
      ) : (
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
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest">{order.id}</span>
                        <span className="text-gray-500 text-xs font-bold">{format(order.createdAt?.toDate ? order.createdAt.toDate() : new Date(), 'MMM dd, HH:mm')}</span>
                      </div>
                      <h4 className="text-lg font-bold text-white uppercase">{order.deliveryAddress}</h4>
                      <p className="text-blue-500 font-mono text-sm">{order.phone}</p>
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
                    <div className="lg:col-start-4 text-right">
                       <p className="text-[10px] text-gray-500 font-black uppercase mb-1">Total Payload</p>
                       <p className="text-white font-black text-xl italic tracking-tighter">UGX {order.total.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
