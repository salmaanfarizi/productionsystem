# Netlify Deployment Guide - Production System

Complete guide to deploy all three apps to Netlify.

## 📋 Prerequisites

- GitHub account
- Netlify account (free tier is fine)
- Google Cloud credentials ready:
  - API Key
  - OAuth Client ID (for Production & Packing)
  - Spreadsheet ID

---

## 🚀 Deployment Steps

### Step 1: Push Code to GitHub

First, ensure all code is committed and pushed:

```bash
cd ~/Documents/productionsystem
git status
git add -A
git commit -m "Ready for Netlify deployment"
git push origin claude/update-department-structure-011CUM8sPnhDB1DXbRo5uqE4
```

**Important**: You'll deploy from this branch, or merge to main first.

---

### Step 2: Deploy Production App

#### 2.1 Create New Site on Netlify

1. Go to: https://app.netlify.com/
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub**
4. Select your repository: `productionsystem`
5. Configure build settings:

```
Branch to deploy: claude/update-department-structure-011CUM8sPnhDB1DXbRo5uqE4
Base directory: apps/production
Build command: npm install && npm run build
Publish directory: apps/production/dist
```

6. Click **"Show advanced"** → **"New variable"** and add:

```
VITE_GOOGLE_SHEETS_API_KEY = your_api_key_here
VITE_GOOGLE_CLIENT_ID = your_client_id.apps.googleusercontent.com
VITE_SPREADSHEET_ID = 1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo
```

7. Click **"Deploy site"**

#### 2.2 Configure Custom Domain (Optional)

After deployment:
- Site will get random name like `random-name-123.netlify.app`
- Click **"Domain settings"** → **"Edit site name"**
- Change to: `production-dept.netlify.app` (or your preference)

#### 2.3 Update Google OAuth Settings

**CRITICAL**: Add Netlify URL to Google Cloud Console:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your OAuth Client ID
3. Add to **"Authorized JavaScript origins"**:
   ```
   https://production-dept.netlify.app
   ```
4. Add to **"Authorized redirect URIs"**:
   ```
   https://production-dept.netlify.app
   ```
5. Click **"Save"**

---

### Step 3: Deploy Packing App

#### 3.1 Create New Site on Netlify

1. Go to: https://app.netlify.com/
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub**
4. Select your repository: `productionsystem`
5. Configure build settings:

```
Branch to deploy: claude/update-department-structure-011CUM8sPnhDB1DXbRo5uqE4
Base directory: apps/packing
Build command: npm install && npm run build
Publish directory: apps/packing/dist
```

6. Add environment variables:

```
VITE_GOOGLE_SHEETS_API_KEY = your_api_key_here
VITE_GOOGLE_CLIENT_ID = your_client_id.apps.googleusercontent.com
VITE_SPREADSHEET_ID = 1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo
```

7. Click **"Deploy site"**

#### 3.2 Configure Custom Domain

Change site name to: `packing-dept.netlify.app`

#### 3.3 Update Google OAuth Settings

Add to Google Cloud Console:
- **Authorized JavaScript origins**: `https://packing-dept.netlify.app`
- **Authorized redirect URIs**: `https://packing-dept.netlify.app`

---

### Step 4: Deploy Inventory App

#### 4.1 Create New Site on Netlify

1. Go to: https://app.netlify.com/
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub**
4. Select your repository: `productionsystem`
5. Configure build settings:

```
Branch to deploy: claude/update-department-structure-011CUM8sPnhDB1DXbRo5uqE4
Base directory: apps/inventory
Build command: npm install && npm run build
Publish directory: apps/inventory/dist
```

6. Add environment variables:

```
VITE_GOOGLE_SHEETS_API_KEY = your_api_key_here
VITE_SPREADSHEET_ID = 1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo
```

**Note**: Inventory app doesn't need OAuth Client ID (read-only)

7. Click **"Deploy site"**

#### 4.2 Configure Custom Domain

Change site name to: `inventory-dept.netlify.app`

---

## 🔄 Auto-Deploy on Git Push

After initial setup, Netlify auto-deploys when you push to the branch:

```bash
git add -A
git commit -m "Update feature"
git push origin claude/update-department-structure-011CUM8sPnhDB1DXbRo5uqE4
```

All three sites will rebuild automatically!

---

## 🌐 Your Deployed URLs

After deployment, you'll have:

- **Production App**: `https://production-dept.netlify.app`
- **Packing App**: `https://packing-dept.netlify.app`
- **Inventory App**: `https://inventory-dept.netlify.app`

Share these URLs with your team!

---

## ⚙️ Environment Variables Reference

### Production App:
```
VITE_GOOGLE_SHEETS_API_KEY = AIza...
VITE_GOOGLE_CLIENT_ID = 123...apps.googleusercontent.com
VITE_SPREADSHEET_ID = 1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo
```

### Packing App:
```
VITE_GOOGLE_SHEETS_API_KEY = AIza...
VITE_GOOGLE_CLIENT_ID = 123...apps.googleusercontent.com
VITE_SPREADSHEET_ID = 1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo
```

### Inventory App:
```
VITE_GOOGLE_SHEETS_API_KEY = AIza...
VITE_SPREADSHEET_ID = 1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo
```

---

## 🐛 Troubleshooting

### Build Fails with "Command not found"

**Issue**: npm not finding build command

**Fix**: Update build command to:
```
npm install && npm run build
```

### OAuth Error: "redirect_uri_mismatch"

**Issue**: Netlify URL not in Google Cloud Console

**Fix**:
1. Go to Google Cloud Console
2. Add your Netlify URL to Authorized origins & redirect URIs
3. Wait 5 minutes for changes to propagate

### Environment Variables Not Working

**Issue**: Variables not loading in app

**Fix**:
1. Go to Netlify site → **Site settings** → **Environment variables**
2. Verify variables are set correctly
3. Click **"Trigger deploy"** → **"Clear cache and deploy"**

### "Failed to fetch" Error

**Issue**: Google Sheets API key invalid or restricted

**Fix**:
1. Go to Google Cloud Console → Credentials
2. Check API key restrictions
3. Ensure "Google Sheets API" is enabled
4. Try unrestricted key first, then add restrictions

### PDF Not Downloading

**Issue**: jsPDF library not included in build

**Fix**: Already installed! Should work. If not:
```bash
cd apps/packing
npm install jspdf
git add package.json package-lock.json
git commit -m "Add jsPDF dependency"
git push
```

---

## 📊 Deployment Checklist

Before deploying:

- [ ] All code committed and pushed to GitHub
- [ ] Google Cloud API Key created
- [ ] Google OAuth Client ID created (for Production & Packing)
- [ ] Google Sheets API enabled
- [ ] All 5 Google Sheets created and formatted
- [ ] Test apps work locally

During deployment:

- [ ] Production app deployed
- [ ] Packing app deployed
- [ ] Inventory app deployed
- [ ] Environment variables added to all sites
- [ ] Custom domain names set (optional)
- [ ] Google OAuth updated with Netlify URLs
- [ ] All sites building successfully

After deployment:

- [ ] Test Production app on Netlify
- [ ] Test Packing app on Netlify
- [ ] Test Inventory app on Netlify
- [ ] Test OAuth login works
- [ ] Test PDF download works
- [ ] Test complete flow: Production → Packing → Inventory

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** to GitHub (already in `.gitignore`)
2. **Use environment variables** in Netlify for all secrets
3. **Restrict API keys** to your domain after testing:
   - Go to Google Cloud Console
   - Edit API key
   - Add HTTP referrer restriction: `https://*.netlify.app/*`
4. **Enable Google Sheets sharing** with "Anyone with link - Viewer"
5. **Add users to OAuth test users** if using Advanced Protection

---

## 🚀 Quick Deploy Commands

If you need to redeploy all apps:

```bash
# Commit any changes
git add -A
git commit -m "Deploy updates"
git push origin claude/update-department-structure-011CUM8sPnhDB1DXbRo5uqE4

# Netlify will auto-build all three sites!
```

Or trigger manual deploys:
1. Go to Netlify dashboard
2. Click site → **"Deploys"**
3. Click **"Trigger deploy"** → **"Deploy site"**

---

## 📝 Post-Deployment Tasks

1. **Share URLs with team**
2. **Add bookmarks** to browser
3. **Test on different devices**
4. **Monitor Netlify analytics**
5. **Set up custom domains** (optional, requires domain ownership)
6. **Enable HTTPS** (automatic with Netlify)

---

## 🎯 Expected Results

After successful deployment:

✅ **Production App**:
- Sign in with Google works
- Can create production entries
- WIP batches generated
- All sheets updated

✅ **Packing App**:
- Sign in with Google works
- Shows inventory recommendations
- Transfer PDF auto-downloads
- Daily summary PDF downloads
- All sheets updated

✅ **Inventory App**:
- No sign-in needed (read-only)
- Shows finished goods inventory
- Color-coded status
- Filters work
- WIP inventory displays

---

## 💡 Tips

- **Use same Google account** for all three apps
- **Clear browser cache** if changes don't appear
- **Check Netlify deploy logs** if build fails
- **Monitor Netlify functions** (none used currently)
- **Set up notifications** in Netlify for failed deploys

---

**Status**: Ready to deploy! Follow steps above.

**Support**: Check Netlify docs at https://docs.netlify.com/
