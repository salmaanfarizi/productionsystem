#!/bin/bash

###############################################################################
# Deploy All 3 Apps to Netlify - With Bug Fixes!
###############################################################################

set -e

echo "=========================================="
echo "🚀 DEPLOYING ALL 3 APPS TO NETLIFY"
echo "=========================================="
echo ""

# Get to the project root
cd "$(dirname "$0")"

###############################################################################
# 1. PRODUCTION APP
###############################################################################
echo "📦 [1/3] Deploying Production App..."
echo "----------------------------------------"

cd apps/production

# Link to Netlify site (if not already linked)
netlify link --name productionars || echo "Already linked"

# Build first
npm run build

# Deploy from the correct directory
cd ../../
netlify deploy --prod --dir=apps/production/dist --site=productionars

echo "✅ Production App deployed to: https://productionars.netlify.app"
echo ""

###############################################################################
# 2. PACKING APP (WITH BUG FIXES!)
###############################################################################
echo "📦 [2/3] Deploying Packing App (WITH BUG FIXES!)..."
echo "----------------------------------------"

cd apps/packing

# Link to Netlify site (if not already linked)
netlify link --name packingars || echo "Already linked"

# Build first
npm run build

# Deploy from the correct directory
cd ../../
netlify deploy --prod --dir=apps/packing/dist --site=packingars

echo "✅ Packing App deployed to: https://packingars.netlify.app"
echo "   🐛 Bug fixes included:"
echo "      - WIP Inventory column mapping fixed"
echo "      - Batch Tracking column shift fixed"
echo ""

###############################################################################
# 3. INVENTORY APP
###############################################################################
echo "📦 [3/3] Deploying Inventory App..."
echo "----------------------------------------"

cd apps/inventory

# Link to Netlify site (if not already linked)
netlify link --name inventoryars || echo "Already linked"

# Build first
npm run build

# Deploy from the correct directory
cd ../../
netlify deploy --prod --dir=apps/inventory/dist --site=inventoryars

echo "✅ Inventory App deployed to: https://inventoryars.netlify.app"
echo ""

###############################################################################
# DONE!
###############################################################################
echo "=========================================="
echo "🎉 ALL 3 APPS DEPLOYED SUCCESSFULLY!"
echo "=========================================="
echo ""
echo "Your apps are live at:"
echo "  🏭 Production: https://productionars.netlify.app"
echo "  📦 Packing:    https://packingars.netlify.app"
echo "  📊 Inventory:  https://inventoryars.netlify.app"
echo ""
echo "✨ Bug fixes are now live in Production!"
echo ""
