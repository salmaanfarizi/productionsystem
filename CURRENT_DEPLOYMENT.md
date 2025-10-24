# Deployment Configuration Guide - ARS Custom URLs

Deploy all three apps to your custom Netlify site names:

- 🏭 **Production**: https://productionars.netlify.app
- 📦 **Packing**: https://packingars.netlify.app
- 📊 **Inventory**: https://inventoryars.netlify.app

Follow the steps below to deploy all three apps.

---

## 🔍 Step 1: Deploy to Custom Site Names

You want to deploy to these specific URLs (not auto-generated names):

- **productionars** → https://productionars.netlify.app
- **packingars** → https://packingars.netlify.app
- **inventoryars** → https://inventoryars.netlify.app

**📖 See `DEPLOY_TO_ARS.md` for complete step-by-step instructions!**

---

## ⚙️ Step 2: Configure Environment Variables (CRITICAL!)

The app won't work without environment variables set in Netlify.

### How to Add Environment Variables:

1. **Go to** https://app.netlify.com/
2. **Navigate** to your site: "kaleidoscopic-dasik-687456"
3. **Click**: Site settings → Environment variables
4. **Add variables** based on which app is deployed:

#### If it's Production or Packing App:
```
Variable Name: VITE_GOOGLE_SHEETS_API_KEY
Value: [Your API Key from Google Cloud Console]

Variable Name: VITE_GOOGLE_CLIENT_ID
Value: [Your Client ID].apps.googleusercontent.com

Variable Name: VITE_SPREADSHEET_ID
Value: 1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo
```

#### If it's Inventory App:
```
Variable Name: VITE_GOOGLE_SHEETS_API_KEY
Value: [Your API Key from Google Cloud Console]

Variable Name: VITE_SPREADSHEET_ID
Value: 1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo
```

5. **Click** "Save"
6. **Go to**: Deploys tab
7. **Click**: "Trigger deploy" → "Clear cache and deploy site"
8. **Wait** 2-3 minutes for rebuild

---

## 🔐 Step 3: Update Google OAuth (For Production/Packing Apps Only)

If the deployed app is Production or Packing (requires authentication):

1. **Go to** https://console.cloud.google.com/apis/credentials
2. **Click** on your OAuth 2.0 Client ID
3. **Under "Authorized JavaScript origins"**, click **ADD URI**
4. **Add all three URLs**:
   ```
   https://productionars.netlify.app
   https://packingars.netlify.app
   https://inventoryars.netlify.app
   ```
5. **Also add** (for local testing):
   ```
   http://localhost:3000
   http://localhost:3001
   http://localhost:3002
   ```
6. **Click** "SAVE"
7. **Wait** 5-10 minutes for changes to propagate

---

## 🚀 Step 4: Deploy the Other Two Apps

You need to deploy all three apps separately. Here's how:

### Deploy Second App

1. **Go to** https://app.netlify.com/
2. **Click**: "Add new site" → "Import an existing project"
3. **Select**: GitHub → Your repository
4. **Configure**:

   **If deploying Production App:**
   - Site name: `yourcompany-production`
   - Base directory: `apps/production`
   - Build command: `npm run build`
   - Publish directory: `apps/production/dist`

   **If deploying Packing App:**
   - Site name: `yourcompany-packing`
   - Base directory: `apps/packing`
   - Build command: `npm run build`
   - Publish directory: `apps/packing/dist`

   **If deploying Inventory App:**
   - Site name: `yourcompany-inventory`
   - Base directory: `apps/inventory`
   - Build command: `npm run build`
   - Publish directory: `apps/inventory/dist`

5. **Click** "Deploy"
6. **Add environment variables** (same as Step 2)
7. **Trigger redeploy**

### Deploy Third App

Repeat the same process for the third app.

---

## 📝 Step 5: Customize Site Names (Optional)

You can change the auto-generated Netlify name:

1. **In Netlify**: Site settings → Domain management
2. **Click**: "Change site name"
3. **Enter**: `yourcompany-production` (or packing/inventory)
4. **Save**
5. **Update OAuth** with new URL (if needed)

---

## 🧪 Step 6: Test Your Apps

### Test Production/Packing App (With Auth):

1. **Open** the app URL
2. **Click** "Sign In with Google"
3. **Grant** permissions when prompted
4. **Fill** a test entry in the form
5. **Submit** and verify success message
6. **Check** Google Sheets for the new data

### Test Inventory App (No Auth):

1. **Open** the app URL
2. Should load immediately (no sign-in)
3. **Verify** stock statistics display
4. **Click** "Refresh All" to reload data
5. **Check** that batch lists populate

---

## ❌ Common Issues & Solutions

### Issue: "Configuration Error" message shows

**Cause**: Environment variables not set

**Solution**:
- Add all required `VITE_*` variables in Netlify
- Trigger a new deploy (variables are baked into build)
- Clear browser cache

### Issue: "OAuth error" or "Sign in doesn't work"

**Cause**: Netlify URL not in authorized origins

**Solution**:
- Add Netlify URL to Google Cloud OAuth settings
- Wait 10 minutes for changes to propagate
- Clear browser cache and cookies
- Try incognito/private browsing mode

### Issue: App shows but data doesn't load

**Cause**: Wrong spreadsheet ID or API key

**Solution**:
- Verify `VITE_SPREADSHEET_ID` is correct
- Check `VITE_GOOGLE_SHEETS_API_KEY` is valid
- Verify spreadsheet sharing permissions
- Check Google Cloud Console API is enabled

### Issue: Build fails on Netlify

**Cause**: Wrong base directory or publish directory

**Solution**:
- Verify base directory matches app path
- Ensure publish directory is `{base}/dist`
- Check Netlify build logs for specific error

---

## 📊 Your Three Apps Overview

Once all deployed, you'll have:

| App | Purpose | Auth Required | Env Vars Needed |
|-----|---------|---------------|-----------------|
| **Production** | Record daily production | ✅ Yes (OAuth) | API Key, Client ID, Spreadsheet ID |
| **Packing** | Record packaging | ✅ Yes (OAuth) | API Key, Client ID, Spreadsheet ID |
| **Inventory** | Monitor stock | ❌ No (read-only) | API Key, Spreadsheet ID |

---

## 🔄 Continuous Deployment

After initial setup, Netlify auto-deploys on Git push:

```bash
git add .
git commit -m "Update app features"
git push origin main

# All three sites automatically rebuild
```

---

## 📋 Deployment Checklist

- [ ] First app deployed to Netlify ✅ (https://kaleidoscopic-dasik-687456.netlify.app)
- [ ] Environment variables added for first app
- [ ] First app tested and working
- [ ] OAuth updated with first app URL (if needed)
- [ ] Second app deployed to Netlify
- [ ] Environment variables added for second app
- [ ] Second app tested and working
- [ ] OAuth updated with second app URL (if needed)
- [ ] Third app deployed to Netlify
- [ ] Environment variables added for third app
- [ ] Third app tested and working
- [ ] OAuth updated with third app URL (if needed)
- [ ] All three apps working and integrated
- [ ] URLs shared with team
- [ ] Production data tested end-to-end

---

## 🎯 Next Steps

1. **Right now**: Add environment variables to current deployment
2. **Then**: Test the first app thoroughly
3. **After**: Deploy the remaining two apps
4. **Finally**: Test all three apps together

---

## 📞 Need Help?

If you encounter issues:

1. Check Netlify deploy logs for errors
2. Review browser console for JavaScript errors
3. Verify all environment variables are set correctly
4. Check Google Cloud Console for API quota/errors
5. Review `DEPLOYMENT_CHECKLIST.md` for detailed troubleshooting

---

**Current Status**: 1 of 3 apps deployed ✅

**Next Action**: Configure environment variables for the deployed app

---

Last updated: October 24, 2025
