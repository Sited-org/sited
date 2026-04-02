import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PackageProduct {
  name: string;
  price: number;
}

// Tier key → product name mapping (same as backend)
const TIER_TO_PRODUCT: Record<string, string> = {
  "basic-deposit": "Essential Blue",
  "gold": "Gold Package",
  "platinum": "Platinum Package",
};

/**
 * Fetches active package products from the products table.
 * Returns a map of tier key → price for use on public-facing pages.
 * Uses service-role via edge function not needed — products table
 * is queryable if we add a public RLS policy, but to avoid that
 * we just query with the anon key and rely on existing policies.
 * 
 * Fallback: if query fails, returns hardcoded defaults so page still renders.
 */
export function usePackagePrices() {
  const [prices, setPrices] = useState<Record<string, number>>({
    "basic-deposit": 499,
    "gold": 649,
    "platinum": 1149,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('name, price')
        .eq('product_type', 'package')
        .eq('is_active', true);

      if (!error && data && data.length > 0) {
        const map: Record<string, number> = {};
        for (const [tierKey, productName] of Object.entries(TIER_TO_PRODUCT)) {
          const product = data.find((p: any) => p.name === productName);
          if (product) {
            map[tierKey] = product.price;
          }
        }
        if (Object.keys(map).length > 0) {
          setPrices(prev => ({ ...prev, ...map }));
        }
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return { prices, loading };
}
