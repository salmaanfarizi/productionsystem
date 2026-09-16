#!/bin/bash

###############################################################################
# Deploy Production App Only
###############################################################################

set -e

echo "🔨 Building Production App..."
cd apps/production
npm run build

echo "🚀 Deploying to Netlify..."
# Always name the site so this can never overwrite another app
netlify deploy --prod --dir=dist --site=7c41928c-02f7-4333-a1e1-4cebad3b3062

echo "✅ Production App deployed successfully!"
echo "Visit: https://production.abusalim.sa"
