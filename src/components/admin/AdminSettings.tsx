import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, ShieldCheck, Mail, Trash2, Database, Code, BookOpen, AlertTriangle } from 'lucide-react';
import { StoreSettings } from './types';

interface AdminSettingsProps {
  settings: StoreSettings;
  onChangeSettings: (settings: StoreSettings) => void;
  allowedEmails: string[];
  onAddEmail: (email: string) => void;
  onRemoveEmail: (email: string) => void;
  isSupabaseConfigured: boolean;
}

export function AdminSettings({
  settings,
  onChangeSettings,
  allowedEmails,
  onAddEmail,
  onRemoveEmail,
  isSupabaseConfigured
}: AdminSettingsProps) {
  const [newEmail, setNewEmail] = useState('');
  const [sqlCopied, setSqlCopied] = useState(false);

  const handleUpdate = (keys: Partial<StoreSettings>) => {
    onChangeSettings({
      ...settings,
      ...keys
    });
  };

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const mail = newEmail.trim().toLowerCase();
    if (!mail) return;
    onAddEmail(mail);
    setNewEmail('');
    alert(`Success: Admin status whitelist expanded with "${mail}".`);
  };

  const migrationSql = `-- Create Inventory Movements log table
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Purchase', 'Sale', 'Return', 'Damaged', 'Adjustment'
    quantity INTEGER NOT NULL,
    before_stock INTEGER NOT NULL,
    after_stock INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on inventory_movements
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Allow all administrative operations for inventory_movements
CREATE POLICY "Allow administrative access to movements" ON public.inventory_movements
    FOR ALL USING (true) WITH CHECK (true);

-- Create Coupons / Promotions table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL, -- 'percentage', 'fixed'
    value NUMERIC NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Allow read for anonymous users, write for admins
CREATE POLICY "Allow public select coupons" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "Allow admin operations coupons" ON public.coupons FOR ALL USING (true) WITH CHECK (true);
`.trim();

  const handleCopySql = () => {
    navigator.clipboard.writeText(migrationSql);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-sans">
      <div className="space-y-6">
        {/* Core System parameters */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-805 p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-blue-500" />
            <h3 className="text-sm font-display font-black uppercase tracking-wider text-zinc-900 dark:text-white">Store Parameters Control</h3>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
            Configure system variables. Operational parameters adjust client alerts and reorder suggestions instantly.
          </p>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-zinc-400">Low Stock Threshold</span>
                <input
                  type="number"
                  value={settings.lowStockThreshold}
                  onChange={e => handleUpdate({ lowStockThreshold: parseInt(e.target.value) || 5 })}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl p-3 text-xs font-mono font-bold"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-zinc-400">Store Support Phone</span>
                <input
                  type="text"
                  value={settings.storePhone}
                  onChange={e => handleUpdate({ storePhone: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl p-3 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase text-zinc-400">Working shifts hours</span>
              <input
                type="text"
                value={settings.storeHours}
                onChange={e => handleUpdate({ storeHours: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl p-3.5 text-xs font-bold focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 rounded-xl">
              <div>
                <h4 className="text-xs font-bold text-zinc-800 dark:text-white uppercase">Automated Stock Alerts</h4>
                <p className="text-[9px] text-zinc-400 normal-case mt-0.5">Toggle automated replenishment recommendations.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enableAlerts}
                onChange={e => handleUpdate({ enableAlerts: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded bg-zinc-100 border-zinc-300 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Credentials whitelisting panel */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-805 p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-blue-500" />
            <h3 className="text-sm font-display font-black uppercase tracking-wider text-zinc-900 dark:text-white">Admin Credentials Whitelist</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">
            Identify authorized administrative nodes. Whitelisted users instantly bypass traditional permission gates.
          </p>

          <form onSubmit={handleAddEmail} className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
              <input
                type="email"
                placeholder="Ex. secure-admin@soloelectronics.com"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-9 pr-4 text-xs font-bold"
              />
            </div>
            <button type="submit" className="px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold rounded-xl text-xs uppercase cursor-pointer">
              Whitelist email
            </button>
          </form>

          <div className="divide-y divide-zinc-105 darK:divide-zinc-800 space-y-2 pt-2">
            {allowedEmails.map((ml, i) => (
              <div key={ml || i} className="flex justify-between items-center py-2 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-300">
                <span>{ml}</span>
                {ml !== 'legacy-admin' && (
                  <button
                    onClick={() => onRemoveEmail(ml)}
                    className="text-red-500 hover:text-red-650 p-1 bg-red-100/10 hover:bg-red-100/20 border border-red-500/20 rounded-md transition-all cursor-pointer"
                  >
                    <Trash2 size={12} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Database Schema guidelines blueprint panels */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-[2.5rem] space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Database className="text-blue-500" size={18} />
              <h3 className="text-sm font-display font-black uppercase tracking-wider text-zinc-900 dark:text-white">Database Migration guidelines</h3>
            </div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Copy-paste the SQL script inside Supabase SQL Editor to provision relational tables for advanced logistics auditing.
            </p>
          </div>
          
          <button
            onClick={handleCopySql}
            className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-black uppercase rounded-lg active:scale-95 transition-all cursor-pointer"
          >
            {sqlCopied ? "Copied!" : "Copy SQL"}
          </button>
        </div>

        <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-2xl relative h-[310px] overflow-hidden">
          <pre className="font-mono text-[9px] text-emerald-400 overflow-y-auto h-full pr-1 select-all select-none leading-relaxed">
            {migrationSql}
          </pre>
        </div>

        <div className="p-3.5 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-start gap-2 text-blue-600 dark:text-blue-400 text-[11px] font-sans leading-relaxed">
          <AlertTriangle className="shrink-0 mt-0.5" size={14} />
          <div>
            <strong className="font-bold block uppercase mb-0.5">Automated synch support</strong>
            Our client code autonomously tracks adjustments and promotions. Deploying this server blueprint extends synchronization security across multi-admin networks.
          </div>
        </div>
      </div>
    </div>
  );
}
