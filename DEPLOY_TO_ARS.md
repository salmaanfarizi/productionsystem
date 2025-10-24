# Deploy to ARS Custom URLs

Guide to deploy all three apps to your custom Netlify site names.

---

## 🎯 Target URLs

You will deploy to these three specific URLs:

| App | Target URL | Base Directory |
|-----|------------|----------------|
| **Production** | https://productionars.netlify.app | `apps/production` |
| **Packing** | https://packingars.netlify.app | `apps/packing` |
| **Inventory** | https://inventoryars.netlify.app | `apps/inventory` |

---

## 🚀 Deployment Steps

### Option 1: Netlify UI (Recommended)

#### Deploy Production App

1. **Go to**: https://app.netlify.com/
2. **Click**: "Add new site" → "Import an existing project"
3. **Choose**: GitHub
4. **Select**: Your `productionsystem` repository
5. **Configure Site**:
   - **Site name**: `productionars` (This creates productionars.netlify.app)
   - **Base directory**: `apps/production`
   - **Build command**: `npm run build`
   - **Publish directory**: `apps/production/dist`
   - **Branch to deploy**: `main` (or your current branch)
6. **Click**: "Deploy site"
7. **Add Environment Variables**:
   - Go to: Site settings → Environment variables
   - Click "Add a variable" and add:
   ```
   VITE_GOOGLE_SHEETS_API_KEY = your_api_key_here
   VITE_GOOGLE_CLIENT_ID = your_client_id.apps.googleusercontent.com
   VITE_SPREADSHEET_ID = your_spreadsheet_id_here
   ```
8. **Trigger Redeploy**: Deploys → Trigger deploy → Clear cache and deploy site

✅ **Result**: https://productionars.netlify.app

---

#### Deploy Packing App

1. **Repeat steps 1-4** above
2. **Configure Site**:
   - **Site name**: `packingars`
   - **Base directory**: `apps/packing`
   - **Build command**: `npm run build`
   - **Publish directory**: `apps/packing/dist`
   - **Branch to deploy**: `main` (or your current branch)
3. **Deploy**
4. **Add Environment Variables** (same as Production app):
   ```
   VITE_GOOGLE_SHEETS_API_KEY = your_api_key_here
   VITE_GOOGLE_CLIENT_ID = your_client_id.apps.googleusercontent.com
   VITE_SPREADSHEET_ID = your_spreadsheet_id_here
   ```
5. **Trigger Redeploy**

✅ **Result**: https://packingars.netlify.app

---

#### Deploy Inventory App

1. **Repeat steps 1-4** above
2. **Configure Site**:
   - **Site name**: `inventoryars`
   - **Base directory**: `apps/inventory`
   - **Build command**: `npm run build`
   - **Publish directory**: `apps/inventory/dist`
   - **Branch to deploy**: `main` (or your current branch)
3. **Deploy**
4. **Add Environment Variables** (Inventory only needs 2):
   ```
   VITE_GOOGLE_SHEETS_API_KEY = your_api_key_here
   VITE_SPREADSHEET_ID = your_spreadsheet_id_here
   ```
   ⚠️ **Note**: Inventory app does NOT need `VITE_GOOGLE_CLIENT_ID` (it's read-only)
5. **Trigger Redeploy**

✅ **Result**: https://inventoryars.netlify.app

---

### Option 2: Netlify CLI (Advanced)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy Production App
cd apps/production
netlify init
# When prompted:
# - Create & configure new site
# - Team: [Select your team]
# - Site name: productionars
# - Build command: npm run build
# - Directory to deploy: dist

netlify env:set VITE_GOOGLE_SHEETS_API_KEY "your_api_key"
netlify env:set VITE_GOOGLE_CLIENT_ID "your_client_id"
netlify env:set VITE_SPREADSHEET_ID "your_spreadsheet_id"
netlify deploy --prod

# Deploy Packing App
cd ../packing
netlify init
# Site name: packingars
netlify env:set VITE_GOOGLE_SHEETS_API_KEY "your_api_key"
netlify env:set VITE_GOOGLE_CLIENT_ID "your_client_id"
netlify env:set VITE_SPREADSHEET_ID "your_spreadsheet_id"
netlify deploy --prod

# Deploy Inventory App
cd ../inventory
netlify init
# Site name: inventoryars
netlify env:set VITE_GOOGLE_SHEETS_API_KEY "your_api_key"
netlify env:set VITE_SPREADSHEET_ID "your_spreadsheet_id"
netlify deploy --prod
```

---

## 🔐 Update Google OAuth Authorized Origins

After all three apps are deployed, update Google Cloud OAuth:

1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Click** on your OAuth 2.0 Client ID
3. **Under "Authorized JavaScript origins"**, add all three URLs:
   ```
   https://productionars.netlify.app
   https://packingars.netlify.app
   https://inventoryars.netlify.app
   ```
4. **Optionally add** (for local development):
   ```
   http://localhost:3000
   http://localhost:3001
   http://localhost:3002
   ```
5. **Click** "SAVE"
6. **Wait** 5-10 minutes for changes to propagate globally

⚠️ **Important**: Without this step, Production and Packing apps won't be able to authenticate!

---

## ⚙️ Environment Variables Reference

### For Production App (productionars.netlify.app):
```
VITE_GOOGLE_SHEETS_API_KEY = [Your API Key from Google Cloud]
VITE_GOOGLE_CLIENT_ID = [Your Client ID].apps.googleusercontent.com
VITE_SPREADSHEET_ID = [Your Spreadsheet ID]
```

### For Packing App (packingars.netlify.app):
```
VITE_GOOGLE_SHEETS_API_KEY = [Your API Key from Google Cloud]
VITE_GOOGLE_CLIENT_ID = [Your Client ID].apps.googleusercontent.com
VITE_SPREADSHEET_ID = [Your Spreadsheet ID]
```

### For Inventory App (inventoryars.netlify.app):
```
VITE_GOOGLE_SHEETS_API_KEY = [Your API Key from Google Cloud]
VITE_SPREADSHEET_ID = [Your Spreadsheet ID]
```

📝 **Note**: All three apps use the SAME API key, Client ID, and Spreadsheet ID

---

## 🧪 Testing Your Deployments

### Test Production App
1. **Visit**: https://productionars.netlify.app
2. **Check**: Page loads with "🏭 Production Department" header
3. **Click**: "Sign In with Google" button
4. **Grant** permissions when prompted
5. **Fill** a test production entry:
   - Date: Today
   - Product: Sunflower Seeds
   - Seed Type: T6
   - Size: 100g
   - Weight: 1.5 T
6. **Submit** and verify success message
7. **Check** Google Sheets "Daily - Jul 2025" for new row
8. **Check** "Batch Master" for new/updated batch

### Test Packing App
1. **Visit**: https://packingars.netlify.app
2. **Check**: Page loads with "📦 Packing Department" header
3. **Sign in** with Google
4. **Fill** a test packing entry:
   - Product: Sunflower Seeds
   - Seed Type: T6
   - Size: 100g
   - Bags: 20 (converts to 4 bundles)
5. **Submit** and verify success
6. **Check** "Packing Consumption" sheet for new row
7. **Check** "Batch Master" for updated weights

### Test Inventory App
1. **Visit**: https://inventoryars.netlify.app
2. **Check**: Page loads with "📊 Inventory Department" header
3. **No sign-in required** - should load immediately
4. **Verify** dashboard shows:
   - Total Stock weight
   - Active Batches count
   - Product breakdown by type
   - Batch queue (FIFO order)
5. **Click** "Refresh All" to reload data
6. **Check** all stats update correctly

---

## ❌ Troubleshooting

### Issue: Site name already taken

**Error**: "packingars.netlify.app is not available"

**Solution**:
- Try alternative names: `packingars2`, `packing-ars`, `ars-packing`
- Or use: `[yourname]-production-ars`, etc.
- The site name must be unique across all Netlify

### Issue: "Configuration Error" shows on app

**Cause**: Environment variables not set

**Solution**:
1. Go to Netlify site settings → Environment variables
2. Add all required `VITE_*` variables
3. Go to Deploys → Trigger deploy → Clear cache and deploy
4. Wait 2-3 minutes for rebuild

### Issue: OAuth "Error 400: redirect_uri_mismatch"

**Cause**: Netlify URL not in OAuth authorized origins

**Solution**:
1. Add exact Netlify URL to Google Cloud OAuth settings
2. Make sure to use `https://` (not `http://`)
3. No trailing slash: `https://productionars.netlify.app` ✓
4. Wait 10 minutes after saving

### Issue: "Failed to fetch" or can't read Google Sheets

**Cause**: API key or spreadsheet ID incorrect

**Solution**:
1. Verify `VITE_GOOGLE_SHEETS_API_KEY` is correct
2. Verify `VITE_SPREADSHEET_ID` matches your sheet
3. Check spreadsheet is shared properly
4. Verify Google Sheets API is enabled in Cloud Console

### Issue: Build fails on Netlify

**Common causes**:
- Wrong base directory
- Wrong publish directory
- Missing dependencies

**Solution**:
1. Check Netlify build logs for specific error
2. Verify base directory is set: `apps/production` (etc.)
3. Verify publish directory: `apps/production/dist` (etc.)
4. Ensure Node version is 18+ (already set in netlify.toml)

---

## 📋 Deployment Checklist

### Production App (productionars.netlify.app)
- [ ] Site created with name "productionars"
- [ ] Base directory: `apps/production`
- [ ] Publish directory: `apps/production/dist`
- [ ] Environment variables added (3 variables)
- [ ] Site redeployed after adding env vars
- [ ] OAuth authorized origin updated
- [ ] App tested - sign in works
- [ ] App tested - can submit data
- [ ] Google Sheets updated correctly

### Packing App (packingars.netlify.app)
- [ ] Site created with name "packingars"
- [ ] Base directory: `apps/packing`
- [ ] Publish directory: `apps/packing/dist`
- [ ] Environment variables added (3 variables)
- [ ] Site redeployed after adding env vars
- [ ] OAuth authorized origin updated
- [ ] App tested - sign in works
- [ ] App tested - can submit data
- [ ] Google Sheets updated correctly

### Inventory App (inventoryars.netlify.app)
- [ ] Site created with name "inventoryars"
- [ ] Base directory: `apps/inventory`
- [ ] Publish directory: `apps/inventory/dist`
- [ ] Environment variables added (2 variables)
- [ ] Site redeployed after adding env vars
- [ ] App tested - loads without sign in
- [ ] App tested - shows correct data
- [ ] Refresh button works

### Final Verification
- [ ] All three apps deployed and accessible
- [ ] OAuth includes all three URLs
- [ ] Production → Packing → Inventory data flow works
- [ ] Test end-to-end: Record production → Record packing → View inventory
- [ ] All apps show updated data in real-time

---

## 🔄 Continuous Deployment

Once set up, any push to GitHub automatically redeploys all three apps:

```bash
git add .
git commit -m "Update app feature"
git push origin main

# Netlify automatically rebuilds:
# - productionars.netlify.app
# - packingars.netlify.app
# - inventoryars.netlify.app
```

---

## 📊 Your Final Setup

```
┌─────────────────────────────────────┐
│  🏭 Production Department           │
│  https://productionars.netlify.app  │
│  Records daily production data      │
│  Creates WIP batches automatically  │
└─────────────────────────────────────┘
              ↓ (Google Sheets)
┌─────────────────────────────────────┐
│  📦 Packing Department              │
│  https://packingars.netlify.app     │
│  Records packaging consumption      │
│  Updates batch weights (FIFO)       │
└─────────────────────────────────────┘
              ↓ (Google Sheets)
┌─────────────────────────────────────┐
│  📊 Inventory Department            │
│  https://inventoryars.netlify.app   │
│  Real-time stock monitoring         │
│  Batch analytics & reporting        │
└─────────────────────────────────────┘
```

---

## 🎯 Quick Start Commands

If using Netlify CLI:

```bash
# Deploy all three at once
cd apps/production && netlify init && netlify deploy --prod
cd ../packing && netlify init && netlify deploy --prod
cd ../inventory && netlify init && netlify deploy --prod
```

---

## 💡 Tips

1. **Deploy in order**: Production → Packing → Inventory
2. **Set env vars immediately** after creating each site
3. **Update OAuth once** after all three are deployed
4. **Test each app** before moving to the next
5. **Bookmark all three URLs** for easy access

---

## 📞 Support

- **Netlify Status**: https://www.netlifystatus.com/
- **Google Cloud Status**: https://status.cloud.google.com/
- **Project Docs**: See README.md and other guides

---

**Ready to deploy?** Start with Production app, then Packing, then Inventory. Each takes ~5 minutes to set up!

---

Last Updated: October 24, 2025
