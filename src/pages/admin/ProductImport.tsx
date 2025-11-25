import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Upload, CheckCircle, XCircle } from 'lucide-react';
import { products, categories } from '@/data/newProductData';

export default function ProductImport() {
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleImport = async () => {
    setImporting(true);
    setResult(null);

    try {
      console.log(`Starting import of ${products.length} products from ${categories.length} categories...`);

      const { data, error } = await supabase.functions.invoke('import-products', {
        body: { 
          products: products,
          clearExisting: true  // Clear all existing products before import
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
      <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Import Products from Excel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-muted-foreground">
                <p className="mb-4">
                  This will replace all existing products with the new product database.
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>All existing products will be deleted</li>
                  <li>{products.length} new products across {categories.length} categories will be imported</li>
                  <li>Images will need to be uploaded separately to the product-images storage bucket</li>
                  <li>Stock quantities will default to 0</li>
                </ul>
              </div>

              <Button 
                onClick={handleImport} 
                disabled={importing}
                className="w-full"
                size="lg"
              >
                <Upload className="mr-2 h-5 w-5" />
                {importing ? 'Importing Products...' : 'Start Import'}
              </Button>

              {result && (
                <Card className={result.success ? 'border-green-500' : 'border-red-500'}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      {result.success ? (
                        <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
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
    </AdminLayout>
  );
}
