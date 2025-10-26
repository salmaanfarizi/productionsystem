# Deploy to Netlify Without CLI
## Web UI Method - No Command Line Tools Needed!

---

## ✅ Prerequisites

1. GitHub account with your code pushed
2. Netlify account (free): https://app.netlify.com/signup
3. Google Sheets API Key (for Inventory app)

---

## 🚀 Step-by-Step Deployment

### Step 1: Push Code to GitHub

```bash
# Make sure you're on the right branch
git checkout claude/connect-repositories-011CUUhbw5nsPAN2dfftv2Ta

# Push to GitHub
git push origin claude/connect-repositories-011CUUhbw5nsPAN2dfftv2Ta
```

### Step 2: Create Netlify Account

1. Go to: https://app.netlify.com/signup
2. Sign up with GitHub (easiest)
3. Authorize Netlify to access your repositories

### Step 3: Deploy Production App

1. **Click "Add new site"**
   - From Netlify dashboard

2. **Import from Git**
   - Click "Import from Git"
   - Choose "GitHub"
   - Select repository: `salmaanfarizi/productionsystem`

3. **Configure Build Settings**
   ```
   Site name: productionars (or your choice)
   Branch to deploy: claude/connect-repositories-011CUUhbw5nsPAN2dfftv2Ta
   Base directory: apps/production
   Build command: npm run build
   Publish directory: apps/production/dist
   ```

4. **Click "Deploy site"**
   - Wait for build to complete (2-3 minutes)
   - You'll get a URL: `https://productionars.netlify.app`

5. **Add Environment Variables**
   - Go to: Site settings → Environment variables
   - Click "Add a variable"
   - Key: `VITE_SPREADSHEET_ID`
   - Value: Your Google Spreadsheet ID
   - Click "Create variable"
   - **Redeploy**: Deploys → Trigger deploy → Deploy site

### Step 4: Deploy Packing App

Repeat Step 3 with these changes:

```
Site name: packingars
Base directory: apps/packing
Build command: npm run build
Publish directory: apps/packing/dist

Environment Variables:
- VITE_SPREADSHEET_ID = your-spreadsheet-id
```

### Step 5: Deploy Inventory App

Repeat Step 3 with these changes:

```
Site name: inventoryars
Base directory: apps/inventory
Build command: npm run build
Publish directory: apps/inventory/dist

Environment Variables:
- VITE_SPREADSHEET_ID = your-spreadsheet-id
- VITE_GOOGLE_SHEETS_API_KEY = your-api-key
- VITE_ARSINV_SPREADSHEET_ID = 1o3rmIC2mSUAS-0d0-w62mDDHGzJznHf9qEjcHoyZEX0
```

---

## 🔑 Getting Your Spreadsheet ID

1. Open your Google Spreadsheet
2. Look at the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
   ```
3. Copy the long ID between `/d/` and `/edit`
4. Paste into Netlify environment variables

---

## 🔑 Getting Google Sheets API Key

### Quick Steps:

1. **Google Cloud Console**
   - Go to: https://console.cloud.google.com/

2. **Create Project**
   - Click "Select a project" → "New Project"
   - Name: "ARS Production System"
   - Click "Create"

3. **Enable Google Sheets API**
   - Navigation menu → "APIs & Services" → "Library"
   - Search: "Google Sheets API"
   - Click on it → Click "ENABLE"

4. **Create API Key**
   - Navigation menu → "APIs & Services" → "Credentials"
   - Click "CREATE CREDENTIALS" → "API key"
   - Copy the key (starts with `AIza...`)
   - Save it securely!

5. **Restrict API Key (Recommended)**
   - Click edit icon next to your API key
   - Application restrictions:
     - Select "HTTP referrers"
     - Add:
       ```
       https://inventoryars.netlify.app/*
       https://*.netlify.app/*
       ```
   - API restrictions:
     - Select "Restrict key"
     - Choose only "Google Sheets API"
   - Click "SAVE"

6. **Add to Netlify**
   - Inventory site → Environment variables
   - Add: `VITE_GOOGLE_SHEETS_API_KEY` = your-key
   - Redeploy the site

---

## ✅ Verify Deployment

### Check Each Site:

**Production App** - `https://productionars.netlify.app`
- [ ] Site loads
- [ ] Can submit production data
- [ ] Data appears in Google Sheets

**Packing App** - `https://packingars.netlify.app`
- [ ] Site loads
- [ ] WIP batches appear
- [ ] Can record transfers

**Inventory App** - `https://inventoryars.netlify.app`
- [ ] Site loads
- [ ] Finished Goods tab works
- [ ] WIP Inventory tab works
- [ ] **Stock Outwards tab appears**
- [ ] **"Sync Salesman Data" button visible**
- [ ] Can sync and see arsinv data
- [ ] Can add manual outwards

---

## 🔄 Auto-Deploy Setup

Once sites are created, every time you push to GitHub:

```bash
git push origin claude/connect-repositories-011CUUhbw5nsPAN2dfftv2Ta
```

Netlify **automatically rebuilds and deploys** all three apps! No manual action needed.

---

## 🎨 Customize Your Sites

### Change Site Name

1. Site settings → General → Site details
2. Click "Change site name"
3. Enter: `productionars`, `packingars`, `inventoryars`
4. Save

### Custom Domain (Optional)

1. Domain settings → Add custom domain
2. Follow instructions to point your domain to Netlify

---

## 🐛 Troubleshooting

### Build Fails

**Check build logs:**
- Deploys → Click on failed deploy → See build log
- Common issues:
  - Missing dependencies: Run `npm install` locally first
  - Build command wrong: Should be `npm run build`
  - Base directory wrong: Should be `apps/production` etc.

### Environment Variables Not Working

**Solution:**
1. Verify variables are set correctly
2. **Trigger new deploy**: Deploys → Trigger deploy → Clear cache and deploy
3. Hard refresh browser: Ctrl+Shift+R

### Stock Outwards Sync Not Working

**Checklist:**
- [ ] `VITE_GOOGLE_SHEETS_API_KEY` is set in Netlify
- [ ] Google Sheets API is enabled in Cloud Console
- [ ] API key is valid and not expired
- [ ] Arsinv spreadsheet is accessible
- [ ] Site was redeployed after adding API key

---

## 📞 Need Help?

**Netlify Support:**
- Docs: https://docs.netlify.com/
- Community: https://answers.netlify.com/

**Your Documentation:**
- Full guide: `NETLIFY_DEPLOYMENT_GUIDE.md`
- Env vars: `ENVIRONMENT_VARIABLES.md`
- Stock Outwards: `STOCK_OUTWARDS_SETUP.md`

---

## 🎉 That's It!

You now have all three apps deployed to Netlify with:
- ✅ Automatic deployments on git push
- ✅ Environment variables configured
- ✅ Stock Outwards with arsinv sync
- ✅ Complete production system live!

**Your Apps:**
- Production: https://productionars.netlify.app
- Packing: https://packingars.netlify.app
- Inventory: https://inventoryars.netlify.app

---

**Last Updated**: October 26, 2025
**Method**: Web UI Deployment (No CLI Required)
