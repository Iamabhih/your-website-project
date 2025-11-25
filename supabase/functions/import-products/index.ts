import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductRow {
  number: string;
  photo?: string;
  size: string;
  description: string;
  code: string;
  price: string;
}

// Category mapping based on product codes and descriptions
const detectCategory = (code: string, description: string): string => {
  const codeUpper = code.toUpperCase();
  const descUpper = description.toUpperCase();
  
  if (codeUpper.includes('GHSC') || descUpper.includes('SEED')) return 'Seeds';
  if (codeUpper.includes('SNAIL') || descUpper.includes('PAPER')) return 'Papers';
  if (codeUpper.includes('GP') && !codeUpper.includes('GHWP') && !codeUpper.includes('PGWP')) return 'Glass Pipes';
  if (codeUpper.includes('GHWP') || codeUpper.includes('PGWP') || descUpper.includes('BONG')) return 'Glass Bongs';
  if (codeUpper.includes('ASH') && descUpper.includes('CATCHER')) return 'Ash Catchers';
  if (codeUpper.includes('GRWP') || descUpper.includes('RECYCLER')) return 'Recyclers';
  if (codeUpper.includes('GOLB') || descUpper.includes('DAB RIG')) return 'Dab Rigs';
  if (codeUpper.includes('GR') && !codeUpper.includes('GREEN')) return 'Grinders';
  if (codeUpper.includes('SP') && descUpper.includes('SILICONE')) return 'Silicone Pipes';
  if (descUpper.includes('BANNGER') || descUpper.includes('CARB CAP')) return 'Dabbing Accessories';
  if (codeUpper.includes('FGP') || descUpper.includes('FIGURE')) return 'Figure Pipes';
  if (codeUpper.includes('OHT') || descUpper.includes('ONE HITTER')) return 'One Hitters';
  if (descUpper.includes('CHILLUM')) return 'Chillums';
  if (codeUpper.includes('WP') && !codeUpper.includes('GHWP') && !codeUpper.includes('PGWP')) return 'Wood Pipes';
  if (codeUpper.includes('CWP') || descUpper.includes('CERAMIC')) return 'Ceramic Bongs';
  if (codeUpper.includes('AWP') || descUpper.includes('ACRYLIC')) return 'Acrylic Bongs';
  if (descUpper.includes('ASH TRAY')) return 'Ash Trays';
  if (descUpper.includes('SCALE') || descUpper.includes('GRINDER')) return 'Accessories';
  if (descUpper.includes('DOWN PIPE') || descUpper.includes('HEAD')) return 'Down Pipes & Heads';
  if (descUpper.includes('MYLAR') || descUpper.includes('TUBE') || descUpper.includes('JAR')) return 'Packaging';
  
  return 'General';
};

// Parse price - handles multiple prices (e.g., "R88 R150")
const parsePrice = (priceStr: string): number[] => {
  if (!priceStr || priceStr === 'SQ') return [0];
  
  const prices: number[] = [];
  const matches = priceStr.match(/R?\s*(\d+(?:[.,]\d+)?)/g);
  
  if (matches) {
    for (const match of matches) {
      const cleaned = match.replace(/R/g, '').replace(',', '.').trim();
      const price = parseFloat(cleaned);
      if (!isNaN(price)) prices.push(price);
    }
  }
  
  return prices.length > 0 ? prices : [0];
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { products } = await req.json();
    
    console.log(`Starting import of ${products.length} product rows...`);

    const productsToInsert = [];
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    const skippedRows: string[] = [];

    for (const row of products) {
      try {
        // Skip if no code or no description
        if (!row.code || !row.description || row.code.trim() === '' || row.description.trim() === '') {
          skippedRows.push(`Empty row: ${JSON.stringify(row)}`);
          continue;
        }

        // Skip header rows
        if (row.code === 'Code' || row.code === 'code' || row.description === 'Discripton & Colour') {
          skippedRows.push(`Header row: ${row.code}`);
          continue;
        }

        const code = row.code.trim();
        const description = row.description.trim();
        const size = row.size?.trim() || null;
        
        // Detect category
        const category = detectCategory(code, description);
        
        // Parse prices - may have multiple prices for different sizes
        const prices = parsePrice(row.price || '0');
        
        // Handle multiple size/price combinations
        if (size && size.includes(' ')) {
          // Multiple sizes mentioned (e.g., "8cm 10cm")
          const sizes = size.split(/\s+/).filter((s: string) => s.match(/\d+/));
          
          if (sizes.length === prices.length && prices.length > 1) {
            // Create separate product for each size/price combo
            for (let i = 0; i < sizes.length; i++) {
              const variantName = sizes.length > 1 ? `${code} - ${sizes[i]}` : code;
              productsToInsert.push({
                name: `${variantName} - ${description}`.substring(0, 255),
                description: description,
                category: category,
                price: prices[i],
                pack_info: sizes[i],
                min_quantity: 1,
                stock_quantity: 0,
                image_url: null,
              });
              successCount++;
            }
            continue;
          }
        }
        
        // Single product or use first price
        const productName = `${code} - ${description}`.substring(0, 255);
        
        productsToInsert.push({
          name: productName,
          description: description,
          category: category,
          price: prices[0],
          pack_info: size,
          min_quantity: 1,
          stock_quantity: 0,
          image_url: null,
        });
        
        successCount++;

        // Insert in batches of 100
        if (productsToInsert.length >= 100) {
          const { error } = await supabase
            .from('products')
            .insert(productsToInsert);

          if (error) {
            console.error('Batch insert error:', error);
            errors.push(`Batch error: ${error.message}`);
            errorCount += productsToInsert.length;
            successCount -= productsToInsert.length;
          } else {
            console.log(`Inserted batch of ${productsToInsert.length} products`);
          }

          productsToInsert.length = 0; // Clear array
        }

      } catch (err) {
        console.error(`Error processing row:`, err);
        const errorMsg = err instanceof Error ? err.message : String(err);
        errors.push(`${row.code}: ${errorMsg}`);
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
      } else {
        console.log(`Inserted final batch of ${productsToInsert.length} products`);
      }
    }

    console.log(`Import complete: ${successCount} successful, ${errorCount} errors, ${skippedRows.length} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        imported: successCount,
        errors: errorCount,
        skipped: skippedRows.length,
        errorDetails: errors.slice(0, 20),
        skippedDetails: skippedRows.slice(0, 10),
        message: `Successfully imported ${successCount} products. ${errorCount} errors, ${skippedRows.length} rows skipped.`
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
