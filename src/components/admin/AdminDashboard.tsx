import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, ShoppingBag, Package, FileText, Users, 
  BarChart3, Layers, Tag, Settings, LogOut, Loader2, ShieldCheck, Database
} from 'lucide-react';
import { Product, Order, OrderStatus } from '../../types';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Modular Tab components
import { AdminOverview } from './AdminOverview';
import { AdminProducts } from './AdminProducts';
import { AdminInventory } from './AdminInventory';
import { AdminSales } from './AdminSales';
import { AdminMarketing } from './AdminMarketing';
import { AdminSettings } from './AdminSettings';
import { InventoryMovement, PromoCoupon, StoreSettings } from './types';

interface AdminDashboardProps {
  products: Product[];
  onRefresh: () => void;
}

type AdminTab = 'overview' | 'products' | 'inventory' | 'orders' | 'customers' | 'analytics' | 'categories' | 'promotions' | 'settings';

export default function AdminDashboard({ products, onRefresh }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  
  // Real orders fetching
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // 1. Whitelist administrative accounts state
  const [allowedEmails, setAllowedEmails] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('solo_allowed_emails');
      return saved ? JSON.parse(saved) : ['legacy-admin', 'secure-admin@soloelectronics.com', 'admin@soloelectronics.com'];
    } catch {
      return ['legacy-admin', 'secure-admin@soloelectronics.com'];
    }
  });

  // Save admin whitelist on modification
  useEffect(() => {
    localStorage.setItem('solo_allowed_emails', JSON.stringify(allowedEmails));
  }, [allowedEmails]);

  // 2. Global settings state
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('solo_settings_config');
      return saved ? JSON.parse(saved) : {
        lowStockThreshold: 5,
        storePhone: '+256793405517',
        storeHours: '08:00 AM - 07:00 PM',
        enableAlerts: true
      };
    } catch {
      return {
        lowStockThreshold: 5,
        storePhone: '+256793405517',
        storeHours: '08:00 AM - 07:00 PM',
        enableAlerts: true
      };
    }
  });

  useEffect(() => {
    localStorage.setItem('solo_settings_config', JSON.stringify(settings));
  }, [settings]);

  // 3. Inventory movements state
  const [movements, setMovements] = useState<InventoryMovement[]>(() => {
    try {
      const saved = localStorage.getItem('solo_inventory_movements');
      if (saved) return JSON.parse(saved);
      
      // Initialize with sample high-fidelity seed rows if empty
      const d = (daysAgo: number) => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date.toISOString();
      };
      return [
        {
          id: uuidv4(),
          product_id: 'sample-1',
          productName: 'Samsung Galaxy Ultra S24',
          type: 'Purchase',
          quantity: 20,
          before: 5,
          after: 25,
          reason: 'Consignment shipment from Kampala logistics hub',
          operator: 'Admin Node-01',
          timestamp: d(3)
        },
        {
          id: uuidv4(),
          product_id: 'sample-2',
          productName: 'Apple iPhone 15 Pro Max',
          type: 'Sale',
          quantity: 2,
          before: 12,
          after: 10,
          reason: 'Completed client order during Flash sale event',
          operator: 'Autonomous Sales API',
          timestamp: d(2)
        },
        {
          id: uuidv4(),
          product_id: 'sample-3',
          productName: 'Hp Pavilion 15 Core i5',
          type: 'Damaged',
          quantity: 1,
          before: 8,
          after: 7,
          reason: 'QA flicker fault write-off during shelf display validation',
          operator: 'Admin Node-01',
          timestamp: d(1)
        }
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('solo_inventory_movements', JSON.stringify(movements));
  }, [movements]);

  // 4. Coupons promotions state
  const [promotions, setPromotions] = useState<PromoCoupon[]>(() => {
    try {
      const saved = localStorage.getItem('solo_coupons');
      return saved ? JSON.parse(saved) : [
        {
          id: '1',
          code: 'SOLO2026',
          type: 'percentage',
          value: 10,
          status: 'active',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          code: 'LIRATECH',
          type: 'fixed',
          value: 50000,
          status: 'active',
          created_at: new Date().toISOString()
        }
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('solo_coupons', JSON.stringify(promotions));
  }, [promotions]);

  // Fetch real order lists from Supabase databases or local sandboxes
  const fetchOrders = async () => {
    setLoadingOrders(true);
    if (!isSupabaseConfigured) {
      try {
        const sandboxRaw = localStorage.getItem('solo_sandbox_orders');
        const list: Order[] = sandboxRaw ? JSON.parse(sandboxRaw) : [];
        setOrders(list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      } catch (err) {
        console.warn(err);
      } finally {
        setLoadingOrders(false);
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setOrders(data as Order[]);
    } catch (err: any) {
      console.warn("Orders fetch failure, mounting local sandboxes:", err.message);
      const sandboxRaw = localStorage.getItem('solo_sandbox_orders');
      const list: Order[] = sandboxRaw ? JSON.parse(sandboxRaw) : [];
      setOrders(list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Update order pipeline status
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    // 1. Sync client offline database
    try {
      const sandboxRaw = localStorage.getItem('solo_sandbox_orders');
      if (sandboxRaw) {
        let sandboxList: Order[] = JSON.parse(sandboxRaw);
        sandboxList = sandboxList.map(o => o.id === orderId ? { ...o, status } : o);
        localStorage.setItem('solo_sandbox_orders', JSON.stringify(sandboxList));
      }
    } catch (e) {
      console.warn(e);
    }

    // 2. Sync online Supabase
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('orders')
          .update({ status })
          .eq('id', orderId);
        if (error) throw error;
      } catch (err: any) {
        console.error("Online order update failure: ", err.message);
      }
    }

    fetchOrders();
    alert(`Fulfillment Stage synchronized: Order status changed to "${status}".`);
  };

  // Add movement state triggers and re-sync stock numbers!
  const handleAddMovement = async (m: Omit<InventoryMovement, 'id' | 'timestamp'>) => {
    const rawNewMovement: InventoryMovement = {
      ...m,
      id: uuidv4(),
      timestamp: new Date().toISOString()
    };

    setMovements(prev => [rawNewMovement, ...prev]);

    // Direct Stock adjustments logic inside product models
    try {
      const localCustomRaw = localStorage.getItem('custom_products');
      let localCustom: any[] = localCustomRaw ? JSON.parse(localCustomRaw) : [];
      let updatedLocally = false;

      localCustom = localCustom.map(p => {
        if (p.id === m.product_id) {
          updatedLocally = true;
          return { ...p, stock: m.after };
        }
        return p;
      });

      if (!updatedLocally) {
        const originalSource = products.find(p => p.id === m.product_id);
        if (originalSource) {
          localCustom.push({
            ...originalSource,
            stock: m.after
          });
        }
      }

      localStorage.setItem('custom_products', JSON.stringify(localCustom));
    } catch (e) {
      console.warn("Offline adjust error", e);
    }

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('products')
          .update({ stock: m.after })
          .eq('id', m.product_id);
      } catch (err: any) {
        console.error("Online stock update failure: ", err.message);
      }
    }

    onRefresh();
  };

  // Coupons state handlers
  const handleAddPromotion = (promo: Omit<PromoCoupon, 'id' | 'created_at'>) => {
    const freshPromo: PromoCoupon = {
      ...promo,
      id: uuidv4(),
      created_at: new Date().toISOString()
    };
    setPromotions(prev => [freshPromo, ...prev]);
  };

  const handleTogglePromotion = (id: string) => {
    setPromotions(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, status: p.status === 'active' ? 'inactive' : 'active' };
      }
      return p;
    }));
  };

  const handleDeletePromotion = (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon code?")) return;
    setPromotions(prev => prev.filter(p => p.id !== id));
  };

  const handleAddCategory = (name: string) => {
    // Categories are typically configured via constants or tables
    // To support seamless extension, let's trigger a custom event
    // that alerts the container of a fresh segment configuration!
    const customCats = JSON.parse(localStorage.getItem('solo_custom_categories') || '[]');
    if (!customCats.includes(name)) {
      customCats.push(name);
      localStorage.setItem('solo_custom_categories', JSON.stringify(customCats));
      // Reload page or trigger constants extend
      window.location.reload();
    }
  };

  // Whitelist admin emails
  const handleAddEmail = (email: string) => {
    if (allowedEmails.includes(email)) return;
    setAllowedEmails(p => [...p, email]);
  };

  const handleRemoveEmail = (email: string) => {
    setAllowedEmails(p => p.filter(e => e !== email));
  };

  const handleDeauthExit = () => {
    if (confirm("Log out of authorized administrative console session?")) {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans flex flex-col md:flex-row relative z-[45] -mt-16 sm:-mt-24 md:-mt-32">
      {/* LEFT SIDEBAR - Desktop layout */}
      <aside className="w-full md:w-64 bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-850 shrink-0 p-6 flex flex-col justify-between self-stretch md:min-h-screen">
        <div className="space-y-8">
          {/* Brand header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center font-display text-white font-black italic shadow-lg shadow-blue-500/20">
              S
            </div>
            <div>
              <h1 className="text-sm font-display font-black tracking-wider uppercase text-zinc-900 dark:text-white">SOLO ADMIN</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-widest">CONSOLE OK</span>
              </div>
            </div>
          </div>

          {/* Navigation Links list */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'overview' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/15' 
                  : 'text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 hover:text-zinc-600'
              }`}
            >
              <LayoutDashboard size={16} />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'products' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/15' 
                  : 'text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 hover:text-zinc-600'
              }`}
            >
              <ShoppingBag size={16} />
              Products
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'inventory' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/15' 
                  : 'text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 hover:text-zinc-600'
              }`}
            >
              <Package size={16} />
              Inventory
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'orders' || activeTab === 'customers'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/15' 
                  : 'text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 hover:text-zinc-600'
              }`}
            >
              <FileText size={16} />
              Sales Board
            </button>
            <button
              onClick={() => setActiveTab('promotions')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'promotions' || activeTab === 'categories'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/15' 
                  : 'text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 hover:text-zinc-600'
              }`}
            >
              <Tag size={16} />
              Campaigns
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'settings' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/15' 
                  : 'text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 hover:text-zinc-600'
              }`}
            >
              <Settings size={16} />
              Settings
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Logout triggers */}
        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
          <div className="flex items-center gap-2.5 p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 rounded-2xl">
            <ShieldCheck className="text-blue-500 shrink-0" size={16} strokeWidth={2.5} />
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Authorized Session</span>
              <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 block truncate">Administrator node</span>
            </div>
          </div>
          
          <button
            onClick={handleDeauthExit}
            className="w-full py-3.5 bg-red-650/10 hover:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/10 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <LogOut size={13} />
            Term Deauth Exit
          </button>
        </div>
      </aside>

      {/* RIGHT CONTENT WORKSPACE */}
      <main className="flex-1 min-w-0 flex flex-col self-stretch">
        {/* Top Active Toolbar layout */}
        <header className="p-6 md:p-8 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center select-none shrink-0 h-24">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-400 uppercase tracking-widest">
            <span>Solo Electronics Admin</span>
            <span>/</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{activeTab}</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            {isSupabaseConfigured ? (
              <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 select-none">
                <Database size={10} />
                Supabase Online
              </span>
            ) : (
              <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 select-none">
                Sandbox Local Fallback
              </span>
            )}
          </div>
        </header>

        {/* Scrollable Sub Tabs Panels */}
        <div className="p-6 md:p-8 flex-1 overflow-y-auto max-h-[calc(100vh-6rem)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.18 }}
            >
              {activeTab === 'overview' && (
                <AdminOverview 
                  products={products} 
                  orders={orders} 
                  movements={movements} 
                  lowStockThreshold={settings.lowStockThreshold}
                  onTabChange={(tab: any) => setActiveTab(tab)}
                  onRunSeed={onRefresh}
                  isSupabaseConfigured={isSupabaseConfigured}
                  onRefreshOrders={fetchOrders}
                />
              )}

              {activeTab === 'products' && (
                <AdminProducts 
                  products={products} 
                  onRefresh={onRefresh} 
                  lowStockThreshold={settings.lowStockThreshold}
                />
              )}

              {activeTab === 'inventory' && (
                <AdminInventory 
                  products={products} 
                  movements={movements} 
                  onAddMovement={handleAddMovement}
                  lowStockThreshold={settings.lowStockThreshold}
                />
              )}

              {(activeTab === 'orders' || activeTab === 'customers') && (
                <AdminSales 
                  orders={orders} 
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                />
              )}

              {(activeTab === 'promotions' || activeTab === 'categories') && (
                <AdminMarketing 
                  products={products}
                  promotions={promotions}
                  onAddPromotion={handleAddPromotion}
                  onTogglePromotion={handleTogglePromotion}
                  onDeletePromotion={handleDeletePromotion}
                  onAddCategory={handleAddCategory}
                />
              )}

              {activeTab === 'settings' && (
                <AdminSettings 
                  settings={settings}
                  onChangeSettings={setSettings}
                  allowedEmails={allowedEmails}
                  onAddEmail={handleAddEmail}
                  onRemoveEmail={handleRemoveEmail}
                  isSupabaseConfigured={isSupabaseConfigured}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
