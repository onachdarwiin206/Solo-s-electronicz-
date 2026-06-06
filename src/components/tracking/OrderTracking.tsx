import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Truck, Search, MapPin, CheckCircle2, ArrowLeft, Clock, ShieldCheck, Activity, Cpu, RefreshCw, Barcode, ClipboardCheck, ArrowUpRight, ChevronDown, ChevronUp, SlidersHorizontal, Filter, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { safeGetLocalStorage } from '../../lib/sandboxDb';
import { Order, OrderStatus } from '../../types';

export default function OrderTracking() {
  const [orderId, setOrderId] = useState('');
  const [trackingData, setTrackingData] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logsExpanded, setLogsExpanded] = useState(true);
  const [logFilter, setLogFilter] = useState<'all' | 'system' | 'logistics'>('all');

  const handleTrack = async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      try {
        const localOrders = safeGetLocalStorage<any[]>('solo_sandbox_orders', []);
        const matched = localOrders.find((o: any) => o.id?.toLowerCase().trim() === orderId.trim().toLowerCase());
        if (matched) {
          setTrackingData(matched as Order);
        } else {
          setError("Order ID not found in Local Sandbox memory pool. Please retry or cross-check your active basket session.");
          setTrackingData(null);
        }
      } catch (e) {
        setError("Sandbox memory reading failure. Could not query local localstorage allocations.");
        setTrackingData(null);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const { data, error: sbError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId.trim())
        .single();

      if (sbError) {
        setError("Order Reference Code not identified in active cloud database. Verify with support.");
        setTrackingData(null);
      } else {
        setTrackingData(data as Order);
      }
    } catch (e: any) {
      console.error("Tracking Core Error:", e);
      setError("Synchronizer network handshake failure. Check parameters.");
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  const statusList: OrderStatus[] = ['pending', 'confirmed', 'delivering', 'delivered'];
  
  const currentStepIndex = trackingData ? statusList.indexOf(trackingData.status) : -1;

  const getEstimatedDelivery = () => {
    if (!trackingData) return null;
    if (trackingData.estimated_delivery) return trackingData.estimated_delivery;
    
    switch (trackingData.status) {
      case 'pending':
        return "Warehouse Hold (Est: 48-72h)";
      case 'confirmed':
        return "Fulfillment Dispatched";
      case 'delivering':
        return "Courier en-route (Est Delivery < 3 Hours)";
      case 'delivered':
        return "Verified Hand-off & Signature Complete";
      default:
        return "Calculating route timings...";
    }
  };

  const estDelivery = getEstimatedDelivery();

  // Helper to filter live console logs
  const getFilteredLogs = () => {
    if (!trackingData || !trackingData.tracking_logs) return [];
    
    const logs = trackingData.tracking_logs;
    if (logFilter === 'all') return logs;
    
    return logs.filter((log: any) => {
      const msg = (log.message || '').toLowerCase();
      const status = (log.status || '').toLowerCase();
      
      if (logFilter === 'system') {
        return msg.includes('initiated') || msg.includes('validated') || msg.includes('approved') || msg.includes('created') || status.includes('pending') || status.includes('confirmed');
      }
      
      if (logFilter === 'logistics') {
        return msg.includes('transit') || msg.includes('delivery') || msg.includes('courier') || msg.includes('hand-off') || msg.includes('landmark') || status.includes('delivering') || status.includes('delivered');
      }
      return true;
    });
  };

  const filteredLogs = getFilteredLogs();

  return (
    <div className="max-w-4xl mx-auto py-24 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('changeView', { detail: 'shop' }))} 
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group font-mono"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          // Return to Terminal
        </button>

        <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/5 rounded-full">
          <span className={cn(
            "relative flex h-2 w-2",
            isSupabaseConfigured ? "text-emerald-500" : "text-amber-500"
          )}>
            <span className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              isSupabaseConfigured ? "bg-emerald-400" : "bg-amber-400"
            )}></span>
            <span className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              isSupabaseConfigured ? "bg-emerald-500" : "bg-amber-500"
            )}></span>
          </span>
          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
            {isSupabaseConfigured ? "CLOUD-SYNC DIRECT PORT" : "SECURE SANDBOX NODE CONSOLE"}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Search Command Terminal Style Card */}
        <div className="bg-card border border-border rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/[0.02] via-transparent to-transparent pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-border/40 pb-6">
            <div className="space-y-1">
              <span className="text-[9px] font-mono font-black text-blue-500 uppercase tracking-widest flex items-center gap-1.5">
                <Cpu size={10} className="text-blue-500 animate-pulse" />
                SYSTEM INTERFACE // TRANSIT_QUERY
              </span>
              <h2 className="text-3xl font-black font-display text-foreground tracking-tight uppercase italic">
                Device Tracker Panel
              </h2>
            </div>
            <div className="hidden md:block">
              <Barcode size={44} className="text-muted-foreground/30" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input 
                type="text" 
                placeholder="SL-YYYY-MMDD-XXXXXX" 
                value={orderId} 
                onChange={(e) => setOrderId(e.target.value)} 
                className="w-full bg-foreground/5 border border-border rounded-2xl py-3.5 pl-12 pr-4 text-sm font-mono text-foreground focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all outline-none" 
              />
            </div>
            <button 
              onClick={handleTrack} 
              disabled={!orderId || loading} 
              className={cn(
                "px-8 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black rounded-2xl transition-all uppercase tracking-widest text-[10px] sm:h-auto h-12 flex items-center justify-center gap-2 border border-blue-400/20 active:scale-95 duration-200",
                loading && "animate-pulse"
              )}
            >
              {loading ? <RefreshCw className="animate-spin" size={12} /> : <Activity size={12} />}
              {loading ? 'Scanning Pool' : 'Track Order'}
            </button>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="mt-6 text-red-500 text-[10px] font-black font-mono uppercase tracking-widest bg-red-500/10 p-4 rounded-2xl border border-red-500/15 text-center flex items-center justify-center gap-2"
            >
              <ShieldAlert size={12} className="shrink-0" />
              {error}
            </motion.div>
          )}
        </div>

        {/* Detailed Tracking View - Bento Grid & Progress */}
        <AnimatePresence mode="wait">
          {trackingData && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Dynamic Status Progress Card with Classified Pipeline Stages */}
              <div className="bg-card border border-border rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 right-0 p-8 text-blue-500/5 font-mono text-7xl font-black italic select-none pointer-events-none uppercase">
                  {trackingData.status}
                </div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                      <ClipboardCheck size={20} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Active Dispatch State</p>
                      <h3 className="text-xl font-black font-display text-foreground uppercase italic">Logistics Stage Pipeline</h3>
                    </div>
                  </div>
                  
                  {/* Phase Summary Grouping Badge */}
                  <div className="px-3.5 py-1.5 rounded-xl border font-mono text-[9px] uppercase tracking-wider bg-foreground/5 border-border/80 text-blue-400 font-bold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                    CURRENT PHASE:{' '}
                    {currentStepIndex <= 1 ? (
                      <span className="text-white">STAGE_A: INTAKE</span>
                    ) : currentStepIndex === 2 ? (
                      <span className="text-amber-400">STAGE_B: TRANSIT</span>
                    ) : (
                      <span className="text-emerald-400">STAGE_C: HANDOFF</span>
                    )}
                  </div>
                </div>

                {/* Vertical-Mobile, Horizontal-Desktop Timeline Progress */}
                <div className="relative pt-6 pb-2">
                  <div className="absolute top-11 left-6 right-6 hidden md:block h-1 bg-foreground/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)] transition-all duration-1000"
                      style={{ width: `${(currentStepIndex / (statusList.length - 1)) * 100}%` }}
                    />
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-4 relative text-sm">
                    {statusList.map((status, idx) => {
                      const isCompleted = idx <= currentStepIndex;
                      const isCurrent = idx === currentStepIndex;
                      
                      return (
                        <div 
                          key={status} 
                          className={cn(
                            "flex md:flex-col items-center gap-4 md:gap-3 transition-opacity duration-300 w-full md:w-auto",
                            !isCompleted && "opacity-40"
                          )}
                        >
                          <div 
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all border-4 shadow-lg",
                              isCurrent 
                                ? "bg-blue-600 border-blue-400 text-white animate-pulse" 
                                : isCompleted 
                                  ? "bg-emerald-600 border-emerald-400 text-white" 
                                  : "bg-foreground/5 border-border text-muted-foreground"
                            )}
                          >
                            {isCompleted ? (
                              <CheckCircle2 size={16} className="shrink-0" />
                            ) : (
                              <Clock size={16} className="shrink-0" />
                            )}
                          </div>

                          <div className="text-left md:text-center">
                            <p 
                              className={cn(
                                "text-[10px] uppercase font-mono font-black tracking-widest",
                                isCurrent ? "text-blue-400" : isCompleted ? "text-white" : "text-muted-foreground"
                              )}
                            >
                              {status === 'pending' ? '01_AWAIT' : status === 'confirmed' ? '02_READY' : status === 'delivering' ? '03_DISPATCH' : '04_DELIVERED'}
                            </p>
                            <span 
                              className={cn(
                                "text-xs font-bold block",
                                isCurrent ? "text-blue-500" : isCompleted ? "text-gray-200" : "text-gray-500"
                              )}
                            >
                              {status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Grouped Phase Descriptions beneath progress line */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-8 pt-6 border-t border-border/40 text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
                  <div className={cn("p-3.5 rounded-2xl border bg-foreground/[0.01]", currentStepIndex <= 1 ? "border-blue-500/20 text-white bg-blue-500/[0.01]" : "border-border/60")}>
                    <p className="font-bold text-blue-400">// STAGE_A: INTAKE PROCESS</p>
                    <p className="text-[8px] leading-relaxed mt-1 text-gray-400">Order placement registered, catalog allocations blocked and secure payment payload verified.</p>
                  </div>
                  <div className={cn("p-3.5 rounded-2xl border bg-foreground/[0.01]", currentStepIndex === 2 ? "border-amber-500/20 text-white bg-amber-500/[0.01]" : "border-border/60")}>
                    <p className="font-bold text-amber-500">// STAGE_B: ENROUTE TRANSIT</p>
                    <p className="text-[8px] leading-relaxed mt-1 text-gray-400">Dispatched via Lira transit terminal vehicle fleet. Local landmark alignment on active maps.</p>
                  </div>
                  <div className={cn("p-3.5 rounded-2xl border bg-foreground/[0.01]", currentStepIndex === 3 ? "border-emerald-500/20 text-white bg-emerald-500/[0.01]" : "border-border/60")}>
                    <p className="font-bold text-emerald-400">// STAGE_C: FIELD DELIVERY</p>
                    <p className="text-[8px] leading-relaxed mt-1 text-gray-400">Handover confirmation with physical invoice signing, hardware sanity check & final state close.</p>
                  </div>
                </div>
              </div>

              {/* Bento Grid Info Blocks with Database state indicator banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 bg-card border border-border rounded-3xl backdrop-blur-md flex gap-4">
                  <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl h-fit">
                    <MapPin className="text-blue-500" size={16} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">RECEIVER ADDR</h4>
                    <p className="text-xs font-mono font-medium text-foreground">{trackingData.district}</p>
                    <p className="text-xs font-sans font-bold text-muted-foreground leading-relaxed truncate max-w-[160px]" title={trackingData.delivery_address}>
                      {trackingData.delivery_address}
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-card border border-border rounded-3xl backdrop-blur-md flex gap-4">
                  <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl h-fit">
                    <Truck className="text-blue-500" size={16} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">ETA WINDOW</h4>
                    <p className="text-xs font-sans font-black text-foreground">{estDelivery}</p>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase">Priority Dispatch</p>
                  </div>
                </div>

                <div className="p-6 bg-card border border-border rounded-3xl backdrop-blur-md flex gap-4">
                  <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl h-fit">
                    <Activity className="text-blue-500" size={16} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <h4 className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest">REQUISITION</h4>
                      <span className={cn(
                        "text-[7px] font-semibold font-mono rounded-full px-1.5",
                        isSupabaseConfigured ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" : "bg-amber-500/10 text-amber-500 border border-amber-500/15"
                      )}>
                        {isSupabaseConfigured ? "CLOUD-SYNC" : "SANDBOX"}
                      </span>
                    </div>
                    <p className="text-xs font-mono font-bold text-blue-500 truncate max-w-[140px] uppercase">{trackingData.id}</p>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase">
                      UGX {trackingData.total?.toLocaleString() ?? 'Offline Config'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Hardware Selection Panel */}
              <div className="bg-card border border-border rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[10px] font-mono font-black text-muted-foreground uppercase tracking-[0.2em]">REQUISITIONED HARDWARE COMPONENT FEED</h3>
                  <div className="text-[8px] font-mono text-muted-foreground">ALLOC_ID_SL8</div>
                </div>
                
                <div className="space-y-3">
                  {trackingData.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-4 p-4 bg-foreground/[0.02] border border-border/50 rounded-2xl items-center hover:bg-foreground/[0.04] transition-all">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-border">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <h4 className="text-xs font-black uppercase text-foreground truncate">{item.name}</h4>
                          <span className="text-[8px] font-mono px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/15 rounded-md uppercase">{item.category}</span>
                        </div>
                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Quantity Ordered: <span className="text-white font-bold">{item.quantity}</span> Component Unit</p>
                      </div>
                      <div className="text-right font-mono">
                        <p className="text-xs font-black text-blue-500">UGX {((item.price ?? 0) * (item.quantity ?? 1)).toLocaleString()}</p>
                        <p className="text-[8px] text-muted-foreground uppercase font-bold">UGX {item.price?.toLocaleString()} Unit</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Structured Timeline Audit Log with Collapse State & Filters */}
              {trackingData.tracking_logs && trackingData.tracking_logs.length > 0 && (
                <div className="bg-card border border-border rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md space-y-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-4">
                    <button 
                      onClick={() => setLogsExpanded(!logsExpanded)}
                      className="flex items-center gap-3 select-none outline-none group text-left"
                    >
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                      <h3 className="text-[10px] font-mono font-black text-foreground uppercase tracking-[0.25em] flex items-center gap-2">
                        REAL-TIME CONSOLE AUDIT LOG
                        {logsExpanded ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
                      </h3>
                    </button>

                    {/* Terminal Filters */}
                    {logsExpanded && (
                      <div className="flex items-center gap-1.5 self-stretch sm:self-auto font-mono text-[8px] uppercase font-bold">
                        <Filter size={10} className="text-muted-foreground mr-1" />
                        <button 
                          onClick={() => setLogFilter('all')} 
                          className={cn(
                            "px-2.5 py-1 border rounded-lg transition-colors", 
                            logFilter === 'all' ? "bg-blue-500/10 border-blue-500 text-blue-400 font-black" : "border-border text-muted-foreground hover:bg-foreground/5"
                          )}
                        >
                          All Logs
                        </button>
                        <button 
                          onClick={() => setLogFilter('system')} 
                          className={cn(
                            "px-2.5 py-1 border rounded-lg transition-colors", 
                            logFilter === 'system' ? "bg-purple-500/10 border-purple-500 text-purple-400 font-black" : "border-border text-muted-foreground hover:bg-foreground/5"
                          )}
                        >
                          System Events
                        </button>
                        <button 
                          onClick={() => setLogFilter('logistics')} 
                          className={cn(
                            "px-2.5 py-1 border rounded-lg transition-colors", 
                            logFilter === 'logistics' ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-black" : "border-border text-muted-foreground hover:bg-foreground/5"
                          )}
                        >
                          Transit Logs
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Collapsible Log Stream container */}
                  <AnimatePresence initial={false}>
                    {logsExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-4 pt-1"
                      >
                        {filteredLogs.length > 0 ? (
                          <div className="border border-border/80 rounded-3xl p-6 bg-black/40 space-y-4 font-mono select-none">
                            {filteredLogs.slice().reverse().map((log: any, idx: number) => (
                              <div key={idx} className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-xs border-l-2 border-border pl-4 py-1.5 relative hover:border-blue-500 transition-colors">
                                <div className="absolute left-[-5px] top-6 w-2 h-2 rounded-full bg-blue-500/80 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                <div className="text-[9px] text-muted-foreground whitespace-nowrap pt-0.5">
                                  {log.timestamp ? new Date(log.timestamp).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : 'STAMP_VOID'}
                                </div>
                                <div className="flex-1 text-gray-300">
                                  <span className={cn(
                                    "text-[10px] uppercase font-black mr-2 px-1.5 py-0.5 rounded",
                                    log.status === 'delivered' 
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                      : log.status === 'delivering' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                  )}>
                                    {log.status}
                                  </span>
                                  <span className="text-gray-300 font-medium">{log.message}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="border border-border/60 rounded-3xl p-8 bg-black/40 text-center font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                            No logs found matching current terminal filter selection.
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
