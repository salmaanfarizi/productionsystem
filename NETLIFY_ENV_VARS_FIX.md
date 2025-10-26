# Fix: Google API Key Undefined (400 Bad Request)

## Error Symptoms

**Browser Console Shows**:
```
GET https://sheets.googleapis.com/v4/spreadsheets/.../values/...?key=undefined 400 (Bad Request)
Error reading sheet data: Error: HTTP error! status: 400
```

**Root Cause**: The URL contains `key=undefined`, meaning environment variables are not configured in your Netlify deployment.

---

## Quick Fix (5 minutes)

### Step 1: Get Your API Credentials

You need three values from Google Cloud Console:

1. **API Key**: https://console.cloud.google.com/apis/credentials
   - Look for "API keys" section
   - Example: `AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz`

2. **OAuth Client ID**: https://console.cloud.google.com/apis/credentials
   - Look for "OAuth 2.0 Client IDs"
   - Example: `123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com`

3. **Spreadsheet ID**: Already known
   - `1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo`

---

### Step 2: Add Environment Variables to Netlify

#### For Packing App

1. **Go to Netlify Dashboard**: https://app.netlify.com/
2. **Select your site**: Click on the Packing app deployment
3. **Navigate to**: Site settings → Environment variables
4. **Click**: "Add a variable"
5. **Add these THREE variables ONE BY ONE**:

   **Variable 1**:
   ```
   Key:   VITE_GOOGLE_SHEETS_API_KEY
   Value: [Paste your API Key from Google Cloud Console]
   ```

   **Variable 2**:
   ```
   Key:   VITE_GOOGLE_CLIENT_ID
   Value: [Paste your Client ID].apps.googleusercontent.com
   ```

   **Variable 3**:
   ```
   Key:   VITE_SPREADSHEET_ID
   Value: 1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo
   ```

6. **Click "Save"** after adding each variable

---

### Step 3: Redeploy (Critical!)

**Important**: Environment variables only take effect after redeploying!

1. **Go to**: Deploys tab
2. **Click**: "Trigger deploy" → "Clear cache and deploy site"
3. **Wait**: ~2-3 minutes for deployment to complete
4. **Verify**: Check deploy log shows "Success"

---

### Step 4: Test

1. **Open your app**: `https://your-site-name.netlify.app`
2. **Open browser console**: Press F12
3. **Sign in with Google**
4. **Check**: Errors should be gone
5. **Try loading data**: Should now work!

---

## For Production and Inventory Apps

Repeat the same steps for each app deployment:

### Production App
1. Go to Production app's Netlify site
2. Add the same 3 environment variables
3. Trigger redeploy
4. Test

### Inventory App
1. Go to Inventory app's Netlify site
2. Add the same 3 environment variables
3. Trigger redeploy
4. Test

**Note**: Each app needs its own set of environment variables because they're deployed as separate sites.

---

## Alternative: Using Netlify CLI

If you prefer command line:

```bash
# Login to Netlify
netlify login

# Link to your site (run from apps/packing directory)
cd apps/packing
netlify link

# Set environment variables
netlify env:set VITE_GOOGLE_SHEETS_API_KEY "your-api-key-here"
netlify env:set VITE_GOOGLE_CLIENT_ID "your-client-id-here.apps.googleusercontent.com"
netlify env:set VITE_SPREADSHEET_ID "1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo"

# Trigger redeploy
netlify deploy --prod
```

---

## Verification Checklist

After redeploying, verify:

- [ ] No `key=undefined` in browser console
- [ ] No 400 Bad Request errors
- [ ] Google Sign In button works
- [ ] After signing in, data loads (no errors)
- [ ] Low Stock Alert shows (if applicable)
- [ ] WIP batches load correctly
- [ ] Form dropdowns populate with data

---

## Local Development Setup (Optional)

If you also want to run the app locally with environment variables:

### Step 1: Create .env File

In `apps/packing/` directory, create `.env` file (copy from `.env.example`):

```bash
cd apps/packing
cp .env.example .env
```

### Step 2: Edit .env File

Open `.env` and fill in your values:

```env
# Google Sheets API Configuration
VITE_GOOGLE_SHEETS_API_KEY=your_api_key_here

# Google OAuth2 Client ID
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com

# Your Google Spreadsheet ID
VITE_SPREADSHEET_ID=1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo
```

### Step 3: Restart Dev Server

```bash
# Stop dev server (Ctrl+C)
# Start dev server again
npm run dev
```

**Important**:
- `.env` files are in `.gitignore` (won't be committed to Git)
- Never commit API keys to Git!
- Netlify uses environment variables set in dashboard, not `.env` files

---

## Why This Happens

### Build-Time vs Runtime

Vite embeds environment variables **at build time**:

```javascript
// shared/utils/sheetsAPI.js
const GOOGLE_SHEETS_API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
```

This gets replaced during build with:

```javascript
// If env var is set:
const GOOGLE_SHEETS_API_KEY = "AIzaSyC1234567890...";

// If env var is NOT set:
const GOOGLE_SHEETS_API_KEY = undefined;
```

**Result**: If environment variables aren't available during build, they become `undefined` forever (until next build).

**Solution**: Must set environment variables in Netlify BEFORE building.

---

## Common Mistakes

### ❌ Mistake 1: Adding Env Vars But Not Redeploying
**Problem**: Variables only apply to new builds
**Solution**: Always trigger redeploy after adding/changing variables

### ❌ Mistake 2: Wrong Variable Names
**Problem**: Must use exact names starting with `VITE_`
**Solution**:
- ✅ `VITE_GOOGLE_SHEETS_API_KEY`
- ❌ `GOOGLE_SHEETS_API_KEY` (won't work - no VITE_ prefix)

### ❌ Mistake 3: Adding Spaces
**Problem**:
```
VITE_GOOGLE_SHEETS_API_KEY = your-key  ← space before =
```
**Solution**: No spaces around = sign:
```
VITE_GOOGLE_SHEETS_API_KEY=your-key
```

### ❌ Mistake 4: Adding Quotes in Netlify UI
**Problem**:
```
Value: "your-api-key"  ← Quotes included
```
**Solution**: Don't add quotes in Netlify UI (only in .env files):
```
Value: your-api-key
```

---

## Troubleshooting

### Still Getting Errors After Redeploy?

1. **Check Deploy Log**:
   - Go to Deploys → Click latest deploy
   - Look for "Environment variables" section
   - Should show: "Using environment variables"

2. **Verify Variables Saved**:
   - Site settings → Environment variables
   - All 3 variables should be listed
   - Click "Edit" to verify values (don't have extra quotes/spaces)

3. **Hard Refresh Browser**:
   - Press Ctrl+Shift+R (Windows/Linux)
   - Press Cmd+Shift+R (Mac)
   - Or clear browser cache completely

4. **Check Network Tab**:
   - Open browser DevTools (F12)
   - Go to Network tab
   - Reload page
   - Look for requests to `sheets.googleapis.com`
   - Check if `key=` parameter has actual key (not "undefined")

5. **Build Locally to Test**:
   ```bash
   cd apps/packing

   # Set env vars temporarily
   export VITE_GOOGLE_SHEETS_API_KEY="your-key"
   export VITE_GOOGLE_CLIENT_ID="your-client-id"
   export VITE_SPREADSHEET_ID="1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo"

   # Build
   npm run build

   # Check dist/assets/*.js files
   # Should contain your API key (means build worked)
   grep -r "AIzaSy" dist/assets/
   ```

### Other Google API Errors?

If you're getting different errors (not `key=undefined`):

- **401 Unauthorized**: API key might be invalid or restricted
  - Go to Google Cloud Console → Credentials
  - Check API key restrictions
  - Should allow "Google Sheets API"

- **403 Forbidden**: OAuth consent screen or permissions issue
  - See: `GOOGLE_SHEETS_SETUP.md`

- **404 Not Found**: Spreadsheet ID might be wrong
  - Double-check VITE_SPREADSHEET_ID value

---

## Security Notes

### API Key Exposure

**Question**: "Is it safe to embed API key in client-side code?"

**Answer**: For this use case (Google Sheets API with restricted permissions), yes:
- API key is **restricted to Google Sheets API only**
- Spreadsheet has **proper sharing permissions**
- OAuth is **required for write operations**
- Read-only operations are **acceptable with API key**

**Best Practice**:
1. In Google Cloud Console → Credentials
2. Click your API key → "Edit"
3. Under "API restrictions":
   - Select "Restrict key"
   - Enable only: "Google Sheets API"
4. Under "Website restrictions" (optional):
   - Add: `https://*.netlify.app/*`
   - Add: Your custom domain if you have one

---

## Related Documentation

- **Full Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Google Sheets Setup**: `GOOGLE_SHEETS_SETUP.md`
- **Custom Domain Setup**: `CUSTOM_DOMAIN_SETUP.md`
- **Environment Files**:
  - `apps/packing/.env.example`
  - `apps/production/.env.example`
  - `apps/inventory/.env.example`

---

**Last Updated**: October 26, 2025
**Fixed By**: Claude Code
**Issue**: Google API key undefined causing 400 Bad Request errors
