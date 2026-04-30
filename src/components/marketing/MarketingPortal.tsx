import { useState } from 'react';
import { motion } from 'motion/react';
import { Megaphone, Plus, Image as ImageIcon, Send, BarChart3, Users, Tags } from 'lucide-react';

export function MarketingPortal() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  return (
    <div className="max-w-6xl mx-auto py-20 px-4">
      <div className="flex flex-col md:flex-row gap-12">
        <div className="w-full md:w-1/3 space-y-6">
          <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-2xl shadow-blue-900/40 relative overflow-hidden">
            <Megaphone className="absolute -right-4 -bottom-4 opacity-10 rotate-12" size={160} />
            <h2 className="text-3xl font-black mb-4 leading-tight">MARKETING DASHBOARD</h2>
            <p className="text-blue-100 text-sm font-medium mb-8">Empower our staff to spread the word about the latest tech at Solo's.</p>
            <div className="space-y-4">
               <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl">
                 <Users size={20} />
                 <div><p className="text-xs font-bold">12 Staff Online</p></div>
               </div>
               <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl">
                 <BarChart3 size={20} />
                 <div><p className="text-xs font-bold">+15% Conversion</p></div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-colors group">
              <Tags className="text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Coupons</p>
            </button>
            <button className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-colors group">
              <Megaphone className="text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Ads</p>
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-8">
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-10">
            <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <Plus className="p-1 bg-blue-600 rounded-lg" size={24} />
              Create Marketing Update
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Campaign Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Summer Phone Extravaganza"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Internal Brief / Content</label>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  placeholder="Describe the promotion strategy..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <button className="flex-1 py-4 bg-white/5 border border-white/10 border-dashed rounded-2xl text-gray-400 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2">
                  <ImageIcon size={20} />
                  Upload Visual Asset
                </button>
                <button className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
                  <Send size={20} />
                  Deploy Campaign
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
             <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest px-4">Recent Staff Activity</h4>
             {[1, 2].map((_, i) => (
               <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-600/30 flex items-center justify-center text-blue-500 font-bold">M</div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <p className="font-bold text-gray-200">New Affiliate Post: iPhone 16 Pro Max</p>
                      <span className="text-[10px] text-gray-500">2h ago</span>
                    </div>
                    <p className="text-xs text-gray-400">Staff: Marcus Chen deployed a new social media asset.</p>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
