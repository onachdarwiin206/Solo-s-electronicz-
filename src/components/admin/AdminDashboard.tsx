import { useState, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Package, DollarSign, Tag, Image as ImageIcon, Video, Trash2, Save, X, Star, Upload, Loader2, Zap } from 'lucide-react';
import { Product, Category } from '../../types';
import { db, storage } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/error-handler';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { cn } from '../../lib/utils';

interface AdminDashboardProps {
  products: Product[];
  onProductAdded: (product: Product) => void;
}

export function AdminDashboard({ products, onProductAdded }: AdminDashboardProps) {
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
    featured: false
  });

  // Native Fast Compression: Uses hardware-accelerated canvas for near-instant processing
  const fastCompress = async (file: File): Promise<Blob | File> => {
    return new Promise((resolve) => {
      // Direct pass for optimized small files
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
          }, 'image/jpeg', 0.85); // High quality, fast encoding
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

    // Zero-Latency Optimistic Preview
    const previewUrl = URL.createObjectURL(file);
    setLocalPreview(previewUrl);
    setUploading(true);

    try {
      // Speed-First Processing
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
        // Refresh products in parent state would be better, but assuming onProductAdded handles updates if ID matches or is a general "refresh" trigger. 
        // For simplicity in this structure, I'll assume we need to reload or update manually.
        window.location.reload(); // Simple way to sync for now if parent state isn't reactive enough
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
    const path = `products/${id}`;
    try {
      await deleteDoc(doc(db, 'products', id));
      window.location.reload();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
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
      featured: false
    });
  };

  return (
    <div className="max-w-7xl mx-auto py-20 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic">Inventory Command</h2>
          <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest mt-2 font-bold bg-white/5 px-3 py-1 rounded-full border border-white/5 inline-block">Authorized Personnel Only</p>
        </div>
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
      </div>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] p-8 md:p-12 mb-12 relative overflow-hidden"
        >
           <button 
            onClick={resetForm}
            className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"
           >
             <X size={24} />
           </button>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
             <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Model Designation</label>
                  <input 
                    type="text" 
                    value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                    placeholder="e.g. Solo X Gen 4"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold placeholder:text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Technical Description</label>
                  <textarea 
                    value={newProduct.description}
                    onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                    placeholder="Full specifications..."
                    rows={4}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-light resize-none placeholder:text-gray-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Retail Valuation (UGX)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input 
                        type="number" 
                        value={newProduct.price}
                        onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 pl-12 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Units in Storage</label>
                    <div className="relative">
                      <Package className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input 
                        type="number" 
                        value={newProduct.stock}
                        onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 pl-12 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Category Assignment</label>
                  <div className="relative">
                    <Tag className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <select 
                      value={newProduct.category}
                      onChange={e => setNewProduct({...newProduct, category: e.target.value as Category})}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 pl-12 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none font-bold"
                    >
                      <option value="Phones">Mobile Devices (Phones)</option>
                      <option value="Computers">Computing Systems</option>
                      <option value="Electronics">General Electronics</option>
                    </select>
                  </div>
                </div>
             </div>

             <div className="space-y-6">
                 <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Visual Media (URL or Local File)</label>
                  <div className="space-y-4">
                    <div className="relative">
                      <ImageIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input 
                        type="text" 
                        value={newProduct.image}
                        onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                        placeholder="https://cdn.example.com/image.jpg"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 pl-12 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-xs placeholder:text-gray-700"
                      />
                    </div>
                    
                    <div className="relative">
                      <input
                        type="file"
                        id="asset-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                      <label 
                        htmlFor="asset-upload"
                        className={cn(
                          "flex items-center justify-center gap-3 w-full p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer",
                          uploading 
                            ? "bg-white/5 border-white/10 cursor-not-allowed" 
                            : "bg-blue-600/10 border-blue-600/30 hover:bg-blue-600/20 hover:border-blue-600/50"
                        )}
                      >
                        {uploading ? (
                          <>
                            <Loader2 size={20} className="animate-spin text-blue-500" />
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Optimizing & Uploading...</span>
                              <div className="flex items-center gap-1 mt-1">
                                <Zap size={10} className="text-amber-500 fill-amber-500" />
                                <span className="text-[8px] font-mono text-amber-500/80 uppercase">Turbo Mode Active</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <Upload size={20} className="text-blue-500" />
                            <span className="text-xs font-black text-blue-500 uppercase tracking-widest">Select From Local Hub</span>
                          </>
                        )}
                      </label>
                    </div>

                    {(localPreview || newProduct.image) && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 group bg-black/40"
                      >
                        <img 
                          src={localPreview || newProduct.image} 
                          alt="Preview" 
                          className={cn(
                            "w-full h-full object-cover transition-opacity duration-500",
                            uploading ? "opacity-50 blur-[2px]" : "opacity-100"
                          )} 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                          <div className="w-full flex items-center justify-between">
                            <div>
                              <p className="text-[9px] font-mono text-blue-400 uppercase font-bold tracking-widest">
                                {uploading ? "Analyzing Pixels..." : "Visual Link Verified"}
                              </p>
                              {uploading && (
                                <motion.div 
                                  className="h-1 bg-blue-500 mt-1 rounded-full"
                                  initial={{ width: "0%" }}
                                  animate={{ width: "100%" }}
                                  transition={{ duration: 2, ease: "easeInOut" }}
                                />
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                              <Zap size={10} className="text-amber-500 fill-amber-500" />
                              <span className="text-[8px] font-black text-amber-500 uppercase">Turbo-Sync</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Motion Asset URL (Optional)</label>
                  <div className="relative">
                    <Video className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="text" 
                      value={newProduct.videoUrl}
                      onChange={e => setNewProduct({...newProduct, videoUrl: e.target.value})}
                      placeholder="mp4 direct link"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 pl-12 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-xs placeholder:text-gray-700"
                    />
                  </div>
                </div>
                
                <div className="bg-black/40 border border-white/10 rounded-3xl p-6">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-white font-black text-xs uppercase tracking-tighter">Featured Status</p>
                       <p className="text-gray-500 text-[10px] font-mono mt-1 uppercase">Prioritize in main display</p>
                     </div>
                     <button 
                      onClick={() => setNewProduct({...newProduct, featured: !newProduct.featured})}
                      className={cn(
                        "w-14 h-8 rounded-full relative transition-all duration-300",
                        newProduct.featured ? "bg-blue-600" : "bg-white/10"
                      )}
                     >
                       <div className={cn(
                         "absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-lg",
                         newProduct.featured ? "left-7" : "left-1"
                       )} />
                     </button>
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={handleSave}
                    className="flex-1 py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-900/40 flex items-center justify-center gap-3 group"
                  >
                    <Save size={20} className="group-hover:scale-110 transition-transform" />
                    {editingId ? 'COMMIT CHANGES' : 'AUTHORIZE DEPLOYMENT'}
                  </button>
                  {editingId && (
                    <button 
                      onClick={resetForm}
                      className="px-6 py-5 bg-white/5 hover:bg-white/10 text-gray-400 font-bold rounded-2xl transition-all border border-white/10"
                    >
                      ABORT
                    </button>
                  )}
                </div>
             </div>
           </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="relative group bg-white/5 border border-white/10 rounded-[2rem] p-8 hover:border-white/20 transition-all flex flex-col gap-6 overflow-hidden">
             {/* Visual Preview */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
             
             <div className="flex items-center gap-6">
                <div className="relative shrink-0">
                  <img src={product.image} className="w-20 h-20 rounded-2xl object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                  {product.featured && (
                    <div className="absolute -top-2 -right-2 bg-amber-500 p-1.5 rounded-lg text-white shadow-lg">
                      <Star size={12} fill="currentColor" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                   <h4 className="font-black text-xl text-white mb-1 tracking-tighter truncate uppercase italic leading-tight">{product.name}</h4>
                   <div className="flex flex-wrap items-center gap-3 text-[9px] uppercase font-black tracking-widest">
                      <span className="text-blue-500 font-mono">UGX {product.price.toLocaleString()}</span>
                      <span className="text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">{product.category}</span>
                   </div>
                   <div className="mt-2 flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        product.stock > 0 ? "bg-green-500" : "bg-red-500"
                      )} />
                      <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                        {product.stock} units
                      </span>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleEdit(product)}
                  className="py-3 bg-white/5 hover:bg-white text-gray-400 hover:text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border border-white/10 hover:border-white flex items-center justify-center gap-2"
                >
                  Edit Specifications
                </button>
                <button 
                  onClick={() => handleDelete(product.id)}
                  className="py-3 bg-white/5 hover:bg-red-500/20 text-gray-700 hover:text-red-500 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all border border-white/10 hover:border-red-500/30 flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} />
                  Decommission
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
