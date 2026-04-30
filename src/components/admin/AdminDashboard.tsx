import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Package, DollarSign, Tag, Image as ImageIcon, Video, Trash2, Save, X } from 'lucide-react';
import { Product, Category } from '../../types';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface AdminDashboardProps {
  products: Product[];
  onProductAdded: (product: Product) => void;
}

export function AdminDashboard({ products, onProductAdded }: AdminDashboardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    category: 'Phones',
    image: '',
    videoUrl: '',
    stock: 0,
  });

  const handleSave = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.image) return;

    try {
      const productData = {
        ...newProduct,
        createdAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'products'), productData);
      
      onProductAdded({
        ...productData,
        id: docRef.id,
      } as Product);

      setIsAdding(false);
      setNewProduct({
        name: '',
        description: '',
        price: 0,
        category: 'Phones',
        image: '',
        videoUrl: '',
        stock: 0,
      });
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-20 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-white">INVENTORY CONTROL</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mt-2">Administrator Oversight System</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl flex items-center gap-2 transition-all shadow-xl shadow-blue-900/20"
        >
          <Plus size={20} />
          New Product Entry
        </button>
      </div>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] p-8 md:p-12 mb-12 relative overflow-hidden"
        >
           <button 
            onClick={() => setIsAdding(false)}
            className="absolute top-8 right-8 text-gray-500 hover:text-white"
           >
             <X size={24} />
           </button>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Device Name</label>
                  <input 
                    type="text" 
                    value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                    placeholder="e.g. Solo Phantom v1"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Retail Price (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="number" 
                      value={newProduct.price}
                      onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Category Selection</label>
                  <select 
                    value={newProduct.category}
                    onChange={e => setNewProduct({...newProduct, category: e.target.value as Category})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                  >
                    <option value="Phones">Phones</option>
                    <option value="Computers">Computers</option>
                    <option value="Electronics">Electronics</option>
                  </select>
                </div>
             </div>

             <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Image Media URL</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="text" 
                      value={newProduct.image}
                      onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                      placeholder="https://..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Video Asset URL (Optional)</label>
                  <div className="relative">
                    <Video className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="text" 
                      value={newProduct.videoUrl}
                      onChange={e => setNewProduct({...newProduct, videoUrl: e.target.value})}
                      placeholder="mp4 or webm link"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-xs"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleSave}
                  className="w-full py-5 bg-white text-black font-black rounded-3xl mt-4 hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  Authorize & Publish
                </button>
             </div>
           </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-6">
             <img src={product.image} className="w-20 h-20 rounded-2xl object-cover" />
             <div className="flex-1">
                <h4 className="font-bold text-white mb-1">{product.name}</h4>
                <div className="flex items-center gap-4 text-[10px] uppercase font-black tracking-widest">
                   <span className="text-blue-500 font-mono">UGX {product.price.toLocaleString()}</span>
                   <span className="text-gray-500">{product.category}</span>
                </div>
             </div>
             <button className="p-3 text-gray-500 hover:text-red-500 transition-colors">
               <Trash2 size={20} />
             </button>
          </div>
        ))}
      </div>
    </div>
  );
}
