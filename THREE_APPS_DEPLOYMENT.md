# Three-App Deployment Guide

Complete guide to deploy all three department applications to Netlify.

## 🎯 Overview

You have three interconnected applications:

| App | Port | Purpose | Color Theme |
|-----|------|---------|-------------|
| **Production** | 3000 | Record daily production & create batches | Green 🏭 |
| **Packing** | 3001 | Record packaging consumption | Blue 📦 |
| **Inventory** | 3002 | Monitor stock levels & analytics | Purple 📊 |

All three apps share the same Google Sheets database and work together in real-time.

---

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ Google Cloud Project with Sheets API enabled
- ✅ API Key and OAuth Client ID
- ✅ GitHub account
- ✅ Netlify account (free tier works)
- ✅ All three apps tested locally

---

## Step 1: Test All Apps Locally

### 1.1 Production App

```bash
cd ~/Documents/productionsystem/apps/production

# Create environment file
cp .env.example .env

# Edit .env with your credentials
open -e .env

# Install dependencies
npm install

# Run the app
npm run dev
```

Open: http://localhost:3000

**Test:** Record a production entry and verify batch is created in Google Sheets.

---

### 1.2 Packing App

```bash
cd ~/Documents/productionsystem/apps/packing

# Create environment file (if not already done)
cp .env.example .env
open -e .env

# Install dependencies
npm install

# Run the app
npm run dev
```

Open: http://localhost:3001

**Test:** Record a packing entry and verify consumption is logged.

---

### 1.3 Inventory App

```bash
cd ~/Documents/productionsystem/apps/inventory

# Create environment file
cp .env.example .env

# Edit .env - NOTE: Inventory only needs API key (no OAuth)
open -e .env

# Install dependencies
npm install

# Run the app
npm run dev
```

Open: http://localhost:3002

**Test:** Verify stock stats and batch lists display correctly.

---

## Step 2: Build All Apps

From the project root:

```bash
cd ~/Documents/productionsystem

# Build all three apps
npm run build:all
```

Or build individually:

```bash
npm run build:production
npm run build:packing
npm run build:inventory
```

**Expected output:**
```
✓ built in X.XXs
dist/index.html
dist/assets/*.css
dist/assets/*.js
```

---

## Step 3: Commit and Push to GitHub

```bash
cd ~/Documents/productionsystem

# Check git status
git status

# Add all new files
git add .

# Commit
git commit -m "Add Production and Inventory apps with complete three-department system"

# Push to your branch
git push origin claude/update-department-structure-011CUM8sPnhDB1DXbRo5uqE4
```

---

## Step 4: Deploy to Netlify (All Three Apps)

You'll create **three separate sites** on Netlify, one for each app.

### 4.1 Deploy Production App

1. **Go to**: https://app.netlify.com/
2. **Click**: "Add new site" → "Import an existing project"
3. **Choose**: GitHub
4. **Select**: `productionsystem` repository
5. **Configure**:
   - **Site name**: `your-company-production` (or any unique name)
   - **Base directory**: `apps/production`
   - **Build command**: `npm run build`
   - **Publish directory**: `apps/production/dist`
6. **Click**: "Deploy site"
7. **Add environment variables**:
   - Go to: Site settings → Environment variables
   - Add:
     ```
     VITE_GOOGLE_SHEETS_API_KEY=your_api_key
     VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
     VITE_SPREADSHEET_ID=1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo
     ```
8. **Trigger redeploy**: Deploys → Trigger deploy → Clear cache and deploy

**Your Production App URL**: `https://your-company-production.netlify.app`

---

### 4.2 Deploy Packing App

1. **Create new site** (repeat steps 1-3 from above)
2. **Configure**:
   - **Site name**: `your-company-packing`
   - **Base directory**: `apps/packing`
   - **Build command**: `npm run build`
   - **Publish directory**: `apps/packing/dist`
3. **Deploy**
4. **Add same environment variables** as Production app
5. **Redeploy**

**Your Packing App URL**: `https://your-company-packing.netlify.app`

---

### 4.3 Deploy Inventory App

1. **Create new site** (repeat steps 1-3 from above)
2. **Configure**:
   - **Site name**: `your-company-inventory`
   - **Base directory**: `apps/inventory`
   - **Build command**: `npm run build`
   - **Publish directory**: `apps/inventory/dist`
3. **Deploy**
4. **Add environment variables** (Inventory only needs two):
   ```
   VITE_GOOGLE_SHEETS_API_KEY=your_api_key
   VITE_SPREADSHEET_ID=1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo
   ```
5. **Redeploy**

**Your Inventory App URL**: `https://your-company-inventory.netlify.app`

---

## Step 5: Update OAuth Authorized Origins

Now that you have three Netlify URLs, add them to Google Cloud:

1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Click** on your OAuth 2.0 Client ID
3. **Add all three Netlify URLs** to "Authorized JavaScript origins":
   ```
   https://your-company-production.netlify.app
   https://your-company-packing.netlify.app
   https://your-company-inventory.netlify.app
   ```
4. **Click "SAVE"**
5. **Wait 5-10 minutes** for changes to propagate

---

## Step 6: Test All Deployed Apps

### Test Production App

1. Open: `https://your-company-production.netlify.app`
2. Sign in with Google
3. Record a production entry:
   - Date: Today
   - Seed Type: T6
   - Size: 100g
   - Weight: 1.5 T
4. Click "Record Production"
5. **Verify** in Google Sheets:
   - "Daily - Jul 2025" has new row
   - "Batch Master" has new/updated batch
   - "Batch Tracking" has log entry

### Test Packing App

1. Open: `https://your-company-packing.netlify.app`
2. Sign in with Google
3. Record a packing entry:
   - Product: Sunflower Seeds
   - Seed Type: T6
   - Size: 100g
   - Bags: 20
4. Click "Record Packaging Entry"
5. **Verify** in Google Sheets:
   - "Packing Consumption" has new row
   - "Batch Master" weights updated
   - "Batch Tracking" has consumption log

### Test Inventory App

1. Open: `https://your-company-inventory.netlify.app`
2. **Check** all stats display correctly:
   - Total Stock shows correct weight
   - Active Batches count is accurate
   - Product Types listed
   - Batch queue shows FIFO order
3. Click "Refresh All" to reload data

---

## Step 7: Custom Domains (Optional)

If you have a custom domain, you can set up subdomains:

```
production.yourcompany.com  → Production App
packing.yourcompany.com     → Packing App
inventory.yourcompany.com   → Inventory App
```

**For each app:**

1. **In Netlify**: Site settings → Domain management → Add custom domain
2. **Add domain**: `production.yourcompany.com`
3. **Configure DNS** as instructed by Netlify
4. **Update OAuth origins** in Google Cloud Console with new domains

---

## 🔄 Data Flow Between Apps

```
┌─────────────────┐
│  Production App │ Records daily production (1.5T of T6-100g)
└────────┬────────┘
         ↓
    [Google Sheets]
    "Batch Master" → Creates BT6-250122-001 (1.5T ACTIVE)
         ↓
┌─────────────────┐
│   Packing App   │ Consumes from batch (0.5T used)
└────────┬────────┘
         ↓
    [Google Sheets]
    "Batch Master" → Updates BT6-250122-001 (1.0T remaining)
    "Packing Consumption" → Logs consumption
         ↓
┌─────────────────┐
│ Inventory App   │ Shows real-time stock: 1.0T remaining
└─────────────────┘
```

---

## 📊 Monitoring & Maintenance

### Daily Workflow

1. **Morning**: Production team records today's production
2. **During day**: Packing team records packaging as it happens
3. **Anytime**: Management checks Inventory app for stock levels

### Weekly Tasks

- Review "Batch History" for completed batches
- Check "Low Stock Alerts" in Inventory app
- Archive old data if needed

### Monthly Tasks

- Review OAuth token usage in Google Cloud Console
- Check Netlify build minutes (free tier: 300 mins/month)
- Update test users if needed

---

## 🐛 Troubleshooting

### App won't load after deployment

**Solution**:
- Check Netlify deploy logs for build errors
- Verify all environment variables are set
- Clear browser cache

### OAuth not working

**Solution**:
- Verify all Netlify URLs are in OAuth authorized origins
- Wait 10 minutes after updating OAuth settings
- Check that you're using correct Client ID

### Data not updating

**Solution**:
- Check Google Sheets API quota in Cloud Console
- Verify spreadsheet is shared correctly
- Check browser console for API errors

### Build fails on Netlify

**Solution**:
- Ensure `base directory` is set correctly
- Check that `package.json` exists in base directory
- Review build logs for specific errors

---

## 💰 Cost Breakdown

### Free Tier (Sufficient for Small Teams)

**Netlify**:
- 3 sites: Free
- 300 build minutes/month: Free
- 100GB bandwidth/month: Free

**Google Cloud**:
- Sheets API: 100 reads/100 secs per user: Free
- OAuth: Unlimited: Free

**Total Monthly Cost**: $0

### If You Exceed Free Tier

**Netlify Pro**: $19/month per site
- Unlimited build minutes
- Better performance
- Team collaboration features

---

## 🎯 Summary

You now have three fully deployed applications:

✅ **Production App** - Records production & creates batches
✅ **Packing App** - Records packaging & consumes batches
✅ **Inventory App** - Monitors stock & provides analytics

All three apps:
- Share the same Google Sheets database
- Update in real-time
- Are independently deployed
- Have their own URLs

**Your URLs**:
- Production: `https://your-company-production.netlify.app`
- Packing: `https://your-company-packing.netlify.app`
- Inventory: `https://your-company-inventory.netlify.app`

---

## 🚀 Next Steps

1. **Share URLs** with your team
2. **Train users** on each app
3. **Monitor usage** for the first week
4. **Gather feedback** and iterate
5. **Consider**: Adding user roles, notifications, reports

---

**Questions?** Check the main `README.md` or `DEPLOYMENT_GUIDE.md` for more details.

**Last Updated**: January 2025
