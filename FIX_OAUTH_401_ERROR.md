# Fix OAuth 401 Authentication Error

Error: `HTTP error! status: 401, UNAUTHENTICATED`

This means Google OAuth authentication is not configured correctly.

---

## 🔍 Which App Has This Error?

First, identify which app is showing this error:
- productionars.netlify.app
- packingars.netlify.app
- inventoryars.netlify.app

**Note**: If it's **inventoryars**, this app should NOT use OAuth (it's read-only). The error would indicate wrong setup.

---

## ✅ Fix Steps (10 minutes)

### Step 1: Check Environment Variables in Netlify

For **Production App** and **Packing App** (both need OAuth):

1. **Go to**: https://app.netlify.com/
2. **Select**: The site with the error (productionars or packingars)
3. **Navigate**: Site settings → Environment variables
4. **Verify these 3 variables exist**:
   ```
   VITE_GOOGLE_SHEETS_API_KEY
   VITE_GOOGLE_CLIENT_ID
   VITE_SPREADSHEET_ID
   ```

#### If Missing or Wrong:

**Add/Update the variables:**

```
Variable: VITE_GOOGLE_CLIENT_ID
Value: YOUR_CLIENT_ID.apps.googleusercontent.com
```

**Where to get this:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Copy the "Client ID" (ends with `.apps.googleusercontent.com`)

**After adding/updating:**
1. Go to: Deploys tab
2. Click: "Trigger deploy" → "Clear cache and deploy site"
3. Wait 2-3 minutes

---

### Step 2: Add Netlify URLs to Google OAuth Authorized Origins

This is the MOST COMMON cause of 401 errors.

1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Click** on your OAuth 2.0 Client ID
3. **Under "Authorized JavaScript origins"**, check if these URLs are listed:
   ```
   https://productionars.netlify.app
   https://packingars.netlify.app
   ```

#### If Missing:

4. **Click**: "ADD URI"
5. **Add each URL** (one at a time):
   ```
   https://productionars.netlify.app
   ```
   Click "ADD URI" again:
   ```
   https://packingars.netlify.app
   ```
6. **Click**: "SAVE" at the bottom
7. **WAIT 5-10 MINUTES** for Google to propagate changes globally

**Important Notes:**
- Must use `https://` (not `http://`)
- No trailing slash: ✅ `https://productionars.netlify.app`
- With slash is wrong: ❌ `https://productionars.netlify.app/`
- Must match EXACTLY

---

### Step 3: Clear Browser Cache and Test

After waiting 10 minutes:

1. **Open browser in Incognito/Private mode**
2. **Visit**: https://productionars.netlify.app (or whichever had the error)
3. **Click**: "Sign In with Google"
4. **Should work now** ✅

If still not working, try:
- Clear browser cache and cookies completely
- Wait another 5 minutes (OAuth changes can take time)
- Try different browser

---

## 🐛 Common Causes & Solutions

### Cause 1: Environment Variable Not Set

**Symptom**: Error appears immediately when trying to sign in

**Check**:
- Netlify → Site settings → Environment variables
- Verify `VITE_GOOGLE_CLIENT_ID` exists and is correct

**Fix**:
- Add the variable
- Redeploy the site

---

### Cause 2: Netlify URL Not in OAuth Origins

**Symptom**: OAuth popup appears but fails with 401

**Check**:
- Google Cloud Console → Credentials
- Verify Netlify URL is in "Authorized JavaScript origins"

**Fix**:
- Add Netlify URL to authorized origins
- Wait 10 minutes
- Test in incognito mode

---

### Cause 3: Wrong Client ID

**Symptom**: Consistent 401 errors

**Check**:
- Compare Client ID in Netlify with one in Google Cloud Console
- Must end with `.apps.googleusercontent.com`

**Fix**:
- Copy correct Client ID from Google Cloud
- Update in Netlify environment variables
- Redeploy

---

### Cause 4: OAuth Consent Screen Not Configured

**Symptom**: 401 error or "app not verified" warning

**Check**:
- Google Cloud Console → OAuth consent screen
- Must be configured with at least "Internal" or "External"

**Fix**:
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Configure consent screen:
   - App name: "Production System"
   - User support email: your email
   - Developer contact: your email
3. Add scopes:
   - `https://www.googleapis.com/auth/spreadsheets`
4. Save

---

## 📋 Quick Checklist

### In Google Cloud Console:
- [ ] OAuth 2.0 Client ID exists
- [ ] Client ID copied correctly
- [ ] Authorized JavaScript origins includes:
  - [ ] `https://productionars.netlify.app`
  - [ ] `https://packingars.netlify.app`
- [ ] OAuth consent screen configured
- [ ] Scopes include Google Sheets API

### In Netlify (for Production & Packing):
- [ ] `VITE_GOOGLE_CLIENT_ID` environment variable set
- [ ] Variable value matches Google Cloud Client ID
- [ ] `VITE_GOOGLE_SHEETS_API_KEY` set
- [ ] `VITE_SPREADSHEET_ID` set
- [ ] Site redeployed after adding variables

### Testing:
- [ ] Waited 10 minutes after OAuth changes
- [ ] Tested in incognito/private browser
- [ ] Cleared browser cache
- [ ] Sign in works ✅

---

## 🔍 How to Debug

### Check What Client ID the App is Using:

1. Open the app in browser
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for errors showing Client ID
5. Verify it matches Google Cloud Console

### Check Network Requests:

1. Open DevTools → Network tab
2. Try to sign in
3. Look for failed requests
4. Check request headers for authentication info

---

## ⚠️ Special Case: Inventory App

**Inventory app should NOT have this error** because it doesn't use OAuth.

If inventoryars.netlify.app shows this error:
- It means the app is trying to authenticate when it shouldn't
- Check that you're deploying the correct app (apps/inventory)
- Verify environment variables: Should have only 2 vars (not 3)
  - ✅ `VITE_GOOGLE_SHEETS_API_KEY`
  - ✅ `VITE_SPREADSHEET_ID`
  - ❌ Should NOT have `VITE_GOOGLE_CLIENT_ID`

---

## 🎯 Most Likely Fix

**90% of the time, this is the issue:**

1. Netlify URL not in Google OAuth authorized origins
2. Need to wait 10 minutes after adding it

**Quick fix:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your OAuth Client ID
3. Add: `https://productionars.netlify.app` and `https://packingars.netlify.app`
4. Save
5. Wait 10 minutes
6. Clear browser cache
7. Test in incognito mode

---

## 📞 Still Not Working?

If error persists after trying all above:

1. **Screenshot the error** (including full error message)
2. **Check Netlify deploy logs** for any environment variable warnings
3. **Verify Google Cloud Project**:
   - APIs enabled (Sheets API, OAuth)
   - Billing enabled (if required)
   - Correct project selected
4. **Check browser console** for detailed error messages

---

## ✅ Success Criteria

You'll know it's fixed when:
- Click "Sign In with Google" button
- Google sign-in popup appears
- Select your Google account
- Grant permissions
- Popup closes and you're signed in
- Can access the form

---

Last Updated: October 24, 2025
