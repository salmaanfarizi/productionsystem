# Store Update Sync — setup

The store sync copies the daily **STORE UPDATE** tabs from the store sheet
("Packing and dispach 2026") into the apps' database ("Enhanced Production
Tracking System"), so the apps show the same numbers the store team types every day.

- The store sheet is only **read**. Staff keep filling it in exactly as today.
- The sync runs every hour and re-reads the last 14 days, so corrections are picked up.
- Store codes (4402, 4408, 8005, …) are the official item codes.

## What it creates in the database

| Tab | What it holds | Who edits it |
|---|---|---|
| `Item Master` | One row per item: store code, group, pack size, kg per unit, packing minutes, notes | You — the master list |
| `Material Master` | Packing materials: cartons, rolls, covers, tape | You |
| `FG Daily` | One row per item per day: opening, production, despatch, closing, min level, orders | The sync only — don't edit |
| `Sync Issues` | Problems found on the store sheet (see below) | The sync only |
| `Store Movements` | Packed / despatched entries made in the Packing app (Step 3) | The Packing app only — don't edit |
| `Parallel Check` | App entries compared with the store sheet, per day and item | The sync only |

The **Inventory app** shows `FG Daily` on its new **Store Update** tab, and the
**Packing app** low-stock popup uses it (with packing minutes from `Item Master`).

## One-time setup (about 10 minutes)

Use the Google account that owns both spreadsheets.

1. Open [script.google.com](https://script.google.com) → **New project**. Name it `ARS Store Sync`.
2. **Project Settings** (gear icon) → **Time zone** → `(GMT+03:00) Riyadh`.
3. In the editor, create three script files and paste the matching file from this folder into each:
   - `StoreUpdateParser` ← `StoreUpdateParser.js`
   - `ItemMasterSeed` ← `ItemMasterSeed.js`
   - `StoreUpdateSync` ← `StoreUpdateSync.js`

   Delete the empty `myFunction` in `Code.gs` (or delete `Code.gs`).
4. At the top of `StoreUpdateSync`, fill in `SYNC_CONFIG`:
   - `STORE_SPREADSHEET_ID` — the ID of "Packing and dispach 2026"
   - `DATABASE_SPREADSHEET_ID` — the ID of "Enhanced Production Tracking System"

   The ID is the long part of the sheet's URL between `/d/` and `/edit`.
5. Choose **`setupConsolidation`** in the function list and click **Run**.
   Google asks for permission the first time: **Review permissions** → pick your account →
   **Advanced** → **Go to ARS Store Sync** → **Allow**.
   The execution log should end with something like
   `Full sync done: 70 tabs read, 2672 rows in FG Daily, 65 issues.`
6. Choose **`installAutoSync`** and click **Run**. The sync now runs every hour.
7. Open the database spreadsheet and check the new tabs (see "After setup").

Running `setupConsolidation` again is safe: it only adds missing master rows and reloads the data.

## After setup

1. **Item Master → Notes column.** A few items need a decision on the store sheet:
   - `1126` is used for both the PRM and STD 10 kg sunflower — give STD its own code.
   - Melon 10 kg items use temporary codes `1`, `2`, `3`, `4` — give them real codes.
   - `Packing Minutes per Unit` is only filled for 4 products. Fill in the rest so the
     packing popup can estimate time for every item.
2. **Sync Issues.** Fix what you can on the store sheet; the list refreshes every hour.
3. When you change a code on the store sheet, change it in `Item Master` too
   (column `Code`, and `Match Words` if you use them), then run **`rebuildStoreUpdates`**.

## Step 3 — store entry in the Packing app (trial)

The Packing app has a **Store Entry** tab where the store team records what was
**packed** (received into the store) and **despatched** (sent out), per item.
Each saved line becomes a row in `Store Movements`. Mistakes are fixed with
**Cancel**, which marks the row `CANCELLED` and keeps it for the record.

### Turning it on

If you set up the sync before Step 3, update the script once:

1. In the `ARS Store Sync` project, replace the contents of `StoreUpdateParser`,
   `ItemMasterSeed` and `StoreUpdateSync` with the files from this folder
   (keep your two IDs in `SYNC_CONFIG`).
2. Run **`setupConsolidation`** again. It adds the `Store Movements` and
   `Parallel Check` tabs; everything else stays as it is.

Until those tabs exist, the Packing app opens on **Batch Packing** as before.

### Running the trial (about two weeks)

1. The store team enters every packed and despatched quantity in the Packing app
   **and** keeps filling the store sheet as usual.
2. Every hour the sync fills `Parallel Check` for each day that has app entries:
   sheet totals next to app totals, with the result `Match`, `Different` or
   `Not on store sheet`.
3. The Inventory app shows the same comparison on the **Store Update** tab
   ("App entries vs store sheet") for the selected day.
4. Look at the differences every day and find out which side is wrong.
   When several days in a row match, the app entry is ready to replace typing
   the numbers into the store sheet. The next step then generates the daily
   STORE UPDATE tab from the app entries.

## Sync Issues explained

| Issue | Meaning |
|---|---|
| Opening differs from previous closing | The opening was typed over instead of carried from the day before |
| Closing does not add up | Closing ≠ Opening + Production − Despatch |
| Negative closing | More despatched than in stock |
| Duplicate item | The same item appears twice on one day |
| Code differs from Item Master | The name matches an item, but the code on the sheet is different (codes were swapped) — listed once with the date range |
| Unknown item | Code and name don't match any `Item Master` row — add the item |
| Not a number | Text or `#REF!` in a number column |
| No date / No item table | A tab has the store update title but its layout couldn't be read |

## Editing the Item Master

- `Item Key` must be unique. Keep existing keys — `FG Daily` rows point to them.
- `Group` is one of `REG` (Regular), `RUH` (Riyadh), `QAT` (Qatar), `BAH` (Bahrain),
  `MP` (Melon & pumpkin), `POP` (Popcorn), `CC` (Cotton candy) — it comes from the
  section title on the store sheet.
- `Match Words` (comma-separated) tell apart items that share a code in the same group:
  every word must appear in the item name on the store sheet. Leave blank when the code
  is enough.
- `Active` is for information only for now: `NO` marks items no longer on the store sheet.
- After editing, run **`rebuildStoreUpdates`** so the whole history uses the change.

A new product on the store sheet still syncs before it's in `Item Master`: it appears in
the apps under its group and in `Sync Issues` as "Unknown item" until you add it.
A new *section* (for example a new country) shows under "Other" until it's added to
`STORE_GROUPS` in `StoreUpdateParser.js` and `shared/utils/storeUpdate.js`.

## Functions

| Function | Use |
|---|---|
| `setupConsolidation` | First run (or after updating the script): creates missing tabs, adds master rows, loads every day |
| `syncStoreUpdates` | Hourly sync (last 14 days) |
| `rebuildStoreUpdates` | Re-read every day — after editing `Item Master` or correcting old days |
| `installAutoSync` / `removeAutoSync` | Turn the hourly sync on / off |

## Notes

- `FG Daily` lives in the apps' database, so anyone who can read that spreadsheet
  (including the apps' API key) can read it — the same as the existing stock tabs.
- The store sheet already runs its own script (min-level suggestions, dashboard).
  This sync is a separate project and never writes to the store sheet.

## Tests

The sync logic runs under Node with small stand-ins for the Apps Script services:

```bash
npm run test:apps-script
```
