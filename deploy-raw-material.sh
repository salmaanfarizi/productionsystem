#!/bin/bash

# Deploy Raw Material App to Netlify
# This script builds and deploys the Raw Material Management application

echo "🚀 Deploying Raw Material App to Netlify..."
echo ""

# Navigate to raw-material app directory
cd apps/raw-material

# Check if .env file exists
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found!"
  echo "Please create a .env file based on .env.example"
  echo ""
  echo "Required variables:"
  echo "  - VITE_GOOGLE_CLIENT_ID"
  echo "  - VITE_SHEET_ID"
  exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Build the application
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "📤 Ready to deploy to Netlify"
echo ""
echo "Deployment options:"
echo "  1. Manual: Upload the 'dist' folder via Netlify web UI"
echo "  2. CLI: Run 'netlify deploy --prod --dir=dist --site=f96c7f59-e48e-4bcc-95d9-cc4294f42b4d' (requires Netlify CLI)"
echo ""
echo "Build output location: apps/raw-material/dist"
