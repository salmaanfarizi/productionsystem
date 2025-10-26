# Complete Netlify Deployment Guide
## Production System - All Three Apps

This guide covers deploying all three apps (Production, Packing, Inventory) to Netlify.

---

## 📋 Prerequisites

1. **Netlify Account**: Sign up at https://netlify.com
2. **Netlify CLI** (optional but recommended):
   ```bash
   npm install -g netlify-cli
   netlify login
   ```
3. **Google Sheets API Key** (for Inventory app sync):
   - Get from: https://console.cloud.google.com/
4. **Google Apps Script** updated with latest code

---

## 🚀 Quick Deploy (Automated)

### Option 1: Using Deploy Script (Recommended)

```bash
# Make the script executable
chmod +x deploy-all-apps.sh

# Deploy all three apps
./deploy-all-apps.sh
```

### Option 2: Using Netlify CLI (Individual Apps)

```bash
# Production App
cd apps/production
netlify deploy --prod --dir=dist

# Packing App
cd apps/packing
netlify deploy --prod --dir=dist

# Inventory App
cd apps/inventory
netlify deploy --prod --dir=dist
```

### Option 3: Git Push (Auto-Deploy)

If you've linked your GitHub repo to Netlify:
```bash
git push origin main
```

Netlify will automatically build and deploy all three apps.

---

## 🌐 Netlify Sites Setup

You need to create **3 separate Netlify sites** (one for each app):

### 1. Production App
- **Site Name**: `productionars` (or your choice)
- **Domain**: `productionars.netlify.app`
- **Build Settings**:
  - Base directory: `apps/production`
  - Build command: `npm run build`
  - Publish directory: `apps/production/dist`

### 2. Packing App
- **Site Name**: `packingars` (or your choice)
- **Domain**: `packingars.netlify.app`
- **Build Settings**:
  - Base directory: `apps/packing`
  - Build command: `npm run build`
  - Publish directory: `apps/packing/dist`

### 3. Inventory App
- **Site Name**: `inventoryars` (or your choice)
- **Domain**: `inventoryars.netlify.app`
- **Build Settings**:
  - Base directory: `apps/inventory`
  - Build command: `npm run build`
  - Publish directory: `apps/inventory/dist`

---

## ⚙️ Environment Variables Setup

### Production App Environment Variables

Navigate to: **Netlify Dashboard → Production Site → Site Settings → Environment Variables**

```bash
VITE_SPREADSHEET_ID=your-production-spreadsheet-id-here
```

### Packing App Environment Variables

Navigate to: **Netlify Dashboard → Packing Site → Site Settings → Environment Variables**

```bash
VITE_SPREADSHEET_ID=your-production-spreadsheet-id-here
```

### Inventory App Environment Variables (MOST IMPORTANT!)

Navigate to: **Netlify Dashboard → Inventory Site → Site Settings → Environment Variables**

```bash
# Required - Your main production spreadsheet
VITE_SPREADSHEET_ID=your-production-spreadsheet-id-here

# Required for Stock Outwards Sync with Arsinv
VITE_GOOGLE_SHEETS_API_KEY=your-google-api-key-here

# Optional - Arsinv spreadsheet (defaults to salmaanfarizi's)
VITE_ARSINV_SPREADSHEET_ID=1o3rmIC2mSUAS-0d0-w62mDDHGzJznHf9qEjcHoyZEX0
```

⚠️ **CRITICAL**: Without `VITE_GOOGLE_SHEETS_API_KEY`, the "Sync Salesman Data" button won't appear!

---

## 🔑 Getting Google Sheets API Key

### Step-by-Step:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create/Select Project**
   - Create a new project or select existing
   - Name it: "ARS Production System"

3. **Enable Google Sheets API**
   - Navigation Menu → APIs & Services → Library
   - Search for: "Google Sheets API"
   - Click "Enable"

4. **Create API Key**
   - Navigation Menu → APIs & Services → Credentials
   - Click "Create Credentials" → "API Key"
   - Copy the generated key (starts with `AIza...`)

5. **Restrict the API Key (Recommended)**
   - Click "Edit API Key"
   - Application restrictions → HTTP referrers
   - Add your Netlify domains:
     ```
     https://inventoryars.netlify.app/*
     https://packingars.netlify.app/*
     https://productionars.netlify.app/*
     ```
   - API restrictions → Restrict key → Select "Google Sheets API"
   - Save

6. **Add to Netlify**
   - Copy the API key
   - Go to Netlify → Inventory Site → Environment Variables
   - Add: `VITE_GOOGLE_SHEETS_API_KEY` = `your-api-key-here`

---

## 📝 Step-by-Step Deployment (First Time)

### Step 1: Create Netlify Sites

**Option A: Via Netlify CLI**

```bash
# Login to Netlify
netlify login

# Create Production site
cd apps/production
netlify init
# Follow prompts, select "Create & configure a new site"
# Team: Your team
# Site name: productionars
# Build command: npm run build
# Publish directory: dist

# Create Packing site
cd ../packing
netlify init
# Site name: packingars

# Create Inventory site
cd ../inventory
netlify init
# Site name: inventoryars
```

**Option B: Via Netlify Web UI**

1. Go to https://app.netlify.com/
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub → Select your repository
4. Configure settings:
   - Branch: `main` (or `claude/connect-repositories-011CUUhbw5nsPAN2dfftv2Ta`)
   - Base directory: `apps/production`
   - Build command: `npm run build`
   - Publish directory: `apps/production/dist`
5. Repeat for packing and inventory apps

### Step 2: Configure Environment Variables

For each site, add the environment variables listed above.

### Step 3: Update Google Apps Script

**IMPORTANT**: Do this BEFORE first deploy!

1. Open your Google Spreadsheet
2. Extensions → Apps Script
3. Copy the updated `BatchTracking.js` code
4. Run: `initializeSheets()`
5. Grant permissions when prompted

This creates/updates:
- Production Data
- WIP Inventory
- Batch Tracking
- Packing Transfers
- Finished Goods Inventory
- **Stock Outwards** (with Category & Source columns)

### Step 4: Build Locally (Test)

```bash
# From project root
npm run build:all

# Or build individually
npm run build:production
npm run build:packing
npm run build:inventory
```

Check for any build errors.

### Step 5: Deploy to Netlify

```bash
# Deploy all apps using the script
./deploy-all-apps.sh

# Or manually deploy each
cd apps/production && netlify deploy --prod --dir=dist
cd apps/packing && netlify deploy --prod --dir=dist
cd apps/inventory && netlify deploy --prod --dir=dist
```

### Step 6: Verify Deployment

Visit each site:
- https://productionars.netlify.app
- https://packingars.netlify.app
- https://inventoryars.netlify.app

Check:
- ✅ Apps load correctly
- ✅ Can connect to Google Sheets
- ✅ Stock Outwards tab appears (Inventory)
- ✅ "Sync Salesman Data" button appears (if API key set)

---

## 🔄 Continuous Deployment (Auto-Deploy)

### Setup GitHub Integration

1. **Connect Repository to Netlify**
   - Netlify Dashboard → Site Settings → Build & Deploy
   - Link your GitHub repository

2. **Configure Build Settings**
   - Production Site:
     ```
     Base directory: apps/production
     Build command: npm run build
     Publish directory: apps/production/dist
     ```
   - Packing Site:
     ```
     Base directory: apps/packing
     Build command: npm run build
     Publish directory: apps/packing/dist
     ```
   - Inventory Site:
     ```
     Base directory: apps/inventory
     Build command: npm run build
     Publish directory: apps/inventory/dist
     ```

3. **Deploy Branch**
   - Set production branch: `main`
   - Or use your feature branch temporarily

4. **Auto-Deploy**
   - Every push to the branch triggers automatic deployment
   - Netlify builds and deploys automatically

---

## 🎯 Deploy Workflows

### Workflow 1: Feature Branch Deploy

```bash
# Merge feature branch to main
git checkout main
git merge claude/connect-repositories-011CUUhbw5nsPAN2dfftv2Ta
git push origin main

# Netlify auto-deploys all three apps
```

### Workflow 2: Manual Deploy

```bash
# Build all apps
npm run build:all

# Deploy manually
./deploy-all-apps.sh
```

### Workflow 3: Deploy Single App

```bash
# Only deploy inventory app (with new Stock Outwards)
cd apps/inventory
npm run build
netlify deploy --prod --dir=dist
```

---

## 🐛 Troubleshooting

### Build Fails

**Error**: `Cannot find module '@shared/...'`

**Solution**: Ensure all dependencies are installed:
```bash
npm install
```

### Environment Variables Not Working

**Issue**: Changes not reflected after adding env vars

**Solution**:
1. Clear build cache: Netlify Dashboard → Deploys → Clear cache
2. Trigger new deploy

### Stock Outwards Sync Button Missing

**Issue**: Button doesn't appear in Inventory app

**Solution**:
1. Check `VITE_GOOGLE_SHEETS_API_KEY` is set in Netlify env vars
2. Redeploy the site
3. Hard refresh browser (Ctrl+Shift+R)

### Google Sheets API Error

**Error**: "Failed to fetch arsinv data"

**Solutions**:
1. Verify API key is correct
2. Check Google Sheets API is enabled
3. Verify arsinv spreadsheet is accessible
4. Check API key restrictions allow your domain

### Deploy Takes Too Long

**Issue**: Build/deploy is slow

**Solution**:
1. Check Node version (should be 18)
2. Enable "Pretty URLs" in Netlify settings
3. Use build cache

---

## 📊 Post-Deployment Checklist

After deploying all three apps:

### Production App
- [ ] App loads successfully
- [ ] Can submit production data
- [ ] Batch creation works
- [ ] Data appears in Google Sheets
- [ ] WIP batches are generated

### Packing App
- [ ] App loads successfully
- [ ] WIP batches appear in dropdown
- [ ] Can record packing transfers
- [ ] Low stock alerts work
- [ ] Batch labels generate correctly

### Inventory App
- [ ] App loads successfully
- [ ] Finished Goods tab shows data
- [ ] WIP Inventory tab shows data
- [ ] **Stock Outwards tab appears**
- [ ] **"Sync Salesman Data" button visible** (if API key set)
- [ ] Can sync arsinv data
- [ ] Can add manual outwards
- [ ] Category filters work
- [ ] Transaction history displays

---

## 🔐 Security Best Practices

1. **Restrict API Keys**
   - Add domain restrictions to Google Sheets API key
   - Only allow your Netlify domains

2. **Environment Variables**
   - Never commit .env files to git
   - Keep API keys secret
   - Use Netlify's encrypted env vars

3. **Spreadsheet Permissions**
   - Set appropriate Google Sheets sharing permissions
   - Use service accounts for production

4. **HTTPS**
   - Netlify provides free HTTPS automatically
   - All sites use https://

---

## 📞 Support & Resources

- **Netlify Docs**: https://docs.netlify.com/
- **Stock Outwards Setup**: See `STOCK_OUTWARDS_SETUP.md`
- **Google Sheets API**: https://developers.google.com/sheets/api
- **Arsinv Repository**: https://github.com/salmaanfarizi/arsinv

---

## 🎉 Success!

Once deployed, your URLs will be:
- **Production**: https://productionars.netlify.app
- **Packing**: https://packingars.netlify.app
- **Inventory**: https://inventoryars.netlify.app

All three apps are now connected and syncing data!

---

**Version**: 1.0
**Last Updated**: October 26, 2025
**Branch**: claude/connect-repositories-011CUUhbw5nsPAN2dfftv2Ta
