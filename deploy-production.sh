#!/bin/bash

###############################################################################
# Deploy Production App Only
###############################################################################

set -e

echo "🔨 Building Production App..."
cd apps/production
npm run build

echo "🚀 Deploying to Netlify..."
netlify deploy --prod --dir=dist

echo "✅ Production App deployed successfully!"
echo "Visit: https://productionars.netlify.app"
