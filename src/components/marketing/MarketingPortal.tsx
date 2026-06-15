import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Megaphone, Plus, Image as ImageIcon, Send, BarChart3, Users, Tags, 
  Smartphone, Share2, Sparkles, Calendar, Clock, CheckCircle, Trash2, 
  TrendingUp, Coins, MessageSquare, Eye, RefreshCw, AlertCircle, HelpCircle,
  Briefcase, Globe, ArrowUpRight, Copy, Check
} from 'lucide-react';
import { Product } from '../../types';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  BarChart, Bar, Cell, CartesianGrid
} from 'recharts';

interface MarketingPortalProps {
  products?: Product[];
}

interface SocialPost {
  id: string;
  productId: string;
  productName: string;
  caption: string;
  platforms: string[];
  scheduledDate: string;
  scheduledTime: string;
  status: 'scheduled' | 'published';
  image: string;
}

interface Campaign {
  id: string;
  name: string;
  platform: string;
  budget: number;
  spent: number;
  category: string;
  status: 'Active' | 'Scheduled' | 'Completed' | 'Paused';
  ctr: number;
  inquiries: number;
}

export default function MarketingPortal({ products = [] }: MarketingPortalProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'scheduler' | 'campaigns' | 'assets'>('analytics');
  
  // States for Social Post Scheduler
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);
  const [selectedTone, setSelectedTone] = useState<string>('uganda');
  const [caption, setCaption] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [scheduledTime, setScheduledTime] = useState<string>('14:00');
  const [generatingCaption, setGeneratingCaption] = useState<boolean>(false);
  const [copiedCaption, setCopiedCaption] = useState<boolean>(false);
  const [postSuccessMessage, setPostSuccessMessage] = useState<string | null>(null);

  // Live previews active social frame tab
  const [activePreviewFrame, setActivePreviewFrame] = useState<'twitter' | 'instagram' | 'facebook' | 'linkedin'>('instagram');

  // Interactive local states for posts and campaigns
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>(() => [
    {
      id: "sp-1",
      productId: products[0]?.id || "p1",
      productName: products[0]?.name || "Samsung Galaxy S24 Ultra",
      caption: "🔥 UGANDA REVELATION! Boss, avoid shipping stress and custom delays. The brand new Samsung Galaxy S24 Ultra is officially locked in stock in Kampala. Safe exchange, direct showroom handshakes, and 1-year product support. 🇺🇬 Inbox us now to claim yours!",
      platforms: ["instagram", "facebook"],
      scheduledDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      scheduledTime: "11:30",
      status: "scheduled",
      image: products[0]?.image || "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=75&w=800&auto=format&fit=crop"
    },
    {
      id: "sp-2",
      productId: products[1]?.id || "p2",
      productName: products[1]?.name || "Apple MacBook Pro M3",
      caption: "💻 Serious power for developers and creators. The Apple MacBook Pro M3 is the ultimate silent workhorse. Handpicked, tested, and ready to go with genuine local delivery. Let's get to work.",
      platforms: ["linkedin", "twitter"],
      scheduledDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
      scheduledTime: "15:15",
      status: "scheduled",
      image: products[1]?.image || "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=75&w=800&auto=format&fit=crop"
    }
  ]);

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => [
    {
      id: "camp-1",
      name: "Kampala Plaza Grand Launch",
      platform: "Meta (Instagram/FB)",
      budget: 1800000,
      spent: 1200000,
      category: "Phones & Tablets",
      status: "Active",
      ctr: 5.6,
      inquiries: 194
    },
    {
      id: "camp-2",
      name: "Uni Semester Developers Special",
      platform: "Google Ads & LI",
      budget: 3500000,
      spent: 3500000,
      category: "Computers & Laptops",
      status: "Completed",
      ctr: 4.8,
      inquiries: 240
    },
    {
      id: "camp-3",
      name: "Hype Beast Audio Push",
      platform: "TikTok Campaign",
      budget: 2000000,
      spent: 450000,
      category: "TVs & Audio",
      status: "Active",
      ctr: 6.9,
      inquiries: 110
    },
    {
      id: "camp-4",
      name: "Gaming Grid Kampala Blitz",
      platform: "Meta Ads Network",
      budget: 1500000,
      spent: 0,
      category: "Gaming & Consoles",
      status: "Scheduled",
      ctr: 0.0,
      inquiries: 0
    }
  ]);

  // States for adding a new Campaign
  const [showAddCampaignModal, setShowAddCampaignModal] = useState<boolean>(false);
  const [newCampaignName, setNewCampaignName] = useState<string>('');
  const [newCampaignPlatform, setNewCampaignPlatform] = useState<string>('Meta Ads (Instagram/FB)');
  const [newCampaignBudget, setNewCampaignBudget] = useState<string>('');
  const [newCampaignCategory, setNewCampaignCategory] = useState<string>('Phones & Tablets');

  // Connected accounts mock configuration state
  const [connectedProfiles, setConnectedProfiles] = useState({
    instagram: { connected: true, handle: "@solos_tech_ug" },
    facebook: { connected: true, handle: "Solo's Phones & Electronics" },
    twitter: { connected: true, handle: "@solos_electronics" },
    linkedin: { connected: false, handle: null },
    tiktok: { connected: true, handle: "@soloselectronics" }
  });

  // Selected product object
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || products[0] || null;
  }, [selectedProductId, products]);

  // Auto set caption initial value when product highlights change or tab mounted
  useEffect(() => {
    if (selectedProduct && !caption) {
      setCaption(`Boss, the original ${selectedProduct.name} is officially available here at Solo's Phones & Electronics. Direct procurement, full coverage, and safe showrooms in Kampala. Inquire directly!`);
    }
  }, [selectedProduct]);

  // Trigger caption generation using our smart server-side endpoint
  const handleGenerateAICaption = async () => {
    if (!selectedProduct) return;
    setGeneratingCaption(true);
    try {
      const response = await fetch("/api/marketing/generate-caption", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          productName: selectedProduct.name,
          productDescription: selectedProduct.description,
          tone: selectedTone,
          platform: selectedPlatforms.join(', ') || 'instagram'
        })
      });
      const data = await response.json();
      if (data.caption) {
        setCaption(data.caption);
      }
    } catch (err) {
      console.error("Caption generation request failed", err);
    } finally {
      setGeneratingCaption(false);
    }
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(caption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const togglePlatform = (plat: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(plat) 
        ? prev.filter(p => p !== plat) 
        : [...prev, plat]
    );
  };

  const handleCreateSocialPost = () => {
    if (!caption.trim() || !selectedProduct) return;
    
    const newPost: SocialPost = {
      id: `sp-${Date.now()}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      caption: caption,
      platforms: [...selectedPlatforms],
      scheduledDate,
      scheduledTime,
      status: 'scheduled',
      image: selectedProduct.image
    };

    setSocialPosts(prev => [newPost, ...prev]);
    setPostSuccessMessage("Social post successfully scheduled into the digital campaign queue!");
    setTimeout(() => {
      setPostSuccessMessage(null);
    }, 4000);

    // Reset fields partially
    setCaption('');
  };

  const handleDeletePost = (id: string) => {
    setSocialPosts(prev => prev.filter(p => p.id !== id));
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim() || !newCampaignBudget) return;

    const newCamp: Campaign = {
      id: `camp-${Date.now()}`,
      name: newCampaignName,
      platform: newCampaignPlatform,
      budget: parseFloat(newCampaignBudget),
      spent: 0,
      category: newCampaignCategory,
      status: 'Scheduled',
      ctr: 0,
      inquiries: 0
    };

    setCampaigns(prev => [...prev, newCamp]);
    setNewCampaignName('');
    setNewCampaignBudget('');
    setShowAddCampaignModal(false);
  };

  const toggleCampaignStatus = (id: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id === id) {
        const statusMap: Record<Campaign['status'], Campaign['status']> = {
          'Active': 'Paused',
          'Paused': 'Active',
          'Scheduled': 'Active',
          'Completed': 'Active'
        };
        return { ...c, status: statusMap[c.status] };
      }
      return c;
    }));
  };

  // High level marketing metrics derived from active states
  const aggregateMetrics = useMemo(() => {
    const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
    const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
    const totalInquiries = campaigns.reduce((sum, c) => sum + c.inquiries, 0);
    const avgCtr = campaigns.filter(c => c.spent > 0).reduce((acc, curr, _, arr) => acc + curr.ctr / arr.length, 0);
    
    return {
      totalBudget,
      totalSpent,
      totalInquiries,
      avgCtr: parseFloat(avgCtr.toFixed(2)) || 5.2,
      totalReach: "1.4M Impressions",
      cac: "UGX 11,200/Lead"
    };
  }, [campaigns]);

  // Beautiful synthetic data representing sales & CTR trends for Recharts
  const analyticsTrendData = [
    { week: 'Wk 21', Spend: 340000, CTR: 4.2, Clicks: 310, Convs: 15 },
    { week: 'Wk 22', Spend: 450000, CTR: 4.8, Clicks: 440, Convs: 24 },
    { week: 'Wk 23', Spend: 720000, CTR: 5.1, Clicks: 580, Convs: 42 },
    { week: 'Wk 24', Spend: 980000, CTR: 5.9, Clicks: 820, Convs: 68 },
    { week: 'Wk 25', Spend: 1210000, CTR: 6.4, Clicks: 1100, Convs: 98 },
    { week: 'Wk 26', Spend: 1450000, CTR: 6.1, Clicks: 980, Convs: 85 }
  ];

  const categoryShareData = useMemo(() => {
    const catsAndBudgets: Record<string, number> = {};
    campaigns.forEach(c => {
      catsAndBudgets[c.category] = (catsAndBudgets[c.category] || 0) + c.spent;
    });

    return Object.keys(catsAndBudgets).map(key => ({
      category: key.split(' ')[0], // short title
      "Budget Spent": catsAndBudgets[key]
    })).filter(c => c["Budget Spent"] > 0);
  }, [campaigns]);

  return (
    <div className="min-h-screen bg-[#03030c] text-white pt-24 pb-32 relative overflow-hidden">
      {/* Visual Ambient Grid Backdrops */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/15 via-indigo-950/2 to-transparent pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-5 w-80 h-80 bg-fuchsia-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-left">
        {/* Header Display */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/[0.06] pb-8 mb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-mono tracking-widest text-blue-400 font-bold uppercase">
                Solo's Internal Operations
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-medium text-white tracking-tight">
              Acatale & Media Hub
            </h1>
            <p className="text-zinc-400 text-sm max-w-2xl">
              Launch localized campaigns, coordinate verified multi-platform updates, design live pre-flight feed previews, and harness Gemini generation for Uganda direct handshakes.
            </p>
          </div>

          {/* Quick Stats Summary Widget */}
          <div className="flex flex-wrap gap-4 items-center bg-zinc-950/30 border border-white/[0.04] p-4 rounded-2xl backdrop-blur-md">
            <div className="text-zinc-500 px-3 py-1">
              <span className="block text-[8px] font-mono uppercase tracking-widest text-zinc-500">Active Reach</span>
              <span className="block text-sm font-semibold text-white font-mono">{aggregateMetrics.totalReach}</span>
            </div>
            <div className="w-[1px] h-8 bg-white/10 hidden sm:block" />
            <div className="text-zinc-500 px-3 py-1">
              <span className="block text-[8px] font-mono uppercase tracking-widest text-zinc-500">Conversive CTR</span>
              <span className="block text-sm font-semibold text-blue-400 font-mono">{aggregateMetrics.avgCtr}%</span>
            </div>
            <div className="w-[1px] h-8 bg-white/10 hidden sm:block" />
            <div className="text-zinc-500 px-3 py-1">
              <span className="block text-[8px] font-mono uppercase tracking-widest text-zinc-500">Total Budget</span>
              <span className="block text-sm font-semibold text-fuchsia-400 font-mono">UGX {aggregateMetrics.totalBudget.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex overflow-x-auto gap-2 p-1 bg-zinc-950/40 border border-white/[0.04] rounded-2xl mb-8 max-w-max no-scrollbar whitespace-nowrap">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all ${
              activeTab === 'analytics'
                ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            <BarChart3 size={15} />
            Analytics & KPIs
          </button>
          <button
            onClick={() => setActiveTab('scheduler')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all ${
              activeTab === 'scheduler'
                ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            <Smartphone size={15} />
            Scheduler & Mock Frame
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all ${
              activeTab === 'campaigns'
                ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            <Megaphone size={15} />
            Ad Campaigns ({campaigns.length})
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all ${
              activeTab === 'assets'
                ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            <ImageIcon size={15} />
            Visual Assets & Banners
          </button>
        </div>

        {/* Tab Content Rendering */}
        <div className="space-y-10">
          
          {/* TAB 1: ANALYTICS */}
          {activeTab === 'analytics' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Financial & Inquiries High Level KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-950/40 border border-white/[0.04] p-6 rounded-3xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-white group-hover:opacity-[0.05] transition-opacity">
                    <Coins size={120} />
                  </div>
                  <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase block mb-1">TOTAL CAMPAIGN SPEND</span>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-xs text-zinc-400">UGX</span>
                    <span className="text-2xl font-semibold font-mono">{aggregateMetrics.totalSpent.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                    <TrendingUp size={12} />
                    <span>81.4% Spent Of Budget Allocation</span>
                  </div>
                </div>

                <div className="bg-zinc-950/40 border border-white/[0.04] p-6 rounded-3xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-white group-hover:opacity-[0.05] transition-opacity">
                    <MessageSquare size={120} />
                  </div>
                  <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase block mb-1">DIRECT INQUIRIES GATHERED</span>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-2xl font-semibold font-mono text-blue-400">{aggregateMetrics.totalInquiries}</span>
                    <span className="text-xs text-zinc-500">WhatsApp Handshakes</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-sky-400">
                    <CheckCircle size={12} />
                    <span>Avg {aggregateMetrics.cac}</span>
                  </div>
                </div>

                <div className="bg-zinc-950/40 border border-white/[0.04] p-6 rounded-3xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-white group-hover:opacity-[0.05] transition-opacity">
                    <TrendingUp size={120} />
                  </div>
                  <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase block mb-1">GLOBAL CLICK THRUPATE</span>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-2xl font-semibold font-mono text-fuchsia-400">{aggregateMetrics.avgCtr}%</span>
                    <span className="text-xs text-zinc-500">CTR Over All Channels</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-fuchsia-400">
                    <ArrowUpRight size={12} />
                    <span>+1.5% from previous week</span>
                  </div>
                </div>

                <div className="bg-zinc-950/40 border border-white/[0.04] p-6 rounded-3xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-white group-hover:opacity-[0.05] transition-opacity">
                    <Globe size={120} />
                  </div>
                  <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase block mb-1">SIMULATED NET PROMOTIONS</span>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-2xl font-semibold font-mono text-white">{socialPosts.length}</span>
                    <span className="text-xs text-zinc-500">Active Social Envelopes</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                    <Clock size={12} />
                    <span>Next dispatch tomorrow</span>
                  </div>
                </div>
              </div>

              {/* Graphical Performance Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart 1: Growth Trend */}
                <div className="lg:col-span-2 bg-zinc-950/20 border border-white/[0.04] p-6 rounded-[2rem] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-md font-medium text-white transition-colors">Unified Conversion Funnel</h3>
                      <p className="text-zinc-500 text-xs text-left">Tracking performance, CTR spikes, and ad spending across campaigns.</p>
                    </div>
                    {/* legend labels */}
                    <div className="flex gap-4 text-[10px] font-mono">
                      <span className="flex items-center gap-1.5 text-zinc-400">
                        <span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block" /> Spend (UGX)
                      </span>
                      <span className="flex items-center gap-1.5 text-zinc-400">
                        <span className="w-2.5 h-2.5 rounded bg-fuchsia-500 inline-block" /> CTR (%)
                      </span>
                    </div>
                  </div>

                  <div className="h-72 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorCtr" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#d946ef" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#d946ef" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                        <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} stroke="rgba(255,255,255,0.04)" />
                        <YAxis yAxisId="left" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} stroke="rgba(255,255,255,0.04)" />
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} stroke="rgba(255,255,255,0.04)" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#08080c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', color: '#fff' }}
                          labelFormatter={(label) => `Marketing Run: ${label}`}
                        />
                        <Area yAxisId="left" type="monotone" dataKey="Spend" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorSpend)" name="Budget Spent" />
                        <Area yAxisId="right" type="monotone" dataKey="CTR" stroke="#d946ef" strokeWidth={2} fillOpacity={1} fill="url(#colorCtr)" name="Interactive CTR" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Category Breakdown */}
                <div className="bg-zinc-950/20 border border-white/[0.04] p-6 rounded-[2rem] flex flex-col justify-between">
                  <div className="space-y-1 mb-4 text-left">
                    <h3 className="text-md font-medium text-white">Allocations by Device Category</h3>
                    <p className="text-zinc-500 text-xs">Acatale allocation across major hardware collections.</p>
                  </div>

                  {categoryShareData.length > 0 ? (
                    <div className="h-56 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryShareData}>
                          <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.01)" />
                          <XAxis dataKey="category" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} stroke="rgba(255,255,255,0.04)" />
                          <YAxis tickFormatter={(val) => `UGX ${(val/1000000)}M`} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} stroke="rgba(255,255,255,0.04)" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#08080c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', color: '#fff' }} 
                            formatter={(value) => [`UGX ${Number(value).toLocaleString()}`, 'Total Spent']}
                          />
                          <Bar dataKey="Budget Spent" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                            {categoryShareData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#d946ef'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-56 w-full flex flex-col items-center justify-center border border-dashed border-white/[0.06] rounded-2xl p-4 bg-zinc-950/20">
                      <AlertCircle className="text-zinc-600 mb-2" size={24} />
                      <p className="text-xs text-zinc-500 font-mono text-center">No active campaign spends recorded. Budget graph pending live ads tracker.</p>
                    </div>
                  )}

                  <div className="bg-zinc-950/40 border border-white/[0.04] p-3 rounded-2xl flex items-center gap-3 mt-4 text-left">
                    <Sparkles className="text-fuchsia-400 shrink-0" size={16} />
                    <p className="text-[10px] text-zinc-400 leading-normal font-medium">
                      Phones and Tablets command the highest inquiry conversion count, claiming over 55% of custom WhatsApp clicks.
                    </p>
                  </div>
                </div>
              </div>

              {/* Channels Status Tracker */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-mono tracking-[0.3em] text-zinc-500 uppercase">CONNECTED BUSINESS ACCOUNTS</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {Object.entries(connectedProfiles).map(([platform, config]) => (
                    <div 
                      key={platform} 
                      className="bg-zinc-900/30 border border-white/[0.04] p-4 rounded-2xl flex items-center justify-between group cursor-pointer hover:border-white/[0.1] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold font-display uppercase tracking-wider text-xs ${
                          platform === 'instagram' ? 'bg-gradient-to-tr from-pink-500/20 to-orange-500/20 text-pink-500' :
                          platform === 'facebook' ? 'bg-blue-600/10 text-blue-500' :
                          platform === 'twitter' ? 'bg-zinc-100/10 text-white' :
                          platform === 'linkedin' ? 'bg-cyan-600/15 text-cyan-500' :
                          'bg-indigo-500/10 text-indigo-400'
                        }`}>
                          {platform[0]}
                        </div>
                        <div className="text-left">
                          <span className="block text-[10px] font-bold capitalize tracking-wide text-zinc-300">{platform}</span>
                          <span className="block text-[9px] font-mono text-zinc-500 truncate max-w-[120px]">
                            {config.connected ? config.handle : "Not setup"}
                          </span>
                        </div>
                      </div>
                      <span className={`w-2 h-2 rounded-full ${config.connected ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: SCHEDULER & PHONE FRAME */}
          {activeTab === 'scheduler' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start"
            >
              {/* Left Column: Post Composer Form (7 columns) */}
              <div className="lg:col-span-7 space-y-6">
                
                {postSuccessMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-2xl flex items-center gap-3 text-left"
                  >
                    <CheckCircle size={18} className="shrink-0" />
                    <p>{postSuccessMessage}</p>
                  </motion.div>
                )}

                <div className="bg-zinc-900/20 border border-white/[0.05] rounded-[2.5rem] p-6 sm:p-8 space-y-6 text-left">
                  <div className="space-y-2">
                    <h2 className="text-xl font-medium text-white flex items-center gap-2">
                      <Sparkles className="text-blue-500" size={20} />
                      Post Scheduler
                    </h2>
                    <p className="text-zinc-500 text-xs">Combine genuine stock with localized messaging with real-time phone feedback.</p>
                  </div>

                  <div className="space-y-4">
                    
                    {/* Select Linked Showroom Product */}
                    <div>
                      <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500 mb-2">Showroom Device Link</label>
                      <select
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className="w-full bg-zinc-950/60 border border-white/[0.08] rounded-xl p-3.5 text-xs text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer font-sans"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} - (UGX {p.price.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Choose Channels Multi-Select */}
                    <div>
                      <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500 mb-2">Publishing Channels</label>
                      <div className="flex flex-wrap gap-2">
                        {['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'].map(plat => {
                          const isSelected = selectedPlatforms.includes(plat);
                          return (
                            <button
                              key={plat}
                              type="button"
                              onClick={() => togglePlatform(plat)}
                              className={`px-3 py-2 rounded-xl text-[10px] font-mono font-bold uppercase transition-all tracking-wide ${
                                isSelected 
                                  ? 'bg-blue-600/20 border border-blue-500/50 text-blue-400' 
                                  : 'bg-zinc-950/40 border border-white/[0.04] text-zinc-500 hover:text-white hover:border-white/[0.1]'
                              }`}
                            >
                              {plat}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Character limit feedback */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500">Caption & Call to Action</label>
                        <span className={`text-[9px] font-mono font-bold ${
                          selectedPlatforms.includes('twitter') && caption.length > 280 
                            ? 'text-red-500' 
                            : 'text-zinc-500'
                        }`}>
                          {caption.length} chars {selectedPlatforms.includes('twitter') && '/ 280 (Twitter Limit)'}
                        </span>
                      </div>

                      <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        rows={6}
                        placeholder="Boss, type your perfect local caption here..."
                        className="w-full bg-zinc-950/60 border border-white/[0.08] rounded-2xl p-4 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none leading-relaxed font-sans"
                      />
                    </div>

                    {/* Gemini AI Caption Assistant Option */}
                    <div className="p-4 bg-zinc-950/60 border border-white/[0.04] rounded-2xl space-y-3 relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="text-fuchsia-400" size={16} />
                          <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-300">Gemini AI Assistant</h4>
                        </div>
                        <span className="text-[8px] font-mono bg-fuchsia-500/10 text-fuchsia-400 px-2 py-0.5 rounded border border-fuchsia-500/20">READY</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
                        {[
                          { value: 'uganda', label: 'Uganda Direct' },
                          { value: 'hype', label: 'Hype / Launch' },
                          { value: 'premium', label: 'Premium sleek' },
                          { value: 'professional', label: 'Professional' },
                          { value: 'creative', label: 'Creative Story' }
                        ].map(tone => (
                          <button
                            key={tone.value}
                            type="button"
                            onClick={() => setSelectedTone(tone.value)}
                            className={`py-2 px-1 rounded-lg text-[9px] font-bold text-center border transition-all ${
                              selectedTone === tone.value
                                ? 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400'
                                : 'bg-transparent border-white/[0.04] text-zinc-500 hover:text-white'
                            }`}
                          >
                            {tone.label}
                          </button>
                        ))}
                      </div>

                      <div className="pt-2 flex gap-3">
                        <button
                          type="button"
                          onClick={handleGenerateAICaption}
                          disabled={generatingCaption || !selectedProduct}
                          className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-fuchsia-600 hover:from-blue-500 hover:to-fuchsia-500 text-white font-mono text-[10px] uppercase font-bold tracking-wider rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-950/20"
                        >
                          {generatingCaption ? (
                            <>
                              <RefreshCw size={12} className="animate-spin" />
                              Generating Captions...
                            </>
                          ) : (
                            <>
                              <Sparkles size={12} />
                              Generate Captions
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleCopyCaption}
                          disabled={!caption}
                          className="px-3.5 bg-zinc-900 border border-white/[0.06] hover:bg-zinc-850 text-zinc-300 hover:text-white rounded-xl transition-all flex items-center justify-center gap-1.5"
                          title="Copy generated caption"
                        >
                          {copiedCaption ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider">{copiedCaption ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Schedule Date & Time Select */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Scheduled Launch Date</label>
                        <div className="relative">
                          <input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className="w-full bg-zinc-950/40 border border-white/[0.08] rounded-xl p-3 text-xs text-white outline-none cursor-pointer text-left"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Scheduled Dispatch Time</label>
                        <input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="w-full bg-zinc-950/40 border border-white/[0.08] rounded-xl p-3 text-xs text-white outline-none cursor-pointer text-left"
                        />
                      </div>
                    </div>

                  </div>

                  {/* Submission triggers */}
                  <button
                    type="button"
                    onClick={handleCreateSocialPost}
                    disabled={!caption.trim() || !selectedProduct}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-blue-950/30 disabled:opacity-50"
                  >
                    <Calendar size={15} />
                    Commit Post To Campaign Schedule
                  </button>
                </div>

                {/* Scheduled Pipeline List */}
                <div className="space-y-4 text-left">
                  <h3 className="text-[10px] font-mono tracking-[0.3em] text-zinc-500 uppercase">SCHEDULED POST PIPELINE ({socialPosts.length})</h3>
                  <div className="space-y-3">
                    {socialPosts.map(post => (
                      <div key={post.id} className="bg-zinc-950/40 border border-white/[0.04] p-5 rounded-2xl flex flex-col sm:flex-row gap-4 justify-between items-start">
                        <div className="flex gap-4 items-start flex-1 min-w-0">
                          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/[0.06] bg-zinc-900 flex items-center justify-center">
                            {post.image ? (
                              <img src={post.image} alt={post.productName} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon size={20} className="text-zinc-650" />
                            )}
                          </div>
                          <div className="space-y-1 flex-1 min-w-0">
                            <h4 className="font-semibold text-xs text-white truncate">{post.productName}</h4>
                            <p className="text-[10px] text-zinc-400 leading-normal line-clamp-2">{post.caption}</p>
                            
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              {post.platforms.map(p => (
                                <span key={p} className="text-[8px] font-mono bg-zinc-900 border border-white/[0.06] text-zinc-400 px-1.5 py-0.5 rounded uppercase">{p}</span>
                              ))}
                              <span className="w-1 h-1 rounded-full bg-zinc-600" />
                              <span className="text-[9px] font-mono text-zinc-500 whitespace-nowrap">{post.scheduledDate} @ {post.scheduledTime}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-end gap-2 shrink-0 self-stretch justify-between">
                          <span className="text-[8px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded uppercase">Scheduled</span>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-2 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-lg transition-colors"
                            title="Remove draft"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column: Simulated Smartphone Frame & Preview Live feeds (5 columns) */}
              <div className="lg:col-span-5 h-full space-y-4">
                <span className="text-[10px] font-mono tracking-[0.3em] text-zinc-500 uppercase block mb-1">PRE-FLIGHT RENDERING FEED</span>

                {/* Smartphone Preview Mockup */}
                <div className="relative mx-auto max-w-[320px] bg-[#0c0c16] border-[8px] border-zinc-800 rounded-[3rem] shadow-2xl shadow-zinc-950/80 overflow-hidden flex flex-col h-[580px]">
                  
                  {/* Phone Speaker Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-zinc-800 rounded-b-2xl z-20 flex items-center justify-center">
                    <div className="w-8 h-1 bg-zinc-900 rounded-full mb-1" />
                  </div>

                  {/* Phone Status bar */}
                  <div className="h-10 bg-zinc-950 flex justify-between items-center px-6 top-0 z-10 text-[9px] font-mono text-zinc-500 select-none">
                    <span>9:41</span>
                    <div className="flex items-center gap-1.5">
                      <span>LTE</span>
                      <div className="w-4 h-2 border border-zinc-650 rounded-sm p-0.5 flex items-center">
                        <div className="w-full h-full bg-zinc-400 rounded-2xs" />
                      </div>
                    </div>
                  </div>

                  {/* Phone Feed Selectors (Instagram, Twitter, FB, LinkedIn inside) */}
                  <div className="bg-zinc-950 border-b border-white/[0.04] p-1 grid grid-cols-4 select-none">
                    {['instagram', 'twitter', 'facebook', 'linkedin'].map(frameType => {
                      const isActive = activePreviewFrame === frameType;
                      return (
                        <button
                          key={frameType}
                          onClick={() => setActivePreviewFrame(frameType as any)}
                          className={`py-2 text-[8px] font-mono font-bold uppercase text-center transition-all border-b-2 ${
                            isActive 
                              ? 'text-blue-400 border-blue-400 bg-white/[0.01]' 
                              : 'text-zinc-600 border-transparent hover:text-zinc-400'
                          }`}
                        >
                          {frameType.substring(0, 4)}
                        </button>
                      );
                    })}
                  </div>

                  {/* Scrollable Live feed dynamic frame */}
                  <div className="flex-1 overflow-y-auto p-4 bg-zinc-980 scrollbar-none text-left">
                    <AnimatePresence mode="wait">
                      
                      {/* INSTAGRAM SIMULATION */}
                      {activePreviewFrame === 'instagram' && (
                        <motion.div
                          key="insta"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-3"
                        >
                          {/* Profile details */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-500 p-[1.5px] shrink-0">
                                <span className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-[10px] font-black text-rose-500">S</span>
                              </div>
                              <div className="text-left leading-none">
                                <span className="text-[10px] font-bold text-zinc-200 block">solos_tech_ug</span>
                                <span className="text-[8px] text-zinc-500">Kampala Showroom</span>
                              </div>
                            </div>
                            <span className="text-zinc-400 font-bold tracking-widest text-xs cursor-pointer">•••</span>
                          </div>

                          {/* Image frame */}
                          <div className="aspect-square w-full rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.02] flex items-center justify-center relative">
                            {selectedProduct ? (
                              <img src={selectedProduct.image} alt="Pre-flight product render" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="text-zinc-700 animate-pulse" size={34} />
                            )}
                          </div>

                          {/* Interactive buttons */}
                          <div className="flex items-center justify-between text-zinc-300">
                            <div className="flex items-center gap-3">
                              <span className="text-xs hover:text-red-500 cursor-pointer">❤️</span>
                              <span className="text-xs hover:text-white cursor-pointer">💬</span>
                              <span className="text-xs hover:text-white cursor-pointer">📤</span>
                            </div>
                            <span className="text-xs hover:text-white cursor-pointer">🔖</span>
                          </div>

                          {/* Captions space */}
                          <div className="space-y-0.5 leading-snug text-left">
                            <p className="text-[9px] text-zinc-350">
                              <span className="font-bold text-zinc-250 mr-1.5">solos_tech_ug</span>
                              {caption || "Boss, the caption text you compose will automatically appear formatted in real time."}
                            </p>
                            <span className="text-[7px] text-zinc-500 uppercase tracking-wider block pt-1 font-mono">2 minutes ago</span>
                          </div>
                        </motion.div>
                      )}

                      {/* TWITTER SIMULATION */}
                      {activePreviewFrame === 'twitter' && (
                        <motion.div
                          key="twit"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-3"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[11px] font-black text-white shrink-0 border border-white/5 font-display">S</span>
                            <div className="flex-1 min-w-0 text-left leading-tight">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-extrabold text-zinc-200">Solo's Tech</span>
                                <span className="text-[9px] text-blue-400">☑️</span>
                                <span className="text-[8px] text-zinc-500">@solos • 1m</span>
                              </div>
                              <p className="text-[10px] text-zinc-300 leading-normal pt-1 break-words">
                                {caption || "What are you launching today?"}
                              </p>
                            </div>
                          </div>

                          {/* Image box */}
                          <div className="border border-white/[0.05] rounded-xl overflow-hidden ml-9 bg-zinc-900 aspect-[1.8/1] flex items-center justify-center">
                            {selectedProduct ? (
                              <img src={selectedProduct.image} alt="Showroom post banner" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="text-zinc-750" size={24} />
                            )}
                          </div>

                          {/* Action row grid */}
                          <div className="flex items-center justify-between text-zinc-550 pl-9 text-[8px] font-mono pt-1 max-w-[90%]">
                            <span className="flex items-center gap-1 hover:text-blue-400 cursor-pointer">💬 12</span>
                            <span className="flex items-center gap-1 hover:text-emerald-400 cursor-pointer">🔁 4</span>
                            <span className="flex items-center gap-1 hover:text-rose-400 cursor-pointer">❤️ 88</span>
                            <span className="flex items-center gap-1 hover:text-blue-400 cursor-pointer">📊 3.1K</span>
                          </div>
                        </motion.div>
                      )}

                      {/* FACEBOOK SIMULATION */}
                      {activePreviewFrame === 'facebook' && (
                        <motion.div
                          key="fb"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-3"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-[11px] font-black text-white shrink-0">f</span>
                            <div className="text-left leading-none">
                              <span className="text-[10px] font-semibold text-zinc-200 block">Solo's Phones & Electronics</span>
                              <span className="text-[8px] text-zinc-500">Sponsored • 🌐</span>
                            </div>
                          </div>

                          <p className="text-[10px] text-zinc-350 leading-relaxed text-left">
                            {caption || "Explore high-fidelity local products in Kampala."}
                          </p>

                          {/* Full width picture */}
                          <div className="w-full bg-zinc-900 border-y border-white/[0.04] aspect-[1.91/1] overflow-hidden flex items-center justify-center">
                            {selectedProduct ? (
                              <img src={selectedProduct.image} alt="Facebook advert box" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="text-zinc-700" size={20} />
                            )}
                          </div>

                          {/* Fb CTA label */}
                          <div className="bg-zinc-900/40 p-2 border-x border-b border-white/[0.04] flex justify-between items-center text-left">
                            <div className="min-w-0 pr-2">
                              <span className="text-[7px] text-zinc-500 block font-mono uppercase">SOLOSELECTRONICS.TECH</span>
                              <span className="text-[9px] font-semibold text-zinc-300 block truncate">{selectedProduct?.name || "Direct Inquiries"}</span>
                            </div>
                            <span className="px-2.5 py-1 text-[8px] font-bold uppercase bg-white/5 border border-white/10 rounded-md text-zinc-200 select-none">Contact</span>
                          </div>
                        </motion.div>
                      )}

                      {/* LINKEDIN SIMULATION */}
                      {activePreviewFrame === 'linkedin' && (
                        <motion.div
                          key="li"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-3"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-400 shrink-0">IN</span>
                            <div className="text-left leading-none">
                              <span className="text-[10px] font-bold text-zinc-200 block">Solo's Enterprise Operations</span>
                              <span className="text-[7px] text-zinc-500 block">Empowering local tech supply chains • 2h</span>
                            </div>
                          </div>

                          <p className="text-[9px] text-zinc-300 leading-normal text-left">
                            {caption || "Fulfilling corporate digital needs via handshakes."}
                          </p>

                          {/* Image */}
                          <div className="w-full bg-zinc-900 border border-white/[0.05] rounded-lg overflow-hidden aspect-[1.7/1] flex items-center justify-center">
                            {selectedProduct ? (
                              <img src={selectedProduct.image} alt="LinkedIn banner" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="text-zinc-700" size={20} />
                            )}
                          </div>
                        </motion.div>
                      )}

                    </AnimatePresence>
                  </div>

                  {/* Phone Bottom Home bar */}
                  <div className="h-6 bg-zinc-950 flex items-center justify-center select-none pb-1 relative z-10">
                    <div className="w-24 h-1 bg-zinc-750 rounded-full" />
                  </div>
                </div>

                <div className="bg-zinc-900/10 border border-white/[0.04] p-4 rounded-2xl flex items-center gap-3 text-left max-w-[320px] mx-auto">
                  <AlertCircle className="text-blue-400 shrink-0" size={16} />
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    This phone represents a standard smartphone dimension. Always review layouts and hashtag counts prior to releasing updates.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: CAMPAIGNS & BUDGETS */}
          {activeTab === 'campaigns' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Table actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1 text-left">
                  <span className="text-[9px] font-mono tracking-[0.2em] text-zinc-500 uppercase">LOCAL & DIGITAL ACATALE REGISTER</span>
                  <p className="text-zinc-400 text-xs">Run localized promotions and register spend metrics directly below.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddCampaignModal(true)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-950/20"
                >
                  <Plus size={14} />
                  Launch Ad Campaign
                </button>
              </div>

              {/* Add Campaign Modal Overlay */}
              {showAddCampaignModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-zinc-950 border border-white/[0.08] rounded-3xl p-6 sm:p-8 max-w-md w-full text-left space-y-6"
                  >
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-medium text-white font-display">Launch Marketing Campaign</h3>
                      <p className="text-zinc-500 text-xs text-left">Track budget spend rates and client inquiries seamlessly.</p>
                    </div>

                    <form onSubmit={handleCreateCampaign} className="space-y-4">
                      <div>
                        <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Campaign Name</label>
                        <input
                          type="text"
                          required
                          value={newCampaignName}
                          onChange={(e) => setNewCampaignName(e.target.value)}
                          placeholder="e.g. Kampala Back To School"
                          className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl p-3 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Media Channel</label>
                          <select
                            value={newCampaignPlatform}
                            onChange={(e) => setNewCampaignPlatform(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl p-3 text-xs text-white outline-none cursor-pointer"
                          >
                            <option>Meta (Instagram/FB)</option>
                            <option>Twitter/X Network</option>
                            <option>Google Search Ads</option>
                            <option>TikTok Ads</option>
                            <option>LinkedIn Professional</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Target Category</label>
                          <select
                            value={newCampaignCategory}
                            onChange={(e) => setNewCampaignCategory(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl p-3 text-xs text-white outline-none cursor-pointer"
                          >
                            <option>Phones & Tablets</option>
                            <option>Computers & Laptops</option>
                            <option>Gaming & Consoles</option>
                            <option>TVs & Audio</option>
                            <option>Accessories</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Budget Allocation (UGX)</label>
                        <input
                          type="number"
                          required
                          min="10000"
                          value={newCampaignBudget}
                          onChange={(e) => setNewCampaignBudget(e.target.value)}
                          placeholder="e.g. 1500000"
                          className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl p-3 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono"
                        />
                      </div>

                      <div className="pt-2 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowAddCampaignModal(false)}
                          className="flex-1 py-3 bg-zinc-900 border border-white/[0.06] hover:bg-zinc-850 text-zinc-400 hover:text-white font-mono text-[10px] uppercase font-bold tracking-wider rounded-xl transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-mono text-[10px] uppercase font-bold tracking-wider rounded-xl transition-all shadow-lg shadow-blue-950/20"
                        >
                          Launch Active
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}

              {/* Campaign Table container */}
              <div className="bg-zinc-950/30 border border-white/[0.04] rounded-3xl overflow-hidden backdrop-blur-md">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-white/[0.05] bg-white/[0.01]">
                        <th className="p-4 text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Campaign Details</th>
                        <th className="p-4 text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Category Target</th>
                        <th className="p-4 text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Platform</th>
                        <th className="p-4 text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Spent / Budget Allocation</th>
                        <th className="p-4 text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase text-center">Interactive CTR</th>
                        <th className="p-4 text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase text-center">Inquiries</th>
                        <th className="p-4 text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase text-center">Platform Status</th>
                        <th className="p-4 text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03] text-xs">
                      {campaigns.map(camp => {
                        const isSpentPercentage = Math.min(100, Math.round((camp.spent / camp.budget) * 100)) || 0;
                        return (
                          <tr key={camp.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="p-4 font-medium text-white leading-normal max-w-[180px] truncate">
                              {camp.name}
                            </td>
                            <td className="p-4 text-zinc-400 font-mono text-[10px]">{camp.category}</td>
                            <td className="p-4 text-zinc-400 font-sans">{camp.platform}</td>
                            <td className="p-4 space-y-1.5 min-w-[160px]">
                              <div className="flex justify-between font-mono text-[10px] text-zinc-500">
                                <span>{isSpentPercentage}% spent</span>
                                <span className="text-zinc-400">UGX {camp.spent.toLocaleString()} / {camp.budget.toLocaleString()}</span>
                              </div>
                              <div className="w-full h-1 rounded-full bg-zinc-900 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    camp.status === 'Completed' ? 'bg-zinc-600' : 
                                    camp.status === 'Paused' ? 'bg-amber-500/50' :
                                    isSpentPercentage > 90 ? 'bg-emerald-500' : 'bg-blue-600'
                                  }`}
                                  style={{ width: `${isSpentPercentage}%` }}
                                />
                              </div>
                            </td>
                            <td className="p-4 text-center font-mono font-semibold text-fuchsia-400">
                              {camp.ctr > 0 ? `${camp.ctr}%` : "—"}
                            </td>
                            <td className="p-4 text-center font-mono text-zinc-300">
                              {camp.inquiries > 0 ? `${camp.inquiries} leads` : "—"}
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                                camp.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                camp.status === 'Completed' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                camp.status === 'Paused' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                'bg-zinc-800 text-zinc-400'
                              }`}>
                                {camp.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => toggleCampaignStatus(camp.id)}
                                  className="px-2.5 py-1 text-[10px] font-mono font-semibold bg-zinc-900 border border-white/[0.04] rounded-lg hover:text-white transition-colors"
                                >
                                  {camp.status === 'Active' ? "Pause" : "Activate"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: VISUAL ASSETS LIBRARY */}
          {activeTab === 'assets' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-mono tracking-[0.3em] text-zinc-500 uppercase">READY-TO-USE MARKETING KITS</span>
                <p className="text-zinc-400 text-xs">Directly copy verified product descriptions, tags, and use placeholders-free high contrast graphic banners.</p>
              </div>

              {/* Visual catalog list layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.slice(0, 6).map(prod => {
                  const copyTemplate = `🔥 ORIGINAL STOCK AT SOLO'S! 🔥
Product: ${prod.name}
Details: ${prod.description}
Sourced directly, verified warranty with absolute transacting confidence at Kampala Showrooms. Let's do business!
Contact directly on WhatsApp: [Direct Handshake]
#SolosUganda #KampalaTech #ShopGenuine`;

                  return (
                    <div 
                      key={prod.id} 
                      className="bg-zinc-950/30 border border-white/[0.04] rounded-3xl p-5 hover:border-white/[0.08] transition-all flex flex-col justify-between group text-left"
                    >
                      <div className="space-y-4">
                        {/* banner placeholder simulation */}
                        <div className="w-full aspect-[16/10] bg-zinc-900 rounded-2xl overflow-hidden relative border border-white/[0.02]">
                          {prod.image ? (
                            <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-700">
                              <ImageIcon size={30} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent p-4 flex flex-col justify-end">
                            <span className="text-[8px] font-mono tracking-widest text-fuchsia-400 bg-fuchsia-500/10 px-2 py-0.5 rounded border border-fuchsia-500/20 self-start mb-1 uppercase">Solo's Official Premium Promo</span>
                            <h4 className="text-xs font-semibold text-white drop-shadow">{prod.name}</h4>
                          </div>
                        </div>

                        {/* description and quick-copy templates */}
                        <div className="space-y-2.5">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wide block">{prod.category}</span>
                          <p className="text-[10px] text-zinc-400 leading-normal line-clamp-3 bg-zinc-950/50 p-3 rounded-xl border border-white/[0.02] font-mono">
                            {copyTemplate}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/[0.04] mt-5 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(copyTemplate);
                            alert("Marketing template copied to clipboard! You are ready to share.");
                          }}
                          className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider border border-white/[0.04] transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Copy size={12} />
                          Copy Post Copy
                        </button>
                        <a
                          href={`https://wa.me/256700000000?text=${encodeURIComponent(copyTemplate)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 rounded-xl text-[10px] font-mono font-bold uppercase transition-colors flex items-center justify-center"
                          title="Fulfill directly via WhatsApp"
                        >
                          Send WA
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Marketing compliance guidelines checklist card */}
              <div className="bg-gradient-to-tr from-blue-950/10 to-indigo-950/15 border border-blue-500/10 p-6 sm:p-8 rounded-[2rem] text-left">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                  <div className="space-y-2">
                    <h3 className="text-md font-medium text-white flex items-center gap-2">
                      <Briefcase className="text-blue-500" size={18} />
                      Solo's Marketing Compliance & Playbook
                    </h3>
                    <p className="text-zinc-400 text-xs max-w-2xl leading-relaxed">
                      All employees are requested to check social posts against core rules before broadcasting. Safeguard the luxury look, direct transparent pricing model, and Uganda local physical safety message.
                    </p>
                  </div>
                  <span className="text-[8px] font-mono tracking-widest bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded border border-emerald-500/20 uppercase font-black">
                    Official Protocol
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-xs text-zinc-300">
                  <div className="flex gap-3 items-start bg-zinc-950/30 p-3.5 rounded-xl border border-white/[0.02]">
                    <span className="p-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-mono leading-none font-bold">1</span>
                    <p className="leading-snug">
                      <strong className="text-white">Verify Price Consistency:</strong> Ensure UGX values represent stock listings without inflation.
                    </p>
                  </div>
                  <div className="flex gap-3 items-start bg-zinc-950/30 p-3.5 rounded-xl border border-white/[0.02]">
                    <span className="p-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-mono leading-none font-bold">2</span>
                    <p className="leading-snug">
                      <strong className="text-white">Zero Fake Placeholders:</strong> Only utilize real stock pictures. Never use stock placeholders that do not represent actual stock.
                    </p>
                  </div>
                  <div className="flex gap-3 items-start bg-zinc-950/30 p-3.5 rounded-xl border border-white/[0.02]">
                    <span className="p-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-mono leading-none font-bold">3</span>
                    <p className="leading-snug">
                      <strong className="text-white">Emphasize Physical Handshake:</strong> Emphasize the physical Kampala Plaza showroom security so buyers feel completely safe.
                    </p>
                  </div>
                  <div className="flex gap-3 items-start bg-zinc-950/30 p-3.5 rounded-xl border border-white/[0.02]">
                    <span className="p-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-mono leading-none font-bold">4</span>
                    <p className="leading-snug">
                      <strong className="text-white">Active Product Linkages:</strong> Add specific shortlinks like <code className="text-blue-400 font-mono text-[10px]">solos.tech/shop/id</code> to redirect viewers directly into the showroom details.
                    </p>
                  </div>
                </div>
              </div>

            </motion.div>
          )}

        </div>

      </div>
    </div>
  );
}
