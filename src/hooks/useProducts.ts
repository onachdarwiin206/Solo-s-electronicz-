import { useState, useEffect } from 'react';
import { Product } from '../types';
import { INITIAL_PRODUCTS } from '../constants';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const getMergedProducts = (remoteData: Product[]): Product[] => {
  if (isSupabaseConfigured) {
    return remoteData.length > 0 ? remoteData : INITIAL_PRODUCTS;
  }

  try {
    const localCustomRaw = localStorage.getItem('custom_products');
    const localCustom: Product[] = localCustomRaw ? JSON.parse(localCustomRaw) : [];
    
    const deletedRaw = localStorage.getItem('deleted_product_ids');
    const deletedIds = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);
    
    const combined: Product[] = [];
    const seenIds = new Set<string>();
    
    remoteData.forEach(p => {
      if (!deletedIds.has(p.id) && !seenIds.has(p.id)) {
        seenIds.add(p.id);
        combined.push(p);
      }
    });
    
    localCustom.forEach(p => {
      if (!deletedIds.has(p.id) && !seenIds.has(p.id)) {
        seenIds.add(p.id);
        combined.push(p);
      }
    });
    
    INITIAL_PRODUCTS.forEach(p => {
      if (!deletedIds.has(p.id) && !seenIds.has(p.id)) {
        seenIds.add(p.id);
        combined.push(p);
      }
    });
    
    return combined;
  } catch (err) {
    console.warn("Error merging products:", err);
    return remoteData.length > 0 ? remoteData : INITIAL_PRODUCTS;
  }
};

const syncLocalProductsToSupabase = async () => {
  if (!isSupabaseConfigured) return;
  try {
    const localCustomRaw = localStorage.getItem('custom_products');
    if (localCustomRaw) {
      const localCustomsRaw: Product[] = JSON.parse(localCustomRaw);
      const validCategories = [
        'Phones & Tablets',
        'Computers & Laptops',
        'Gaming & Consoles',
        'TVs & Audio',
        'Accessories',
        'Networking',
        'Home Appliances',
        'Smart Devices',
        'Cameras & Security'
      ];
      
      const localCustoms = localCustomsRaw.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        price: Number(p.price) || 0,
        category: validCategories.includes(p.category) ? p.category : 'Phones & Tablets',
        image: p.image || '',
        stock: Number(p.stock) || 0,
        featured: !!p.featured,
        specifications: p.specifications || 'High performance device with official store warranty.',
        images: Array.isArray(p.images) ? p.images : [p.image || ''],
        videos: Array.isArray(p.videos) ? p.videos : [],
        is_verified: !!p.is_verified,
        rating: Number(p.rating) || 5.0,
        created_at: p.created_at || new Date().toISOString(),
        updated_at: p.updated_at || new Date().toISOString()
      }));

      if (localCustoms.length > 0) {
        console.log(`[Supabase Sync] Upserting ${localCustoms.length} offline custom/edited products to remote database...`);
        const { error } = await supabase.from('products').upsert(localCustoms);
        if (error) {
          console.error("[Supabase Sync] Product upsert failed:", error);
        } else {
          console.log("[Supabase Sync] Successfully synchronized all local products to Supabase.");
        }
      }
    }

    const deletedRaw = localStorage.getItem('deleted_product_ids');
    if (deletedRaw) {
      const deletedIds: string[] = JSON.parse(deletedRaw);
      if (deletedIds.length > 0) {
        console.log(`[Supabase Sync] Syncing ${deletedIds.length} deletions to remote database...`);
        for (const id of deletedIds) {
          await supabase.from('products').delete().eq('id', id);
        }
        localStorage.setItem('deleted_product_ids', JSON.stringify([]));
      }
    }
  } catch (err) {
    console.warn("[Supabase Sync] Error during automatic synchronization pass:", err);
  }
};

/**
 * Custom hook to manage fetching and syncing products.
 * Combines cached remote items, local custom items, and handles Postgres real-time events.
 */
export function useProducts() {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const cachedRemoteRaw = localStorage.getItem('cached_remote_products');
      const cachedRemote = cachedRemoteRaw ? JSON.parse(cachedRemoteRaw) : [];
      
      const localCustomRaw = localStorage.getItem('custom_products');
      const localCustom = localCustomRaw ? JSON.parse(localCustomRaw) : [];
      
      const deletedRaw = localStorage.getItem('deleted_product_ids');
      const deletedIds = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);
      
      const combined: Product[] = [];
      const seenIds = new Set<string>();
      
      if (isSupabaseConfigured && cachedRemote.length > 0) {
        cachedRemote.forEach((p: Product) => {
          if (!deletedIds.has(p.id) && !seenIds.has(p.id)) {
            seenIds.add(p.id);
            combined.push(p);
          }
        });
      }
      
      localCustom.forEach((p: Product) => {
        if (!deletedIds.has(p.id) && !seenIds.has(p.id)) {
          seenIds.add(p.id);
          combined.push(p);
        }
      });
      
      INITIAL_PRODUCTS.forEach((p: Product) => {
        if (!deletedIds.has(p.id) && !seenIds.has(p.id)) {
          seenIds.add(p.id);
          combined.push(p);
        }
      });
      
      return combined;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [loadingProducts, setLoadingProducts] = useState(() => {
    try {
      const cachedRemoteRaw = localStorage.getItem('cached_remote_products');
      if (cachedRemoteRaw) {
        const cachedRemote = JSON.parse(cachedRemoteRaw);
        if (cachedRemote.length > 0) return false;
      }
    } catch {}
    return true;
  });

  const fetchProducts = async (silent = false) => {
    if (!isSupabaseConfigured) {
      setProducts(getMergedProducts([]));
      setLoadingProducts(false);
      return;
    }
    
    syncLocalProductsToSupabase();
    
    if (!silent && products.length === 0) {
      setLoadingProducts(true);
    }
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
 
      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01' || error.hint?.includes('not found')) {
          console.warn("[Supabase] 'products' table missing. Using hardware feed fallback.");
        } else {
          console.warn("[Supabase] Query warning:", error.message || error);
        }
        setProducts(getMergedProducts([]));
      } else if (data) {
        if (data.length === 0) {
          console.log("[Supabase] Remote products table is empty. Mounting INITIAL_PRODUCTS and auto-seeding in background...");
          setProducts(getMergedProducts([]));
          
          try {
            const seedData = INITIAL_PRODUCTS.map(p => ({
              id: p.id,
              name: p.name,
              description: p.description || '',
              price: p.price,
              category: p.category,
              image: p.image || '',
              stock: p.stock || 10,
              featured: p.featured || false,
              specifications: 'High performance device with official store warranty.',
              images: [p.image],
              is_verified: true,
              rating: 5.0,
              created_at: new Date().toISOString()
            }));
            
            supabase.from('products').insert(seedData).then(({ error: seedErr }) => {
              if (seedErr) {
                console.warn("[Supabase] Background seed issue:", seedErr);
              } else {
                console.log("[Supabase] Successfully auto-seeded database in background.");
                supabase.from('products').select('*').order('created_at', { ascending: false }).then(({ data: freshData }) => {
                  if (freshData && freshData.length > 0) {
                    try {
                      localStorage.setItem('cached_remote_products', JSON.stringify(freshData));
                    } catch (e) {}
                    setProducts(getMergedProducts(freshData as Product[]));
                  }
                });
              }
            });
          } catch (seedErr) {
            console.warn("[Supabase] Background seeding fail:", seedErr);
          }
        } else {
          try {
            localStorage.setItem('cached_remote_products', JSON.stringify(data));
          } catch (e) {
            console.warn("Failed to update remote cache:", e);
          }
          setProducts(getMergedProducts(data as Product[]));
        }
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        console.warn("[Supabase] Connection Failure: Check if project URL is correct.");
      } else {
        console.warn("[Supabase] Dynamic warning (handled):", err);
      }
      setProducts(getMergedProducts([]));
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    let channel: any = null;
    if (isSupabaseConfigured) {
      try {
        channel = supabase.channel('products_changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchProducts(true))
          .subscribe();
      } catch (e) {
        console.warn("[Realtime] Subscription failed.", e);
      }
    }
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  return {
    products,
    setProducts,
    loadingProducts,
    fetchProducts,
  };
}
