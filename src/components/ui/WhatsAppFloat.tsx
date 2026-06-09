import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, HelpCircle } from 'lucide-react';

interface WhatsAppFloatProps {
  user?: any;
}

export function WhatsAppFloat({ user }: WhatsAppFloatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  const WHATSAPP_NUMBER = "256793405517";

  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    const defaultText = message.trim() || "Hello! I have a question about Solo's Electronics products.";
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(defaultText)}`;
    window.open(whatsappUrl, '_blank');
    setIsOpen(false);
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
            className="pointer-events-auto bg-[#09090b] border border-green-500/30 w-72 xs:w-80 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600/90 to-teal-800 p-4 pb-5 text-white relative">
              <button 
                onClick={() => setIsOpen(false)} 
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-all"
              >
                <X size={14} />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl shrink-0 font-bold border border-white/10">
                    S
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#09090b]" />
                </div>
                <div>
                  <h4 className="text-[13px] font-black uppercase tracking-wider font-mono">Solo Support</h4>
                  <p className="text-[10px] text-emerald-200 font-bold flex items-center gap-1 mt-0.5">
                    <span>●</span> Online (Avg response: 1 min)
                  </p>
                </div>
              </div>
            </div>

            {/* Conversation Flow Card area */}
            <div className="p-4 bg-emerald-950/10 min-h-[100px] flex flex-col justify-end gap-3 text-left">
              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl rounded-tl-none max-w-[90%]">
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest font-mono">Solo Desk</p>
                <p className="text-foreground text-[11px] leading-relaxed mt-1">
                  How can we help you today? Please enter your message below and we will redirect you instantly to our active support line.
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleStartChat} className="p-4 pt-2 border-t border-border/60 flex flex-col gap-2.5 bg-black/40">
              <input
                type="text"
                placeholder={user ? `${user.name.split(' ')[0]}, type your message...` : "How can we help?"}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-foreground/5 border border-border/80 focus:border-green-500/55 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors"
                autoFocus
              />
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-500 text-white font-black text-[10px] uppercase tracking-wider py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-green-900/30"
              >
                <Send size={11} />
                Send Message
              </button>
            </form>
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
