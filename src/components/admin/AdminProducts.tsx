import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import imageCompression from 'browser-image-compression';
import { Plus, Package, DollarSign, Tag, Image as ImageIcon, Video, Trash2, Save, X, Loader2, ArrowLeft, ShieldCheck, AlertCircle, QrCode, Printer, Search, Camera, CameraOff, FlipHorizontal, Radio, Copy, Eye, Archive, FileSpreadsheet, Upload, Check } from 'lucide-react';
import { Product, Category } from '../../types';
import { PRODUCT_CATEGORIES } from '../../constants';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { uploadFile, getPublicUrl, deleteFile } from '../../lib/storage';
import { v4 as uuidv4 } from 'uuid';

interface AdminProductsProps {
  products: Product[];
  onRefresh: () => void;
  lowStockThreshold: number;
}

export function AdminProducts({ products, onRefresh, lowStockThreshold }: AdminProductsProps) {
  // Navigation & Tab Filters
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [skuSearch, setSkuSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<string>('all'); // 'all', 'under-500k', '500k-1.5m', 'over-1.5m'
  const [stockFilter, setStockFilter] = useState<string>('all'); // 'all', 'low', 'out'
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all', 'published', 'draft', 'archived'

  // Modal Product State
  const [newProduct, setNewProduct] = useState<Partial<Product> & {
    brand?: string;
    original_price?: number;
    discount_percentage?: number;
    sku?: string;
    low_stock_level?: number;
    publish_status?: 'Draft' | 'Published' | 'Archived' | 'Out of Stock';
  }>({
    name: '',
    brand: '',
    category: 'Phones & Tablets',
    description: '',
    specifications: '',
    price: 0,
    original_price: 0,
    discount_percentage: 0,
    sku: '',
    stock: 0,
    low_stock_level: 5,
    publish_status: 'Published',
    featured: false,
    is_verified: true,
    images: [],
    videos: []
  });

  // Unique list of categories and brands for filtering
  const brandsList = Array.from(new Set(products.map(p => {
    // Attempt to parse brand from name if not stored, e.g. "Apple iPhone" -> "Apple"
    if ((p as any).brand) return (p as any).brand;
    const split = p.name?.trim().split(' ');
    return split && split.length > 0 ? split[0] : 'Generic';
  }))).filter(Boolean);

  // Core Product Filters Logic
  const filteredProducts = products.filter(p => {
    const pBrand = ((p as any).brand || p.name?.trim().split(' ')[0] || 'Generic').toLowerCase();
    const pSku = (p as any).sku || p.id || '';
    const pStatus = (p as any).publish_status || (p.stock > 0 ? 'Published' : 'Out of Stock');
    const pLowThreshold = (p as any).low_stock_level || lowStockThreshold;

    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSku = pSku.toLowerCase().includes(skuSearch.toLowerCase());
    const matchesCategory = categoryFilter === 'all' ? true : p.category === categoryFilter;
    const matchesBrand = brandFilter === 'all' ? true : pBrand === brandFilter.toLowerCase();
    
    let matchesPrice = true;
    if (priceFilter === 'under-500k') matchesPrice = p.price < 500000;
    else if (priceFilter === '500k-1.5m') matchesPrice = p.price >= 500000 && p.price <= 1500000;
    else if (priceFilter === 'over-1.5m') matchesPrice = p.price > 1500000;

    let matchesStock = true;
    if (stockFilter === 'low') matchesStock = p.stock > 0 && p.stock <= pLowThreshold;
    else if (stockFilter === 'out') matchesStock = p.stock === 0;

    let matchesStatus = true;
    if (statusFilter === 'all') matchesStatus = true;
    else matchesStatus = pStatus.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesSku && matchesCategory && matchesBrand && matchesPrice && matchesStock && matchesStatus;
  });

  // Calculate pricing values automatically
  useEffect(() => {
    if (newProduct.original_price && newProduct.price) {
      const diff = newProduct.original_price - newProduct.price;
      if (diff > 0 && newProduct.original_price > 0) {
        const pct = Math.round((diff / newProduct.original_price) * 100);
        if (newProduct.discount_percentage !== pct) {
          setNewProduct(prev => ({ ...prev, discount_percentage: pct }));
        }
      } else {
        if (newProduct.discount_percentage !== 0) {
          setNewProduct(prev => ({ ...prev, discount_percentage: 0 }));
        }
      }
    }
  }, [newProduct.price, newProduct.original_price]);

  // QR shelf utilities
  const [selectedQRProduct, setSelectedQRProduct] = useState<Product | null>(null);

  // CSV Bulk Import Screen state
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Upload state managers
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

  // Camera Console States and Refs
  const [showCameraSuite, setShowCameraSuite] = useState(false);
  const [cameraMode, setCameraMode] = useState<'image' | 'video'>('image');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Actions: Duplicate, Archive, Delete
  const handleDuplicate = (p: Product) => {
    setEditingId(null);
    setNewProduct({
      ...p,
      name: `${p.name} (Copy)`,
      sku: `${(p as any).sku || p.id || ''}-COPY`,
      stock: 0,
      publish_status: 'Draft',
      images: p.images || [p.image],
      videos: p.videos || []
    });
    // Load existing items into upload items to mimic
    const mappedImages = (p.images || [p.image]).map(img => ({
      id: uuidv4().substring(0, 8),
      type: 'image' as const,
      file: new File([], 'copied-image'),
      status: 'done' as const,
      progress: 100,
      url: img
    }));
    setUploadingMedia(mappedImages);
    setIsAdding(true);
  };

  const handleArchive = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Archived' ? 'Published' : 'Archived';
    if (!confirm(`Are you sure you want to transition this listing to ${nextStatus}?`)) return;

    // Local Storage support
    try {
      const localCustomRaw = localStorage.getItem('custom_products');
      let localCustom: any[] = localCustomRaw ? JSON.parse(localCustomRaw) : [];
      let updated = false;
      localCustom = localCustom.map(p => {
        if (p.id === id) {
          updated = true;
          return { ...p, publish_status: nextStatus };
        }
        return p;
      });
      if (!updated) {
        const found = products.find(p => p.id === id);
        if (found) {
          localCustom.push({ ...found, publish_status: nextStatus });
        }
      }
      localStorage.setItem('custom_products', JSON.stringify(localCustom));
    } catch (e) {
      console.warn(e);
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('products').update({ publish_status: nextStatus }).eq('id', id);
      } catch (err) {
        console.error("Archive failed: ", err);
      }
    }
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('CRITICAL ACTION: Are you sure you want to permanently decommission this product from the inventory database? This cannot be undone.')) return;
    
    // Clean local fallback
    try {
      const localCustomRaw = localStorage.getItem('custom_products');
      if (localCustomRaw) {
        const localCustom: any[] = JSON.parse(localCustomRaw);
        localStorage.setItem('custom_products', JSON.stringify(localCustom.filter(p => p.id !== id)));
      }
      const deletedRaw = localStorage.getItem('deleted_product_ids');
      const deletedIds: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem('deleted_product_ids', JSON.stringify(deletedIds));
      }
    } catch (e) {
      console.warn(e);
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('products').delete().eq('id', id);
      } catch (err) {
        console.error(err);
      }
    }
    onRefresh();
  };

  // Live Camera control loops
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const constraints = {
        video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: cameraMode === 'video'
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn(e));
      }
      setCameraActive(true);
    } catch (err) {
      setCameraError("Camera hardware pipeline denied context permission.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setRecording(false);
  };

  useEffect(() => {
    if (showCameraSuite) startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [showCameraSuite, cameraMode, facingMode]);

  const snapPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera_snap_${Date.now()}.jpg`, { type: 'image/jpeg' });
          const newUpload = {
            id: uuidv4().substring(0, 8),
            type: 'image' as const,
            file,
            status: 'queued' as const,
            progress: 0,
            localPreview: URL.createObjectURL(file)
          };
          setUploadingMedia(prev => [...prev, newUpload]);
        }
      }, 'image/jpeg', 0.9);
    }
  };

  // Compress & Upload routines
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newUploads = Array.from(files).map(file => ({
      id: uuidv4().substring(0, 8),
      type,
      file,
      status: 'queued' as const,
      progress: 0,
      localPreview: URL.createObjectURL(file)
    }));
    setUploadingMedia(prev => [...prev, ...newUploads]);
  };

  const processQueue = async () => {
    const active = uploadingMedia.filter(m => m.status === 'uploading').length;
    const queued = uploadingMedia.filter(m => m.status === 'queued');
    if (active >= 2 || queued.length === 0) return;

    const next = queued[0];
    setUploadingMedia(prev => prev.map(i => i.id === next.id ? { ...i, status: 'uploading' } : i));

    try {
      let fileToUpload: Blob | File = next.file;
      if (next.type === 'image' && next.file.size > 0) {
        try {
          fileToUpload = await imageCompression(next.file, { maxSizeMB: 0.5, maxWidthOrHeight: 1600, useWebWorker: true });
        } catch (e) { console.warn("Compression failed model bypass", e); }
      }

      if (isSupabaseConfigured) {
        const bucket = next.type === 'image' ? 'product-images' : 'product-videos';
        const storagePath = `products/${editingId || 'new'}_${next.file.name.replace(/\s+/g, '_')}`;
        const filePath = await uploadFile(fileToUpload as File, bucket, storagePath);
        const publicUrl = getPublicUrl(bucket, filePath!);
        
        setUploadingMedia(prev => prev.map(i => i.id === next.id ? { 
          ...i, progress: 100, status: 'done', url: publicUrl, path: filePath 
        } : i));
      } else {
        // Mock offline preview
        setUploadingMedia(prev => prev.map(i => i.id === next.id ? { 
          ...i, progress: 100, status: 'done', url: i.localPreview 
        } : i));
      }
    } catch (err: any) {
      setUploadingMedia(prev => prev.map(i => i.id === next.id ? { 
        ...i, status: 'error', error: err.message || "Upload Failure" 
      } : i));
    }
  };

  useEffect(() => { processQueue(); }, [uploadingMedia]);

  const handleSave = async () => {
    if (submitting) return;
    const name = newProduct.name?.trim();
    const price = Number(newProduct.price);
    const stock = Number(newProduct.stock || 0);

    if (!name || isNaN(price) || price <= 0) {
      alert("Validation Error: Please configure a valid product name and MSRP selling price.");
      return;
    }

    setSubmitting(true);
    try {
      const finalImages = uploadingMedia.filter(m => m.type === 'image' && m.status === 'done').map(m => m.url!);
      const finalVideos = uploadingMedia.filter(m => m.type === 'video' && m.status === 'done').map(m => m.url!);

      const savedData: any = {
        name,
        brand: newProduct.brand || name.split(' ')[0] || 'Generic',
        description: newProduct.description || '',
        specifications: newProduct.specifications || '',
        price,
        original_price: Number(newProduct.original_price) || price,
        discount_percentage: Number(newProduct.discount_percentage) || 0,
        sku: newProduct.sku || `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        stock,
        low_stock_level: Number(newProduct.low_stock_level) || 5,
        publish_status: newProduct.publish_status || 'Published',
        category: newProduct.category,
        image: finalImages[0] || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12',
        images: finalImages.length > 0 ? finalImages : ['https://images.unsplash.com/photo-1546868871-7041f2a55e12'],
        videos: finalVideos,
        featured: !!newProduct.featured,
        is_verified: !!newProduct.is_verified,
        updated_at: new Date().toISOString()
      };

      if (editingId) {
        savedData.id = editingId;
        if (isSupabaseConfigured) {
          const { error } = await supabase.from('products').update(savedData).eq('id', editingId);
          if (error) throw error;
        }
      } else {
        savedData.id = `SOLO-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        savedData.created_at = new Date().toISOString();
        savedData.rating = 5;
        if (isSupabaseConfigured) {
          const { error } = await supabase.from('products').insert(savedData);
          if (error) throw error;
        }
      }

      // Sync offline cache
      const localCustomRaw = localStorage.getItem('custom_products');
      let localCustom: any[] = localCustomRaw ? JSON.parse(localCustomRaw) : [];
      if (editingId) {
        localCustom = localCustom.map(p => p.id === editingId ? { ...p, ...savedData } : p);
      } else {
        localCustom.push(savedData);
      }
      localStorage.setItem('custom_products', JSON.stringify(localCustom));

      setIsAdding(false);
      setEditingId(null);
      setUploadingMedia([]);
      onRefresh();
    } catch (err: any) {
      alert(`Save compilation failure: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle CSV parser logic
  const handleCSVImport = () => {
    if (!csvText.trim()) return;
    const lines = csvText.split('\n');
    const headers = lines[0].toLowerCase().split(',');
    const results: any[] = [];
    const errors: string[] = [];

    // Columns: name, category, price, stock, brand, description
    const findIndex = (col: string) => headers.indexOf(col);
    const nIdx = findIndex('name');
    const cIdx = findIndex('category');
    const pIdx = findIndex('price');
    const sIdx = findIndex('stock');
    const bIdx = findIndex('brand');

    if (nIdx === -1 || pIdx === -1) {
      alert("Invalid Template Headers: At least 'Name' and 'Price' columns must be present.");
      return;
    }

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      // Basic CSV splitter
      const cols = lines[i].split(',');
      const name = cols[nIdx]?.replace(/^"|"$/g, '').trim();
      const category = cIdx !== -1 ? cols[cIdx]?.replace(/^"|"$/g, '').trim() : 'Phones & Tablets';
      const price = pIdx !== -1 ? parseFloat(cols[pIdx]) : 0;
      const stock = sIdx !== -1 ? parseInt(cols[sIdx]) : 0;
      const brand = bIdx !== -1 ? cols[bIdx]?.replace(/^"|"$/g, '').trim() : name?.split(' ')[0] || 'Generic';

      if (!name) {
        errors.push(`Row ${i + 1}: Critical: Name is empty.`);
        continue;
      }
      if (isNaN(price) || price <= 0) {
        errors.push(`Row ${i + 1}: Error: Price "${cols[pIdx]}" is invalid.`);
        continue;
      }

      // Check Duplicates in current catalogs
      const isDuplicate = products.some(p => p.name?.toLowerCase() === name.toLowerCase());

      results.push({
        id: `SOLO-CSV-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        name,
        category,
        brand,
        price,
        stock,
        isDuplicate,
        description: 'Bulk catalog importation system device.',
        image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12',
        images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12'],
        publish_status: 'Published'
      });
    }

    setImportPreview(results);
    setImportErrors(errors);
  };

  const commitCSVImport = async () => {
    if (importPreview.length === 0) return;
    setIsImporting(true);
    try {
      const formatted = importPreview.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        brand: p.brand,
        price: p.price,
        stock: p.stock,
        description: p.description,
        image: p.image,
        images: p.images,
        publish_status: p.publish_status,
        created_at: new Date().toISOString()
      }));

      // Supabase upload
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('products').insert(formatted);
        if (error) throw error;
      }

      // Local storage upload
      const localCustomRaw = localStorage.getItem('custom_products');
      let localCustom: any[] = localCustomRaw ? JSON.parse(localCustomRaw) : [];
      localStorage.setItem('custom_products', JSON.stringify([...localCustom, ...formatted]));

      alert(`Commit Succeeded! Successfully imported ${formatted.length} devices into inventory.`);
      setShowBulkImport(false);
      setCsvText('');
      setImportPreview([]);
      onRefresh();
    } catch (err: any) {
      alert(`Import committed failure: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const triggerLabelPrint = (product: Product) => {
    const printWindow = window.open('about:blank', '_blank', 'width=600,height=600');
    if (!printWindow) return;
    const productUrl = `${window.location.origin}/?product=${product.id}`;
    printWindow.document.write(`
      <html>
        <head>
          <title>${product.name} - Label</title>
          <style>
            body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
            .label { border: 2px solid #000; padding: 25px; border-radius: 12px; width: 300px; text-align: center; }
            .brand { font-size: 10px; font-weight: 900; color: #2563eb; letter-spacing: 0.1em; }
            .name { font-size: 16px; font-weight: 800; margin: 8px 0; }
            .price { font-size: 20px; font-weight: 900; font-family: monospace; }
            .qr { margin: 15px auto; width: 140px; height: 140px; }
            .footer { font-size: 8px; color: #555; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="brand">⚡ SOLO ELECTRONICS ⚡</div>
            <div class="name">${product.name}</div>
            <div class="price">UGX ${product.price.toLocaleString()}</div>
            <img class="qr" src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(productUrl)}" />
            <div class="footer">SCAN TO BROWSE REVIEWS & SPECS</div>
          </div>
          <script>window.onload = function() { window.print(); window.close(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Search Actions bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-3xl">
        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Search catalog models..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-sans text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Search dynamic SKU indexes..."
              value={skuSearch}
              onChange={e => setSkuSearch(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-sans text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto self-stretch">
          <button
            onClick={() => setShowBulkImport(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl text-xs uppercase cursor-pointer"
          >
            <FileSpreadsheet size={15} />
            Bulk CSV
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setNewProduct({
                name: '', brand: '', category: 'Phones & Tablets', description: '', specifications: '',
                price: 0, original_price: 0, discount_percentage: 0, sku: '', stock: 10, low_stock_level: 5,
                publish_status: 'Published', featured: false, is_verified: true, images: [], videos: []
              });
              setUploadingMedia([]);
              setIsAdding(true);
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase cursor-pointer shadow-lg shadow-blue-500/10"
          >
            <Plus size={15} />
            ADD PRODUCT
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-3xl p-6 grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Category select filter */}
        <div className="space-y-1.5Col">
          <label className="text-[9px] font-black uppercase text-zinc-400">Category</label>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none font-bold"
          >
            <option value="all">All Categories</option>
            {PRODUCT_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Brand filter selection */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase text-zinc-400">Brand</label>
          <select
            value={brandFilter}
            onChange={e => setBrandFilter(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none font-bold capitalize"
          >
            <option value="all">All Brands</option>
            {brandsList.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>

        {/* Pricing boundaries */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase text-zinc-400">Pricing Tier</label>
          <select
            value={priceFilter}
            onChange={e => setPriceFilter(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none font-bold"
          >
            <option value="all">All Prices</option>
            <option value="under-500k">Under UGX 500k</option>
            <option value="500k-1.5m">UGX 500k - 1.5M</option>
            <option value="over-1.5m">Over UGX 1.5M</option>
          </select>
        </div>

        {/* Stock conditions */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase text-zinc-400">Stock Alarm</label>
          <select
            value={stockFilter}
            onChange={e => setStockFilter(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none font-bold"
          >
            <option value="all">All Status</option>
            <option value="low">Under Threshold (Low)</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>

        {/* Published state */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase text-zinc-400">Catalog Stage</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none font-bold"
          >
            <option value="all">All Stages</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Main Product Table Grid */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-1050 border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                <th className="py-4 px-6">Product Image</th>
                <th className="py-4 px-6">Product Name</th>
                <th className="py-4 px-6">Segment / Brand</th>
                <th className="py-4 px-6 text-right">Selling Price</th>
                <th className="py-4 px-6 text-center">Stock Reserves</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredProducts.map((p) => {
                const isLow = p.stock <= ((p as any).low_stock_level || lowStockThreshold) && p.stock > 0;
                const isOut = p.stock === 0;
                const status = (p as any).publish_status || (p.stock > 0 ? 'Published' : 'Out of Stock');
                const brandStr = (p as any).brand || p.name?.trim().split(' ')[0] || 'Generic';

                return (
                  <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-all text-xs">
                    <td className="py-4 px-6">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800">
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="py-4 px-6 font-bold text-zinc-900 dark:text-zinc-100">
                      <div className="max-w-xs truncate uppercase">{p.name}</div>
                      <div className="text-[10px] text-zinc-400 font-mono tracking-tight">{p.id}</div>
                    </td>
                    <td className="py-4 px-6 text-zinc-500 font-bold uppercase">
                      <div>{brandStr}</div>
                      <div className="text-[9px] font-medium text-zinc-400 normal-case">{p.category}</div>
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-bold text-zinc-800 dark:text-zinc-100">
                      UGX {p.price.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-center font-mono font-bold">
                      <div className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg ${
                        isOut 
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400' 
                          : isLow 
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                          : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}>
                        {p.stock} Units
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black tracking-widest uppercase ${
                        status === 'Published'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/10 dark:text-emerald-400'
                          : status === 'Draft'
                          ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-950/10 dark:text-red-400'
                      }`}>
                        {status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button onClick={() => triggerLabelPrint(p)} className="p-1 px-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase transition-colors" title="Print shelf tags">
                        QR Tag
                      </button>
                      <button onClick={() => handleDuplicate(p)} className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-300 transition-colors inline-block" title="Duplicate model spec">
                        <Copy size={13} />
                      </button>
                      <button onClick={() => {
                        setEditingId(p.id);
                        setNewProduct({
                          ...p,
                          brand: (p as any).brand || p.name?.trim().split(' ')[0] || 'Generic',
                          publish_status: (p as any).publish_status || 'Published',
                          sku: (p as any).sku || p.id,
                          original_price: (p as any).original_price || p.price,
                          discount_percentage: (p as any).discount_percentage || 0,
                          low_stock_level: (p as any).low_stock_level || 5
                        });
                        // Initialize mapped assets
                        const mappedImgs = (p.images || [p.image]).map(img => ({
                          id: uuidv4().substring(0, 8),
                          type: 'image' as const,
                          file: new File([], 'db-image'),
                          status: 'done' as const,
                          progress: 100,
                          url: img
                        }));
                        setUploadingMedia(mappedImgs);
                        setIsAdding(true);
                      }} className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 transition-colors inline-block" title="Edit spec sheet">
                        <Eye size={13} />
                      </button>
                      <button onClick={() => handleArchive(p.id, status)} className="p-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400 transition-colors inline-block" title="Toggle catalog stage">
                        <Archive size={13} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 transition-colors inline-block" title="Decommission listing">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-20 text-xs font-mono text-zinc-400 uppercase tracking-widest">
                    No results configured for active filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSV Bulk Import Dialog */}
      <AnimatePresence>
        {showBulkImport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-6 relative shadow-2xl">
              <button onClick={() => setShowBulkImport(false)} className="absolute top-5 right-5 p-2 bg-zinc-50 dark:bg-zinc-800 rounded-full hover:bg-zinc-100 transition-all text-zinc-500">
                <X size={20} />
              </button>
              
              <div className="space-y-1">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-wider">Bulk Catalog Import pass</span>
                <h3 className="text-2xl font-display font-black text-zinc-900 dark:text-white uppercase italic">CSV Parser Integrator</h3>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Paste Text CSV Block (Headers: Name, Category, Price, Stock, Brand)</label>
                <textarea
                  rows={6}
                  placeholder={`name,category,price,stock,brand\nSamsung Galaxy S24 Ultra,Phones & Tablets,4200000,12,Samsung\nApple MacBook Pro 16",Computers & Laptops,7500000,8,Apple`}
                  value={csvText}
                  onChange={e => setCsvText(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none"
                />
              </div>

              <button onClick={handleCSVImport} className="w-full py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all hover:bg-zinc-800">
                Parse & Validate Rows
              </button>

              {importErrors.length > 0 && (
                <div className="p-4 bg-red-100/10 border border-red-500/20 rounded-2xl text-red-500 text-[11px] font-mono space-y-1">
                  <p className="font-bold uppercase tracking-wider">Validation Errors detected:</p>
                  {importErrors.map((err, i) => <p key={i}>• {err}</p>)}
                </div>
              )}

              {importPreview.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-zinc-500">CSV Import Grid Review ({importPreview.length} found)</h4>
                  <div className="border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden max-h-56 overflow-y-auto text-[11px]">
                    <table className="w-full text-left">
                      <thead className="bg-zinc-50 dark:bg-zinc-950 font-black text-zinc-400 uppercase">
                        <tr>
                          <th className="p-3">Model</th>
                          <th className="p-3">Category</th>
                          <th className="p-3 text-right">Price</th>
                          <th className="p-3 text-center">Stock</th>
                          <th className="p-3 text-center">Duplicate Check</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium text-zinc-700 dark:text-zinc-300">
                        {importPreview.map((item, i) => (
                          <tr key={i} className="hover:bg-zinc-50/50">
                            <td className="p-3 font-bold uppercase">{item.name}</td>
                            <td className="p-3">{item.category}</td>
                            <td className="p-3 text-right font-mono">UGX {item.price.toLocaleString()}</td>
                            <td className="p-3 text-center font-mono">{item.stock} Units</td>
                            <td className="p-3 text-center">
                              {item.isDuplicate ? (
                                <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wide">⚠ Exists in DB</span>
                              ) : (
                                <span className="bg-emerald-150 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wide">Clean</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button onClick={commitCSVImport} disabled={isImporting} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-widest rounded-xl transition-all disabled:opacity-55">
                    {isImporting ? "Synching catalogs..." : "PULL ALL DEV TO LIVE STOCK"}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Spec Add/Edit Panel */}
      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-zinc-950/90 backdrop-blur-md overflow-y-auto py-10 px-4">
            <div className="max-w-5xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] p-8 md:p-10 relative">
              <button onClick={() => setIsAdding(false)} className="absolute top-6 right-6 p-2 bg-zinc-50 dark:bg-zinc-800 rounded-full hover:bg-zinc-100 transition-all text-zinc-500">
                <X size={22} />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-blue-600 text-white rounded-2xl">
                  <Package size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-black text-zinc-900 dark:text-white uppercase italic">
                    {editingId ? 'Modify Catalog Spec' : 'Initialize Catalog Spec'}
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                    {editingId ? `Spec Registry id: ${editingId}` : 'Step-By-Step Product Initialization'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Form Column */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Basic specs</label>
                    <input
                      type="text"
                      placeholder="Product Name"
                      value={newProduct.name}
                      onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-xs text-zinc-800 dark:text-zinc-200 font-bold focus:outline-none"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Brand/Importers"
                        value={newProduct.brand}
                        onChange={e => setNewProduct(p => ({ ...p, brand: e.target.value }))}
                        className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-xs text-zinc-800 dark:text-zinc-200 font-bold focus:outline-none"
                      />
                      <select
                        value={newProduct.category}
                        onChange={e => setNewProduct(p => ({ ...p, category: e.target.value as Category }))}
                        className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-xs text-zinc-800 dark:text-zinc-200 font-bold focus:outline-none"
                      >
                        {PRODUCT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>

                    <textarea
                      rows={3}
                      placeholder="Store front intro text description..."
                      value={newProduct.description}
                      onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
                    />

                    <textarea
                      rows={3}
                      placeholder="Technical specification details (One per line)..."
                      value={newProduct.specifications}
                      onChange={e => setNewProduct(p => ({ ...p, specifications: e.target.value }))}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-xs text-zinc-850 dark:text-zinc-200 font-mono focus:outline-none"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Price Configuration (UGX)</label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-[8px] font-black text-zinc-400 uppercase">Selling MSRP</span>
                        <input
                          type="number"
                          value={newProduct.price || ''}
                          onChange={e => setNewProduct(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-800 dark:text-zinc-200"
                        />
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-zinc-400 uppercase">Original Retail</span>
                        <input
                          type="number"
                          value={newProduct.original_price || ''}
                          onChange={e => setNewProduct(p => ({ ...p, original_price: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-800 dark:text-zinc-200"
                        />
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-zinc-400 uppercase">Discount Calc (%)</span>
                        <input
                          type="number"
                          readOnly
                          value={newProduct.discount_percentage || '0'}
                          className="w-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-850 rounded-xl p-3 text-xs font-mono font-black text-zinc-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Inventory Specs</label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-[8px] font-black text-zinc-400 uppercase">SKU Signature</span>
                        <input
                          type="text"
                          value={newProduct.sku}
                          onChange={e => setNewProduct(p => ({ ...p, sku: e.target.value }))}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-850 dark:text-zinc-200"
                        />
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-zinc-400 uppercase">Initial Qty</span>
                        <input
                          type="number"
                          value={newProduct.stock || '0'}
                          onChange={e => setNewProduct(p => ({ ...p, stock: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-850 dark:text-zinc-200"
                        />
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-zinc-400 uppercase">Low Stock Trigger</span>
                        <input
                          type="number"
                          value={newProduct.low_stock_level}
                          onChange={e => setNewProduct(p => ({ ...p, low_stock_level: parseInt(e.target.value) || 5 }))}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-850 dark:text-zinc-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Media Column */}
                <div className="space-y-6">
                  <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 p-6 rounded-[2rem] space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block h-6">Interactive Media asset Pipeline</label>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <label className="h-32 bg-blue-500/5 hover:bg-blue-500/10 border-2 border-dashed border-blue-500/15 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all">
                        <input type="file" className="hidden" accept="image/*" multiple onChange={e => handleFileUpload(e, 'image')} />
                        <ImageIcon size={28} className="text-blue-500 mb-2" />
                        <span className="text-[10px] font-black uppercase text-blue-500">Upload Photos</span>
                      </label>
                      <label className="h-32 bg-emerald-500/5 hover:bg-emerald-500/10 border-2 border-dashed border-emerald-500/15 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all">
                        <input type="file" className="hidden" accept="video/*" multiple onChange={e => handleFileUpload(e, 'video')} />
                        <Video size={28} className="text-emerald-500 mb-2" />
                        <span className="text-[10px] font-black uppercase text-emerald-500">Upload Video</span>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCameraSuite(true)}
                      className="w-full py-3 bg-zinc-900 text-white dark:bg-zinc-200 dark:text-black hover:opacity-90 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <Camera size={14} />
                      Launch Live WebCam Lens Suite
                    </button>
                  </div>

                  {/* Previews panel */}
                  <div className="grid grid-cols-4 gap-2 min-h-24">
                    {uploadingMedia.map((item) => (
                      <div key={item.id} className="relative aspect-square border border-zinc-150 rounded-xl overflow-hidden bg-zinc-50">
                        {item.type === 'image' ? (
                          <img src={item.localPreview || item.url} className="w-full h-full object-cover" alt="Preview spec" />
                        ) : (
                          <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                            <Video size={16} className="text-white" />
                          </div>
                        )}
                        <button
                          onClick={() => setUploadingMedia(p => p.filter(f => f.id !== item.id))}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-500 transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Catalog Status Stage</label>
                    <select
                      value={newProduct.publish_status}
                      onChange={e => setNewProduct(p => ({ ...p, publish_status: e.target.value as any }))}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-xl p-3.5 text-xs text-zinc-800 dark:text-zinc-200 font-bold"
                    >
                      <option value="Published">Published (Active Storefront)</option>
                      <option value="Draft">Draft spec</option>
                      <option value="Archived">Archived spec</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={submitting}
                    className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase rounded-2xl italic tracking-tight shadow-xl shadow-blue-500/10 flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {editingId ? "Commit Spec parameters" : "DEPLOY TO LIVE STOCK"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera Live Modal Overlay  */}
      <AnimatePresence>
        {showCameraSuite && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[130] bg-black/90 flex items-center justify-center p-4">
            <motion.div className="bg-zinc-900 border border-zinc-80 rounded-3xl p-6 max-w-xl w-full text-left space-y-4 relative">
              <button
                onClick={() => {
                  stopCamera();
                  setShowCameraSuite(false);
                }}
                className="absolute top-4 right-4 p-2 bg-zinc-800 text-zinc-300 rounded-full hover:text-white"
              >
                <X size={18} />
              </button>
              
              <h4 className="text-sm font-black uppercase tracking-widest text-blue-500">Hardware capture lens</h4>
              
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                {cameraActive && !cameraError ? (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <Loader2 size={24} className="animate-spin text-blue-500 mx-auto" />
                    <p className="text-[10px] font-mono text-zinc-500 mt-2">Connecting optic sensor pipelines...</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFacingMode(p => p === 'user' ? 'environment' : 'user')}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  Flip Lens Angle
                </button>
                <button
                  type="button"
                  onClick={snapPhoto}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  Cap specifications Photo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
