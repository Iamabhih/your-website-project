import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft, Search, MoreVertical, Loader2, Package, RefreshCw,
  AlertTriangle, Warehouse, ArrowUpDown, Plus, Minus, Download,
  Upload, TrendingDown, TrendingUp, Filter, Edit, History,
  Bell, BellOff, CheckCircle
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock_quantity: number;
  min_quantity: number;
  image_url: string | null;
  created_at: string;
}

interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  created_at: string;
}

const LOW_STOCK_THRESHOLD = 10;
const OUT_OF_STOCK_THRESHOLD = 0;

export default function Inventory() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);

  // Dialogs
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [showBulkAdjustDialog, setShowBulkAdjustDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Adjust form
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'set'>('add');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, stockFilter, categoryFilter]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('stock_quantity', { ascending: true });

      if (error) throw error;

      if (data) {
        setProducts(data);
        const uniqueCategories = [...new Set(data.map(p => p.category))].filter(Boolean);
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    if (stockFilter !== 'all') {
      switch (stockFilter) {
        case 'out':
          filtered = filtered.filter(p => p.stock_quantity <= OUT_OF_STOCK_THRESHOLD);
          break;
        case 'low':
          filtered = filtered.filter(p => p.stock_quantity > OUT_OF_STOCK_THRESHOLD && p.stock_quantity <= LOW_STOCK_THRESHOLD);
          break;
        case 'in':
          filtered = filtered.filter(p => p.stock_quantity > LOW_STOCK_THRESHOLD);
          break;
      }
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    setFilteredProducts(filtered);
  };

  const updateStock = async (productId: string, newQuantity: number, reason: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock_quantity: Math.max(0, newQuantity) })
        .eq('id', productId);

      if (error) throw error;

      // Record movement
      const product = products.find(p => p.id === productId);
      if (product) {
        const movement: StockMovement = {
          id: Date.now().toString(),
          product_id: productId,
          product_name: product.name,
          type: newQuantity > product.stock_quantity ? 'in' : newQuantity < product.stock_quantity ? 'out' : 'adjustment',
          quantity: Math.abs(newQuantity - product.stock_quantity),
          reason,
          created_at: new Date().toISOString(),
        };
        setStockMovements(prev => [movement, ...prev]);
      }

      await loadProducts();
      return true;
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
      return false;
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedProduct || adjustmentQuantity === 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setSaving(true);
    let newQuantity = selectedProduct.stock_quantity;

    switch (adjustmentType) {
      case 'add':
        newQuantity = selectedProduct.stock_quantity + adjustmentQuantity;
        break;
      case 'remove':
        newQuantity = selectedProduct.stock_quantity - adjustmentQuantity;
        break;
      case 'set':
        newQuantity = adjustmentQuantity;
        break;
    }

    const success = await updateStock(
      selectedProduct.id,
      newQuantity,
      adjustmentReason || `Stock ${adjustmentType}`
    );

    if (success) {
      toast.success('Stock updated successfully');
      setShowAdjustDialog(false);
      resetAdjustForm();
    }
    setSaving(false);
  };

  const handleBulkAdjust = async () => {
    if (selectedProducts.size === 0 || adjustmentQuantity === 0) {
      toast.error('Please select products and enter a quantity');
      return;
    }

    setSaving(true);
    let successCount = 0;

    for (const productId of selectedProducts) {
      const product = products.find(p => p.id === productId);
      if (!product) continue;

      let newQuantity = product.stock_quantity;
      switch (adjustmentType) {
        case 'add':
          newQuantity = product.stock_quantity + adjustmentQuantity;
          break;
        case 'remove':
          newQuantity = product.stock_quantity - adjustmentQuantity;
          break;
        case 'set':
          newQuantity = adjustmentQuantity;
          break;
      }

      const success = await updateStock(productId, newQuantity, adjustmentReason || `Bulk ${adjustmentType}`);
      if (success) successCount++;
    }

    toast.success(`Updated ${successCount} products`);
    setShowBulkAdjustDialog(false);
    setSelectedProducts(new Set());
    resetAdjustForm();
    setSaving(false);
  };

  const resetAdjustForm = () => {
    setAdjustmentType('add');
    setAdjustmentQuantity(0);
    setAdjustmentReason('');
    setSelectedProduct(null);
  };

  const exportInventory = () => {
    const csv = [
      ['Product Name', 'Category', 'Price', 'Stock', 'Min Quantity', 'Status'].join(','),
      ...filteredProducts.map(p => [
        `"${p.name}"`,
        `"${p.category}"`,
        p.price,
        p.stock_quantity,
        p.min_quantity,
        getStockStatus(p.stock_quantity).label
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity <= OUT_OF_STOCK_THRESHOLD) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    }
    if (quantity <= LOW_STOCK_THRESHOLD) {
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: TrendingDown };
    }
    return { label: 'In Stock', color: 'bg-success/10 text-success', icon: CheckCircle };
  };

  const getStockPercentage = (quantity: number, minQuantity: number) => {
    const target = Math.max(minQuantity * 10, 100); // Target is 10x min quantity or 100
    return Math.min(100, (quantity / target) * 100);
  };

  const stats = {
    totalProducts: products.length,
    totalStock: products.reduce((sum, p) => sum + p.stock_quantity, 0),
    outOfStock: products.filter(p => p.stock_quantity <= OUT_OF_STOCK_THRESHOLD).length,
    lowStock: products.filter(p => p.stock_quantity > OUT_OF_STOCK_THRESHOLD && p.stock_quantity <= LOW_STOCK_THRESHOLD).length,
    inStock: products.filter(p => p.stock_quantity > LOW_STOCK_THRESHOLD).length,
    totalValue: products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0),
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Inventory Management</h1>
            <p className="text-muted-foreground">Track and manage product stock levels</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportInventory}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={loadProducts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {selectedProducts.size > 0 && (
            <Button onClick={() => setShowBulkAdjustDialog(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Bulk Adjust ({selectedProducts.size})
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
                <p className="text-sm text-muted-foreground">Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Warehouse className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalStock.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Units</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.outOfStock}</p>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.lowStock}</p>
                <p className="text-sm text-muted-foreground">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inStock}</p>
                <p className="text-sm text-muted-foreground">In Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">R{stats.totalValue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Stock Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {stats.outOfStock > 0 && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">
                  {stats.outOfStock} product(s) are out of stock
                </p>
                <p className="text-sm text-red-600">
                  These products cannot be purchased until restocked
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => setStockFilter('out')}
              >
                View
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="in">In Stock</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
                        } else {
                          setSelectedProducts(new Set());
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const status = getStockStatus(product.stock_quantity);
                  const percentage = getStockPercentage(product.stock_quantity, product.min_quantity);
                  const StatusIcon = status.icon;

                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.has(product.id)}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedProducts);
                            if (checked) {
                              newSelected.add(product.id);
                            } else {
                              newSelected.delete(product.id);
                            }
                            setSelectedProducts(newSelected);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Min: {product.min_quantity}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell className="w-40">
                        <div className="space-y-1">
                          <Progress
                            value={percentage}
                            className={cn(
                              "h-2",
                              product.stock_quantity <= OUT_OF_STOCK_THRESHOLD && "[&>div]:bg-red-500",
                              product.stock_quantity > OUT_OF_STOCK_THRESHOLD && product.stock_quantity <= LOW_STOCK_THRESHOLD && "[&>div]:bg-yellow-500"
                            )}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-lg font-bold">{product.stock_quantity}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("gap-1", status.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        R{(product.price * product.stock_quantity).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedProduct(product);
                              setShowAdjustDialog(true);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Adjust Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedProduct(product);
                              setAdjustmentType('add');
                              setAdjustmentQuantity(10);
                              setShowAdjustDialog(true);
                            }}>
                              <Plus className="h-4 w-4 mr-2" />
                              Quick Add +10
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setSelectedProduct(product);
                              setShowHistoryDialog(true);
                            }}>
                              <History className="h-4 w-4 mr-2" />
                              View History
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/products?search=${encodeURIComponent(product.name)}`)}>
                              <Package className="h-4 w-4 mr-2" />
                              Edit Product
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Adjust Stock Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span>Current Stock</span>
              <span className="text-2xl font-bold">{selectedProduct?.stock_quantity || 0}</span>
            </div>
            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <Select value={adjustmentType} onValueChange={(v: 'add' | 'remove' | 'set') => setAdjustmentType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4 text-success" />
                      Add Stock
                    </div>
                  </SelectItem>
                  <SelectItem value="remove">
                    <div className="flex items-center gap-2">
                      <Minus className="h-4 w-4 text-red-600" />
                      Remove Stock
                    </div>
                  </SelectItem>
                  <SelectItem value="set">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      Set to Value
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="0"
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Input
                placeholder="e.g., New shipment received"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
              />
            </div>
            {selectedProduct && adjustmentQuantity > 0 && (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <span>New Stock Level</span>
                <span className="text-2xl font-bold text-blue-600">
                  {adjustmentType === 'add'
                    ? selectedProduct.stock_quantity + adjustmentQuantity
                    : adjustmentType === 'remove'
                      ? Math.max(0, selectedProduct.stock_quantity - adjustmentQuantity)
                      : adjustmentQuantity
                  }
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdjustDialog(false); resetAdjustForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAdjustStock} disabled={saving || adjustmentQuantity === 0}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Adjust Dialog */}
      <Dialog open={showBulkAdjustDialog} onOpenChange={setShowBulkAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Stock Adjustment</DialogTitle>
            <DialogDescription>
              Adjust stock for {selectedProducts.size} selected products
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <Select value={adjustmentType} onValueChange={(v: 'add' | 'remove' | 'set') => setAdjustmentType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add to each product</SelectItem>
                  <SelectItem value="remove">Remove from each product</SelectItem>
                  <SelectItem value="set">Set all to value</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="0"
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                placeholder="e.g., Inventory count adjustment"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowBulkAdjustDialog(false); resetAdjustForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleBulkAdjust} disabled={saving || adjustmentQuantity === 0}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update {selectedProducts.size} Products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Stock History</DialogTitle>
            <DialogDescription>
              {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {stockMovements.filter(m => m.product_id === selectedProduct?.id).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No stock movements recorded</p>
              </div>
            ) : (
              stockMovements
                .filter(m => m.product_id === selectedProduct?.id)
                .slice(0, 10)
                .map(movement => (
                  <div key={movement.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {movement.type === 'in' ? (
                        <div className="p-2 bg-success/10 rounded-full">
                          <Plus className="h-4 w-4 text-success" />
                        </div>
                      ) : movement.type === 'out' ? (
                        <div className="p-2 bg-red-100 rounded-full">
                          <Minus className="h-4 w-4 text-red-600" />
                        </div>
                      ) : (
                        <div className="p-2 bg-blue-100 rounded-full">
                          <ArrowUpDown className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium capitalize">{movement.type}</p>
                        <p className="text-sm text-muted-foreground">{movement.reason}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "font-bold",
                        movement.type === 'in' && "text-success",
                        movement.type === 'out' && "text-red-600"
                      )}>
                        {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : ''}{movement.quantity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(movement.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
