import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Package, DollarSign, Tag, Image as ImageIcon, Video, Trash2, Save, X, Star, Loader2, Clock, CheckCircle, Truck, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Product, Category, Order, OrderStatus } from '../../types';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { Tooltip } from '../ui/Tooltip';

interface AdminDashboardProps {
  products: Product[];
  onProductAdded: (product: Product) => void;
  onProductRemoved: (id: string) => void;
}

export function AdminDashboard({ products, onProductAdded, onProductRemoved }: AdminDashboardProps) {
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

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // In local mode, we'll use placeholder or local URL
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (file.type.startsWith('video/')) {
        setNewProduct(prev => ({ ...prev, videoUrl: url, videoDuration: 30 }));
      } else {
        setNewProduct(prev => ({ ...prev, image: url }));
      }
    }
  };

  const handleSave = () => {
    if (!newProduct.name || !newProduct.price || !newProduct.image) return;
    setSubmitting(true);
    
    // Simulate save
    setTimeout(() => {
      const data = { ...newProduct, id: editingId || `LOCAL-${Date.now()}` } as Product;
      onProductAdded(data);
      resetForm();
      setSubmitting(false);
    }, 500);
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
                {editingId ? 'Modify Local Asset' : 'Commit to Local Inventory'}
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
                      <Tooltip content="Stock Control (Local)">
                        <button className="px-2 py-1 text-gray-500 hover:text-white">-</button>
                      </Tooltip>
                      <span className="px-2 font-mono text-xs text-white">{p.stock}</span>
                      <Tooltip content="Stock Control (Local)">
                        <button className="px-2 py-1 text-gray-500 hover:text-white">+</button>
                      </Tooltip>
                   </div>
                   <button onClick={() => { setNewProduct(p); setEditingId(p.id); setIsAdding(true); }} className="text-[10px] font-black text-gray-500 hover:text-white uppercase">Edit</button>
                </div>
              </div>
                <Tooltip content="Remove (Local)" position="left">
                  <button onClick={() => onProductRemoved(p.id)} className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} className="text-red-500/50 hover:text-red-500" />
                  </button>
                </Tooltip>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="py-20 text-center text-gray-500 font-black uppercase tracking-widest bg-white/5 rounded-[3rem] border border-white/10">
             Logistics Database Offline (Local Mode)
          </div>
        </div>
      )}
    </div>
  );
}
