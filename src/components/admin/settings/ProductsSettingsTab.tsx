import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Package, RefreshCw, Check, AlertCircle, Loader2, DollarSign, Save } from 'lucide-react';
import { useProducts, Product, ProductInsert, ProductType } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

const PRODUCT_TYPE_OPTIONS: { value: ProductType; label: string }[] = [
  { value: 'package', label: 'Package' },
  { value: 'page', label: 'Page Add-on' },
  { value: 'feature', label: 'Feature Add-on' },
  { value: 'integration', label: 'Integration Add-on' },
  { value: 'portal_admin', label: 'Admin Portal' },
  { value: 'portal_client', label: 'Client Portal' },
  { value: 'portal_staff', label: 'Staff Portal' },
];

function DepositSettingsCard() {
  const [depositAmount, setDepositAmount] = useState('49');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'deposit_amount')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.setting_value) {
          const val = data.setting_value as any;
          setDepositAmount(String(val.amount ?? 49));
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      setSaving(false);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const settingValue = { amount } as unknown as Json;

    // Upsert the deposit setting
    const { data: existing } = await supabase
      .from('system_settings')
      .select('id')
      .eq('setting_key', 'deposit_amount')
      .maybeSingle();

    if (existing) {
      await supabase
        .from('system_settings')
        .update({ setting_value: settingValue, updated_by: userData.user?.id })
        .eq('setting_key', 'deposit_amount');
    } else {
      await supabase
        .from('system_settings')
        .insert({ setting_key: 'deposit_amount', setting_value: settingValue, updated_by: userData.user?.id });
    }

    toast({ title: 'Deposit amount saved' });
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-4 w-4" />
          Deposit Settings
        </CardTitle>
        <CardDescription>
          Set the deposit amount charged when a proposal is sent. The remaining balance is billed separately.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-3">
          <div className="space-y-2 flex-1 max-w-[200px]">
            <Label htmlFor="deposit">Deposit Amount ($)</Label>
            <Input
              id="deposit"
              type="number"
              min="0"
              step="1"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button onClick={handleSave} disabled={saving || loading} size="sm">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductsSettingsTab() {
  const { products, loading, syncing, addProduct, updateProduct, deleteProduct, resyncProduct } = useProducts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [productType, setProductType] = useState<ProductType>('package');

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setIsActive(true);
    setProductType('package');
    setEditingProduct(null);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || '');
    setPrice(product.price.toString());
    setIsActive(product.is_active);
    setProductType(product.product_type || 'package');
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !price) return;

    const productData: ProductInsert = {
      name: name.trim(),
      description: description.trim() || null,
      price: parseFloat(price),
      is_active: isActive,
      product_type: productType,
      created_by: null,
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id, productData);
    } else {
      await addProduct(productData);
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteProduct(id);
  };

  const getTypeLabel = (type: string) => PRODUCT_TYPE_OPTIONS.find(o => o.value === type)?.label || type;

  return (
    <div className="space-y-6">
      <DepositSettingsCard />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Products
              </CardTitle>
              <CardDescription>
                Manage products and pricing used in proposals and billing.
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                  <DialogDescription>
                    {editingProduct ? 'Update the product details below.' : 'Create a new product for billing.'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Gold Package" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Product Type</Label>
                    <Select value={productType} onValueChange={(v) => setProductType(v as ProductType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRODUCT_TYPE_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." rows={3} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input id="price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="active">Active</Label>
                      <p className="text-sm text-muted-foreground">Only active products can be used in proposals</p>
                    </div>
                    <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
                  <Button onClick={handleSubmit} disabled={!name.trim() || !price}>
                    {editingProduct ? 'Update' : 'Create'} Product
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-muted-foreground">No products created yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stripe</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{getTypeLabel(product.product_type)}</Badge>
                    </TableCell>
                    <TableCell>${product.price.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={product.is_active ? 'default' : 'secondary'}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {syncing === product.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : product.stripe_product_id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-yellow-500" />
                            )}
                          </TooltipTrigger>
                          <TooltipContent>
                            {syncing === product.id ? 'Syncing...' : product.stripe_product_id ? `Linked: ${product.stripe_product_id}` : 'Not synced with Stripe'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => resyncProduct(product)} disabled={syncing === product.id} title="Sync with Stripe">
                          <RefreshCw className={`h-4 w-4 ${syncing === product.id ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Product</AlertDialogTitle>
                              <AlertDialogDescription>Are you sure you want to delete "{product.name}"? This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(product.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
