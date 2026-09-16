#!/bin/bash

###############################################################################
# Deploy Packing App Only
###############################################################################

set -e

echo "🔨 Building Packing App..."
cd apps/packing
npm run build

echo "🚀 Deploying to Netlify..."
# Always name the site so this can never overwrite another app
netlify deploy --prod --dir=dist --site=9b578357-d3d0-407d-b67f-73915dd07396

echo "✅ Packing App deployed successfully!"
echo "Visit: https://packing.abusalim.sa"
