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
}

export type ProductInsert = Omit<Product, 'id' | 'created_at' | 'updated_at'>;
export type ProductUpdate = Partial<ProductInsert>;

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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

  const addProduct = async (product: ProductInsert) => {
    const { data: userData } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        description: product.description,
        price: product.price,
        is_active: product.is_active,
        created_by: userData.user?.id,
      });

    if (error) {
      toast({ title: 'Error adding product', description: error.message, variant: 'destructive' });
      return { error };
    }
    
    toast({ title: 'Product created' });
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
    
    toast({ title: 'Product updated' });
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

  return {
    products,
    activeProducts: products.filter(p => p.is_active),
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchProducts,
  };
}
