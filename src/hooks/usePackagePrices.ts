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
 * Fetches active package products and deposit amount from the database.
 * Returns a map of tier key → price and the dynamic deposit amount.
 * Fallback: if query fails, returns hardcoded defaults so page still renders.
 */
export function usePackagePrices() {
  const [prices, setPrices] = useState<Record<string, number>>({
    "basic-deposit": 499,
    "gold": 649,
    "platinum": 1149,
  });
  const [depositAmount, setDepositAmount] = useState(49);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      // Fetch products and deposit amount in parallel
      const [productsRes, depositRes] = await Promise.all([
        supabase
          .from('products')
          .select('name, price')
          .eq('product_type', 'package')
          .eq('is_active', true),
        supabase
          .from('system_settings')
          .select('setting_value')
          .eq('setting_key', 'deposit_amount')
          .maybeSingle(),
      ]);

      if (!productsRes.error && productsRes.data && productsRes.data.length > 0) {
        const map: Record<string, number> = {};
        for (const [tierKey, productName] of Object.entries(TIER_TO_PRODUCT)) {
          const product = productsRes.data.find((p: any) => p.name === productName);
          if (product) {
            map[tierKey] = product.price;
          }
        }
        if (Object.keys(map).length > 0) {
          setPrices(prev => ({ ...prev, ...map }));
        }
      }

      if (!depositRes.error && depositRes.data?.setting_value != null) {
        const val = depositRes.data.setting_value;
        const amount = typeof val === 'number' ? val : Number(val);
        if (!isNaN(amount) && amount > 0) {
          setDepositAmount(amount);
        }
      }

      setLoading(false);
    };
    fetchAll();
  }, []);

  return { prices, depositAmount, loading };
}
