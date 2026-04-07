import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Calculates "was" (usual) prices for each package tier using the same
 * product-rate logic as the SOW generator.  Base rate = 5 pages.
 *
 * Product types used: page, feature, integration, portal_admin,
 * portal_client, portal_staff.
 *
 * The actual per-unit rates are NEVER exposed to the front-end —
 * only the aggregated "was" totals are returned.
 */

interface Rates {
  page: number;
  feature: number;
  integration: number;
  portal_admin: number;
  portal_client: number;
  portal_staff: number;
}

const DEFAULTS: Rates = {
  page: 159,
  feature: 300,
  integration: 199,
  portal_admin: 1200,
  portal_client: 1000,
  portal_staff: 800,
};

const BASE_PAGES = 5;

function calcBlue(r: Rates) {
  return (
    BASE_PAGES * r.page +   // 5 pages
    r.feature +              // high-converting funnel
    r.feature +              // lead capture forms
    r.feature +              // lifetime hosting
    r.feature +              // industry-specific SEO
    r.integration            // email integration
  );
}

function calcGold(r: Rates, blueTotal: number) {
  return (
    blueTotal +
    r.integration +          // calendar integration
    r.portal_admin +         // admin dashboard
    r.feature +              // lead management CRM
    r.feature +              // extra SEO infrastructure
    r.integration            // payment integration
  );
}

function calcPlatinum(r: Rates, goldTotal: number) {
  return (
    goldTotal +
    r.portal_client +        // client portal
    r.portal_staff +         // staff portal
    r.feature +              // AI chatbot
    r.feature +              // premium SEO infrastructure
    r.integration +          // custom integrations
    r.feature                // priority support & delivery
  );
}

export interface PackageSavings {
  blue: { wasPrice: number; };
  gold: { wasPrice: number; };
  platinum: { wasPrice: number; };
}

export function usePackageSavings() {
  const [savings, setSavings] = useState<PackageSavings>(() => {
    const b = calcBlue(DEFAULTS);
    const g = calcGold(DEFAULTS, b);
    const p = calcPlatinum(DEFAULTS, g);
    return { blue: { wasPrice: b }, gold: { wasPrice: g }, platinum: { wasPrice: p } };
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('products')
        .select('price, product_type')
        .eq('is_active', true);

      const rates = { ...DEFAULTS };
      if (data) {
        data.forEach((p: any) => {
          if (p.product_type && p.product_type !== 'package' && p.product_type in rates) {
            (rates as any)[p.product_type] = p.price;
          }
        });
      }

      const b = calcBlue(rates);
      const g = calcGold(rates, b);
      const pl = calcPlatinum(rates, g);
      setSavings({ blue: { wasPrice: b }, gold: { wasPrice: g }, platinum: { wasPrice: pl } });
      setLoading(false);
    })();
  }, []);

  return { savings, loading };
}
