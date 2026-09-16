#!/bin/bash

###############################################################################
# Deploy All Apps to Netlify
# This script builds and deploys all four apps (Production, Packing, Inventory, Raw Material)
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  ${1}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    print_error "Netlify CLI not found!"
    print_info "Install it with: npm install -g netlify-cli"
    exit 1
fi

# Check if logged in to Netlify
print_info "Checking Netlify authentication..."
if ! netlify status &> /dev/null; then
    print_warning "Not logged in to Netlify"
    print_info "Logging in..."
    netlify login
fi

print_success "Netlify authentication verified"

# Get project root
PROJECT_ROOT=$(pwd)

###############################################################################
# BUILD PHASE
###############################################################################

print_header "🔨 BUILDING ALL APPS"

print_info "Building Production App..."
cd "${PROJECT_ROOT}/apps/production"
npm run build
print_success "Production App built successfully"

print_info "Building Packing App..."
cd "${PROJECT_ROOT}/apps/packing"
npm run build
print_success "Packing App built successfully"

print_info "Building Inventory App..."
cd "${PROJECT_ROOT}/apps/inventory"
npm run build
print_success "Inventory App built successfully"

print_info "Building Raw Material App..."
cd "${PROJECT_ROOT}/apps/raw-material"
npm run build
print_success "Raw Material App built successfully"

###############################################################################
# DEPLOY PHASE
###############################################################################

print_header "🚀 DEPLOYING ALL APPS TO NETLIFY"

# Deploy Production App
print_info "Deploying Production App..."
cd "${PROJECT_ROOT}/apps/production"
netlify deploy --prod --dir=dist --site=7c41928c-02f7-4333-a1e1-4cebad3b3062
PRODUCTION_URL="https://production.abusalim.sa"
print_success "Production App deployed!"

# Deploy Packing App
print_info "Deploying Packing App..."
cd "${PROJECT_ROOT}/apps/packing"
netlify deploy --prod --dir=dist --site=9b578357-d3d0-407d-b67f-73915dd07396
PACKING_URL="https://packing.abusalim.sa"
print_success "Packing App deployed!"

# Deploy Inventory App
print_info "Deploying Inventory App..."
cd "${PROJECT_ROOT}/apps/inventory"
netlify deploy --prod --dir=dist --site=df77e9f5-b420-4177-829b-b9fb46aea846
INVENTORY_URL="https://inventory.abusalim.sa"
print_success "Inventory App deployed!"

# Deploy Raw Material App
print_info "Deploying Raw Material App..."
cd "${PROJECT_ROOT}/apps/raw-material"
netlify deploy --prod --dir=dist --site=f96c7f59-e48e-4bcc-95d9-cc4294f42b4d
RAW_MATERIAL_URL="https://raw.abusalim.sa"
print_success "Raw Material App deployed!"

###############################################################################
# SUMMARY
###############################################################################

print_header "✅ DEPLOYMENT COMPLETE"

echo -e "${GREEN}All four apps have been successfully deployed!${NC}\n"
echo -e "📱 ${BLUE}Production App:${NC}"
echo -e "   ${PRODUCTION_URL:-Check Netlify dashboard}\n"
echo -e "📦 ${BLUE}Packing App:${NC}"
echo -e "   ${PACKING_URL:-Check Netlify dashboard}\n"
echo -e "📊 ${BLUE}Inventory App:${NC}"
echo -e "   ${INVENTORY_URL:-Check Netlify dashboard}\n"
echo -e "🏭 ${BLUE}Raw Material App:${NC}"
echo -e "   ${RAW_MATERIAL_URL:-Check Netlify dashboard}\n"

print_warning "Next Steps:"
echo "  1. Verify environment variables are set in Netlify"
echo "  2. Check that Stock Outwards sync button appears (Inventory app)"
echo "  3. Test each app functionality"
echo ""
print_info "For setup details, see: NETLIFY_DEPLOYMENT_GUIDE.md"

cd "${PROJECT_ROOT}"
