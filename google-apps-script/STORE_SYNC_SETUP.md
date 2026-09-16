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
| `Item Materials` | Packing materials one unit of each item uses (Step 4) | You — except `Suggested per Unit`, which the sync fills |
| `Material Issues` | Rolls, covers and cartons issued, from the daily tabs | The sync only |
| `Material Movements` | Deliveries and stock counts entered in the Packing app | The Packing app only — don't edit |
| `Material Stock` | Balance, daily use, days left and status per material | The sync only |

The **Inventory app** shows `FG Daily` on its new **Store Update** tab, and the
**Packing app** low-stock popup uses it (with packing minutes from `Item Master`).

## One-time setup (about 10 minutes)

Use the Google account that owns both spreadsheets.

1. Open [script.google.com](https://script.google.com) → **New project**. Name it `ARS Store Sync`.
2. **Project Settings** (gear icon) → **Time zone** → `(GMT+03:00) Riyadh`.
3. In the editor, create four script files and paste the matching file from this folder into each:
   - `StoreUpdateParser` ← `StoreUpdateParser.js`
   - `ItemMasterSeed` ← `ItemMasterSeed.js`
   - `MaterialStock` ← `MaterialStock.js`
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

1. In the `ARS Store Sync` project, replace the script files with the ones from this
   folder (keep your IDs in `SYNC_CONFIG`).
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

## Step 4 — packing material stock

Material stock updates itself from what the store team already writes on the daily
store sheet: the **ROLLS ISSUED** and **COVER/CARTON ISSUED** blocks. Deliveries and
physical counts are entered in the Packing app (**Materials** tab). Every hour the sync
works out, per material:

**Balance = last stock count + deliveries after it − use after it**

- A **stock count** is what is on the shelf at the end of its day.
- **Use** comes from the store sheet for materials that have `Store Sheet Names` in
  `Material Master`. Materials the sheet never mentions (for example the 130/150 g box
  cartons) are used up from packing instead: units packed (FG Daily production) ×
  `Qty per Unit` in `Item Materials`.
- **Avg Daily Use** = use in the last 30 store days ÷ 30; **Days Left** = balance ÷ daily use.
- **Status** uses the same bands as the old PACKING STOCK sheet: `Reorder now` (under 30
  days), `Plan reorder` (30–60), `Healthy` (over 60). `Check count` means the balance went
  below zero; `No count` means the material has never been counted; `No recent use` means
  nothing was used in the last 30 store days.

The Inventory app shows all of this on the **Packing Materials** tab, and the Packing
app's **Materials** tab lists what needs attention.

### Turning it on

1. Update the script files (add the new `MaterialStock` file) and run
   **`setupConsolidation`** again. It adds `Item Materials`, `Material Issues`,
   `Material Movements` and `Material Stock`, and adds two columns to `Material Master`.
2. Start balances from the old PACKING STOCK sheet (opening stock of 1 Aug + that month's
   deliveries): set `PACKING_STOCK_SPREADSHEET_ID` in `SYNC_CONFIG` and run
   **`importPackingStockSheet`** once. Running it again does nothing.
3. Ask the store team to do a **stock count** in the Packing app for anything that looks
   wrong, and for materials that were never on the PACKING STOCK sheet (blue tape).
   A count always replaces the balance from its day onward.
4. From then on, enter every **delivery** in the Packing app.

If you set up Step 1–3 before, `Material Master` keeps your rows. Cover and tape rows made
earlier have `Count Unit` = `Piece` / `Carton`; change them to `Cover` / `Roll` to match
the store sheet.

### Keeping the matching right

- `Material Master` → `Store Sheet Block` is `ROLLS` (left block on the daily tab) or
  `COVERS` (right block). `Store Sheet Names` lists how the material is written there,
  separated by `|` (capitals and extra spaces don't matter).
- A line that matches nothing shows in `Sync Issues` as **Unknown material** (once, with
  the date range). Add its name to the right material, or split the line on the store sheet.
  At the start these are the combined lines ("Popcorn Roll (Salted/Cheese/Butter)",
  "Pumpkin/Melon Seeds 110Grm Roll") and the new "Packing Cover (…)" lines.
- The store sheet writes 20 g and 25 g film as one line ("25/20 Gram"); it is counted on
  the 25 g roll (RS-5).

### The per-item list (`Item Materials`)

One row per item and material. `Share Weight` says how the material is shared between
items that use it (packets per unit for film rolls, bags per bundle for bag covers).
The sync fills **`Suggested per Unit`** from the last 60 store days:
what the sheet issued ÷ (units packed × share weight) × share weight.
When a suggestion looks right, copy it into **`Qty per Unit`**. `Material Stock` then shows
**Expected Use (30 days)** next to the actual use, so differences stand out — and once
the store sheet is retired, clearing a material's `Store Sheet Names` makes its use come
from packing alone.

## Step 5 — switching off the store sheet

When the trial shows the app entries match the store sheet (the Inventory app's
"App entries vs store sheet" card says all items match for several days in a row),
the daily store update can be made from the app instead of the sheet.

### Before the switch
1. Pick the first day the store sheet will no longer be filled in, e.g. the 1st of next month.
2. `Item Master` → **`Min Level`** (last column): leave blank to keep the last minimum typed on
   the store sheet, or type the level you want from now on.
3. `Item Materials` → copy the `Suggested per Unit` values you agree with into `Qty per Unit`.
   After the switch, rolls, covers and cartons are used up from packing (Qty per Unit, or the
   suggestion when it's blank), because the ISSUED blocks are no longer typed.
4. Make sure the store team enters **every** packed and despatched quantity in Store Entry.

### The switch
1. In `StoreUpdateSync`, set `STORE_APP_FROM: '2026-10-01'` (your day).
2. Run **`rebuildStoreUpdates`**.

From that day on, each day's store update is built from Store Entry:
- **Opening** = the previous day's closing (on the first day: the store sheet's last closing)
- **Production** / **Despatch** = packed / despatched entries
- **Closing** = Opening + Production − Despatch
- **Min Level** = `Item Master` (or the last value on the store sheet), **Required Qty** = Min Level − Closing
- **Suggested Min** = the sheet's rule: MAX(average daily despatch × 2, biggest day), rounded up to 10, over the month
- Fridays without entries are left out (`SKIP_FRIDAYS`)

Store sheet tabs for those days are no longer read, and `Parallel Check` stops at the switch day.
Management prints the day from the Inventory app → **Store Update** → **Print**. The Packing app
tells the store team that the store update now comes from their entries.

Keep "Packing and dispach 2026" as an archive; nothing before the switch day changes.

**To go back**, clear `STORE_APP_FROM` and run `rebuildStoreUpdates`: the store sheet is read again.

### Not in the app yet
The daily store sheet also holds **Specific Order / Deliver By / Order Status**, **No. of Absentees**,
and the **machine work log**. They are not captured after the switch; keep using the sheet for them
until they are added to the app.

## Sync Issues explained

| Issue | Meaning |
|---|---|
| Opening differs from previous closing | The opening was typed over instead of carried from the day before |
| Closing does not add up | Closing ≠ Opening + Production − Despatch |
| Negative closing | More despatched than in stock (reported once while it stays below zero) |
| Duplicate item | The same item appears twice on one day |
| Code differs from Item Master | The name matches an item, but the code on the sheet is different (codes were swapped) — listed once with the date range |
| Unknown item | Code and name don't match any `Item Master` row — add the item |
| Not a number | Text or `#REF!` in a number column (items), or text in an issued quantity (materials) |
| Unknown material | An issued line whose name isn't in any material's `Store Sheet Names` |
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
| `rebuildStoreUpdates` | Re-read every day — after editing `Item Master`, correcting old days, or changing `STORE_APP_FROM` |
| `installAutoSync` / `removeAutoSync` | Turn the hourly sync on / off |
| `importPackingStockSheet` | Once: opening stock and deliveries from the old PACKING STOCK sheet |

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
