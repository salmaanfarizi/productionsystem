#!/bin/bash

###############################################################################
# Deploy Inventory App Only (with Stock Outwards)
###############################################################################

set -e

echo "🔨 Building Inventory App..."
cd apps/inventory
npm run build

echo "🚀 Deploying to Netlify..."
netlify deploy --prod --dir=dist

echo "✅ Inventory App deployed successfully!"
echo "Visit: https://inventoryars.netlify.app"
echo ""
echo "⚠️  IMPORTANT:"
echo "   Make sure these environment variables are set in Netlify:"
echo "   - VITE_SPREADSHEET_ID"
echo "   - VITE_GOOGLE_SHEETS_API_KEY (for Stock Outwards sync)"
echo "   - VITE_ARSINV_SPREADSHEET_ID (optional)"
