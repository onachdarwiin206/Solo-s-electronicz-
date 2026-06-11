import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, HelpCircle, Smartphone, Globe, RotateCcw, Loader2 } from 'lucide-react';

interface WhatsAppFloatProps {
  user?: any;
}

interface ChatMessage {
  sender: 'user' | 'solo';
  text: string;
  time: string;
}

// Global dispatcher to trigger WhatsApp or Web Chat from anywhere in the application
export function triggerWhatsAppFlow(message: string) {
  window.dispatchEvent(new CustomEvent('trigger-whatsapp-flow', { detail: { message } }));
}

export function WhatsAppFloat({ user }: WhatsAppFloatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  
  // Choose between 'web' chat inside the website or 'redirect' to the official app
  const [preference, setPreference] = useState<'web' | 'redirect' | null>(() => {
    const saved = localStorage.getItem('whatsapp_preference');
    return (saved === 'web' || saved === 'redirect') ? saved : null;
  });

  const [showPreferenceModal, setShowPreferenceModal] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const [rememberChoice, setRememberChoice] = useState(true);

  // Web Chat History
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const saved = sessionStorage.getItem('whatsapp_chat_history');
    if (saved) return JSON.parse(saved);
    return [
      {
        sender: 'solo',
        text: "Habari! Welcome to Solo's Support Desk. I can assist you with your orders, fast delivery in Lira/Uganda, or spec inquiries. How can I help you today?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  const [isTyping, setIsTyping] = useState(false);

  const WHATSAPP_NUMBER = "256793405517";
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Persist chat history to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('whatsapp_chat_history', JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isTyping, isOpen]);

  // Handle global trigger events
  useEffect(() => {
    const handleTrigger = (e: Event) => {
      const customEvent = e as CustomEvent;
      const msg = customEvent.detail?.message || '';
      
      if (!preference) {
        // No choice set yet, show choice selector popup
        setPendingMessage(msg);
        setShowPreferenceModal(true);
        setIsOpen(true);
      } else if (preference === 'redirect') {
        // User prefers direct WhatsApp app redirection
        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
      } else {
        // User prefers in-app Web Chat Assistant
        setIsOpen(true);
        // Post their inquiry message immediately to the web chat channel
        const newMsg: ChatMessage = {
          sender: 'user',
          text: msg,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatHistory(prev => [...prev, newMsg]);
        triggerAutomatedReply(msg);
      }
    };

    window.addEventListener('trigger-whatsapp-flow', handleTrigger);
    return () => {
      window.removeEventListener('trigger-whatsapp-flow', handleTrigger);
    };
  }, [preference]);

  // Auto response logic
  const triggerAutomatedReply = (userText: string) => {
    setIsTyping(true);
    setTimeout(() => {
      const text = userText.toLowerCase();
      let response = "That is logged in our support grid! Our team is processing your request. Feel free to ask about Lira hub pickup details, shipping times, or specific device availability!";
      
      if (text.includes('lira') || text.includes('location') || text.includes('where') || text.includes('coordinates') || text.includes('map') || text.includes('address')) {
        response = "Our physical warehouse central hub is at Plot 18, Lira Main Street, Northern Region, Uganda. Coordinates: 2.2328081° N, 32.8932380° E. You can also view active navigation mapping in the page footer by clicking 'GET DIRECTIONS'!";
      } else if (text.includes('shipping') || text.includes('delivery') || text.includes('transit') || text.includes('fees') || text.includes('cost') || text.includes('deliver')) {
        response = "Yes! We provide same-day dispatch and ultrafast 24-hour delivery across Uganda, especially between Kampala and Lira. All shipping paths are synchronized with our active Logistics Grid. What product are you looking to receive?";
      } else if (text.includes('original') || text.includes('fake') || text.includes('authentic') || text.includes('spec') || text.includes('warranty') || text.includes('guarantee')) {
        response = "Every catalog unit at Solo's is 100% authentic, brand-new, and sealed. All items are backed by a comprehensive 1-year product warranty. Your technical confidence is our system's top priority!";
      } else if (text.includes('price') || text.includes('cost') || text.includes('how much') || text.includes('discount') || text.includes('ugx')) {
        response = "All listed pricing represents our final synchronized supplier clearance rates in UGX. However, we can log automatic multi-item package discounts! Let us know if you or your firm is procurement-ready.";
      } else if (text.includes('phone') || text.includes('laptop') || text.includes('stock') || text.includes('available') || text.includes('unit')) {
        response = "Our inventory levels are live-synchronized with our database! Most listed Phones and Laptops are fully stocked and active at our Lira hub. Would you like us to reserve a unit for pickup?";
      } else if (text.includes('hi') || text.includes('hello') || text.includes('hey') || text.includes('habari')) {
        response = "Hello there! How can I assist you with modern gadgets, Lira store pickup location, or shipping today?";
      }

      setChatHistory(prev => [...prev, {
        sender: 'solo',
        text: response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
    }, 1200);
  };

  const handleStartChatOrSend = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMsg = message.trim();
    if (!cleanMsg) return;

    if (!preference) {
      setPendingMessage(cleanMsg);
      setShowPreferenceModal(true);
      return;
    }

    if (preference === 'redirect') {
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(cleanMsg)}`;
      window.open(whatsappUrl, '_blank');
      setMessage('');
      setIsOpen(false);
    } else {
      // Add user message to web chat history
      const userMsg: ChatMessage = {
        sender: 'user',
        text: cleanMsg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, userMsg]);
      setMessage('');
      triggerAutomatedReply(cleanMsg);
    }
  };

  // Set selected mode preference
  const handleSelectPreference = (mode: 'web' | 'redirect') => {
    if (rememberChoice) {
      localStorage.setItem('whatsapp_preference', mode);
    }
    setPreference(mode);
    setShowPreferenceModal(false);

    // Apply the pending action
    if (mode === 'redirect') {
      const defaultText = pendingMessage.trim() || "Hello! I have a question about Solo's Electronics products.";
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(defaultText)}`;
      window.open(url, '_blank');
      setPendingMessage('');
      setIsOpen(false);
    } else {
      // Web chat mode: post the pending message, or just keep it as the conversation starter
      if (pendingMessage.trim()) {
        const userMsg: ChatMessage = {
          sender: 'user',
          text: pendingMessage,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatHistory(prev => [...prev, userMsg]);
        triggerAutomatedReply(pendingMessage);
        setPendingMessage('');
      }
    }
  };

  const resetPreference = () => {
    localStorage.removeItem('whatsapp_preference');
    setPreference(null);
    setShowPreferenceModal(true);
  };

  return (
    <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 flex flex-col items-end gap-3 pointer-events-none">
      {/* Interactive Chat Popup Form */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            className="pointer-events-auto bg-[#09090b]/95 backdrop-blur-xl border border-white/[0.08] w-72 xs:w-80 rounded-[2rem] overflow-hidden shadow-2xl relative flex flex-col h-[400px]"
          >
            {/* Preference Setup Screen / Modal Mode Override */}
            {showPreferenceModal || !preference ? (
              <div className="flex flex-col h-full bg-black/90 p-6 justify-between text-left">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono tracking-[0.2em] text-blue-500 font-black uppercase">CHAT ENGINE DECK</span>
                    <button 
                      onClick={() => {
                        setShowPreferenceModal(false);
                        if (!preference) setIsOpen(false);
                      }} 
                      className="text-gray-400 hover:text-white bg-white/5 p-1 rounded-full"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <h3 className="text-white font-black italic uppercase text-lg tracking-tight">Select Chat Mode</h3>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    How would you like to connect with Solo support? Choose your preferred logistics interface.
                  </p>

                  <div className="space-y-2 pt-2">
                    {/* Option 1: Web Chat */}
                    <button
                      onClick={() => handleSelectPreference('web')}
                      className="w-full flex items-center gap-3 p-3 bg-white/[0.02] hover:bg-blue-600/10 border border-white/[0.05] hover:border-blue-500/30 rounded-2xl transition-all group text-left cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                        <Globe size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wide">Live Web Chat</h4>
                        <p className="text-[9px] text-gray-400">Ask questions instantly inside this website.</p>
                      </div>
                    </button>

                    {/* Option 2: Redirect to WhatsApp */}
                    <button
                      onClick={() => handleSelectPreference('redirect')}
                      className="w-full flex items-center gap-3 p-3 bg-white/[0.02] hover:bg-emerald-600/10 border border-white/[0.05] hover:border-emerald-500/30 rounded-2xl transition-all group text-left cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                        <Smartphone size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wide">Forward to WhatsApp</h4>
                        <p className="text-[9px] text-gray-400">Opens in official WhatsApp Application.</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Remember Checkbox */}
                  <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-700 bg-zinc-950 text-blue-600 focus:ring-0 checked:bg-blue-600"
                      checked={rememberChoice}
                      onChange={(e) => setRememberChoice(e.target.checked)}
                    />
                    <span className="text-[10px] uppercase font-mono text-gray-400 tracking-wider">
                      Remember choice as default
                    </span>
                  </label>
                </div>
              </div>
            ) : (
              // Active Conversation Portal
              <>
                {/* Header */}
                <div className="bg-zinc-950 border-b border-white/[0.05] p-4 text-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2.5 text-left">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold text-sm shrink-0 font-mono">
                        S
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-zinc-950" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black uppercase tracking-wider font-mono">Solo Desk</h4>
                      <p className="text-[9px] text-emerald-400 font-bold tracking-wide flex items-center gap-1 mt-0.5">
                        <span className="animate-pulse">●</span> Active Support Portal
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Reset Channel / Switch preference */}
                    <button 
                      onClick={resetPreference}
                      title="Switch Chat Mode"
                      className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-xl transition-all"
                    >
                      <RotateCcw size={12} />
                    </button>
                    <button 
                      onClick={() => setIsOpen(false)} 
                      className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-xl transition-all"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>

                {/* Messages Channel Thread */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#050505] min-h-0 text-left no-scrollbar">
                  {chatHistory.map((msg, index) => (
                    <div 
                      key={index}
                      className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      <div className={`p-3 rounded-2xl text-[10.5px] leading-relaxed font-sans ${
                        msg.sender === 'user' 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-zinc-900 border border-white/[0.04] text-gray-100 rounded-tl-none'
                      }`}>
                        <p>{msg.text}</p>
                      </div>
                      <span className="text-[8px] font-mono text-zinc-600 mt-1 uppercase tracking-widest">{msg.time}</span>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex flex-col items-start max-w-[85%]">
                      <div className="p-3 bg-zinc-900 border border-white/[0.04] text-gray-400 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                        <Loader2 size={12} className="animate-spin text-blue-500" />
                        <span className="text-[10px] font-mono uppercase tracking-widest font-black">Solo is typing...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Message input panel */}
                <form onSubmit={handleStartChatOrSend} className="p-3 border-t border-white/[0.05] bg-zinc-950 flex gap-2 shrink-0">
                  <input
                    type="text"
                    placeholder="Type your inquiry here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 bg-white/[0.02] border border-white/[0.06] focus:border-blue-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-950/20 shrink-0"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Circle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        className="pointer-events-auto relative w-12 h-12 md:w-14 md:h-14 bg-green-600 hover:bg-green-500 rounded-full flex items-center justify-center shadow-2xl transition-all border border-green-500/20 group cursor-pointer"
      >
        <MessageCircle className="text-white shrink-0 group-hover:rotate-12 transition-transform duration-300" size={24} />
        
        {/* Pulsing indicator badge */}
        {!isOpen && (
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
          </span>
        )}
      </motion.button>
    </div>
  );
}
