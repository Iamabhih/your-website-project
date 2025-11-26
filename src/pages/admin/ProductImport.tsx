import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Upload, CheckCircle, XCircle, AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { products, categories } from '@/data/newProductData';

export default function ProductImport() {
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [clearExisting, setClearExisting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleImportClick = () => {
    if (clearExisting) {
      setShowConfirmDialog(true);
    } else {
      performImport();
    }
  };

  const performImport = async () => {
    setImporting(true);
    setResult(null);
    setShowConfirmDialog(false);

    try {
      console.log(`Starting import of ${products.length} products from ${categories.length} categories...`);

      const { data, error } = await supabase.functions.invoke('import-products', {
        body: {
          products: products,
          clearExisting: clearExisting
        }
      });

      if (error) throw error;

      setResult(data);
      toast.success(data.message || 'Products imported successfully!');
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(`Import failed: ${error.message}`);
      setResult({ success: false, error: error.message });
    } finally {
      setImporting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/admin/products')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Import Products</CardTitle>
            <CardDescription>
              Import products from the pre-configured product database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Info box */}
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <h4 className="font-semibold">Import Summary:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><span className="font-medium text-foreground">{products.length}</span> products to import</li>
                <li><span className="font-medium text-foreground">{categories.length}</span> categories</li>
                <li>Stock quantities will default to 0</li>
                <li>Images need to be uploaded separately</li>
              </ul>
            </div>

            {/* Clear existing option */}
            <div className="border rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="clearExisting"
                  checked={clearExisting}
                  onCheckedChange={(checked) => setClearExisting(checked === true)}
                />
                <div className="space-y-1">
                  <Label htmlFor="clearExisting" className="font-medium cursor-pointer">
                    Replace all existing products
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {clearExisting
                      ? "⚠️ WARNING: All existing products will be permanently deleted before import"
                      : "New products will be added alongside existing ones (duplicates may occur)"
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Warning banner when clear is enabled */}
            {clearExisting && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-destructive">Destructive Action</p>
                  <p className="text-destructive/80">
                    This will permanently delete ALL existing products from your store. This action cannot be undone.
                  </p>
                </div>
              </div>
            )}

            <Button
              onClick={handleImportClick}
              disabled={importing}
              className="w-full"
              size="lg"
              variant={clearExisting ? "destructive" : "default"}
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Importing Products...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  {clearExisting ? 'Replace All Products' : 'Add Products'}
                </>
              )}
            </Button>

            {result && (
              <Card className={result.success ? 'border-success' : 'border-red-500'}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    {result.success ? (
                      <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-2 flex-1">
                      <p className="font-semibold">
                        {result.success ? 'Import Successful' : 'Import Failed'}
                      </p>
                      {result.imported && (
                        <p className="text-sm">
                          <span className="font-medium">Imported:</span> {result.imported} products
                        </p>
                      )}
                      {result.errors > 0 && (
                        <p className="text-sm text-destructive">
                          <span className="font-medium">Errors:</span> {result.errors}
                        </p>
                      )}
                      {result.errorDetails && result.errorDetails.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-1">Error details:</p>
                          <ul className="text-xs space-y-1 text-muted-foreground">
                            {result.errorDetails.map((err: string, idx: number) => (
                              <li key={idx}>• {err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {result?.success && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/admin/products')}
              >
                View Imported Products
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog for destructive action */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Destructive Import
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>You are about to <strong>permanently delete ALL existing products</strong> and replace them with {products.length} new products.</p>
              <p className="text-destructive font-medium">This action cannot be undone!</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={performImport}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Replace All Products
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
