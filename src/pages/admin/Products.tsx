import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  min_quantity: number;
  image_url: string | null;
  pack_info: string | null;
  stock_quantity: number;
}

export default function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setProducts(data);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const productData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      price: parseFloat(formData.get('price') as string),
      min_quantity: parseInt(formData.get('min_quantity') as string),
      image_url: formData.get('image_url') as string,
      pack_info: formData.get('pack_info') as string,
      stock_quantity: parseInt(formData.get('stock_quantity') as string) || 0,
    };

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id);

      if (error) {
        toast.error('Failed to update product');
      } else {
        toast.success('Product updated successfully');
      }
    } else {
      const { error } = await supabase
        .from('products')
        .insert(productData);

      if (error) {
        toast.error('Failed to create product');
      } else {
        toast.success('Product created successfully');
      }
    }

    setOpen(false);
    setEditingProduct(null);
    loadProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete product');
    } else {
      toast.success('Product deleted successfully');
      loadProducts();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold">Products</h1>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/admin/products/import')}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import Products
              </Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingProduct(null)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" name="name" defaultValue={editingProduct?.name} required />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" defaultValue={editingProduct?.description || ''} rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Input id="category" name="category" defaultValue={editingProduct?.category} required />
                    </div>
                    <div>
                      <Label htmlFor="price">Price (R) *</Label>
                      <Input id="price" name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="min_quantity">Min Quantity *</Label>
                      <Input id="min_quantity" name="min_quantity" type="number" defaultValue={editingProduct?.min_quantity || 1} required />
                    </div>
                    <div>
                      <Label htmlFor="stock_quantity">Stock Quantity</Label>
                      <Input id="stock_quantity" name="stock_quantity" type="number" defaultValue={editingProduct?.stock_quantity || 0} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="pack_info">Pack Info</Label>
                    <Input id="pack_info" name="pack_info" defaultValue={editingProduct?.pack_info || ''} placeholder="e.g., 10ml bottle" />
                  </div>
                  <div>
                    <Label htmlFor="image_url">Image URL</Label>
                    <Input id="image_url" name="image_url" type="url" defaultValue={editingProduct?.image_url || ''} placeholder="https://..." />
                  </div>
                  <Button type="submit" className="w-full">
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-4">
                  {product.image_url && (
                    <img src={product.image_url} alt={product.name} className="w-full h-48 object-cover rounded mb-4" />
                  )}
                  <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold text-primary">R {product.price.toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground">{product.category}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                      setEditingProduct(product);
                      setOpen(true);
                    }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </AdminLayout>
  );
}
