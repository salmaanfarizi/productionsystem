# Deployment Checklist

Quick reference for deploying all three Production System apps to Netlify.

## ✅ Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] Google Cloud Project with Sheets API enabled
- [ ] Google Sheets API Key created
- [ ] OAuth 2.0 Client ID created
- [ ] GitHub repository up to date
- [ ] Netlify account created (free tier works)
- [ ] All three apps built successfully locally

## 🏗️ Build Status

All three apps have been successfully built:

```
✅ Production App - Built in 1.58s
   Size: 164 KB (gzipped: 51.93 KB)
   Output: apps/production/dist/

✅ Packing App - Built in 3.89s
   Size: 562 KB (gzipped: 181.72 KB)
   Output: apps/packing/dist/

✅ Inventory App - Built in 1.52s
   Size: 162 KB (gzipped: 50.26 KB)
   Output: apps/inventory/dist/
```

## 🚀 Deployment Steps

### Option 1: Netlify UI (Recommended for First Time)

#### Deploy Production App

1. **Go to**: https://app.netlify.com/
2. **Click**: "Add new site" → "Import an existing project"
3. **Choose**: GitHub
4. **Select**: Your repository `productionsystem`
5. **Configure Site**:
   - Site name: `yourcompany-production` (choose unique name)
   - Base directory: `apps/production`
   - Build command: `npm run build`
   - Publish directory: `apps/production/dist`
6. **Click**: "Deploy site"
7. **Add Environment Variables**:
   - Go to: Site settings → Environment variables → Add a variable
   - Add the following:
   ```
   VITE_GOOGLE_SHEETS_API_KEY = your_api_key_here
   VITE_GOOGLE_CLIENT_ID = your_client_id.apps.googleusercontent.com
   VITE_SPREADSHEET_ID = your_spreadsheet_id
   ```
8. **Trigger Redeploy**: Deploys → Trigger deploy → Clear cache and deploy site

**Result**: Your production app will be at `https://yourcompany-production.netlify.app`

#### Deploy Packing App

1. **Repeat steps 1-4** above
2. **Configure Site**:
   - Site name: `yourcompany-packing`
   - Base directory: `apps/packing`
   - Build command: `npm run build`
   - Publish directory: `apps/packing/dist`
3. **Add same environment variables** as Production app
4. **Trigger redeploy**

**Result**: Your packing app will be at `https://yourcompany-packing.netlify.app`

#### Deploy Inventory App

1. **Repeat steps 1-4** above
2. **Configure Site**:
   - Site name: `yourcompany-inventory`
   - Base directory: `apps/inventory`
   - Build command: `npm run build`
   - Publish directory: `apps/inventory/dist`
3. **Add environment variables** (Inventory only needs 2):
   ```
   VITE_GOOGLE_SHEETS_API_KEY = your_api_key_here
   VITE_SPREADSHEET_ID = your_spreadsheet_id
   ```
4. **Trigger redeploy**

**Result**: Your inventory app will be at `https://yourcompany-inventory.netlify.app`

---

### Option 2: Netlify CLI (For Advanced Users)

#### Install Netlify CLI

```bash
npm install -g netlify-cli
netlify login
```

#### Deploy Production App

```bash
cd apps/production
netlify init

# Follow prompts:
# - Create new site
# - Site name: yourcompany-production
# - Build command: npm run build
# - Directory to deploy: dist

# Set environment variables
netlify env:set VITE_GOOGLE_SHEETS_API_KEY "your_api_key"
netlify env:set VITE_GOOGLE_CLIENT_ID "your_client_id"
netlify env:set VITE_SPREADSHEET_ID "your_spreadsheet_id"

# Deploy
netlify deploy --prod
```

#### Deploy Packing App

```bash
cd ../packing
netlify init
# (same steps as above with site name: yourcompany-packing)
netlify env:set VITE_GOOGLE_SHEETS_API_KEY "your_api_key"
netlify env:set VITE_GOOGLE_CLIENT_ID "your_client_id"
netlify env:set VITE_SPREADSHEET_ID "your_spreadsheet_id"
netlify deploy --prod
```

#### Deploy Inventory App

```bash
cd ../inventory
netlify init
# (same steps, site name: yourcompany-inventory)
netlify env:set VITE_GOOGLE_SHEETS_API_KEY "your_api_key"
netlify env:set VITE_SPREADSHEET_ID "your_spreadsheet_id"
netlify deploy --prod
```

---

## 🔐 Update OAuth Authorized Origins

After deploying all three apps:

1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Click** on your OAuth 2.0 Client ID
3. **Add all three Netlify URLs** to "Authorized JavaScript origins":
   ```
   https://yourcompany-production.netlify.app
   https://yourcompany-packing.netlify.app
   https://yourcompany-inventory.netlify.app
   ```
4. **Add local development URLs** (optional, for testing):
   ```
   http://localhost:3000
   http://localhost:3001
   http://localhost:3002
   ```
5. **Click** "SAVE"
6. **Wait** 5-10 minutes for changes to propagate

---

## 🧪 Testing Deployed Apps

### Test Production App

1. Visit: `https://yourcompany-production.netlify.app`
2. Click "Sign In with Google"
3. Grant permissions
4. Record a test production entry
5. Verify in Google Sheets that data was written

### Test Packing App

1. Visit: `https://yourcompany-packing.netlify.app`
2. Sign in with Google
3. Record a test packing entry
4. Verify in Google Sheets

### Test Inventory App

1. Visit: `https://yourcompany-inventory.netlify.app`
2. Should load immediately (no sign-in needed)
3. Verify stock data displays correctly
4. Test "Refresh All" button

---

## 🎯 Your Deployment URLs

After deployment, you'll have three separate apps:

| App | URL | Purpose |
|-----|-----|---------|
| Production | `https://yourcompany-production.netlify.app` | Record daily production & create batches |
| Packing | `https://yourcompany-packing.netlify.app` | Record packaging & consume batches |
| Inventory | `https://yourcompany-inventory.netlify.app` | Monitor stock levels & analytics |

---

## 📊 Continuous Deployment

Once deployed, Netlify will automatically redeploy when you push to GitHub:

```bash
# Make changes to code
git add .
git commit -m "Update feature X"
git push origin main

# Netlify automatically detects and deploys all three apps
```

---

## 🐛 Common Issues & Solutions

### Issue: "Build failed"

**Solution**:
- Check Netlify build logs
- Verify `base directory` is set correctly
- Ensure environment variables are set
- Check that Node version is 18+

### Issue: "OAuth error in production"

**Solution**:
- Add Netlify URL to Google Cloud authorized origins
- Wait 10 minutes for OAuth changes to propagate
- Clear browser cache and cookies
- Verify VITE_GOOGLE_CLIENT_ID is correct

### Issue: "Can't read from Google Sheets"

**Solution**:
- Verify VITE_GOOGLE_SHEETS_API_KEY is set
- Check spreadsheet sharing permissions
- Verify VITE_SPREADSHEET_ID is correct
- Check Google Cloud Console for API quota

### Issue: "Environment variables not working"

**Solution**:
- Environment variables must start with `VITE_` prefix
- Variables are baked into build (not runtime)
- After changing env vars, trigger new deploy
- Check deploy logs to see if variables are loaded

---

## 💰 Cost

**Free Tier** (sufficient for small teams):
- Netlify: 3 sites free, 300 build minutes/month
- Google Sheets API: Free for standard usage
- **Total: $0/month**

---

## 📞 Support

- **Netlify Issues**: https://answers.netlify.com/
- **Google Cloud**: https://console.cloud.google.com/support
- **Project Documentation**: See README.md and other guides

---

## ✅ Post-Deployment

After successful deployment:

- [ ] All three apps deployed to Netlify
- [ ] Environment variables configured
- [ ] OAuth authorized origins updated
- [ ] All apps tested and working
- [ ] URLs shared with team
- [ ] User training scheduled

**Congratulations!** Your three-department production system is now live! 🎉

---

**Last Updated**: October 24, 2025
