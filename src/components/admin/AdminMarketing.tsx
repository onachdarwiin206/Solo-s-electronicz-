import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Tag, Plus, Trash2, CheckCircle, Percent, Coins, Play, ToggleLeft, ToggleRight, Loader2, Bookmark } from 'lucide-react';
import { Product } from '../../types';
import { PromoCoupon } from './types';
import { PRODUCT_CATEGORIES } from '../../constants';

interface AdminMarketingProps {
  products: Product[];
  promotions: PromoCoupon[];
  onAddPromotion: (p: Omit<PromoCoupon, 'id' | 'created_at'>) => void;
  onTogglePromotion: (id: string) => void;
  onDeletePromotion: (id: string) => void;
  onAddCategory: (name: string) => void;
}

export function AdminMarketing({
  products,
  promotions,
  onAddPromotion,
  onTogglePromotion,
  onDeletePromotion,
  onAddCategory
}: AdminMarketingProps) {
  const [marketTab, setMarketTab] = useState<'promotions' | 'categories'>('promotions');

  // Coupon configuration Form state
  const [newCode, setNewCode] = useState('');
  const [promoType, setPromoType] = useState<'percentage' | 'fixed'>('percentage');
  const [promoVal, setPromoVal] = useState<number>(0);

  // Category Configuration Form state
  const [newCatName, setNewCatName] = useState('');

  // Handle promo addition
  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = newCode.trim().toUpperCase();
    if (!code || promoVal <= 0) {
      alert("Validation Error: Please configure a valid coupon code and discount value.");
      return;
    }
    onAddPromotion({
      code,
      type: promoType,
      value: promoVal,
      status: 'active'
    });
    setNewCode('');
    setPromoVal(0);
    alert(`Success: Coupon "${code}" is now active in checkout.`);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCatName.trim();
    if (!name) return;
    onAddCategory(name);
    setNewCatName('');
    alert(`Success: Segments catalog extended with "${name}".`);
  };

  return (
    <div className="space-y-6">
      {/* Tab Selectors */}
      <div className="flex border-b border-zinc-150 dark:border-zinc-850 gap-4">
        <button
          onClick={() => setMarketTab('promotions')}
          className={`pb-3 text-sm font-display font-black uppercase tracking-wider relative transition-all ${
            marketTab === 'promotions' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
              : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          Discounts & Promos Codes
        </button>
        <button
          onClick={() => setMarketTab('categories')}
          className={`pb-3 text-sm font-display font-black uppercase tracking-wider relative transition-all ${
            marketTab === 'categories' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
              : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          Categories Manager
        </button>
      </div>

      {marketTab === 'promotions' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coupon Generator console */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-805 p-6 rounded-3xl h-fit space-y-4">
            <div className="flex items-center gap-2">
              <Tag size={18} className="text-blue-500" />
              <h3 className="text-sm font-display font-black uppercase tracking-wider text-zinc-900 dark:text-white">Coupon Creator Station</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans mt-0.5">
              Draft promotional tags and deduct scores directly at client checkpoints. Toggles apply globally.
            </p>

            <form onSubmit={handleCreateCoupon} className="space-y-4 pt-2">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-zinc-400">Coupon Tag code</span>
                <input
                  type="text"
                  placeholder="EX. EMMA2026, LIRAFEST"
                  value={newCode}
                  onChange={e => setNewCode(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl p-3.5 text-xs font-mono font-bold uppercase focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-zinc-400">Deduction Method</span>
                  <select
                    value={promoType}
                    onChange={e => setPromoType(e.target.value as any)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl p-3 text-xs font-bold focus:outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Flat UGX</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-zinc-400">Value size</span>
                  <input
                    type="number"
                    placeholder="Rate input"
                    value={promoVal || ''}
                    onChange={e => setPromoVal(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl p-3 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-widest rounded-xl transition-all">
                Draft Coupon Active
              </button>
            </form>
          </div>

          {/* Dynamic codes table */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-display font-black uppercase tracking-wider text-zinc-900 dark:text-white">Active Coupons database</h3>
            
            <div className="border border-zinc-100 dark:border-zinc-850 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    <th className="py-3 px-5">Promo Tag</th>
                    <th className="py-3 px-5 text-center">Impact rate</th>
                    <th className="py-3 px-5 text-center">Status</th>
                    <th className="py-3 px-5 text-right">Decommission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                  {promotions.map((promo, i) => (
                    <tr key={promo.id || i} className="hover:bg-zinc-50/50">
                      <td className="py-3 px-5 font-mono font-black text-md text-zinc-800 dark:text-white uppercase">
                        {promo.code}
                      </td>
                      <td className="py-3 px-5 text-center font-mono font-bold text-blue-600 dark:text-blue-450">
                        {promo.type === 'percentage' ? `${promo.value}% discount` : `UGX ${promo.value.toLocaleString()} OFF`}
                      </td>
                      <td className="py-3 px-5 text-center">
                        <button onClick={() => onTogglePromotion(promo.id)} className="cursor-pointer">
                          {promo.status === 'active' ? (
                            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 px-2.5 py-1 rounded-full font-black text-[9px] uppercase tracking-wider flex items-center gap-1 mx-auto w-fit">
                              <CheckCircle size={10} />
                              ACTIVE
                            </span>
                          ) : (
                            <span className="bg-zinc-100 text-zinc-500 dark:bg-zinc-800 px-2.5 py-1 rounded-full font-black text-[9px] uppercase tracking-wider flex items-center gap-1 mx-auto w-fit">
                              INACTIVE
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button
                          onClick={() => onDeletePromotion(promo.id)}
                          className="p-1 px-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/25 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg text-[9px] font-black uppercase transition-colors inline-flex cursor-pointer"
                        >
                          <Trash2 size={11} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {promotions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-xs font-mono text-zinc-400 uppercase">
                        No promotional discount cues registered
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 font-sans">
          {/* Custom Category Segment setup console */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-805 p-6 rounded-3xl h-fit space-y-4">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-blue-500" />
              <h3 className="text-sm font-display font-black uppercase tracking-wider text-zinc-900 dark:text-white">Segment Extents Console</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Define completely custom product categories. This immediately adds options to filters and listing wizards.
            </p>

            <form onSubmit={handleCreateCategory} className="space-y-4 pt-2">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-zinc-400">Category segment name</span>
                <input
                  type="text"
                  placeholder="EX. Home theater system, Wearables"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl p-3.5 text-xs font-bold focus:outline-none"
                />
              </div>

              <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-widest rounded-xl transition-all">
                Extend segment
              </button>
            </form>
          </div>

          {/* Category listings density counters */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-display font-black uppercase tracking-wider text-zinc-900 dark:text-white">Product category saturation</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PRODUCT_CATEGORIES.map((cat, i) => {
                const count = products.filter(p => p.category === cat).length;
                return (
                  <div key={cat || i} className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-800 dark:text-white uppercase truncate max-w-[150px]">{cat}</h4>
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">Density segment</div>
                    </div>
                    <span className="text-xs font-mono font-black bg-blue-600 text-white px-3 py-1 rounded-full shrink-0">
                      {count} items
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
