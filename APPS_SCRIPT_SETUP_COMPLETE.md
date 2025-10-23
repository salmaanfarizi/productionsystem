# ✅ Apps Script Configuration Complete

Your Apps Script URL has been configured in all three apps!

```
✅ Apps Script URL: https://script.google.com/macros/s/AKfycbweu8JzkGhLZ0DqYA45HOXh5zTgeUAl4V1BFMI1ed0m4wsYma7OAgmwFsrjQgWFCsll/exec
```

---

## 📋 What I Just Did

Created `.env.local` files for all three apps with your Apps Script URL:

✅ `apps/production/.env.local`
✅ `apps/packing/.env.local`
✅ `apps/inventory/.env.local`

---

## 🔑 Step 1: Add Your API Credentials (REQUIRED)

You need to add your Google Cloud credentials to the `.env.local` files.

### Get Your Credentials:

1. **Go to**: https://console.cloud.google.com/apis/credentials

2. **Get API Key**:
   - Find your API key (or create one)
   - Copy the key

3. **Get OAuth Client ID**:
   - Find "OAuth 2.0 Client IDs"
   - Copy the Client ID (ends with `.apps.googleusercontent.com`)

### Update Environment Files:

**For each app** (Production, Packing, Inventory):

1. **Open**: `apps/production/.env.local` (or packing/inventory)

2. **Replace placeholders**:
   ```env
   # Change this:
   VITE_GOOGLE_SHEETS_API_KEY=your_api_key_here

   # To your actual API key:
   VITE_GOOGLE_SHEETS_API_KEY=AIzaSyC...your_actual_key
   ```

   ```env
   # Change this:
   VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com

   # To your actual OAuth Client ID:
   VITE_GOOGLE_CLIENT_ID=123456789-abc...xyz.apps.googleusercontent.com
   ```

3. **Save** the file

4. **Repeat for all 3 apps**

---

## 🚀 Step 2: Deploy to Netlify

Now you need to add these environment variables to Netlify so the deployed apps can use them.

### For Each App (Production, Packing, Inventory):

1. **Go to**: https://app.netlify.com/

2. **Click on your site** (productionars, packingars, or inventoryars)

3. **Go to**: Site configuration → Environment variables

4. **Add these 4 variables**:

   | Variable Name | Value |
   |---------------|-------|
   | `VITE_GOOGLE_SHEETS_API_KEY` | Your API key |
   | `VITE_GOOGLE_CLIENT_ID` | Your OAuth Client ID |
   | `VITE_SPREADSHEET_ID` | `1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo` |
   | `VITE_APPS_SCRIPT_URL` | `https://script.google.com/macros/s/AKfycbweu8JzkGhLZ0DqYA45HOXh5zTgeUAl4V1BFMI1ed0m4wsYma7OAgmwFsrjQgWFCsll/exec` |

5. **Click "Save"**

6. **Go to Deploys tab**

7. **Click "Trigger deploy"** → **"Clear cache and deploy site"**

8. **Wait 2-3 minutes** ⏳

9. **Repeat for all 3 apps**

---

## 📊 Step 3: Verify Script Version

**IMPORTANT**: Make sure you have the NEW script deployed, not the old one.

### Check Your Apps Script:

1. **Go to Google Sheets**:
   ```
   https://docs.google.com/spreadsheets/d/1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo/edit
   ```

2. **Click**: Extensions → Apps Script

3. **Search in code** (Ctrl+F):
   - Search: `SEED_VARIETIES`

4. **Is it found?**
   - ✅ **YES**: You have the NEW script (correct!)
   - ❌ **NO**: You have the OLD script (need to update)

### If You Have OLD Script:

1. **Go to GitHub**:
   ```
   https://github.com/salmaanfarizi/productionsystem/blob/claude/update-department-structure-011CUM8sPnhDB1DXbRo5uqE4/google-apps-script/BatchTracking.js
   ```

2. **Click "Raw"** button

3. **Select All** (Ctrl+A) → **Copy** (Ctrl+C)

4. **Go back to Apps Script editor**

5. **Delete all old code**

6. **Paste the new code**

7. **Save** (Ctrl+S)

8. **Run**: Select `initializeSheets` function → Click "Run" ▶️

9. **Authorize** when prompted (Review Permissions → Allow)

10. **Check Google Sheets**: New sheet tabs should appear!

---

## 🧪 Step 4: Test Everything

### Test 1: Check Sheets Exist

Open your Google Sheets and verify these sheet tabs exist:

- ✅ Production Data
- ✅ WIP Inventory
- ✅ Batch Tracking
- ✅ Packing Transfers
- ✅ Finished Goods Inventory

**If missing**: Run `initializeSheets` in Apps Script (Step 3)

---

### Test 2: Test Inventory App

1. **Add test data** manually to "Finished Goods Inventory" sheet:

   Row 2:
   ```
   A: SUN-4402
   B: Sunflower Seeds
   C: Eastern Province
   D: 200 g
   E: 100
   F: 250
   G: LOW
   H: (current date)
   I: Test data
   ```

2. **Open Inventory app**: https://inventoryars.netlify.app

3. **Should see**:
   - ✅ Tabs: Finished Goods | WIP Inventory
   - ✅ Summary cards
   - ✅ Test row in the table

**If shows nothing**:
   - Check browser console (F12) for errors
   - Verify environment variables in Netlify
   - Make sure latest deployment is published

---

### Test 3: Test Production Entry

1. **Go to**: https://productionars.netlify.app

2. **Sign in** with Google

3. **Fill the form**:
   - Date: Today
   - Product Type: Sunflower Seeds
   - Seed Variety: T6
   - Size Range: 220-230
   - Variant/Region: Eastern Province
   - Bag Type: 25KG
   - Number of Bags: 10
   - (Fill other required fields)

4. **Submit**

5. **Check "Production Data" sheet**:
   - ✅ Should have new row
   - ✅ Column Q (Batch ID) should show: `WIP-SUN-241023-001` (or similar)

6. **Check "WIP Inventory" sheet**:
   - ✅ Should have new WIP batch
   - ✅ Status: ACTIVE
   - ✅ Seed Variety: T6

---

### Test 4: Test Packing

1. **Go to**: https://packingars.netlify.app

2. **Select**:
   - Product Type: Sunflower Seeds
   - Region: Eastern Province
   - SKU: SUN-4402

3. **Should show**:
   - ✅ "Available WIP: 1 batch"
   - ✅ Current stock (if any)
   - ✅ Recommendation

4. **Pack 10 bundles**

5. **Submit**

6. **Check results**:
   - ✅ Transfer PDF downloads
   - ✅ WIP Inventory: Consumed increases
   - ✅ Packing Transfers: New transfer record
   - ✅ Finished Goods: Stock increases

---

## 🔍 Troubleshooting

### Issue: "Inventory app still shows nothing"

**Check**:
1. ✅ Environment variables set in Netlify?
2. ✅ Latest deployment published?
3. ✅ Sheets exist with correct names?
4. ✅ At least one row of data in "Finished Goods Inventory"?

**Fix**:
- Open browser console (F12)
- Look for red errors
- Common issues:
  - "Failed to fetch" = Wrong API key or CORS issue
  - "Sheet not found" = Sheet doesn't exist or wrong name
  - "401 Unauthorized" = OAuth not configured

---

### Issue: "Can't sign in to apps"

**Check**:
1. ✅ OAuth Client ID set in Netlify?
2. ✅ User added to OAuth consent screen test users?

**Fix**:
- Go to: https://console.cloud.google.com/apis/credentials/consent
- Add user to "Test users"

---

### Issue: "No WIP available"

**Check**:
1. ✅ Did you create production entry first?
2. ✅ WIP Inventory sheet has ACTIVE batches?
3. ✅ Region names match exactly?

**Fix**:
- Create production entry via Production app
- Check WIP Inventory sheet has data
- Verify region is "Eastern Province" (not "Eastern Province Region")

---

## 📊 Current Setup Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Apps Script URL | ✅ Configured | In all 3 apps |
| Spreadsheet ID | ✅ Configured | 1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo |
| API Key | ⚠️ **TODO** | Add to .env.local and Netlify |
| OAuth Client ID | ⚠️ **TODO** | Add to .env.local and Netlify |
| Script Version | ❓ **Check** | Verify you have NEW script with SEED_VARIETIES |
| Sheets Created | ❓ **Check** | Run initializeSheets if missing |
| Netlify Deploy | ⚠️ **TODO** | Trigger after adding env vars |

---

## ✅ Complete Checklist

Before testing, make sure:

- [ ] NEW Google Apps Script installed and run (`initializeSheets`)
- [ ] All 5 sheets exist (Production Data, WIP Inventory, etc.)
- [ ] API Key added to all 3 `.env.local` files
- [ ] OAuth Client ID added to all 3 `.env.local` files
- [ ] Environment variables added to Netlify (all 3 sites)
- [ ] Netlify deployments triggered and completed
- [ ] Test data added to Finished Goods Inventory
- [ ] Tested Inventory app - shows data
- [ ] Tested Production app - creates entries
- [ ] Tested Packing app - finds WIP

---

## 🆘 Quick Commands Reference

### Run locally (for testing .env.local):
```bash
cd apps/production
npm run dev
# Open: http://localhost:5173
```

### Deploy to Netlify:
```
Netlify Dashboard → Site → Deploys → Trigger deploy → Clear cache and deploy
```

### Re-run script initialization:
```
Google Sheets → Extensions → Apps Script
→ Select: initializeSheets
→ Run
```

---

## 🎯 Next Steps

1. ✅ **Add API credentials** to `.env.local` files (Step 1)
2. ✅ **Deploy to Netlify** with environment variables (Step 2)
3. ✅ **Verify script version** (Step 3)
4. ✅ **Test everything** (Step 4)

Once all checkboxes are complete, your system will be fully operational! 🚀

---

**Need help?** Let me know which step you're stuck on!
