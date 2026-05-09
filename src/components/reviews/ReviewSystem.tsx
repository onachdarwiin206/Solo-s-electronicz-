import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquare, Send, User, Calendar, Loader2, AlertCircle, Quote } from 'lucide-react';
import { Review, Product } from '../../types';
import { useAuth } from '../../AuthContext';
import { cn } from '../../lib/utils';
import { supabase } from '../../supabaseClient';

interface ReviewSystemProps {
  product: Product;
  onReviewAdded?: (averageRating: number) => void;
}

export function ReviewSystem({ product, onReviewAdded }: ReviewSystemProps) {
  const { isAdmin } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01' || error.message?.includes('not found')) {
          console.warn("[Supabase] Reviews table not found.");
        } else {
          console.error("Reviews Fetch Error:", error.message);
        }
      } else {
        setReviews(data as Review[]);
      }
    } catch (err) {
      console.error("Reviews Dynamic error", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
    const channel = supabase.channel(`reviews_prod_${product.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews', filter: `product_id=eq.${product.id}` }, () => {
        fetchReviews();
      })
      .subscribe();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [product.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || rating < 1 || !comment.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        product_id: product.id,
        user_id: 'guest',
        user_name: guestName.trim(),
        rating,
        comment,
        created_at: new Date().toISOString()
      });

      if (error) throw error;

      setComment('');
      setGuestName('');
      setRating(5);
    } catch (e) {
      console.error("Review Submit Error:", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/10">
        <div>
          <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Technical Feedback</h3>
          <p className="text-gray-500 text-sm font-medium uppercase tracking-widest">Post-Purchase Performance Logs</p>
        </div>
        
        <div className="flex items-center gap-6 bg-white/5 p-6 rounded-3xl border border-white/10">
          <div className="text-center">
            <div className="text-4xl font-black text-amber-500 mb-1">
              {reviews.length > 0 
                ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
                : "5.0"}
            </div>
            <div className="flex text-amber-500 justify-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill={i < Math.round(reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 5) ? "currentColor" : "none"} />
              ))}
            </div>
          </div>
          <div className="h-12 w-px bg-white/10" />
          <div>
            <div className="text-2xl font-bold text-white">{reviews.length}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 whitespace-nowrap">Verified Reviews</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Form Column */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <Quote size={80} />
              </div>
              
              <h4 className="text-xl font-bold mb-6 italic uppercase">Submit Experience</h4>
              
              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Your Identity</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                    placeholder="Enter your name..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-700"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Rating Intensity</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className="transition-transform active:scale-90"
                      >
                        <Star 
                          size={24} 
                          className={cn(
                            "transition-colors",
                            (hoverRating || rating) >= star ? "text-amber-500" : "text-gray-700"
                          )}
                          fill={(hoverRating || rating) >= star ? "currentColor" : "none"}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Performance Log</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    placeholder="Describe your UX with this hardware..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px] resize-none placeholder:text-gray-700"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-900/20 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs"
                >
                  {submitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      Commit Review
                    </>
                  )}
                </button>
              </form>
            </div>
            
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-start gap-4">
               <AlertCircle size={20} className="text-blue-500 mt-1 flex-shrink-0" />
               <p className="text-[11px] text-gray-500 leading-relaxed uppercase font-medium">
                 Reviews are cloud-synced and verified. Your technical feedback helps the Solo engineering community.
               </p>
            </div>
          </div>
        </div>

        {/* Reviews List Column */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 bg-white/5 animate-pulse rounded-3xl border border-white/10" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-white/5 border border-white/10 p-12 rounded-[2rem] text-center">
               <div className="w-20 h-20 bg-black/40 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-700 border border-white/5">
                  <MessageSquare size={32} />
               </div>
               <h4 className="text-xl font-bold uppercase italic text-gray-500 mb-2">No Active Logs</h4>
               <p className="text-gray-600 text-xs uppercase tracking-widest font-bold">Be the first to provide technical feedback.</p>
            </div>
          ) : (
            reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-[2rem] hover:border-blue-500/30 transition-colors group"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <User size={20} />
                    </div>
                    <div>
                      <h5 className="font-bold text-white uppercase tracking-tight">{review.user_name}</h5>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 font-black uppercase tracking-widest">
                         <Calendar size={12} />
                         {new Date(review.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex text-amber-500 p-2 bg-black/40 rounded-xl border border-white/5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                </div>
                
                <p className="text-gray-300 text-sm leading-relaxed font-light pl-4 border-l-2 border-blue-500/30">
                  {review.comment}
                </p>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
