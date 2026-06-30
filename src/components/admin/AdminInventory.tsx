import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, PlusCircle, MinusCircle, ShieldAlert, FileText, Trash2, ArrowUpDown, ChevronRight, Activity, TrendingUp, HelpCircle } from 'lucide-react';
import { Product } from '../../types';
import { InventoryMovement } from './types';
import { format } from 'date-fns';

interface AdminInventoryProps {
  products: Product[];
  movements: InventoryMovement[];
  onAddMovement: (m: Omit<InventoryMovement, 'id' | 'timestamp'>) => void;
  lowStockThreshold: number;
}

export function AdminInventory({
  products,
  movements,
  onAddMovement,
  lowStockThreshold
}: AdminInventoryProps) {
  // Movement form state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [movementType, setMovementType] = useState<InventoryMovement['type']>('Purchase');
  const [qty, setQty] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [operator, setOperator] = useState('Admin Node-01');

  // Computed state
  const totalStockUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const totalValuation = products.reduce((sum, p) => sum + ((p.stock || 0) * p.price), 0);
  const lowStockItemsCount = products.filter(p => (p.stock || 0) <= lowStockThreshold).length;

  const handleApplyMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      alert("Validation Error: Please select a target product payload.");
      return;
    }
    if (qty <= 0) {
      alert("Validation Error: Quantity delta must be greater than zero.");
      return;
    }

    const item = products.find(p => p.id === selectedProductId);
    if (!item) {
      alert("Selected product could not be resolved.");
      return;
    }

    const currentStock = item.stock || 0;
    let nextStock = currentStock;

    if (movementType === 'Purchase' || movementType === 'Return') {
      nextStock = currentStock + qty;
    } else {
      if (currentStock < qty) {
        alert(`Insufficient reserves: Cannot execute transaction. "${item.name}" stock level is ${currentStock}.`);
        return;
      }
      nextStock = currentStock - qty;
    }

    onAddMovement({
      product_id: selectedProductId,
      productName: item.name,
      type: movementType,
      quantity: qty,
      before: currentStock,
      after: nextStock,
      reason: reason || `Manual adjustment by ${operator}`,
      operator
    });

    // Clear Form parameters
    setQty(0);
    setReason('');
    alert(`Success: Inventory Movement posted. "${item.name}" stock updated from ${currentStock} to ${nextStock}.`);
  };

  return (
    <div className="space-y-8">
      {/* Overview stats header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-3xl flex justify-between items-center h-28">
          <div>
            <span className="text-[10px] font-black uppercase text-zinc-400">Warehouse Reserves</span>
            <div className="text-3xl font-display font-black text-zinc-850 dark:text-zinc-100 mt-1">{totalStockUnits} Units</div>
          </div>
          <Package className="text-blue-500" size={32} />
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-3xl flex justify-between items-center h-28">
          <div>
            <span className="text-[10px] font-black uppercase text-zinc-400">Evaluation Capital</span>
            <div className="text-2xl font-mono font-black text-blue-600 dark:text-blue-400 mt-1">UGX {totalValuation.toLocaleString()}</div>
          </div>
          <TrendingUp className="text-emerald-500" size={32} />
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-3xl flex justify-between items-center h-28">
          <div>
            <span className="text-[10px] font-black uppercase text-zinc-400">Critical Replenishments</span>
            <div className="text-3xl font-display font-black text-red-600 dark:text-red-400 mt-1">{lowStockItemsCount} items</div>
          </div>
          <ShieldAlert className="text-red-500" size={32} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Logistics Adjustment station */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-2">
            <PlusCircle size={18} className="text-blue-500" />
            <h3 className="text-sm font-display font-black uppercase tracking-wider text-zinc-900 dark:text-white">Stock Adjust Console</h3>
          </div>
          <p className="text-xs text-zinc-400 font-sans leading-relaxed">
            Direct real-time inventory adjustments. Updates client cache instantly and schedules remote database triggers on Supabase.
          </p>

          <form onSubmit={handleApplyMovement} className="space-y-4 pt-2">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase text-zinc-400">Select Devices Payload</span>
              <select
                value={selectedProductId}
                onChange={e => setSelectedProductId(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl p-3 text-xs font-bold focus:outline-none"
              >
                <option value="">Choose Listing...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-zinc-400">Type</span>
                <select
                  value={movementType}
                  onChange={e => setMovementType(e.target.value as any)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl p-3 text-xs font-bold focus:outline-none"
                >
                  <option value="Purchase">Purchase (Incoming Restock)</option>
                  <option value="Sale">Sale (Outbound Shipment)</option>
                  <option value="Return">Return (Inward Customer reversal)</option>
                  <option value="Damaged">Damaged (Faulty write-off)</option>
                  <option value="Adjustment">Adjustment (Audit balance check)</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-zinc-400">Units Delta</span>
                <input
                  type="number"
                  placeholder="Units quantity"
                  value={qty || ''}
                  onChange={e => setQty(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl p-3 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase text-zinc-400">Reason / Reference</span>
              <input
                type="text"
                placeholder="Ex. Lira Importers invoice #301-B"
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl p-3 text-xs font-sans"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase text-zinc-400">Transaction Executor ID</span>
              <input
                type="text"
                placeholder="Operator name"
                value={operator}
                onChange={e => setOperator(e.target.value)}
                className="w-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-850 rounded-xl p-3 text-xs font-mono text-zinc-500 focus:outline-none"
                readOnly
              />
            </div>

            <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-widest rounded-xl transition-all">
              Execute Adjust Sequence
            </button>
          </form>
        </div>

        {/* Real-time Logistics Logs Terminal (JetBrains Mono) */}
        <div className="lg:col-span-2 bg-zinc-950 text-emerald-400 border border-zinc-800 p-6 rounded-[2.5rem] flex flex-col justify-between h-[480px]">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                <h3 className="text-xs font-mono font-black uppercase tracking-wider text-emerald-300">EMMA-SYSTEMS-SHELL: LOGS FEED</h3>
              </div>
              <span className="text-[9px] bg-zinc-800 text-zinc-400 px-2.5 py-0.5 rounded font-mono">PORT 3000 // SHELL API-V2</span>
            </div>
            <div className="border-b border-zinc-800 my-2" />
          </div>

          <div className="flex-1 font-mono text-[10px] space-y-2.5 overflow-y-auto pr-1 select-none leading-relaxed">
            <div>&gt; _emma.system.daemon: connecting database pipelines... SUCCESS</div>
            <div>&gt; _listening movements payload in cache stream... OK</div>
            
            {movements.map((item, i) => {
              const dateText = format(new Date(item.timestamp), 'yyyy-MM-dd HH:mm:ss');
              const deltaSign = (item.type === 'Purchase' || item.type === 'Return') ? `+${item.quantity}` : `-${item.quantity}`;
              const deltaColor = (item.type === 'Purchase' || item.type === 'Return') ? 'text-emerald-300' : 'text-rose-400';

              return (
                <div key={item.id || i} className="border-l border-zinc-800 pl-3 space-y-0.5">
                  <div className="flex justify-between flex-wrap text-[9px] text-zinc-500">
                    <span>{dateText} (ID: {item.id?.substring(0, 10)})</span>
                    <span>{item.operator}</span>
                  </div>
                  <div className="uppercase">
                    &gt; <span className="font-bold text-white">{item.productName}</span> ➜ TYPE: <span className="font-bold text-emerald-200">{item.type}</span> [<span className={deltaColor}>{deltaSign}</span>]
                  </div>
                  <div className="text-zinc-400 italic">
                    Reason: "{item.reason}" (Balance: {item.before} ➜ {item.after})
                  </div>
                </div>
              );
            })}

            {movements.length === 0 && (
              <div className="text-zinc-600 uppercase py-10 text-center text-[9px]">
                No transaction payloads committed to standard logs pool.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-zinc-900 text-zinc-500 font-mono text-[9px] flex justify-between">
            <span>Terminal status: STATIC BUFFER OK</span>
            <span>Buffered logs: {movements.length} rows</span>
          </div>
        </div>
      </div>

      {/* Critical stock alerts listing with restock suggestions */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-3xl space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-display font-black uppercase tracking-wider text-zinc-900 dark:text-white">Warehouse replenishments analysis</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Computes and matches replenishment stock estimates against warehouse safety limits.</p>
          </div>
          <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-full px-2.5 py-1 font-bold">
            ALERTS LOGS
          </span>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {products.filter(p => (p.stock || 0) <= lowStockThreshold).map((item, i) => {
            const isOut = (item.stock || 0) === 0;
            // Suggested restock quantity calculated beautifully: Threshold + 15 units buffer
            const suggestedReorder = (lowStockThreshold - (item.stock || 0)) + 15;

            return (
              <div key={item.id || i} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-150 uppercase truncate">{item.name}</h5>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase border ${
                      isOut 
                        ? 'bg-red-100 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50'
                        : 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50'
                    }`}>
                      {isOut ? 'Out of Stock' : 'Low Stock'}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-1">
                    SKU: {(item as any).sku || item.id} • Category: {item.category}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs font-mono font-black text-zinc-650 dark:text-zinc-200">Stock size: {item.stock || 0}</div>
                    <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Threshold: {lowStockThreshold}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">Suggest reorder: +{suggestedReorder} units</div>
                    <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Est. cost: UGX {(suggestedReorder * item.price * 0.75).toLocaleString()}</div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedProductId(item.id);
                      setMovementType('Purchase');
                      setQty(suggestedReorder);
                      setReason(`Autonomous replenishment recommendation`);
                    }}
                    className="p-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-mono text-[9px] font-black uppercase tracking-wider rounded-xl hover:opacity-90 active:scale-95 transition-all text-center"
                  >
                    Load reorder parameters
                  </button>
                </div>
              </div>
            );
          })}

          {products.filter(p => (p.stock || 0) <= lowStockThreshold).length === 0 && (
            <div className="py-12 text-center text-xs font-mono text-zinc-400 uppercase">
              No critical replenishment alerts flagged in warehouse
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
