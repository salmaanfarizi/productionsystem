# ⚡ Easy Deployment Guide (5 Minutes)

## 🎯 Quick Fix: Deploy Your Changes Now

Your code is ready, just needs Netlify to deploy it!

---

## 📱 Step 1: Configure Netlify (One Time Setup)

### For Production App:

1. **Go to**: https://app.netlify.com/sites/productionars/settings/deploys

2. **Scroll down** to "Deploy settings" section

3. **Find**: "Branch to deploy" (should show "main" or something else)

4. **Click**: "Edit settings" button

5. **Change branch to**:
   ```
   claude/update-department-structure-011CUM8sPnhDB1DXbRo5uqE4
   ```

6. **Click**: "Save"

### For Packing App:

1. **Go to**: https://app.netlify.com/sites/packingars/settings/deploys

2. **Repeat steps 2-6** above

### For Inventory App:

1. **Go to**: https://app.netlify.com/sites/inventoryars/settings/deploys

2. **Repeat steps 2-6** above

---

## 🚀 Step 2: Trigger Deploy (For Each App)

### Production App:
1. Go to: https://app.netlify.com/sites/productionars/deploys
2. Click **"Trigger deploy"** button (top right)
3. Select **"Clear cache and deploy site"**
4. Wait 2-3 minutes ⏳

### Packing App:
1. Go to: https://app.netlify.com/sites/packingars/deploys
2. Click **"Trigger deploy"**
3. Select **"Clear cache and deploy site"**
4. Wait 2-3 minutes ⏳

### Inventory App:
1. Go to: https://app.netlify.com/sites/inventoryars/deploys
2. Click **"Trigger deploy"**
3. Select **"Clear cache and deploy site"**
4. Wait 2-3 minutes ⏳

---

## ✅ Step 3: Verify Deployment

After 2-3 minutes, check each deploy:

**Production**: https://app.netlify.com/sites/productionars/deploys
- Should show: "Published" with green checkmark ✅
- Time: Just now

**Packing**: https://app.netlify.com/sites/packingars/deploys
- Should show: "Published" with green checkmark ✅

**Inventory**: https://app.netlify.com/sites/inventoryars/deploys
- Should show: "Published" with green checkmark ✅

---

## 🧪 Step 4: Test the Fix

Once all deployed (green checkmarks):

1. **Open Packing App**: https://packingars.netlify.app

2. **Select**:
   - Product Type: Sunflower Seeds
   - Region: Eastern Province
   - SKU: Any Sunflower SKU

3. **Check**: Should now show "Available WIP: X batch(es)" ✅

4. **If still shows "No WIP available"**:
   - Check if you have ACTIVE WIP batches in Google Sheets
   - Verify "WIP Inventory" sheet has data with Status = ACTIVE
   - Verify Region column shows "Eastern Province" (NOT "Eastern Province Region")

---

## 🎯 That's It!

Your changes will be live once you:
- ✅ Configure branch in Netlify (Step 1) - One time
- ✅ Trigger deploy (Step 2) - Takes 2-3 minutes
- ✅ Test (Step 4)

---

## 📸 Visual Guide

### What "Trigger Deploy" Button Looks Like:
```
┌─────────────────────────────────────┐
│  Deploys  Settings                  │
│                                     │
│  [Trigger deploy ▼]  <- Click here │
│                                     │
│  Production deploys                 │
│  ✓ Published                        │
└─────────────────────────────────────┘
```

### What "Clear cache and deploy site" Means:
```
Trigger deploy
  ├─ Deploy site          <- Don't use this
  └─ Clear cache and deploy site  <- Use THIS one
```

---

## ❓ Troubleshooting

### "I don't see the branch option"
- Make sure you're logged into Netlify
- Make sure you're in Site Settings → Build & deploy → Deploy settings

### "Deployment failed"
- Check the deploy log in Netlify
- Look for red error messages
- Most common: Missing environment variables

### "Still showing No WIP available"
- Wait 5 minutes for browser cache to clear
- Try hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Check Google Sheets has WIP Inventory with ACTIVE batches

---

## 🆘 Need Help?

If you get stuck at any step, let me know:
- Which app (Production/Packing/Inventory)?
- Which step (1, 2, 3, or 4)?
- What error message (if any)?

I'll help you fix it! 🚀
