# Custom Domain Setup (abusalim.sa)

## Goal
Change your app URLs from:
- ❌ `productionars.netlify.app`
- ❌ `packingars.netlify.app`
- ❌ `inventoryars.netlify.app`

To:
- ✅ `production.abusalim.sa`
- ✅ `packing.abusalim.sa`
- ✅ `inventory.abusalim.sa`

---

## Quick Summary

You need 3 things:
1. **Netlify**: Add custom domains to each site
2. **DNS**: Add 3 CNAME records pointing to netlify.app
3. **Google OAuth**: Add new domains to authorized origins

---

## Step 1: Add Custom Domain in Netlify

### For Production App (productionars):

1. Go to https://app.netlify.com
2. Click on `productionars` site
3. Click "Domain settings"
4. Click "Add custom domain"
5. Enter: `production.abusalim.sa`
6. Click "Verify" → "Add domain"

### For Packing App (packingars):

1. Click on `packingars` site
2. Domain settings → Add custom domain
3. Enter: `packing.abusalim.sa`
4. Verify and add

### For Inventory App (inventoryars):

1. Click on `inventoryars` site
2. Domain settings → Add custom domain
3. Enter: `inventory.abusalim.sa`
4. Verify and add

---

## Step 2: Add DNS Records

Go to your domain registrar (where you bought `abusalim.sa`) and add these **CNAME records**:

### DNS Records:

```
Type: CNAME
Name: production
Value: productionars.netlify.app
TTL: Auto (or 3600)

Type: CNAME
Name: packing
Value: packingars.netlify.app
TTL: Auto

Type: CNAME
Name: inventory
Value: inventoryars.netlify.app
TTL: Auto
```

### Where to Add DNS Records:

**GoDaddy**:
- My Products → DNS (next to abusalim.sa) → Add CNAME records

**Namecheap**:
- Domain List → Manage → Advanced DNS → Add CNAME

**Google Domains**:
- domains.google.com → abusalim.sa → DNS → Add CNAME

**Cloudflare**:
- Dashboard → abusalim.sa → DNS → Add CNAME
- **Important**: Set to "DNS only" (grey cloud icon)

---

## Step 3: Wait for DNS Propagation

**Time**: Usually 5-30 minutes (can take up to 48 hours)

**Check if ready**:
```bash
nslookup production.abusalim.sa
# Should show: CNAME → productionars.netlify.app
```

Or use: https://dnschecker.org

---

## Step 4: Enable HTTPS in Netlify

After DNS propagates:

1. Go to each Netlify site
2. Domain settings
3. HTTPS section
4. Click "Verify DNS configuration"
5. Click "Provision certificate" (if not automatic)
6. Wait 1-5 minutes for SSL certificate

Netlify automatically:
- Provides free SSL (Let's Encrypt)
- Enables HTTPS
- Redirects HTTP → HTTPS

---

## Step 5: Update Google OAuth Settings

**CRITICAL** - Without this, login will fail!

1. Go to https://console.cloud.google.com
2. APIs & Services → Credentials
3. Click your OAuth 2.0 Client ID
4. Add to **Authorized JavaScript origins**:
   ```
   https://production.abusalim.sa
   https://packing.abusalim.sa
   ```
5. Add to **Authorized redirect URIs**:
   ```
   https://production.abusalim.sa
   https://packing.abusalim.sa
   ```
6. Keep old netlify.app URLs (for now)
7. Click **Save**

---

## Step 6: Test Your New Domains

### Test Production:
1. Open: `https://production.abusalim.sa`
2. Sign in with Google
3. Create a test production entry
4. ✅ Should work perfectly

### Test Packing:
1. Open: `https://packing.abusalim.sa`
2. Sign in with Google
3. Generate a label
4. Submit packing entry
5. ✅ Should work perfectly

### Test Inventory:
1. Open: `https://inventory.abusalim.sa`
2. Check WIP inventory loads
3. Check Finished Goods loads
4. ✅ Should work perfectly

---

## Troubleshooting

### "DNS record not found"
- Wait longer (up to 48 hours)
- Check CNAME records are correct
- Verify Name = `production` (not `production.abusalim.sa`)

### "Certificate provisioning failed"
- Verify DNS CNAME is correct
- If using Cloudflare: Use "DNS only" mode
- Remove and re-add domain in Netlify

### "OAuth error / 401 Unauthorized"
- Add new domains to Google Cloud Console
- Check both "Authorized origins" and "Redirect URIs"
- Clear browser cache

### "Site not loading"
- Check DNS: https://dnschecker.org
- Verify CNAME points to correct netlify.app
- Check Netlify shows domain as "Verified"

---

## Summary Checklist

- [ ] Add 3 custom domains in Netlify
- [ ] Add 3 CNAME records in DNS
- [ ] Wait for DNS propagation (5-30 min)
- [ ] Verify SSL certificates auto-provisioned
- [ ] Update Google OAuth with new domains
- [ ] Test production.abusalim.sa
- [ ] Test packing.abusalim.sa
- [ ] Test inventory.abusalim.sa
- [ ] Test Google sign-in on all apps
- [ ] Remove old netlify.app URLs from Google OAuth (optional)

---

## Timeline

| Time    | Action |
|---------|--------|
| 0 min   | Add domains in Netlify |
| 0 min   | Add CNAME records in DNS |
| 5-30 min| DNS propagates |
| 30 min  | Netlify verifies DNS |
| 35 min  | SSL certificates provisioned |
| 40 min  | Sites accessible on new domains ✅ |

---

## Example: Final DNS Configuration

Your DNS should look like this:

| Type  | Name       | Value                     | TTL  |
|-------|------------|---------------------------|------|
| CNAME | production | productionars.netlify.app | Auto |
| CNAME | packing    | packingars.netlify.app    | Auto |
| CNAME | inventory  | inventoryars.netlify.app  | Auto |

---

## Need Help?

**DNS Checker**: https://dnschecker.org
**Netlify Docs**: https://docs.netlify.com/domains-https/custom-domains/
**Google OAuth**: https://console.cloud.google.com/apis/credentials

---

Last Updated: October 26, 2025
