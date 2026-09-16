/**
 * Item Master and Material Master starting data
 * Store codes (as used on "Packing and dispach 2026") are the official codes.
 * setupConsolidation() writes these rows once; after that the sheet tabs are
 * the master and can be edited there. Rows are only added, never overwritten.
 */

var ITEM_MASTER_HEADERS = [
  'Item Key', 'Code', 'Variant', 'Group', 'Item', 'Product', 'Pack Size', 'Pack Unit',
  'Pack Contents', 'Kg per Unit', 'Bulk Alert Group', 'Packing Minutes per Unit',
  'Active', 'Old App SKU', 'Match Words', 'Notes', 'Min Level'
];

var ITEM_MASTER_FIELDS = [
  'key', 'code', 'variant', 'group', 'name', 'product', 'packSize', 'packUnit',
  'packContents', 'kgPerUnit', 'bulkGroup', 'packingMinutes',
  'active', 'appSku', 'matchWords', 'notes', 'minLevel'
];

var TEMP_CODE_NOTE = 'Temporary code on the store sheet - give this item a real store code';

// [key, code, variant, group, item, product, pack size, pack unit, pack contents,
//  kg per unit, bulk alert group, packing minutes, active, old app SKU, match words, notes]
// Min Level (last column) is left blank: once the store update comes from the app,
// a value here replaces the last minimum level typed on the store sheet.
var ITEM_MASTER_SEED = [
  ['4402-REG', '4402', '', 'REG', '200 Grams Sunflower Seeds Bundles (10 Pieces x 5 Bags)', 'Sunflower', '200 g', 'Bundle', '10 pcs x 5 bags', 10, 'REGULAR SUNFLOWER SEEDS', 1, 'YES', 'SUN-4402 (Eastern Province)', '', '', ''],
  ['4401-REG', '4401', '', 'REG', '100 Grams Sunflower Seeds Bundles (12 Pieces x 5 Bags)', 'Sunflower', '100 g', 'Bundle', '12 pcs x 5 bags', 6, 'REGULAR SUNFLOWER SEEDS', 1, 'YES', 'SUN-4401 (Eastern Province)', '', '', ''],
  ['1129-REG', '1129', '', 'REG', '25 Grams Sunflower Seeds Carton (24 Pieces x 6 Bags)', 'Sunflower', '25 g', 'Carton', '24 pcs x 6 bags', 3.6, 'REGULAR SUNFLOWER SEEDS', 2, 'YES', 'SUN-1129 (Eastern Province)', '', 'Packing rate came from the app, which counted bundles - check it per carton', ''],
  ['4408-REG', '4408', '', 'REG', '800 Grams Sunflower Seeds (6 x 800 g) Carton', 'Sunflower', '800 g', 'Carton', '6 x 800 g', 4.8, 'REGULAR SUNFLOWER SEEDS', 3, 'YES', 'SUN-1116 (Eastern Province)', '', 'The app used code 1116 for this item', ''],
  ['1126-REG-PRM', '1126', 'PRM', 'REG', '10kg Blue Sunflower Seeds AHL (PRM)', 'Sunflower', '10 kg', 'Bag', '10 kg', 10, '10 KG PREMIUM SUNFLOWER SEEDS', '', 'YES', 'SUN-1126 (Eastern Province)', 'PRM', 'Code 1126 is shared with the STD item', ''],
  ['1126-REG-STD', '1126', 'STD', 'REG', '10kg Blue Sunflower Seeds DAMMAM SPL (STD)', 'Sunflower', '10 kg', 'Bag', '10 kg', 10, '10 KG STANDARD SUNFLOWER SEEDS', '', 'YES', '', 'STD', 'Code 1126 is shared with the PRM item - give STD its own store code', ''],
  ['1146-REG', '1146', '', 'REG', '10kg Blue Sunflower Seeds BBQ', 'Sunflower', '10 kg', 'Bag', '10 kg', 10, '', '', 'YES', '', '', 'Not in the bulk stock alert', ''],
  ['1145-REG', '1145', '', 'REG', '130gm Sunflower Seeds (6x12 Pcs) Master Carton', 'Sunflower', '130 g', 'Master carton', '6 x 12 pcs', 9.36, '', '', 'YES', 'SUN-1145 (Eastern Province)', '', 'The app listed this as 150 g; not in the bulk stock alert', ''],

  ['4402-RUH', '4402', '', 'RUH', '200 Grams Sunflower Seeds Bundles (10 Pieces x 5 Bags)', 'Sunflower', '200 g', 'Bundle', '10 pcs x 5 bags', 10, 'RIYADH', 1, 'YES', 'SUN-4402 (Riyadh)', '', '', ''],
  ['4401-RUH', '4401', '', 'RUH', '100 Grams Sunflower Seeds Bundles (12 Pieces x 5 Bags)', 'Sunflower', '100 g', 'Bundle', '12 pcs x 5 bags', 6, 'RIYADH', 1, 'YES', 'SUN-4401 (Riyadh)', '', '', ''],
  ['4407-RUH', '4407', '', 'RUH', '20 Grams Sunflower Seeds (6 x 30) Master Carton', 'Sunflower', '20 g', 'Master carton', '6 x 30 pcs', 3.6, 'RIYADH', '', 'YES', 'SUN-1129 (Riyadh, listed as 20 g)', '', '', ''],
  ['4408-RUH', '4408', '', 'RUH', '800 Grams Sunflower Seeds (6 x 800 g) Master Carton', 'Sunflower', '800 g', 'Master carton', '6 x 800 g', 4.8, 'RIYADH', 3, 'YES', 'SUN-1116 (Riyadh)', '', 'The app used code 1116 for this item', ''],
  ['1127-RUH', '1127', '', 'RUH', '10kg Orange Sunflower Seeds Riyadh (ECO)', 'Sunflower', '10 kg', 'Bag', '10 kg', 10, '10 KG ECO SUNFLOWER SEEDS', '', 'YES', 'SUN-1126 (ORANGE)', '', 'Marked inactive in the bulk stock alert', ''],

  ['4401-QAT', '4401', '', 'QAT', '100 Grams Sunflower Seeds Bundles (12 Pieces x 5 Bags)', 'Sunflower', '100 g', 'Bundle', '12 pcs x 5 bags', 6, '', 1, 'YES', 'SUN-4401 (Qatar)', '', 'Not in the bulk stock alert', ''],
  ['4407-QAT', '4407', '', 'QAT', '20 Grams Sunflower Seeds (6 x 30) Master Carton', 'Sunflower', '20 g', 'Master carton', '6 x 30 pcs', 3.6, '', '', 'YES', 'SUN-1129 (Qatar, listed as 20 g)', '', 'Not in the bulk stock alert', ''],

  ['4402-BAH', '4402', '', 'BAH', '200 Grams Sunflower Seeds Bundles (10 Pieces x 5 Bags)', 'Sunflower', '200 g', 'Bundle', '10 pcs x 5 bags', 10, '', 1, 'NO', 'SUN-4402 (Bahrain)', '', 'Not on the store update since 6 Aug 2026', ''],
  ['4401-BAH', '4401', '', 'BAH', '100 Grams Sunflower Seeds Bundles (12 Pieces x 5 Bags)', 'Sunflower', '100 g', 'Bundle', '12 pcs x 5 bags', 6, '', 1, 'NO', 'SUN-4401 (Bahrain)', '', 'Not on the store update since 6 Aug 2026', ''],
  ['4407-BAH', '4407', '', 'BAH', '20 Grams Sunflower Seeds (6 x 30) Master Carton', 'Sunflower', '20 g', 'Master carton', '6 x 30 pcs', 3.6, '', '', 'NO', '', '', 'Not on the store update since 6 Aug 2026', ''],

  ['8005-MP', '8005', '', 'MP', 'Pumpkin 15 gram (6 x 24 Pieces) Master Carton', 'Pumpkin', '15 g', 'Master carton', '6 x 24 pcs', 2.16, 'PUMPKIN SEEDS FOR PET PACKETS', '', 'YES', 'PUM-8001', '', 'The app used code 8001 for this item', ''],
  ['8002-MP', '8002', '', 'MP', 'Pumpkin 110 gram (6 x 12 Pieces) Master Carton', 'Pumpkin', '110 g', 'Master carton', '6 x 12 pcs', 7.92, 'PUMPKIN SEEDS FOR PET PACKETS', '', 'YES', 'PUM-8002', '', '', ''],
  ['1142-MP', '1142', '', 'MP', 'Pumpkin Seeds 10kg Bags', 'Pumpkin', '10 kg', 'Bag', '10 kg', 10, '10 KG PUMPKIN SEEDS', '', 'YES', 'PUM-1142', '', '', ''],
  ['9005-MP', '9005', '', 'MP', 'Melon Seeds 15 gram (6 x 15 grm) Master Carton', 'Melon', '15 g', 'Master carton', '6 x 24 pcs', 2.16, 'MELON SEEDS FOR PET PACKETS', '', 'YES', 'MEL-9001', '', 'The app used code 9001; the sheet name says "6 x 15 grm" - check the pack contents', ''],
  ['9002-MP', '9002', '', 'MP', 'Melon Seeds 110 gram (6 x 12 Pieces) Master Carton', 'Melon', '110 g', 'Master carton', '6 x 12 pcs', 7.92, 'MELON SEEDS FOR PET PACKETS', '', 'YES', 'MEL-9002', '', '', ''],
  ['2-MP', '2', '', 'MP', '10kg Melon Seeds Yellow Blue PRM', 'Melon', '10 kg', 'Bag', '10 kg', 10, '10 KG MELON SEEDS PREMIUM', '', 'YES', 'MEL-2 (Yellow Blue)', 'YELLOW,BLUE,PRM', TEMP_CODE_NOTE, ''],
  ['1-MP', '1', '', 'MP', '10kg Melon Seeds White Blue PRM', 'Melon', '10 kg', 'Bag', '10 kg', 10, '10 KG MELON SEEDS PREMIUM', '', 'YES', 'MEL-1 (White Blue)', 'WHITE,BLUE,PRM', TEMP_CODE_NOTE, ''],
  ['4-MP', '4', '', 'MP', '10kg Melon Seeds Yellow Blue STD', 'Melon', '10 kg', 'Bag', '10 kg', 10, '10 KG MELON SEEDS STANDARD', '', 'YES', '', 'YELLOW,BLUE,STD', TEMP_CODE_NOTE, ''],
  ['3-MP', '3', '', 'MP', '10kg Melon Seeds White Blue STD', 'Melon', '10 kg', 'Bag', '10 kg', 10, '10 KG MELON SEEDS STANDARD', '', 'YES', '', 'WHITE,BLUE,STD', TEMP_CODE_NOTE, ''],
  ['4405-MP', '4405', '', 'MP', '10kg Melon Seeds Yellow Orange ECO', 'Melon', '10 kg', 'Bag', '10 kg', 10, '10 KG MELON SEEDS ECO', '', 'YES', 'MEL-4406 (listed as Yellow orange)', 'YELLOW,ORANGE', 'The app had code 4406 as yellow orange; the store uses 4405 - check', ''],
  ['4406-MP', '4406', '', 'MP', '10kg Melon Seeds White Orange ECO', 'Melon', '10 kg', 'Bag', '10 kg', 10, '10 KG MELON SEEDS ECO', '', 'YES', 'MEL-1143 (listed as white orange)', 'WHITE,ORANGE', 'The app had code 4406 as yellow orange; the store uses 4406 for white orange - check', ''],
  ['1013-MP', '1013', '', 'MP', '10 kg Peanuts Roasted Carton', 'Peanuts', '10 kg', 'Carton', '10 kg', 10, '10 kg Peanuts Roasted', '', 'YES', '', '', 'Packed to order', ''],
  ['1182-MP', '1182', '', 'MP', 'Sunflower & Pumpkin Combo (130+15) 12 pcs', 'Combo', '130 g + 15 g', 'Box', '12 pcs', '', '', '', 'YES', '', 'PUMPKIN,130', 'Codes 1181 and 1182 were swapped on the store sheet before 8 Aug 2026', ''],
  ['1181-MP', '1181', '', 'MP', 'Sunflower And Melon Combo (130+15) 12 pcs', 'Combo', '130 g + 15 g', 'Box', '12 pcs', '', '', '', 'YES', '', 'MELON,130', 'Codes 1181 and 1182 were swapped on the store sheet before 8 Aug 2026', ''],
  ['1183-MP', '1183', '', 'MP', 'Sunflower & Pumpkin Combo (115+15) 12 pcs', 'Combo', '115 g + 15 g', 'Box', '12 pcs', '', '', '', 'YES', '', 'PUMPKIN,115', '', ''],

  ['1712-POP', '1712', '', 'POP', 'PC- Salted 16 gm (8 x 8) Master Carton', 'Popcorn', '16 g', 'Master carton', '8 x 8 pcs', '', '', '', 'YES', 'POP-1712', 'SALTED,16 GM', '', ''],
  ['1711-POP', '1711', '', 'POP', 'PC- Cheese 16 gm (8 x 8) Master Carton', 'Popcorn', '16 g', 'Master carton', '8 x 8 pcs', '', '', '', 'YES', 'POP-1711', 'CHEESE,16 GM', '', ''],
  ['1710-POP', '1710', '', 'POP', 'PC- Butter 16 gm (8 x 8) Master Carton', 'Popcorn', '16 g', 'Master carton', '8 x 8 pcs', '', '', '', 'YES', 'POP-1710', 'BUTTER,16 GM', '', ''],
  ['1712-POP-RET', '1712', 'RETURN', 'POP', 'PC- Salted 16 gm (8 x 8) Master Carton (Return)', 'Popcorn', '16 g', 'Master carton', '8 x 8 pcs', '', '', '', 'NO', '', 'SALTED,16 GM,RETURN', 'Returned stock, listed 18 Aug - 2 Sep 2026', ''],
  ['1711-POP-RET', '1711', 'RETURN', 'POP', 'PC- Cheese 16 gm (8 x 8) Master Carton (Return)', 'Popcorn', '16 g', 'Master carton', '8 x 8 pcs', '', '', '', 'NO', '', 'CHEESE,16 GM,RETURN', 'Returned stock, listed 18 Aug - 2 Sep 2026', ''],
  ['1710-POP-RET', '1710', 'RETURN', 'POP', 'PC- Butter 16 gm (8 x 8) Master Carton (Return)', 'Popcorn', '16 g', 'Master carton', '8 x 8 pcs', '', '', '', 'NO', '', 'BUTTER,16 GM,RETURN', 'Returned stock, listed 18 Aug - 2 Sep 2026', ''],
  ['1212-POP', '1212', '', 'POP', 'PC- Cheese 20 gm (20 gm x 5) Master Carton (Old)', 'Popcorn', '20 g', 'Master carton', '20 g x 5', '', '', '', 'YES', '', 'CHEESE,20 GM', 'Old item. Codes 1211 and 1212 were swapped on the store sheet before 30 Aug 2026', ''],
  ['1211-POP', '1211', '', 'POP', 'PC- Butter 20 gm (20 gm x 5) Master Carton (Old)', 'Popcorn', '20 g', 'Master carton', '20 g x 5', '', '', '', 'YES', '', 'BUTTER,20 GM', 'Old item. Codes 1211 and 1212 were swapped on the store sheet before 30 Aug 2026', ''],

  ['1901-CC', '1901', '', 'CC', 'Cotton Candy Mango', 'Cotton candy', '', '', '', '', '', '', 'YES', '', '', '', ''],
  ['1902-CC', '1902', '', 'CC', 'Cotton Candy Strawberry', 'Cotton candy', '', '', '', '', '', '', 'YES', '', '', '', ''],
  ['1903-CC', '1903', '', 'CC', 'Cotton Candy Blueberry', 'Cotton candy', '', '', '', '', '', '', 'YES', '', '', '', '']
];

var MATERIAL_MASTER_HEADERS = [
  'Material ID', 'Code', 'Material', 'Size', 'Category', 'Count Unit',
  'Pieces per Pack', 'Pack', 'Roll Weight (kg)', 'Active', 'Notes',
  'Store Sheet Block', 'Store Sheet Names'
];

var MATERIAL_MASTER_FIELDS = [
  'id', 'code', 'name', 'size', 'category', 'unit',
  'piecesPerPack', 'pack', 'rollKg', 'active', 'notes',
  'sheetBlock', 'sheetNames'
];


// [id, code, material, size, category, count unit, pieces per pack, pack, roll kg, active, notes,
//  store sheet block, store sheet names]
// Store sheet names: how the item is written in the ROLLS ISSUED / COVER/CARTON ISSUED
// blocks of the daily store tabs, separated by "|" (compared ignoring case and extra spaces)
var MATERIAL_MASTER_SEED = [
  ['CT-1', '', 'Popcorn Carton Butter (10 x 22g)', '', 'Carton', 'Piece', 260, 'Carton', '', 'YES', '', '', ''],
  ['CT-2', '', 'Popcorn Carton Cheese (10 x 22g)', '', 'Carton', 'Piece', 260, 'Carton', '', 'YES', '', '', ''],
  ['CT-3', '', '15 Gm Melon Seeds 24 pcs Carton', '', 'Carton', 'Piece', 400, 'Carton', '', 'YES', '', 'COVERS', '15 Gram Melon Seeds Box'],
  ['CT-4', '', '15 Gm Pumpkin Seeds 24 pcs Carton', '', 'Carton', 'Piece', 400, 'Carton', '', 'YES', '', 'COVERS', '15 Gram Pumpkin Seeds Box'],
  ['CT-5', '', '20 Gm Sunflower Seeds 24 pcs Carton', '', 'Carton', 'Piece', 350, 'Carton', '', 'YES', '', 'COVERS', '20 Gram Sunflower Seeds Box'],
  ['CT-6', '3349', '130/150 Gm Sunflower Seeds 12 pcs Box Carton', '', 'Carton', 'Piece', 90, 'Carton', '', 'YES', '', '', ''],
  ['CT-7', '3351', '110 Gm Pumpkin Seeds 12 pcs Box Carton', '', 'Carton', 'Piece', 90, 'Carton', '', 'YES', '', 'COVERS', '110 Gram Pumpkin Seeds Box'],
  ['CT-8', '3350', '110 Gm Melon Seeds 12 pcs Box Carton', '', 'Carton', 'Piece', 90, 'Carton', '', 'YES', '', 'COVERS', '110 Gram Melon Seeds Box'],
  ['MC-1', '', 'Master Carton - Hot Pack', '', 'Master carton', 'Piece', 520, 'Pallet', '', 'YES', '', '', ''],
  ['MC-2', '3362', 'Master Carton Gulf Carton Small', '450 x 290 x 319', 'Master carton', 'Piece', 400, 'Pallet', '', 'YES', 'Store sheet "Master Carton Small" - check', 'COVERS', 'Master Carton Small'],
  ['MC-3', '3361', 'Master Carton Gulf', '619 x 300 x 348', 'Master carton', 'Piece', 400, 'Pallet', '', 'YES', 'Store sheet "Master Carton Big" - check', 'COVERS', 'Master Carton Big'],
  ['MC-4', '', 'Master Carton Pumpkin/Melon 15 Gm', '383 x 134 x 438', 'Master carton', 'Piece', 1200, 'Pallet', '', 'YES', '', 'COVERS', '15 Gram Melon/Pumpkin Master Carton|15 Gram Melon/Pumpkin M. Carton|15 Gram Pumpkin Master Carton'],
  ['MC-5', '', 'Master Carton Sunflower Seeds 20 Gm', '420 x 145 x 575', 'Master carton', 'Piece', 1200, 'Pallet', '', 'YES', '', 'COVERS', '20 Gram Sunflower Master Carton'],
  ['MC-6', '', 'Master Carton - Hot Pack Red', '120 x 100 x 165', 'Master carton', 'Piece', 225, 'Pallet', '', 'YES', '', '', ''],
  ['MC-7', '', 'Master Carton - Hot Pack Blue', '120 x 100 x 165', 'Master carton', 'Piece', 225, 'Pallet', '', 'YES', '', '', ''],
  ['CC-1', '', 'Mango Cotton Candy Carton', '', 'Carton', 'Piece', 225, '', '', 'YES', '', '', ''],
  ['CC-2', '', 'Blueberry Cotton Candy Carton', '', 'Carton', 'Piece', 225, '', '', 'YES', '', '', ''],
  ['CC-3', '', 'Strawberry Cotton Candy Carton', '', 'Carton', 'Piece', 225, '', '', 'YES', '', '', ''],
  ['RS-1', '2225', 'Sunflower Roll 800 Gram', '570 x 370 mm', 'Sunflower roll', 'Roll', '', '', 31.1, 'YES', '', 'ROLLS', '800 Gram'],
  ['RS-2', '2568', 'Sunflower Roll 200 Gram', '370 (W) x 240 mm', 'Sunflower roll', 'Roll', '', '', 30.1, 'YES', '', 'ROLLS', '200 Gram'],
  ['RS-3', '2567', 'Sunflower Roll 100 Gram', '290 (W) x 195 mm', 'Sunflower roll', 'Roll', '', '', 25, 'YES', '', 'ROLLS', '100 Gram'],
  ['RS-4', '2566', 'Sunflower Roll 20 Gram', '200 (W) x 145 mm', 'Sunflower roll', 'Roll', '', '', 25, 'YES', 'Code 2566 is used for both the 20 g and 25 g rolls; the store sheet usually issues both as "25/20 Gram" (counted on RS-5)', 'ROLLS', '20 Gram'],
  ['RS-5', '2566', 'Sunflower Roll 25 Gram', '200 (W) x 145 mm', 'Sunflower roll', 'Roll', '', '', 24.6, 'YES', 'Code 2566 is used for both the 20 g and 25 g rolls. The store sheet issues both on one line ("25/20 Gram"), counted here', 'ROLLS', '25/20 Gram'],
  ['RS-6', '', 'Sunflower Roll 25 Gram Outer', '640 (W) x 440 mm', 'Sunflower roll', 'Roll', '', '', 32.1, 'YES', 'New item - no code yet', 'ROLLS', '25/20 Gram Outer Roll|25 Gram Outer Roll'],
  ['RS-7', '', 'Sunflower Roll 150/130 Gram', '300 (W) x 200 mm', 'Sunflower roll', 'Roll', '', '', 25, 'YES', '', 'ROLLS', 'Sunflower Seeds 130 Grm Roll'],
  ['RS-8', '2235', '10KG Orange Roll (Al Hasa Plastics)', '1020 x 460', 'Sunflower roll', 'Roll', '', '', 50, 'YES', '', 'ROLLS', '10KG ORANGE ROLL'],
  ['RS-9', '2236', '10KG Blue Roll (Al Hasa Plastics)', '1020 x 460', 'Sunflower roll', 'Roll', '', '', 50, 'YES', '', 'ROLLS', '10KG BLUE ROLL'],
  ['RP-1', '2560', 'Popcorn Roll Salted 16 Gram', '320 x 190', 'Popcorn roll', 'Roll', '', '', 19, 'YES', '', 'ROLLS', 'Popcorn Roll (Salted)|Popcorn Roll (Salt)|Popcorn Salted Roll'],
  ['RP-2', '2562', 'Popcorn Roll Cheese 16 Gram', '320 x 190', 'Popcorn roll', 'Roll', '', '', 19, 'YES', '', 'ROLLS', 'Popcorn Roll (Cheese)|Popcorn Cheese Roll'],
  ['RP-3', '2561', 'Popcorn Roll Butter 16 Gram', '320 x 190', 'Popcorn roll', 'Roll', '', '', 19, 'YES', '', 'ROLLS', 'Popcorn Roll (Butter)|Popcorn Butter Roll'],
  ['RP-4', '', 'Popcorn Roll Salted 22 Gram', '320 x 225', 'Popcorn roll', 'Roll', '', '', 19, 'YES', 'New item - no code yet', '', ''],
  ['RP-5', '', 'Popcorn Roll Cheese 22 Gram', '320 x 225', 'Popcorn roll', 'Roll', '', '', 19, 'YES', 'New item - no code yet', '', ''],
  ['RP-6', '', 'Popcorn Roll Butter 22 Gram', '320 x 225', 'Popcorn roll', 'Roll', '', '', 19, 'YES', 'New item - no code yet', '', ''],
  ['RP-7', '2237', 'Popcorn Roll Salted 20 Gram (Old Item)', '', 'Popcorn roll', 'Roll', '', '', 19, 'YES', '', '', ''],
  ['RP-8', '2238', 'Popcorn Roll Cheese 20 Gram (Old Item)', '', 'Popcorn roll', 'Roll', '', '', 19, 'YES', '', '', ''],
  ['RP-9', '2239', 'Popcorn Roll Butter 20 Gram (Old Item)', '', 'Popcorn roll', 'Roll', '', '', 19, 'YES', '', '', ''],
  ['RK-1', '', 'Pumpkin Seed Film (UV)', '300 (W) x 180 mm', 'Pumpkin roll', 'Roll', '', '', 20, 'YES', 'Store sheet "Pumpkin Seeds 110Grm Roll" - check', 'ROLLS', 'Pumpkin Seeds 110Grm Roll'],
  ['RK-2', '', 'Pumpkin Seed Film (Glossy) 15 Gm', '185 (W) x 135 mm', 'Pumpkin roll', 'Roll', '', '', 11.5, 'YES', '', 'ROLLS', 'Pumpkin Seeds 15Grm Roll'],
  ['RK-3', '', 'Pumpkin Seed Film (UV) 65 Gm', '300 (W) x 150 mm', 'Pumpkin roll', 'Roll', '', '', 20, 'YES', '', '', ''],
  ['RM-1', '', 'Melon Seed Film (Glossy) 15 Gm', '185 (W) x 135 mm', 'Melon roll', 'Roll', '', '', 11.5, 'YES', '', 'ROLLS', 'Melon Seeds 15Grm Roll'],
  ['RM-2', '', 'Melon Seed Film (UV) 65 Gm', '300 (W) x 150 mm', 'Melon roll', 'Roll', '', '', 20, 'YES', '', '', ''],
  ['RM-3', '', 'Melon Seed Film (UV)', '300 (W) x 180 mm', 'Melon roll', 'Roll', '', '', 20, 'YES', 'Store sheet "Melon Seeds 110Grm Roll" - check', 'ROLLS', 'Melon Seeds 110Grm Roll'],
  ['RC-1', '', 'Blueberry Cotton Candy Film', '', 'Cotton candy film', 'Roll', '', '', 9, 'YES', 'New item - no code yet', '', ''],
  ['RC-2', '', 'Strawberry Cotton Candy Film', '', 'Cotton candy film', 'Roll', '', '', 9, 'YES', 'New item - no code yet', '', ''],
  ['RC-3', '', 'Mango Cotton Candy Film', '', 'Cotton candy film', 'Roll', '', '', 9, 'YES', 'New item - no code yet', '', ''],
  ['PC-1', '3355', '100 Gram Bundle Cover', '67 x 43', 'Cover', 'Cover', '', '', '', 'YES', '', 'COVERS', '100gm bndl'],
  ['PC-2', '3354', '100 Gram Bag Cover', '34 x 44', 'Cover', 'Cover', '', '', '', 'YES', '', 'COVERS', '100 gm bag'],
  ['PC-3', '3356', '200 Gram Bag Cover', '37 x 58', 'Cover', 'Cover', '', '', '', 'YES', '', 'COVERS', '200 gm bag'],
  ['PC-4', '3357', '200 Gram Bundle Cover', '88 x 42', 'Cover', 'Cover', '', '', '', 'YES', '', 'COVERS', '200 gm bndl'],
  ['TP-1', '', 'Clear Tape Roll', '', 'Tape', 'Roll', '', '', '', 'YES', '', 'ROLLS', 'CLEAR TAPE'],
  ['TP-2', '', 'Abu Salim Tape Roll - Purple', '', 'Tape', 'Roll', '', '', '', 'YES', '', 'ROLLS', 'PURPLE TAPE'],
  ['TP-3', '', 'Abu Salim Tape Roll - Green', '', 'Tape', 'Roll', '', '', '', 'YES', '', 'ROLLS', 'GREEN TAPE'],
  ['TP-4', '', 'Blue Tape Roll', '', 'Tape', 'Roll', '', '', '', 'YES', 'Issued on the store sheet ("BLUE TAPE") but not on the packing stock sheet', 'ROLLS', 'BLUE TAPE']
];

/**
 * Item Master rows (arrays, as on the sheet) -> objects used for matching
 */
function itemMasterFromRows(rows) {
  return rows
    .filter(function (row) { return String(row[0] || '').trim() !== ''; })
    .map(function (row) {
      var entry = {};
      ITEM_MASTER_FIELDS.forEach(function (field, index) {
        entry[field] = row[index] === undefined || row[index] === null ? '' : row[index];
      });
      entry.key = String(entry.key).trim();
      entry.code = String(entry.code).trim();
      entry.group = String(entry.group).trim();
      return entry;
    });
}

/**
 * Material Master rows (arrays, as on the sheet) -> objects
 */
function materialMasterFromRows(rows) {
  return rows
    .filter(function (row) { return String(row[0] || '').trim() !== ''; })
    .map(function (row) {
      var entry = {};
      MATERIAL_MASTER_FIELDS.forEach(function (field, index) {
        entry[field] = row[index] === undefined || row[index] === null ? '' : row[index];
      });
      entry.id = String(entry.id).trim();
      entry.code = String(entry.code).trim();
      return entry;
    });
}

/**
 * Item Materials: which packing materials one unit of an item uses.
 * Qty per Unit is in the material's count unit and is left blank until confirmed;
 * the sync fills Suggested per Unit from what the store sheet issued.
 * Share Weight splits a material's use between items that share it
 * (for film rolls: packets per unit).
 */
var ITEM_MATERIAL_HEADERS = [
  'Item Key', 'Material ID', 'Qty per Unit', 'Share Weight', 'Suggested per Unit', 'Notes'
];

var ITEM_MATERIAL_FIELDS = ['itemKey', 'materialId', 'qtyPerUnit', 'shareWeight', 'suggested', 'notes'];

var BOX_NOTE = 'Six inner boxes per master carton';

// [item key, material id, qty per unit, share weight, suggested (filled by the sync), notes]
var ITEM_MATERIAL_SEED = [
  ['4402-REG', 'RS-2', '', 50, '', '10 packets x 5 bags'],
  ['4402-REG', 'PC-4', '', 1, '', 'One bundle cover per bundle'],
  ['4402-REG', 'PC-3', '', 5, '', 'Five bag covers per bundle'],
  ['4402-RUH', 'RS-2', '', 50, '', '10 packets x 5 bags'],
  ['4402-RUH', 'PC-4', '', 1, '', 'One bundle cover per bundle'],
  ['4402-RUH', 'PC-3', '', 5, '', 'Five bag covers per bundle'],
  ['4402-BAH', 'RS-2', '', 50, '', '10 packets x 5 bags'],
  ['4402-BAH', 'PC-4', '', 1, '', 'One bundle cover per bundle'],
  ['4402-BAH', 'PC-3', '', 5, '', 'Five bag covers per bundle'],

  ['4401-REG', 'RS-3', '', 60, '', '12 packets x 5 bags'],
  ['4401-REG', 'PC-1', '', 1, '', 'One bundle cover per bundle'],
  ['4401-REG', 'PC-2', '', 5, '', 'Five bag covers per bundle'],
  ['4401-RUH', 'RS-3', '', 60, '', '12 packets x 5 bags'],
  ['4401-RUH', 'PC-1', '', 1, '', 'One bundle cover per bundle'],
  ['4401-RUH', 'PC-2', '', 5, '', 'Five bag covers per bundle'],
  ['4401-QAT', 'RS-3', '', 60, '', '12 packets x 5 bags'],
  ['4401-QAT', 'PC-1', '', 1, '', 'One bundle cover per bundle'],
  ['4401-QAT', 'PC-2', '', 5, '', 'Five bag covers per bundle'],
  ['4401-BAH', 'RS-3', '', 60, '', '12 packets x 5 bags'],
  ['4401-BAH', 'PC-1', '', 1, '', 'One bundle cover per bundle'],
  ['4401-BAH', 'PC-2', '', 5, '', 'Five bag covers per bundle'],

  ['1129-REG', 'RS-5', '', 144, '', '24 packets x 6 bags'],
  ['1129-REG', 'RS-6', '', 6, '', 'Outer film for the 6 bags'],
  ['4407-RUH', 'RS-5', '', 180, '', '6 x 30 packets; the store sheet issues 20 g film with 25 g'],
  ['4407-RUH', 'CT-5', '', 6, '', 'Check: the box is listed as 24 pcs, the item as 6 x 30'],
  ['4407-RUH', 'MC-5', 1, 1, '', ''],
  ['4407-QAT', 'RS-5', '', 180, '', '6 x 30 packets; the store sheet issues 20 g film with 25 g'],
  ['4407-QAT', 'CT-5', '', 6, '', 'Check: the box is listed as 24 pcs, the item as 6 x 30'],
  ['4407-QAT', 'MC-5', 1, 1, '', ''],
  ['4407-BAH', 'RS-5', '', 180, '', '6 x 30 packets; the store sheet issues 20 g film with 25 g'],
  ['4407-BAH', 'CT-5', '', 6, '', 'Check: the box is listed as 24 pcs, the item as 6 x 30'],
  ['4407-BAH', 'MC-5', 1, 1, '', ''],

  ['4408-REG', 'RS-1', '', 6, '', '6 packets per carton'],
  ['4408-RUH', 'RS-1', '', 6, '', '6 packets per carton'],
  ['1126-REG-PRM', 'RS-9', '', 1, '', 'Blue 10 kg bag'],
  ['1126-REG-STD', 'RS-9', '', 1, '', 'Blue 10 kg bag'],
  ['1146-REG', 'RS-9', '', 1, '', 'Blue 10 kg bag'],
  ['1127-RUH', 'RS-8', '', 1, '', 'Orange 10 kg bag'],
  ['1145-REG', 'RS-7', '', 72, '', '6 x 12 packets'],
  ['1145-REG', 'CT-6', 6, 6, '', BOX_NOTE],

  ['8005-MP', 'RK-2', '', 144, '', '6 x 24 packets'],
  ['8005-MP', 'CT-4', 6, 6, '', BOX_NOTE],
  ['8005-MP', 'MC-4', 1, 1, '', ''],
  ['8002-MP', 'RK-1', '', 72, '', '6 x 12 packets'],
  ['8002-MP', 'CT-7', 6, 6, '', BOX_NOTE],
  ['9005-MP', 'RM-1', '', 144, '', '6 x 24 packets'],
  ['9005-MP', 'CT-3', 6, 6, '', BOX_NOTE],
  ['9005-MP', 'MC-4', 1, 1, '', ''],
  ['9002-MP', 'RM-3', '', 72, '', '6 x 12 packets'],
  ['9002-MP', 'CT-8', 6, 6, '', BOX_NOTE],
  ['2-MP', 'RS-9', '', 1, '', 'Blue 10 kg bag'],
  ['1-MP', 'RS-9', '', 1, '', 'Blue 10 kg bag'],
  ['4-MP', 'RS-9', '', 1, '', 'Blue 10 kg bag'],
  ['3-MP', 'RS-9', '', 1, '', 'Blue 10 kg bag'],
  ['4405-MP', 'RS-8', '', 1, '', 'Orange 10 kg bag'],
  ['4406-MP', 'RS-8', '', 1, '', 'Orange 10 kg bag'],

  ['1712-POP', 'RP-1', '', 64, '', '8 x 8 packets'],
  ['1711-POP', 'RP-2', '', 64, '', '8 x 8 packets'],
  ['1710-POP', 'RP-3', '', 64, '', '8 x 8 packets'],
  ['1212-POP', 'RP-8', '', 5, '', '20 g x 5'],
  ['1211-POP', 'RP-9', '', 5, '', '20 g x 5'],

  ['1901-CC', 'CC-1', '', 1, '', ''],
  ['1901-CC', 'RC-3', '', 1, '', ''],
  ['1902-CC', 'CC-3', '', 1, '', ''],
  ['1902-CC', 'RC-2', '', 1, '', ''],
  ['1903-CC', 'CC-2', '', 1, '', ''],
  ['1903-CC', 'RC-1', '', 1, '', '']
];

function itemMaterialsFromRows(rows) {
  return rows
    .filter(function (row) { return String(row[0] || '').trim() !== '' && String(row[1] || '').trim() !== ''; })
    .map(function (row) {
      var entry = {};
      ITEM_MATERIAL_FIELDS.forEach(function (field, index) {
        entry[field] = row[index] === undefined || row[index] === null ? '' : row[index];
      });
      entry.itemKey = String(entry.itemKey).trim();
      entry.materialId = String(entry.materialId).trim();
      return entry;
    });
}
