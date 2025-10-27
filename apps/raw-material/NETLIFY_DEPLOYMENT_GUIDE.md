# Raw Material App - Netlify Deployment Guide

## 🚀 Quick Deploy to Netlify

### Option 1: Manual Deploy via Netlify UI (Recommended for First Time)

#### Step 1: Create New Site

1. **Go to Netlify**: https://app.netlify.com/
2. **Click**: "Add new site" → "Import an existing project"
3. **Connect to Git**: Select your Git provider (GitHub/GitLab/Bitbucket)
4. **Select Repository**: Choose `productionsystem` repository
5. **Configure Build Settings**:
   - **Branch to deploy**: `claude/multi-app-updates-011CUWAZqpdPyxUELs4Ln7Xc`
   - **Base directory**: `apps/raw-material`
   - **Build command**: `npm run build`
   - **Publish directory**: `apps/raw-material/dist`
   - **Node version**: `18`

6. **Environment Variables** (IMPORTANT):
   Click "Show advanced" → "New variable"

   Add these variables:
   ```
   VITE_GOOGLE_CLIENT_ID = your-google-client-id
   VITE_SPREADSHEET_ID = your-spreadsheet-id
   ```

   Get these from your other apps' environment variables:
   - Production: https://app.netlify.com/sites/productionars/settings/env
   - Copy the same values

7. **Click**: "Deploy site"

#### Step 2: Rename Site (Optional)

1. Go to **Site settings** → **General** → **Site details**
2. Click **"Change site name"**
3. Rename to: `rawmaterialars` (or your preferred name)
4. Your URL will be: `https://rawmaterialars.netlify.app`

#### Step 3: Verify Deployment

1. Wait 2-3 minutes for build to complete
2. Check deploy log for errors
3. Visit your site URL
4. Test authentication and functionality

---

### Option 2: Using Netlify CLI

```bash
# Login to Netlify
netlify login

# Navigate to raw material app
cd apps/raw-material

# Initialize Netlify site
netlify init

# Follow the prompts:
# - Create & configure a new site
# - Team: Your team
# - Site name: rawmaterialars (or your choice)
# - Build command: npm run build
# - Publish directory: dist

# Deploy
netlify deploy --prod
```

---

## 🔧 Environment Variables Setup

The Raw Material App requires the same Google Sheets credentials as your other apps.

### Required Variables:

```bash
VITE_GOOGLE_CLIENT_ID=your-actual-client-id
VITE_SPREADSHEET_ID=your-actual-spreadsheet-id
```

### Where to Add Them:

1. Go to: https://app.netlify.com/sites/YOUR-SITE-NAME/settings/env
2. Click "Add a variable"
3. Add both variables
4. Redeploy the site

---

## 📋 Google Sheets Setup

Make sure your Google Spreadsheet has these sheets:
- **Raw Material Inventory** (13 columns)
- **Raw Material Transactions** (14 columns)

See `RAW_MATERIAL_SHEETS_SETUP.md` for detailed structure.

---

## ✅ Post-Deployment Checklist

- [ ] Site deployed successfully
- [ ] Environment variables added
- [ ] Google OAuth working (can sign in)
- [ ] Can view inventory list
- [ ] Can add Stock In transaction
- [ ] Can add Stock Out transaction
- [ ] Sunflower seed fields appear when selected
- [ ] Opening inventory loader accessible

---

## 🔗 Suggested Site Name

To match your existing naming convention:

- Production: `productionars.netlify.app`
- Packing: `packingars.netlify.app`
- Inventory: `inventoryars.netlify.app`
- **Raw Material**: `rawmaterialars.netlify.app` ✨

---

## 🆘 Troubleshooting

### Build Fails

**Error**: "Cannot find module '@shared/...'"

**Fix**: Make sure base directory is set to `apps/raw-material`

### Environment Variables Not Working

**Error**: "Missing Google Client ID"

**Fix**:
1. Check variables are set in Netlify dashboard
2. Variable names must start with `VITE_`
3. Redeploy after adding variables

### OAuth Not Working

**Error**: "Invalid redirect URI"

**Fix**: Add your Netlify URL to Google Cloud Console authorized origins:
```
https://rawmaterialars.netlify.app
```

---

## 📊 Your Apps Overview

After deployment, you'll have:

| App | URL | Purpose |
|-----|-----|---------|
| Production | https://productionars.netlify.app | Record daily production |
| Packing | https://packingars.netlify.app | Pack products, transfer to inventory |
| Inventory | https://inventoryars.netlify.app | Monitor stock levels, FIFO queue |
| **Raw Material** | https://rawmaterialars.netlify.app | Track raw materials, expiry, consumption |

---

## 🎯 Need Help?

If you encounter issues:
1. Check the Netlify deploy logs
2. Verify environment variables
3. Check Google Sheets permissions
4. Try a manual redeploy
