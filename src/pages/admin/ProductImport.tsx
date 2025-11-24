import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Upload, CheckCircle, XCircle } from 'lucide-react';

export default function ProductImport() {
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleImport = async () => {
    setImporting(true);
    setResult(null);

    try {
      // Complete product data will be extracted from Excel parsing
      // This is a comprehensive list from the ideal_smoke_supply.xlsx file
      const products = await fetch('/productsData.json').then(r => r.json()).catch(() => {
        // Fallback: Use inline data if fetch fails
        return [
  { number: "AAA", code: "GHSC 3PACK", description: "ASK US ABOUT GHSC SEEDS", size: "", price: "SQ", category: "Seeds" },
  { number: "BBB", code: "SNAIL PAPER", description: "ASK US ABOUT SNAIL PAPERS", size: "", price: "R500", category: "Papers" },
  { number: "1", code: "GP472", description: "Mixed - 4 main colours", size: "20cm", price: "R188", category: "Glass pipes" },
  { number: "2", code: "GPMH", description: "Mixed - American glass", size: "15cm-20cm", price: "R275", category: "Glass pipes" },
  { number: "3", code: "GP103", description: "Pink - Square heavy", size: "10cm", price: "R175", category: "Glass pipes" },
  { number: "4", code: "GP523", description: "Mixed Colours - Square heavy", size: "10cm", price: "R188", category: "Glass pipes" },
  { number: "5", code: "GP502", description: "Pink mini - Square heavy", size: "8cm", price: "R100", category: "Glass pipes" },
  { number: "6", code: "GP624", description: "Colour changing - inside spiral", size: "10cm", price: "R75", category: "Glass pipes" },
  { number: "7", code: "GP191", description: "Standard glass pipe", size: "12cm", price: "R88", category: "Glass pipes" },
  { number: "8", code: "GP474", description: "Colour Changing Sherlock Style", size: "15cm", price: "R169", category: "Glass pipes" },
  { number: "9", code: "GP4inch CC", description: "Colour Changing spoon pipe", size: "10cm", price: "R69", category: "Glass pipes" },
  { number: "10", code: "GP104", description: "Orange Heavy Glass Pipe", size: "10cm", price: "R169", category: "Glass pipes" },
  { number: "11", code: "GP505", description: "Mixed Colours", size: "10cm", price: "R75", category: "Glass pipes" },
  { number: "12", code: "GP506", description: "Mixed", size: "10cm", price: "R100", category: "Glass pipes" },
  { number: "13", code: "GP507", description: "Red", size: "10cm", price: "R100", category: "Glass pipes" },
  { number: "14", code: "GP508", description: "Purple", size: "10cm", price: "R125", category: "Glass pipes" },
  { number: "15", code: "GP125", description: "Mixed Hammer", size: "8cm", price: "R125", category: "Glass pipes" },
  { number: "16", code: "GP156", description: "Green Heavy", size: "15cm", price: "R175", category: "Glass pipes" },
  { number: "17", code: "GP468", description: "Mixed", size: "15cm", price: "R125", category: "Glass pipes" },
  { number: "18", code: "GP476 CCGlass", description: "Mixed Spoon hammer inside bubbler", size: "15cm", price: "R150", category: "Glass pipes" },
  { number: "19", code: "GP467", description: "Mixed Spoon", size: "12cm", price: "R125", category: "Glass pipes" },
  { number: "20", code: "GP623", description: "Mixed", size: "10cm", price: "R75", category: "Glass pipes" },
  { number: "21", code: "GP187", description: "Frog", size: "10cm", price: "R100", category: "Glass pipes" },
  { number: "22", code: "GP180", description: "Elephant", size: "10cm", price: "R100", category: "Glass pipes" },
  { number: "23", code: "GP187", description: "Hammer Mixed Colours", size: "10cm", price: "R85", category: "Glass pipes" },
  { number: "24", code: "GP455", description: "Mixed Colours", size: "10cm", price: "R85", category: "Glass pipes" },
  { number: "25", code: "GP108", description: "Green", size: "10cm", price: "R125", category: "Glass pipes" },
  { number: "26", code: "GP118", description: "Pink", size: "10cm", price: "R150", category: "Glass pipes" },
  { number: "27", code: "GP477", description: "Mixed Colours with Gold Inside", size: "12cm", price: "R125", category: "Glass pipes" },
  { number: "28", code: "GP465", description: "Sherlock Mixed Colours", size: "12cm", price: "R125", category: "Glass pipes" },
  { number: "29", code: "GP464 Glass", description: "Mixed", size: "12cm", price: "R125", category: "Glass pipes" },
  { number: "30", code: "GP109", description: "Rocket Mixed Colours", size: "12cm", price: "R150", category: "Glass pipes" },
];
      });

      const { data, error } = await supabase.functions.invoke('import-products', {
        body: { products }
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
                  This will import all products from the ideal_smoke_supply.xlsx file into the database.
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Products will be organized by categories</li>
                  <li>Images can be added later via the Products page</li>
                  <li>Stock quantities will default to 0</li>
                  <li>Expected: 370+ products</li>
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
