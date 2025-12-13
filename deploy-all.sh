#!/bin/bash

# ==============================================
# ARS Production System - Netlify Deployment Script
# ==============================================
# This script helps deploy all apps to Netlify
#
# Prerequisites:
# 1. Install Netlify CLI: npm install -g netlify-cli
# 2. Login to Netlify: netlify login
# 3. Set environment variables (see below)
#
# Usage:
#   ./deploy-all.sh          # Deploy all apps
#   ./deploy-all.sh build    # Build only (no deploy)
#   ./deploy-all.sh production  # Deploy single app
# ==============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# App list
APPS=("production" "packing" "inventory" "raw-material" "stock-outwards" "cash-reconciliation")

# Check if netlify CLI is installed
check_netlify_cli() {
    if ! command -v netlify &> /dev/null; then
        echo -e "${RED}Error: Netlify CLI is not installed${NC}"
        echo "Install it with: npm install -g netlify-cli"
        echo "Then login with: netlify login"
        exit 1
    fi
}

# Build a single app
build_app() {
    local app=$1
    echo -e "${BLUE}Building ${app}...${NC}"

    cd "apps/${app}"
    npm install
    npm run build
    cd ../..

    echo -e "${GREEN}✓ ${app} built successfully${NC}"
}

# Deploy a single app
deploy_app() {
    local app=$1
    echo -e "${BLUE}Deploying ${app}...${NC}"

    cd "apps/${app}"

    # Check if site is linked
    if [ ! -f ".netlify/state.json" ]; then
        echo -e "${YELLOW}Site not linked. Running netlify init...${NC}"
        echo "Please follow the prompts to create/link a Netlify site for ${app}"
        netlify init
    fi

    # Deploy to production
    netlify deploy --prod --dir=dist

    cd ../..

    echo -e "${GREEN}✓ ${app} deployed successfully${NC}"
}

# Build all apps
build_all() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Building all apps...${NC}"
    echo -e "${BLUE}========================================${NC}"

    # Install root dependencies first
    npm install

    for app in "${APPS[@]}"; do
        build_app "$app"
    done

    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}All apps built successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
}

# Deploy all apps
deploy_all() {
    check_netlify_cli

    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Deploying all apps to Netlify...${NC}"
    echo -e "${BLUE}========================================${NC}"

    for app in "${APPS[@]}"; do
        build_app "$app"
        deploy_app "$app"
        echo ""
    done

    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}All apps deployed successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${YELLOW}IMPORTANT: Don't forget to:${NC}"
    echo "1. Set environment variables for each site in Netlify dashboard"
    echo "2. Add Netlify URLs to Google Cloud Console OAuth origins"
}

# Print environment variables template
print_env_template() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Environment Variables Template${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo "Add these to each Netlify site (Site Settings → Environment Variables):"
    echo ""
    echo "VITE_SPREADSHEET_ID=your_google_spreadsheet_id"
    echo "VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id"
    echo "VITE_GOOGLE_SHEETS_API_KEY=your_google_api_key"
    echo "VITE_GOOGLE_SCRIPT_URL=your_google_apps_script_url  # For stock-outwards"
    echo ""
}

# Main
case "${1:-all}" in
    "build")
        build_all
        ;;
    "env")
        print_env_template
        ;;
    "all")
        deploy_all
        ;;
    *)
        # Check if it's a valid app name
        if [[ " ${APPS[*]} " =~ " ${1} " ]]; then
            check_netlify_cli
            build_app "$1"
            deploy_app "$1"
        else
            echo "Usage: $0 [command|app-name]"
            echo ""
            echo "Commands:"
            echo "  all              Deploy all apps (default)"
            echo "  build            Build all apps without deploying"
            echo "  env              Show environment variables template"
            echo ""
            echo "Or specify an app name to deploy single app:"
            echo "  production, packing, inventory, raw-material, stock-outwards, cash-reconciliation"
            exit 1
        fi
        ;;
esac
