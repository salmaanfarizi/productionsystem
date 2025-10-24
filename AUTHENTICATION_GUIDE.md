# 🔐 Authentication Guide - Fix 401 Error

## What's Happening

You're seeing this error:
```
Error: HTTP error! status: 401
"Request had invalid authentication credentials. Expected OAuth 2 access token..."
```

**This is GOOD news!** It means:
- ✅ Your apps are deployed correctly
- ✅ The Google Sheets API is working
- ✅ Apps are trying to read/write data
- ❌ You just need to sign in with Google OAuth

---

## ⚡ Quick Fix (2 Minutes)

### Step 1: Open Your App

Go to one of your deployed apps:
- **Production**: https://productionars.netlify.app
- **Packing**: https://packingars.netlify.app
- **Inventory**: https://inventoryars.netlify.app

### Step 2: Look for "Sign in with Google" Button

The button should be in the **top-right corner** of the header.

**If you see it**:
1. ✅ Click the "Sign in with Google" button
2. ✅ Select your Google account
3. ✅ Click "Allow" when asked for permissions
4. ✅ Done! The 401 error should disappear

**If you DON'T see it**:
- The button might not be visible because environment variables are not configured in Netlify
- Continue to Step 3 below

---

## 🔧 Step 3: Configure Environment Variables in Netlify

You need to add your Google Cloud credentials to Netlify so the apps can authenticate.

### Get Your Credentials

1. **Go to Google Cloud Console**:
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **Get API Key**:
   - Look for "API keys" section
   - Click on your API key (or create one if you don't have it)
   - Click "Show key" and copy it
   - Example: `AIzaSyC1234567890abcdefghijklmnop`

3. **Get OAuth Client ID**:
   - Look for "OAuth 2.0 Client IDs" section
   - Click on your Web client
   - Copy the "Client ID"
   - Example: `123456789-abc123xyz.apps.googleusercontent.com`

### Add to Netlify (Repeat for All 3 Apps)

**For Production App**:

1. Go to: https://app.netlify.com/sites/productionars/configuration/env

2. Click "Add a variable" or "Add environment variable"

3. Add these 4 variables:

   | Variable Name | Value |
   |---------------|-------|
   | `VITE_GOOGLE_SHEETS_API_KEY` | (Your API key from step 2) |
   | `VITE_GOOGLE_CLIENT_ID` | (Your OAuth Client ID from step 3) |
   | `VITE_SPREADSHEET_ID` | `1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo` |
   | `VITE_APPS_SCRIPT_URL` | `https://script.google.com/macros/s/AKfycbweu8JzkGhLZ0DqYA45HOXh5zTgeUAl4V1BFMI1ed0m4wsYma7OAgmwFsrjQgWFCsll/exec` |

4. Click "Save"

**For Packing App**:

1. Go to: https://app.netlify.com/sites/packingars/configuration/env

2. Add the same 4 variables (same values as above)

**For Inventory App**:

1. Go to: https://app.netlify.com/sites/inventoryars/configuration/env

2. Add the same 4 variables (same values as above)

---

## 🚀 Step 4: Trigger Deployments

After adding environment variables, you need to redeploy all 3 apps:

**For Each App**:

1. Go to the Deploys tab:
   - Production: https://app.netlify.com/sites/productionars/deploys
   - Packing: https://app.netlify.com/sites/packingars/deploys
   - Inventory: https://app.netlify.com/sites/inventoryars/deploys

2. Click "Trigger deploy" button (top right)

3. Select "Clear cache and deploy site"

4. Wait 2-3 minutes for deployment to complete

5. You'll see a green checkmark when done

---

## ✅ Step 5: Add Your Email to OAuth Test Users

**IMPORTANT**: Your email must be added to OAuth consent screen test users!

1. **Go to OAuth Consent Screen**:
   ```
   https://console.cloud.google.com/apis/credentials/consent
   ```

2. **Scroll to "Test users" section**

3. **Click "Add Users"**

4. **Enter your email address** (the one you'll use to sign in)

5. **Click "Save"**

**Without this step**, you'll get an error saying "This app is blocked" when trying to sign in.

---

## 🧪 Step 6: Test Authentication

1. **Open Production app**: https://productionars.netlify.app

2. **You should now see** "Sign in with Google" button in the header

3. **Click the button**

4. **Select your Google account**

5. **Grant permissions** when prompted:
   - App needs to access Google Sheets
   - Click "Allow" or "Continue"

6. **You're signed in!** You should see:
   - Your profile picture or name in the header
   - "Sign Out" button appears
   - The form is now accessible

7. **Repeat for other apps** (Packing and Inventory)

---

## 🔍 Troubleshooting

### Issue: "Sign in with Google" button doesn't appear

**Check**:
1. ✅ Environment variables added to Netlify?
2. ✅ Deployment completed successfully?
3. ✅ Using the correct Netlify site URLs?

**Fix**:
- Wait for deployment to complete (check Netlify Deploys tab)
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser console (F12) for errors

---

### Issue: "This app is blocked" or "Access denied"

**Check**:
1. ✅ Your email added to OAuth consent screen test users?
2. ✅ Using the same Google account that's in test users?

**Fix**:
- Add your email to test users in Google Cloud Console
- Go to: https://console.cloud.google.com/apis/credentials/consent
- Add your email under "Test users"

---

### Issue: "Redirect URI mismatch"

**Check**:
1. ✅ Authorized JavaScript origins configured?
2. ✅ Authorized redirect URIs configured?

**Fix**:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your OAuth 2.0 Client ID
3. Under "Authorized JavaScript origins", add:
   ```
   https://productionars.netlify.app
   https://packingars.netlify.app
   https://inventoryars.netlify.app
   ```
4. Under "Authorized redirect URIs", add:
   ```
   https://productionars.netlify.app
   https://packingars.netlify.app
   https://inventoryars.netlify.app
   ```
5. Click "Save"

---

### Issue: Still getting 401 error after signing in

**Check**:
1. ✅ Signed in successfully (see profile picture in header)?
2. ✅ Token might have expired?

**Fix**:
- Sign out and sign in again
- The new code has auto token refresh (5-minute buffer)
- Clear browser cache and try again

---

## 📋 Complete Checklist

Before testing, make sure:

- [ ] API Key obtained from Google Cloud Console
- [ ] OAuth Client ID obtained from Google Cloud Console
- [ ] Environment variables added to Production app in Netlify
- [ ] Environment variables added to Packing app in Netlify
- [ ] Environment variables added to Inventory app in Netlify
- [ ] All 3 apps redeployed in Netlify
- [ ] Email added to OAuth consent screen test users
- [ ] Authorized origins/redirect URIs configured in OAuth client
- [ ] Signed in to Production app successfully
- [ ] Signed in to Packing app successfully
- [ ] Signed in to Inventory app successfully

---

## 🎯 What Happens After Authentication

Once you sign in:

1. **Production App**:
   - ✅ Can create production entries
   - ✅ Data written to "Production Data" sheet
   - ✅ WIP batches created automatically
   - ✅ Batch IDs generated (WIP-SUN-241024-001)

2. **Packing App**:
   - ✅ Priority dashboard shows items to pack
   - ✅ Can pack products
   - ✅ Transfer PDFs generate with batch numbers
   - ✅ Finished Goods Inventory updates

3. **Inventory App**:
   - ✅ View Finished Goods inventory
   - ✅ View WIP Inventory
   - ✅ Monitor batch queue
   - ✅ See product breakdowns

---

## 🆘 Still Having Issues?

If you're still seeing 401 errors after following all steps:

1. **Open browser console** (F12)
2. **Copy the full error message**
3. **Check which sheet/operation is failing**
4. **Verify**:
   - Spreadsheet ID is correct: `1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo`
   - Apps Script URL is correct (you provided)
   - You're signed in with the correct Google account

---

## ✅ Quick Summary

**The 401 error is an authentication issue**. To fix it:

1. ✅ Get API Key and OAuth Client ID from Google Cloud Console
2. ✅ Add environment variables to all 3 apps in Netlify
3. ✅ Trigger deployments for all 3 apps
4. ✅ Add your email to OAuth consent screen test users
5. ✅ Sign in with Google in each app
6. ✅ Grant permissions when prompted
7. ✅ Start using the apps!

**Time required**: 5-10 minutes

**Once done**: You'll never need to do this again. Authentication persists and tokens auto-refresh!

---

**Next**: After authentication is working, you can start testing the full workflow:
- Create production entry → Pack products → View inventory
- Test priority packing dashboard
- Generate transfer PDFs with batch numbers
- Verify batch traceability

🚀 Your production system is ready to go!
