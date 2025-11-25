import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { logError, logInfo } from '../_shared/logger.ts';

interface ProductData {
  id: number;
  category: string;
  size: string;
  description: string;
  code: string;
  price: number;
  priceDisplay: string;
  image: string;
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { products, clearExisting = false } = await req.json();

    if (!products || !Array.isArray(products)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid products data' }),
        { headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    await logInfo('import-products', 'Starting product import', {
      totalProducts: products.length,
      clearExisting
    });

    // Clear existing products if requested
    if (clearExisting) {
      await logInfo('import-products', 'Clearing existing products');
      
      // Delete in correct order due to foreign key constraints
      const { error: variantsError } = await supabase.from('product_variants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (variantsError) await logError('import-products', 'Failed to delete product variants', variantsError);

      const { error: imagesError } = await supabase.from('product_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (imagesError) await logError('import-products', 'Failed to delete product images', imagesError);

      const { error: productsError } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (productsError) {
        await logError('import-products', 'Failed to delete products', productsError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to clear existing products', details: productsError.message }),
          { headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      await logInfo('import-products', 'Successfully cleared existing products');
    }

    let imported = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    // Process products in batches
    const batchSize = 50;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const productsToInsert = batch.map((product: ProductData) => ({
        name: `${product.code} - ${product.description}`,
        category: product.category,
        description: product.description,
        price: product.price,
        pack_info: product.size,
        image_url: product.image ? `/images/${product.image}` : null,
        stock_quantity: 0,
        min_quantity: 1,
        has_variants: false
      }));

      const { data, error } = await supabase
        .from('products')
        .insert(productsToInsert)
        .select();

      if (error) {
        await logError('import-products', `Batch ${i / batchSize + 1} failed`, error, { batchSize: batch.length });
        errors += batch.length;
        errorDetails.push(`Batch ${i / batchSize + 1}: ${error.message}`);
      } else {
        imported += data?.length || 0;
        await logInfo('import-products', `Batch ${i / batchSize + 1} completed`, { imported: data?.length });
      }
    }

    const result = {
      success: errors === 0,
      message: `Import completed: ${imported} products imported${errors > 0 ? `, ${errors} errors` : ''}`,
      imported,
      errors,
      errorDetails: errorDetails.length > 0 ? errorDetails : undefined
    };

    await logInfo('import-products', 'Import completed', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logError('import-products', 'Unexpected error', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
