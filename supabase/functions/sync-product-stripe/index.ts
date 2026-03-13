import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-PRODUCT-STRIPE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables not set");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Verify user auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Unauthorized");
    logStep("User authenticated", { userId: userData.user.id });

    // Check if user has permission to manage products (requires can_edit_leads)
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('can_edit_leads')
      .eq('user_id', userData.user.id)
      .single();

    if (roleError || !userRole?.can_edit_leads) {
      logStep("Permission denied", { userId: userData.user.id, requiredPermission: 'can_edit_leads' });
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions: cannot manage products' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    logStep("Permission validated", { permission: 'can_edit_leads' });

    const { product_id, name, description, price, is_active } = await req.json();
    logStep("Received request", { product_id, name, price, is_active });

    if (!name || price === undefined) {
      throw new Error("Missing required fields: name, price");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if product already has Stripe IDs
    const { data: existingProduct, error: fetchError } = await supabaseAdmin
      .from("products")
      .select("stripe_product_id, stripe_price_id")
      .eq("id", product_id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw new Error(`Error fetching product: ${fetchError.message}`);
    }

    let stripeProductId = existingProduct?.stripe_product_id;
    let stripePriceId = existingProduct?.stripe_price_id;

    // If no existing Stripe product, search by name or create new
    if (!stripeProductId) {
      logStep("No existing Stripe product, searching by name");
      
      // Search for existing Stripe product by name
      const existingProducts = await stripe.products.search({
        query: `name~"${name}"`,
        limit: 10,
      });

      const matchingProduct = existingProducts.data.find(
        (p: Stripe.Product) => p.name.toLowerCase() === name.toLowerCase()
      );

      if (matchingProduct) {
        logStep("Found matching Stripe product", { stripeProductId: matchingProduct.id });
        stripeProductId = matchingProduct.id;

        // Get existing prices for this product
        const prices = await stripe.prices.list({
          product: matchingProduct.id,
          active: true,
          limit: 10,
        });

        // Find price matching our amount
        const priceInCents = Math.round(price * 100);
        const matchingPrice = prices.data.find(
          (p: Stripe.Price) => p.unit_amount === priceInCents && p.type === "one_time"
        );

        if (matchingPrice) {
          stripePriceId = matchingPrice.id;
          logStep("Found matching price", { stripePriceId });
        }
      }
    }

    // Create Stripe product if not found
    if (!stripeProductId) {
      logStep("Creating new Stripe product");
      const stripeProduct = await stripe.products.create({
        name,
        description: description || undefined,
        active: is_active,
        metadata: {
          lovable_product_id: product_id,
        },
      });
      stripeProductId = stripeProduct.id;
      logStep("Created Stripe product", { stripeProductId });
    } else {
      // Update existing Stripe product
      logStep("Updating existing Stripe product", { stripeProductId });
      await stripe.products.update(stripeProductId, {
        name,
        description: description || "",
        active: is_active,
      });
    }

    // Create or update price
    const priceInCents = Math.round(price * 100);
    
    if (!stripePriceId) {
      logStep("Creating new Stripe price", { amount: priceInCents });
      const stripePrice = await stripe.prices.create({
        product: stripeProductId,
        unit_amount: priceInCents,
        currency: "aud",
        metadata: {
          lovable_product_id: product_id,
        },
      });
      stripePriceId = stripePrice.id;
      logStep("Created Stripe price", { stripePriceId });
    } else {
      // Check if price amount changed
      const existingPrice = await stripe.prices.retrieve(stripePriceId);
      if (existingPrice.unit_amount !== priceInCents) {
        logStep("Price amount changed, creating new price");
        // Archive old price
        await stripe.prices.update(stripePriceId, { active: false });
        
        // Create new price
        const newPrice = await stripe.prices.create({
          product: stripeProductId,
          unit_amount: priceInCents,
          currency: "aud",
          metadata: {
            lovable_product_id: product_id,
          },
        });
        stripePriceId = newPrice.id;
        logStep("Created new Stripe price", { stripePriceId });
      }
    }

    // Update product in database with Stripe IDs
    const { error: updateError } = await supabaseAdmin
      .from("products")
      .update({
        stripe_product_id: stripeProductId,
        stripe_price_id: stripePriceId,
      })
      .eq("id", product_id);

    if (updateError) {
      throw new Error(`Error updating product: ${updateError.message}`);
    }

    logStep("Product synced successfully", { stripeProductId, stripePriceId });

    return new Response(
      JSON.stringify({
        success: true,
        stripe_product_id: stripeProductId,
        stripe_price_id: stripePriceId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
