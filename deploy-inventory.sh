#!/bin/bash

###############################################################################
# Deploy Inventory App Only (with Stock Outwards)
###############################################################################

set -e

echo "🔨 Building Inventory App..."
cd apps/inventory
npm run build

echo "🚀 Deploying to Netlify..."
# Always name the site so this can never overwrite another app
netlify deploy --prod --dir=dist --site=df77e9f5-b420-4177-829b-b9fb46aea846

echo "✅ Inventory App deployed successfully!"
echo "Visit: https://inventory.abusalim.sa"
echo ""
echo "⚠️  IMPORTANT:"
echo "   Make sure these environment variables are set in Netlify:"
echo "   - VITE_SPREADSHEET_ID"
echo "   - VITE_GOOGLE_SHEETS_API_KEY (for Stock Outwards sync)"
echo "   - VITE_ARSINV_SPREADSHEET_ID (optional)"
