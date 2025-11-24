/**
 * Sitemap Generator for Ideal Smoke Supply
 *
 * This script generates a sitemap.xml file for SEO purposes.
 * Run with: node scripts/generate-sitemap.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DOMAIN = process.env.SITE_URL || 'https://your-domain.com';
const OUTPUT_PATH = path.join(__dirname, '../public/sitemap.xml');

// Static pages with their priority and change frequency
const staticPages = [
  { url: '/', priority: 1.0, changefreq: 'daily' },
  { url: '/shop', priority: 0.9, changefreq: 'daily' },
  { url: '/delivery', priority: 0.6, changefreq: 'monthly' },
  { url: '/support', priority: 0.6, changefreq: 'monthly' },
];

// Function to format date in W3C format (YYYY-MM-DD)
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Function to generate XML for a URL
function generateUrlXml(urlData) {
  const { url, priority, changefreq, lastmod } = urlData;
  const lastmodDate = lastmod || formatDate(new Date());

  return `  <url>
    <loc>${DOMAIN}${url}</loc>
    <lastmod>${lastmodDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

// Main function to generate sitemap
async function generateSitemap() {
  console.log('Generating sitemap.xml...');

  // Start XML structure
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
`;

  // Add static pages
  staticPages.forEach(page => {
    xml += generateUrlXml(page) + '\n';
  });

  // TODO: Fetch dynamic product pages from Supabase
  // This requires setting up Supabase client here or running via an edge function
  // For now, add a placeholder comment
  xml += `
  <!-- Dynamic product pages -->
  <!-- Add product URLs dynamically by fetching from database -->
  <!-- Example: /product/{product-id} -->
`;

  // Close XML structure
  xml += '</urlset>\n';

  // Write to file
  fs.writeFileSync(OUTPUT_PATH, xml, 'utf8');
  console.log(`✅ Sitemap generated successfully at: ${OUTPUT_PATH}`);
  console.log(`   Total URLs: ${staticPages.length}`);
  console.log(`   Domain: ${DOMAIN}`);
  console.log('');
  console.log('⚠️  Remember to update SITE_URL environment variable with your actual domain');
}

// Run the generator
generateSitemap().catch(error => {
  console.error('❌ Error generating sitemap:', error);
  process.exit(1);
});
