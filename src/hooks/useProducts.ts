import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
}

export type ProductInsert = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'stripe_product_id' | 'stripe_price_id'>;
export type ProductUpdate = Partial<ProductInsert>;

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      toast({ title: 'Error fetching products', description: error.message, variant: 'destructive' });
    } else {
      setProducts((data || []) as Product[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const syncWithStripe = async (productId: string, productData: { name: string; description: string | null; price: number; is_active: boolean }) => {
    setSyncing(productId);
    try {
      const { data, error } = await supabase.functions.invoke('sync-product-stripe', {
        body: {
          product_id: productId,
          name: productData.name,
          description: productData.description,
          price: productData.price,
          is_active: productData.is_active,
        },
      });

      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sync with Stripe';
      toast({ title: 'Stripe sync failed', description: message, variant: 'destructive' });
      return { data: null, error };
    } finally {
      setSyncing(null);
    }
  };

  const addProduct = async (product: ProductInsert) => {
    const { data: userData } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        description: product.description,
        price: product.price,
        is_active: product.is_active,
        created_by: userData.user?.id,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error adding product', description: error.message, variant: 'destructive' });
      return { error };
    }
    
    // Sync with Stripe
    if (data) {
      const syncResult = await syncWithStripe(data.id, {
        name: product.name,
        description: product.description,
        price: product.price,
        is_active: product.is_active,
      });
      
      if (syncResult.error) {
        toast({ title: 'Product created', description: 'But Stripe sync failed. You can retry from settings.' });
      } else {
        toast({ title: 'Product created & synced with Stripe' });
      }
    }
    
    fetchProducts();
    return { error: null };
  };

  const updateProduct = async (id: string, updates: ProductUpdate) => {
    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({ title: 'Error updating product', description: error.message, variant: 'destructive' });
      return { error };
    }
    
    // Get full product data for Stripe sync
    const existingProduct = products.find(p => p.id === id);
    if (existingProduct) {
      const mergedData = {
        name: updates.name ?? existingProduct.name,
        description: updates.description ?? existingProduct.description,
        price: updates.price ?? existingProduct.price,
        is_active: updates.is_active ?? existingProduct.is_active,
      };
      
      const syncResult = await syncWithStripe(id, mergedData);
      
      if (syncResult.error) {
        toast({ title: 'Product updated', description: 'But Stripe sync failed.' });
      } else {
        toast({ title: 'Product updated & synced with Stripe' });
      }
    }
    
    fetchProducts();
    return { error: null };
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error deleting product', description: error.message, variant: 'destructive' });
      return { error };
    }
    
    toast({ title: 'Product deleted' });
    fetchProducts();
    return { error: null };
  };

  const resyncProduct = async (product: Product) => {
    const syncResult = await syncWithStripe(product.id, {
      name: product.name,
      description: product.description,
      price: product.price,
      is_active: product.is_active,
    });
    
    if (!syncResult.error) {
      toast({ title: 'Product synced with Stripe' });
      fetchProducts();
    }
    
    return syncResult;
  };

  return {
    products,
    activeProducts: products.filter(p => p.is_active),
    loading,
    syncing,
    addProduct,
    updateProduct,
    deleteProduct,
    resyncProduct,
    refetch: fetchProducts,
  };
}
