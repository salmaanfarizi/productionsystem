# Popup Troubleshooting Guide

## Issue: Popups Not Showing Up

If the Low Stock Alert or Batch Label Popup aren't appearing, follow this checklist:

---

## 1️⃣ **Low Stock Alert Popup** (Packing App)

### When Should It Show?
- ✅ Automatically when you **sign in** to the Packing app
- ✅ After clicking the **"Low Stock"** button in the header
- ✅ Only if it **hasn't been dismissed today**

### Troubleshooting Steps

#### Step 1: Are You Authenticated?
The popup **only shows after signing in** with Google OAuth.

**Check:**
- [ ] Do you see a "Sign Out" button in the top right?
- [ ] Can you see the "Low Stock" button in the header?

**If NO**:
1. Click "Sign In with Google" button
2. Select your Google account
3. Grant permissions
4. Wait for redirect

#### Step 2: Was It Dismissed Today?
The popup remembers if you clicked "Don't Show Today".

**Check localStorage:**
1. Open browser DevTools (F12)
2. Go to "Application" tab → "Local Storage"
3. Look for key: `lowStockAlertDismissed`
4. Check value: If it's today's date (YYYY-MM-DD), popup won't show

**To reset:**
```javascript
// In browser console (F12):
localStorage.removeItem('lowStockAlertDismissed');
location.reload();
```

#### Step 3: Are There Low Stock Items?
The popup only shows items where:
- Minimum Stock > 0 **AND**
- Current Stock < Minimum Stock

**Check your "Finished Goods Inventory" sheet:**
1. Open Google Sheet
2. Go to "Finished Goods Inventory" tab
3. Check if any rows have:
   - Column H (Minimum Stock) > 0
   - Column G (Current Stock) < Column H

**Example:**
```
SKU      | Current Stock | Minimum Stock | Will Show?
SUN-4401 | 50           | 250          | ✅ YES (50 < 250)
SUN-4402 | 500          | 250          | ❌ NO (500 >= 250)
PUM-8001 | 0            | 0            | ❌ NO (minimum is 0)
```

**If no items match**, popup will show but display "No low stock items found".

#### Step 4: Check Browser Console
1. Open DevTools (F12)
2. Go to "Console" tab
3. Look for errors like:
   - `Failed to load Finished Goods Inventory`
   - `Cannot read property 'Current Stock'`
   - `API error: 401 UNAUTHENTICATED`

#### Step 5: Verify Code Is Deployed
**For Netlify deployment:**
1. Go to: https://packingars.netlify.app
2. Open DevTools → Sources tab
3. Check if `LowStockAlert.jsx` exists in the bundle
4. Look for the latest commit hash in the footer or About page

**If using old version:**
- Redeploy from the latest branch
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+Shift+R)

---

## 2️⃣ **Batch Label Popup** (After Packing Submission)

### When Should It Show?
- ✅ **After** successfully submitting a packing entry
- ✅ Shows the generated packet label (e.g., `241025-RR-001`)
- ✅ Appears **automatically** (no button needed)

### Troubleshooting Steps

#### Step 1: Did Packing Submission Succeed?
The popup only shows **after a successful** packing entry.

**Check for success message:**
- [ ] Do you see: "✓ Transfer TRF-XXXXXX-XXX completed! PDF downloaded."?
- [ ] Did a PDF download?
- [ ] Did the form reset (units packed field cleared)?

**If NO**:
- Packing failed, so popup won't show
- Check error message in the form
- Common errors:
  - "No WIP available for this product"
  - "Insufficient WIP"
  - "Please authenticate first"

#### Step 2: Check Google Sheet Has Column R
**CRITICAL**: The sheet must have 18 columns (not 17).

**Verify:**
1. Open Google Sheet
2. Go to "Packing Transfers" tab
3. Check header row has **column R: "Packet Label"**
4. Count columns: Should be **18 total**

**If column R is missing:**
1. Add column R header: `Packet Label`
2. See: `GOOGLE_SHEET_UPDATE_REQUIRED.md`
3. Without this column, the code might error

#### Step 3: Check Browser Console for Errors
1. Open DevTools (F12)
2. Go to Console tab
3. Submit a packing entry
4. Look for errors:
   - `Could not load existing labels` (warning - OK)
   - `Failed to generate packet label`
   - `TypeError: Cannot read property 'WIP Batch ID'`
   - `Append failed: Column count mismatch`

**If you see "Column count mismatch":**
- Google Sheet has wrong number of columns
- Add column R (see Step 2 above)

#### Step 4: Verify labelData Is Set
In the browser console, after submitting packing:

```javascript
// Add this temporarily to PackingFormNew.jsx after line 389:
console.log('Label Data:', labelData);
console.log('Show Popup:', showLabelPopup);
```

**Expected output:**
```
Label Data: {
  transferId: "TRF-251025-001",
  wipBatchId: "WIP-SUN-251024-001",
  region: "Riyadh",
  date: "2025-10-25",
  sequence: 1,
  ...
}
Show Popup: true
```

**If labelData is null or showLabelPopup is false:**
- Code isn't reaching the popup trigger
- Check for earlier errors in handleSubmit

#### Step 5: Check Popup Component Exists
**Verify BatchLabelPopup is built:**
1. Open DevTools → Network tab
2. Hard refresh (Ctrl+Shift+R)
3. Look for bundle containing `BatchLabelPopup`
4. Check file exists: `apps/packing/src/components/BatchLabelPopup.jsx`

#### Step 6: Test Popup Manually
**Force the popup to show (for debugging):**

Add this button temporarily to PackingFormNew.jsx:

```jsx
{/* DEBUG: Remove after testing */}
<button
  type="button"
  onClick={() => {
    setLabelData({
      transferId: "TEST-001",
      wipBatchId: "WIP-SUN-251025-001",
      region: "Riyadh",
      date: "2025-10-25",
      productName: "Sunflower Seeds",
      packageSize: "100 g",
      packagingType: "bundle",
      unitsPacked: "100",
      totalUnits: 500,
      unitType: "bags",
      weight: "0.100",
      operator: "Test",
      sequence: 1
    });
    setShowLabelPopup(true);
  }}
  className="w-full mt-4 btn btn-secondary"
>
  🧪 TEST: Show Batch Label Popup
</button>
```

**If test button works but real submission doesn't:**
- Issue is in the submission flow, not the popup
- Check handleSubmit errors

---

## 3️⃣ **General Troubleshooting**

### Clear Everything and Start Fresh

**Step 1: Clear Browser Data**
1. Press Ctrl+Shift+Delete
2. Select "All time"
3. Check:
   - ✅ Cookies and other site data
   - ✅ Cached images and files
4. Clear data

**Step 2: Clear localStorage**
```javascript
// In console (F12):
localStorage.clear();
location.reload();
```

**Step 3: Hard Refresh**
- Windows/Linux: Ctrl+Shift+R
- Mac: Cmd+Shift+R

**Step 4: Redeploy Latest Code**
```bash
# In terminal:
git pull origin claude/investigate-project-issues-011CURBwVpKVZaje5WGHbeHR
npm install
npm run build:packing

# Then deploy to Netlify
```

---

## 4️⃣ **Quick Diagnostics Script**

Run this in the browser console (F12) while on the Packing app:

```javascript
// === POPUP DIAGNOSTIC SCRIPT ===
console.log('=== POPUP DIAGNOSTICS ===');

// Check authentication
console.log('1. Is Authenticated:', !!localStorage.getItem('gapi_access_token'));

// Check low stock dismissal
const dismissed = localStorage.getItem('lowStockAlertDismissed');
const today = new Date().toISOString().split('T')[0];
console.log('2. Low Stock Dismissed:', dismissed);
console.log('   Today:', today);
console.log('   Will Show:', dismissed !== today);

// Check if components exist
console.log('3. LowStockAlert exists:', typeof LowStockAlert !== 'undefined');
console.log('   BatchLabelPopup exists:', typeof BatchLabelPopup !== 'undefined');

// Check React DevTools
console.log('4. React DevTools:', typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' ? 'Installed' : 'Not Installed');

console.log('=== END DIAGNOSTICS ===');
```

---

## 5️⃣ **Expected Behavior**

### Low Stock Alert:
1. **Sign in** → Popup shows after 1 second
2. Click **"Don't Show Today"** → Popup dismissed until tomorrow
3. Click **"Low Stock" button** → Popup shows again
4. **Tomorrow** → Popup shows automatically again on login

### Batch Label Popup:
1. Fill out packing form
2. Click **"Record Packing & Generate PDF"**
3. Wait for success message
4. Popup shows **immediately** with label
5. Click **"Print Label"** → Print dialog opens
6. Click **"Close"** → Popup disappears

---

## 6️⃣ **Still Not Working?**

### Check These Files Exist:
- [ ] `apps/packing/src/components/LowStockAlert.jsx`
- [ ] `apps/packing/src/components/BatchLabelPopup.jsx`
- [ ] `shared/utils/packetLabelGenerator.js`

### Verify Latest Code:
```bash
git log --oneline -5
# Should show:
# 147a49e Add documentation for required Google Sheet structure update
# 8128c2e Fix batch label sequence calculation - was hardcoded to 1
# e65e9ca Implement user-requested features: Low Stock Alert, Batch Labels, and PDF Export
```

### Check Deploy:
- Netlify should be deploying from branch: `claude/investigate-project-issues-011CURBwVpKVZaje5WGHbeHR`
- Check Netlify deploy logs for errors
- Verify environment variables are set (VITE_GOOGLE_CLIENT_ID, etc.)

---

## 7️⃣ **Common Issues & Solutions**

| Issue | Solution |
|-------|----------|
| "Low Stock Alert never shows" | Clear localStorage, check authentication |
| "Batch popup shows blank" | Check labelData has all required fields |
| "Popup shows then immediately closes" | Check z-index, no parent onClick closing it |
| "Nothing happens after packing submit" | Check console for errors, verify sheet column count |
| "Popup works locally but not on Netlify" | Redeploy latest code, check env vars |

---

**Need More Help?**

1. Share console errors (F12 → Console tab)
2. Share Network tab errors (F12 → Network → look for failed requests)
3. Confirm which popup isn't showing (Low Stock or Batch Label)
4. Confirm environment (local dev or deployed Netlify)

---

Last Updated: October 25, 2025
