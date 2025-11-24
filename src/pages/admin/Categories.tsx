import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft, Plus, Edit, Trash2, MoreVertical, Loader2,
  FolderTree, Package, Eye, EyeOff, GripVertical, Upload,
  Search, Image as ImageIcon, Tag, ArrowUpDown, RefreshCw,
  ChevronUp, ChevronDown, Save, X
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { cn } from '@/lib/utils';

interface CategoryMetadata {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  meta_title: string;
  meta_description: string;
  is_visible: boolean;
  sort_order: number;
  parent_category?: string;
}

interface Category {
  name: string;
  productCount: number;
  metadata: CategoryMetadata;
}

const DEFAULT_METADATA: Omit<CategoryMetadata, 'name' | 'slug'> = {
  description: '',
  image_url: '',
  meta_title: '',
  meta_description: '',
  is_visible: true,
  sort_order: 0,
};

export default function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryMetadataStore, setCategoryMetadataStore] = useState<Record<string, CategoryMetadata>>({});

  // Form state
  const [formData, setFormData] = useState<CategoryMetadata>({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    meta_title: '',
    meta_description: '',
    is_visible: true,
    sort_order: 0,
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [deleteAction, setDeleteAction] = useState<'reassign' | 'delete'>('reassign');
  const [reassignCategory, setReassignCategory] = useState('');

  useEffect(() => {
    loadCategories();
    loadCategoryMetadata();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('category');

      if (error) throw error;

      // Count products per category
      const categoryMap: Record<string, number> = {};
      data?.forEach(product => {
        const cat = product.category || 'Uncategorized';
        categoryMap[cat] = (categoryMap[cat] || 0) + 1;
      });

      // Convert to array and merge with metadata
      const categoryList: Category[] = Object.entries(categoryMap).map(([name, count]) => ({
        name,
        productCount: count,
        metadata: categoryMetadataStore[name] || {
          ...DEFAULT_METADATA,
          name,
          slug: generateSlug(name),
        },
      }));

      // Sort by sort_order then by name
      categoryList.sort((a, b) => {
        const orderDiff = (a.metadata.sort_order || 0) - (b.metadata.sort_order || 0);
        if (orderDiff !== 0) return orderDiff;
        return a.name.localeCompare(b.name);
      });

      setCategories(categoryList);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryMetadata = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'category_metadata')
        .single();

      if (!error && data?.value) {
        const metadata = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        setCategoryMetadataStore(metadata);
      }
    } catch (error) {
      console.error('Error loading category metadata:', error);
    }
  };

  const saveCategoryMetadata = async (metadata: Record<string, CategoryMetadata>) => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert([{
          key: 'category_metadata',
          value: metadata as any,
          updated_at: new Date().toISOString(),
        }], { onConflict: 'key' });

      if (error) throw error;
      setCategoryMetadataStore(metadata);
    } catch (error) {
      console.error('Error saving category metadata:', error);
      throw error;
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const handleAddCategory = async () => {
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    // Check if category already exists
    if (categories.some(c => c.name.toLowerCase() === formData.name.toLowerCase())) {
      toast.error('Category already exists');
      return;
    }

    setSaving(true);
    try {
      const slug = formData.slug || generateSlug(formData.name);
      const newMetadata = {
        ...categoryMetadataStore,
        [formData.name]: {
          ...formData,
          slug,
          sort_order: categories.length,
        },
      };

      await saveCategoryMetadata(newMetadata);
      await loadCategories();
      setShowAddDialog(false);
      resetForm();
      toast.success('Category created successfully');
    } catch (error) {
      toast.error('Failed to create category');
    } finally {
      setSaving(false);
    }
  };

  const handleEditCategory = async () => {
    if (!selectedCategory || !formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setSaving(true);
    try {
      const newMetadata = { ...categoryMetadataStore };

      // If name changed, rename products too
      if (formData.name !== selectedCategory.name) {
        const { error } = await supabase
          .from('products')
          .update({ category: formData.name })
          .eq('category', selectedCategory.name);

        if (error) throw error;

        // Remove old key and add new one
        delete newMetadata[selectedCategory.name];
      }

      newMetadata[formData.name] = {
        ...formData,
        slug: formData.slug || generateSlug(formData.name),
      };

      await saveCategoryMetadata(newMetadata);
      await loadCategories();
      setShowEditDialog(false);
      resetForm();
      toast.success('Category updated successfully');
    } catch (error) {
      toast.error('Failed to update category');
    } finally {
      setSaving(false);
    }
  };

  const handleRenameCategory = async () => {
    if (!selectedCategory || !newCategoryName.trim()) {
      toast.error('New category name is required');
      return;
    }

    if (categories.some(c => c.name.toLowerCase() === newCategoryName.toLowerCase() && c.name !== selectedCategory.name)) {
      toast.error('Category with this name already exists');
      return;
    }

    setSaving(true);
    try {
      // Update all products with this category
      const { error } = await supabase
        .from('products')
        .update({ category: newCategoryName })
        .eq('category', selectedCategory.name);

      if (error) throw error;

      // Update metadata
      const newMetadata = { ...categoryMetadataStore };
      if (newMetadata[selectedCategory.name]) {
        newMetadata[newCategoryName] = {
          ...newMetadata[selectedCategory.name],
          name: newCategoryName,
          slug: generateSlug(newCategoryName),
        };
        delete newMetadata[selectedCategory.name];
      } else {
        newMetadata[newCategoryName] = {
          ...DEFAULT_METADATA,
          name: newCategoryName,
          slug: generateSlug(newCategoryName),
        };
      }

      await saveCategoryMetadata(newMetadata);
      await loadCategories();
      setShowRenameDialog(false);
      setNewCategoryName('');
      setSelectedCategory(null);
      toast.success(`Category renamed to "${newCategoryName}"`);
    } catch (error) {
      toast.error('Failed to rename category');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    setSaving(true);
    try {
      if (deleteAction === 'reassign' && reassignCategory) {
        // Move products to another category
        const { error } = await supabase
          .from('products')
          .update({ category: reassignCategory })
          .eq('category', selectedCategory.name);

        if (error) throw error;
      } else if (deleteAction === 'delete') {
        // Delete all products in this category
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('category', selectedCategory.name);

        if (error) throw error;
      }

      // Remove metadata
      const newMetadata = { ...categoryMetadataStore };
      delete newMetadata[selectedCategory.name];
      await saveCategoryMetadata(newMetadata);

      await loadCategories();
      setShowDeleteDialog(false);
      setSelectedCategory(null);
      setDeleteAction('reassign');
      setReassignCategory('');
      toast.success('Category deleted successfully');
    } catch (error) {
      toast.error('Failed to delete category');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async (category: Category) => {
    try {
      const newMetadata = {
        ...categoryMetadataStore,
        [category.name]: {
          ...category.metadata,
          is_visible: !category.metadata.is_visible,
        },
      };

      await saveCategoryMetadata(newMetadata);
      await loadCategories();
      toast.success(`Category ${!category.metadata.is_visible ? 'shown' : 'hidden'}`);
    } catch (error) {
      toast.error('Failed to update visibility');
    }
  };

  const handleMoveCategory = async (category: Category, direction: 'up' | 'down') => {
    const index = categories.findIndex(c => c.name === category.name);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === categories.length - 1)) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newCategories = [...categories];
    [newCategories[index], newCategories[newIndex]] = [newCategories[newIndex], newCategories[index]];

    // Update sort orders
    const newMetadata = { ...categoryMetadataStore };
    newCategories.forEach((cat, i) => {
      newMetadata[cat.name] = {
        ...cat.metadata,
        sort_order: i,
      };
    });

    try {
      await saveCategoryMetadata(newMetadata);
      setCategories(newCategories);
    } catch (error) {
      toast.error('Failed to reorder categories');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      image_url: '',
      meta_title: '',
      meta_description: '',
      is_visible: true,
      sort_order: 0,
    });
    setSelectedCategory(null);
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      slug: category.metadata.slug || generateSlug(category.name),
      description: category.metadata.description || '',
      image_url: category.metadata.image_url || '',
      meta_title: category.metadata.meta_title || '',
      meta_description: category.metadata.meta_description || '',
      is_visible: category.metadata.is_visible !== false,
      sort_order: category.metadata.sort_order || 0,
    });
    setShowEditDialog(true);
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Categories</h1>
            <p className="text-muted-foreground">Manage product categories</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { loadCategories(); loadCategoryMetadata(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FolderTree className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-sm text-muted-foreground">Total Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {categories.filter(c => c.metadata.is_visible !== false).length}
                </p>
                <p className="text-sm text-muted-foreground">Visible</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {categories.reduce((sum, c) => sum + c.productCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ImageIcon className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {categories.filter(c => c.metadata.image_url).length}
                </p>
                <p className="text-sm text-muted-foreground">With Images</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No categories found</p>
              <p className="text-sm">Create your first category to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-center">Products</TableHead>
                  <TableHead className="text-center">Visible</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category, index) => (
                  <TableRow key={category.name}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveCategory(category, 'up')}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveCategory(category, 'down')}
                          disabled={index === filteredCategories.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {category.metadata.image_url ? (
                          <img
                            src={category.metadata.image_url}
                            alt={category.name}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <Tag className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{category.name}</p>
                          {category.metadata.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {category.metadata.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {category.metadata.slug || generateSlug(category.name)}
                      </code>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{category.productCount}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={category.metadata.is_visible !== false}
                        onCheckedChange={() => handleToggleVisibility(category)}
                      />
                    </TableCell>
                    <TableCell>
                      {category.metadata.image_url ? (
                        <Badge variant="outline" className="text-green-600">
                          <ImageIcon className="h-3 w-3 mr-1" />
                          Set
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          None
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(category)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedCategory(category);
                            setNewCategoryName(category.name);
                            setShowRenameDialog(true);
                          }}>
                            <Tag className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleVisibility(category)}>
                            {category.metadata.is_visible !== false ? (
                              <><EyeOff className="h-4 w-4 mr-2" /> Hide</>
                            ) : (
                              <><Eye className="h-4 w-4 mr-2" /> Show</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => navigate(`/admin/products?category=${encodeURIComponent(category.name)}`)}
                          >
                            <Package className="h-4 w-4 mr-2" />
                            View Products
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedCategory(category);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Category Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new product category with optional metadata
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Electronics"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    name: e.target.value,
                    slug: generateSlug(e.target.value),
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  placeholder="electronics"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this category"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image_url">Category Image URL</Label>
              <Input
                id="image_url"
                placeholder="https://..."
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
              />
            </div>
            <div className="border-t pt-4 mt-2">
              <h4 className="font-medium mb-3">SEO Settings</h4>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input
                    id="meta_title"
                    placeholder="Page title for search engines"
                    value={formData.meta_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    placeholder="Description for search engines"
                    value={formData.meta_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                    rows={2}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_visible}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_visible: checked }))}
                />
                <Label>Visible on storefront</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddCategory} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category details and metadata
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Category Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
                {selectedCategory && formData.name !== selectedCategory.name && (
                  <p className="text-xs text-amber-600">
                    Renaming will update {selectedCategory.productCount} products
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-slug">URL Slug</Label>
                <Input
                  id="edit-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-image_url">Category Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                />
                {formData.image_url && (
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="h-10 w-10 rounded object-cover"
                  />
                )}
              </div>
            </div>
            <div className="border-t pt-4 mt-2">
              <h4 className="font-medium mb-3">SEO Settings</h4>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-meta_title">Meta Title</Label>
                  <Input
                    id="edit-meta_title"
                    value={formData.meta_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-meta_description">Meta Description</Label>
                  <Textarea
                    id="edit-meta_description"
                    value={formData.meta_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                    rows={2}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_visible}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_visible: checked }))}
                />
                <Label>Visible on storefront</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEditCategory} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Category Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Category</DialogTitle>
            <DialogDescription>
              Renaming will update all products in this category
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Name</Label>
              <Input value={selectedCategory?.name || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-name">New Name</Label>
              <Input
                id="new-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter new category name"
              />
            </div>
            {selectedCategory && (
              <p className="text-sm text-muted-foreground">
                This will update {selectedCategory.productCount} product(s)
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>Cancel</Button>
            <Button onClick={handleRenameCategory} disabled={saving || !newCategoryName.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              This category contains {selectedCategory?.productCount || 0} products. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <input
                type="radio"
                id="reassign"
                name="deleteAction"
                checked={deleteAction === 'reassign'}
                onChange={() => setDeleteAction('reassign')}
              />
              <Label htmlFor="reassign" className="flex-1">
                Move products to another category
              </Label>
            </div>
            {deleteAction === 'reassign' && (
              <select
                className="w-full p-2 border rounded-md"
                value={reassignCategory}
                onChange={(e) => setReassignCategory(e.target.value)}
              >
                <option value="">Select category...</option>
                {categories
                  .filter(c => c.name !== selectedCategory?.name)
                  .map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))
                }
              </select>
            )}
            <div className="flex items-center gap-3">
              <input
                type="radio"
                id="delete"
                name="deleteAction"
                checked={deleteAction === 'delete'}
                onChange={() => setDeleteAction('delete')}
              />
              <Label htmlFor="delete" className="flex-1 text-destructive">
                Delete all products in this category
              </Label>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              disabled={saving || (deleteAction === 'reassign' && !reassignCategory)}
              className="bg-destructive text-destructive-foreground"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
