import React from 'react';
import { motion } from 'motion/react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, Bar, ComposedChart, Line } from 'recharts';
import { LayoutDashboard, ShoppingBag, Package, FileText, Users, AlertTriangle, TrendingUp, DollarSign, Activity, ChevronRight, CheckCircle, RefreshCw } from 'lucide-react';
import { Product, Order, OrderStatus } from '../../types';
import { InventoryMovement } from './types';
import { format } from 'date-fns';

interface AdminOverviewProps {
  products: Product[];
  orders: Order[];
  movements: InventoryMovement[];
  lowStockThreshold: number;
  onTabChange: (tab: any) => void;
  onRunSeed: () => void;
  isSupabaseConfigured: boolean;
  onRefreshOrders: () => void;
}

export function AdminOverview({
  products,
  orders,
  movements,
  lowStockThreshold,
  onTabChange,
  onRunSeed,
  isSupabaseConfigured,
  onRefreshOrders
}: AdminOverviewProps) {
  // 1. Calculate Bento Card KPIs
  const totalProducts = products.length;
  
  // Capital valuation of all store listings
  const totalValuation = products.reduce((acc, p) => acc + (p.price * (p.stock || 0)), 0);
  
  // Total Revenue based on confirmed/completed orders
  const confirmedAndDeliveredOrders = orders.filter(o => o.status === 'confirmed' || o.status === 'delivered');
  const revenueTotal = confirmedAndDeliveredOrders.reduce((acc, o) => acc + o.total, 0);
  
  // Pending logistics orders tracking count
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  
  // Active customers count (unique phone contacts)
  const uniqueCustomerPhones = Array.from(new Set(orders.map(o => o.customer_phone?.trim())));
  const activeCustomersCount = uniqueCustomerPhones.length;
  
  // Under-threshold items
  const lowStockItems = products.filter(p => (p.stock || 0) <= lowStockThreshold);
  const outOfStockItems = products.filter(p => (p.stock || 0) === 0);

  // 2. Derive Analytical Recharts Datasets
  // Category allocation data matching types
  const categoriesList = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
  const categoryChartData = categoriesList.map(cat => {
    const catProducts = products.filter(p => p.category === cat);
    const totalStock = catProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
    
    // Calculate category sales units from completed orders
    let totalSold = 0;
    orders.forEach(ord => {
      ord.items?.forEach(itm => {
        if (itm.category === cat) {
          totalSold += (itm.quantity || 1);
        }
      });
    });

    return {
      category: typeof cat === 'string' ? cat.split(' & ')[0] : '',
      fullName: cat,
      "Cumulative Sales": totalSold,
      "Available Stock": totalStock,
    };
  });

  // Calculate 7-Day supply chain buffer trend chronologically
  const getDailyTrendData = () => {
    const trendMap: Record<string, { date: string, "Sales Velocity": number, "Cumulative Buffer": number }> = {};
    const totalGlobalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    
    // Chronological baseline 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = format(d, 'MMM dd');
      trendMap[dateStr] = {
        date: dateStr,
        "Sales Velocity": 0,
        "Cumulative Buffer": totalGlobalStock
      };
    }

    orders.forEach(ord => {
      try {
        const dStr = format(new Date(ord.created_at), 'MMM dd');
        if (trendMap[dStr] && ord.items) {
          const quantitySold = ord.items.reduce((s, itm) => s + (itm.quantity || 1), 0);
          trendMap[dStr]["Sales Velocity"] += quantitySold;
        }
      } catch (err) {
        // bypass gracefully
      }
    });

    return Object.values(trendMap);
  };

  const trendChartData = getDailyTrendData();

  return (
    <div className="space-y-10">
      {/* Overview Greeting Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-8 rounded-3xl">
        <div>
          <h2 className="text-3xl font-display font-black tracking-tight text-zinc-900 dark:text-white uppercase italic">
            Dashboard Overview
          </h2>
          <p className="text-sm text-zinc-500 font-sans mt-1">
            Emma Electronics central command center — logistics audits, demand vectors, and supply velocity metrics.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRefreshOrders}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold active:scale-95 transition-all rounded-xl text-xs uppercase"
          >
            <RefreshCw size={14} />
            Sync Orders Feed
          </button>
          {products.length === 0 && (
            <button
              onClick={onRunSeed}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold active:scale-95 transition-all rounded-xl text-xs uppercase"
            >
              Seed Default Stock
            </button>
          )}
        </div>
      </div>

      {/* Bento-Style Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Listings */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-4 right-4 text-zinc-200 dark:text-zinc-800 group-hover:scale-110 transition-transform">
            <ShoppingBag size={48} strokeWidth={1} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Listings</span>
            <div className="text-4xl font-display font-bold text-zinc-800 dark:text-zinc-150 mt-1">{totalProducts}</div>
          </div>
          <button 
            onClick={() => onTabChange('products')}
            className="mt-6 text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 hover:underline"
          >
            Manage Product Catalog <ChevronRight size={14} />
          </button>
        </div>

        {/* Capital Valuation */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-4 right-4 text-emerald-100 dark:text-emerald-950/40 group-hover:scale-110 transition-transform">
            <DollarSign size={48} strokeWidth={1} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Capital Value</span>
            <div className="text-3xl font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-tight mt-2">
              UGX {totalValuation.toLocaleString()}
            </div>
          </div>
          <button 
            onClick={() => onTabChange('inventory')}
            className="mt-6 text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 hover:underline"
          >
            Adjust Stock Reserves <ChevronRight size={14} />
          </button>
        </div>

        {/* Revenue Index */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-4 right-4 text-blue-100 dark:text-blue-950/40 group-hover:scale-110 transition-transform">
            <TrendingUp size={48} strokeWidth={1} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Gross Sales</span>
            <div className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400 tracking-tight mt-2">
              UGX {revenueTotal.toLocaleString()}
            </div>
          </div>
          <div className="mt-6 text-[10px] text-zinc-400 uppercase font-bold">
            Computed from {confirmedAndDeliveredOrders.length} Confirmed orders
          </div>
        </div>

        {/* Pending Orders Count */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-4 right-4 text-amber-100 dark:text-amber-950/40 group-hover:scale-110 transition-transform">
            <FileText size={48} strokeWidth={1} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Pending Orders</span>
            <div className="text-4xl font-display font-bold text-amber-500 dark:text-amber-400 mt-1">{pendingOrdersCount}</div>
          </div>
          <button 
            onClick={() => onTabChange('orders')}
            className="mt-6 text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 hover:underline"
          >
            Fulfill Purchase Cues <ChevronRight size={14} />
          </button>
        </div>

        {/* Active Customers */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-4 right-4 text-zinc-200 dark:text-zinc-800 group-hover:scale-110 transition-transform">
            <Users size={48} strokeWidth={1} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Contacts</span>
            <div className="text-4xl font-display font-bold text-zinc-800 dark:text-zinc-150 mt-1">{activeCustomersCount}</div>
          </div>
          <button 
            onClick={() => onTabChange('customers')}
            className="mt-6 text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 hover:underline"
          >
            Review Client Registers <ChevronRight size={14} />
          </button>
        </div>

        {/* Low Stock Warnings */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-4 right-4 text-red-100 dark:text-red-950/30 group-hover:scale-110 transition-transform">
            <AlertTriangle size={48} strokeWidth={1} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">Low Stock Listings</span>
            <div className="text-4xl font-display font-bold text-red-600 dark:text-red-400 mt-1">
              {lowStockItems.length}
            </div>
          </div>
          <div className="mt-6 text-[10px] font-mono text-zinc-400">
            {outOfStockItems.length} items currently out of stock.
          </div>
        </div>
      </div>

      {/* Analytics Visualizers (Charts Section) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category breakdown bar chart */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="text-blue-500" size={18} />
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-100">
              Category Distribution Metrics
            </h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            Compares total available items in inventory versus gross sales volume units per category.
          </p>
          <div className="h-64 pt-4">
            {categoryChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs font-mono text-zinc-500 uppercase">
                No inventory data loaded
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="category" tick={{ fill: 'currentColor', fontSize: 9 }} className="text-zinc-500" />
                  <YAxis tick={{ fill: 'currentColor', fontSize: 9 }} className="text-zinc-500" />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(9,9,22,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 9, textTransform: 'uppercase', fontStyle: 'italic' }} />
                  <Bar dataKey="Cumulative Sales" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Available Stock" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Line / Area trend chart for Logistics reserves */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-emerald-500" size={18} />
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-100">
              7-Day Sales Velocity & Reserve levels
            </h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            Daily transactions against total storestock reserves. Pinpoint store-stock depletion speeds.
          </p>
          <div className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="date" tick={{ fill: 'currentColor', fontSize: 9 }} className="text-zinc-500" />
                <YAxis tick={{ fill: 'currentColor', fontSize: 9 }} className="text-zinc-500" />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(9,9,22,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: 9, textTransform: 'uppercase', fontStyle: 'italic' }} />
                <Bar dataKey="Sales Velocity" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                <Line type="monotone" dataKey="Cumulative Buffer" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid: Recent Orders & Alerts Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders List */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-100">
              Recent Transactions Queue
            </h3>
            <button
              onClick={() => onTabChange('orders')}
              className="text-xs text-blue-500 hover:underline font-bold"
            >
              View Full Feed
            </button>
          </div>
          
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 space-y-3 pt-2">
            {orders.slice(0, 5).map((order, i) => (
              <div key={order.id || i} className="flex flex-wrap justify-between items-center py-3 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-full">
                      {order.id?.substring(0, 10)}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-bold">
                      {format(new Date(order.created_at), 'MM/dd HH:mm')}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1 uppercase">
                    {order.customer_name}
                  </h4>
                  <div className="text-[9px] text-zinc-400 font-mono">
                    {order.customer_phone} • {order.items?.length || 0} items
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200">
                      UGX {order.total.toLocaleString()}
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                    order.status === 'pending'
                      ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50'
                      : order.status === 'confirmed'
                      ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50'
                      : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="py-8 text-center text-xs font-mono text-zinc-400 uppercase">
                No commercial orders registered
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts Ticker panel */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-zinc-850 dark:text-zinc-100">
              Low Stock Warnings
            </h3>
            <span className="text-[9px] bg-red-100 dark:bg-red-950/20 text-red-500 border border-red-200 dark:border-red-900/50 rounded-full font-bold px-2 py-0.5">
              CRITICAL LOGS
            </span>
          </div>

          <div className="space-y-4 pt-2 overflow-y-auto max-h-[260px] pr-1">
            {products.filter(p => (p.stock || 0) <= lowStockThreshold).map((item, i) => {
              const isOut = (item.stock || 0) === 0;
              return (
                <div key={item.id || i} className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-2xl flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-zinc-700 dark:text-zinc-200 uppercase truncate">
                      {item.name}
                    </h5>
                    <p className="text-[9px] text-zinc-400 uppercase tracking-widest mt-0.5">
                      {item.category}
                    </p>
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                      <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${
                        isOut 
                          ? 'bg-red-100 dark:bg-red-950/20 text-red-600 border-red-200 dark:border-red-900/50'
                          : 'bg-amber-100 dark:bg-amber-950/20 text-amber-600 border-amber-200 dark:border-amber-900/50'
                      }`}>
                        {isOut ? '⚠ Out of Stock' : `⚠ Low Stock: ${item.stock}`}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onTabChange('inventory');
                    }}
                    className="p-1 px-2.5 bg-blue-600 text-white font-mono text-[9px] font-black uppercase rounded-lg active:scale-95 transition-all hover:bg-blue-500 text-center shrink-0"
                  >
                    RESTOCK
                  </button>
                </div>
              );
            })}
            
            {products.filter(p => (p.stock || 0) <= lowStockThreshold).length === 0 && (
              <div className="py-12 text-center text-xs font-mono text-zinc-400 uppercase space-y-2">
                <CheckCircle size={24} className="mx-auto text-emerald-500" />
                <p>All stock levels pristine. No alerts flagged.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
