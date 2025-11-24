import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductData {
  number: string;
  size: string;
  description: string;
  code: string;
  price: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { products } = await req.json();
    
    console.log(`Starting import of ${products.length} products...`);

    const productsToInsert = [];
    let currentCategory = 'General';
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const product of products) {
      try {
        // Skip empty rows or headers
        if (!product.code || !product.description) {
          continue;
        }

        // Check if this is a category header (usually all caps, no price)
        if (!product.price && product.description.length > 0) {
          currentCategory = product.description.trim();
          console.log(`Found category: ${currentCategory}`);
          continue;
        }

        // Parse price
        let price = 0;
        if (product.price && product.price !== 'SQ') {
          const priceStr = product.price.replace('R', '').replace(',', '').trim();
          price = parseFloat(priceStr);
          if (isNaN(price)) {
            console.warn(`Invalid price for ${product.code}: ${product.price}`);
            price = 0;
          }
        }

        // Create product name
        const name = product.code ? 
          `${product.code} - ${product.description}`.substring(0, 255) : 
          product.description.substring(0, 255);

        productsToInsert.push({
          name: name.trim(),
          description: product.description.trim(),
          category: currentCategory,
          price: price,
          pack_info: product.size || null,
          min_quantity: 1,
          stock_quantity: 0,
          image_url: null,
        });

        successCount++;

        // Insert in batches of 50
        if (productsToInsert.length >= 50) {
          const { error } = await supabase
            .from('products')
            .insert(productsToInsert);

          if (error) {
            console.error('Batch insert error:', error);
            errors.push(`Batch error: ${error.message}`);
            errorCount += productsToInsert.length;
          }

          productsToInsert.length = 0; // Clear array
        }

      } catch (err) {
        console.error(`Error processing product ${product.code}:`, err);
        const errorMsg = err instanceof Error ? err.message : String(err);
        errors.push(`${product.code}: ${errorMsg}`);
        errorCount++;
      }
    }

    // Insert remaining products
    if (productsToInsert.length > 0) {
      const { error } = await supabase
        .from('products')
        .insert(productsToInsert);

      if (error) {
        console.error('Final batch insert error:', error);
        errors.push(`Final batch error: ${error.message}`);
        errorCount += productsToInsert.length;
        successCount -= productsToInsert.length;
      }
    }

    console.log(`Import complete: ${successCount} successful, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        imported: successCount,
        errors: errorCount,
        errorDetails: errors.slice(0, 10), // First 10 errors
        message: `Successfully imported ${successCount} products. ${errorCount} errors.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Import function error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
