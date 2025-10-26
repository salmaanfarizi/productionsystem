#!/bin/bash

###############################################################################
# Deploy Packing App Only
###############################################################################

set -e

echo "🔨 Building Packing App..."
cd apps/packing
npm run build

echo "🚀 Deploying to Netlify..."
netlify deploy --prod --dir=dist

echo "✅ Packing App deployed successfully!"
echo "Visit: https://packingars.netlify.app"
