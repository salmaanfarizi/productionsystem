/*******************************************************
 * Unified Apps Script — ARS Inventory + Cash (ASCII-safe)
 * - Robust GET/POST parser
 * - Presence + item locks
 * - Inventory save/read (order-agnostic headers)
 * - "Additional Transfer" supported (after T.Unit)
 * - Sales-from-Inventory calculator
 * - Cash reconciliation (incl. discount base/+15%)
 *
 * Spreadsheet: 1o3rmIC2mSUAS-0d0-w62mDDHGzJznHf9qEjcHoyZEX0
 *
 * FIX: saveSalesItems now reuses sheets instead of creating new ones daily
 *******************************************************/

const SPREADSHEET_ID = '1o3rmIC2mSUAS-0d0-w62mDDHGzJznHf9qEjcHoyZEX0';
const ACTIVE_USERS_TIMEOUT = 30000; // 30s

const ROUTES = ['Al-Hasa 1','Al-Hasa 2','Al-Hasa 3','Al-Hasa 4','Al-Hasa Wholesale'];
const SHEET_NAMES = {
  ACTIVE_USERS: 'ACTIVE_USERS',
  ITEM_LOCKS: 'ITEM_LOCKS',
  METADATA: 'METADATA',
  INVENTORY_SNAPSHOT: 'INVENTORY_SNAPSHOT',
  CASH_RECONCILIATION: 'CASH_RECONCILIATION',
  CASH_DENOMINATIONS: 'CASH_DENOMINATIONS',
  SALES_ITEMS: 'SALES_ITEMS',  // Single sheet for all sales items
  STOCK_OUTWARDS: 'STOCK_OUTWARDS'
};

/* ===========================
   HTTP entrypoints
=========================== */
function doGet(e){
  const r = handleRequest(e);
  const cb = e && e.parameter && e.parameter.callback;
  if (cb) {
    return ContentService.createTextOutput(cb + '(' + r.getContent() + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return r;
}
function doPost(e){ return handleRequest(e); }

/* ===========================
   Request parsing
=========================== */
function handleRequest(e){
  try{
    var data = {};

    if (e && e.parameter) {
      if (e.parameter.action) data.action = e.parameter.action;
      if (e.parameter.payload) {
        var pl = _safeJSON(e.parameter.payload);
        if (pl) { for (var k in pl) data[k] = pl[k]; }
      }
    }

    if (e && e.postData && typeof e.postData.contents === 'string' && e.postData.contents.length){
      var raw = e.postData.contents;
      var ct  = String(e.postData.type || '').toLowerCase();

      if (ct.indexOf('application/json') > -1) {
        var body = _safeJSON(raw); if (body) { for (var k1 in body) data[k1] = body[k1]; }
      } else if (ct.indexOf('application/x-www-form-urlencoded') > -1) {
        var form = _parseFormBody(raw);
        if (form.action && !data.action) data.action = form.action;
        if (form.payload) {
          var inner = _safeJSON(form.payload); if (inner) { for (var k2 in inner) data[k2] = inner[k2]; }
        }
        for (var fk in form) if (fk !== 'action' && fk !== 'payload') data[fk] = form[fk];
      } else {
        var asJson = _safeJSON(raw);
        if (asJson) { for (var k3 in asJson) data[k3] = asJson[k3]; }
        else {
          var form2 = _parseFormBody(raw);
          if (form2.action && !data.action) data.action = form2.action;
          if (form2.payload) {
            var inner2 = _safeJSON(form2.payload); if (inner2) { for (var k4 in inner2) data[k4] = inner2[k4]; }
          }
          for (var fk2 in form2) if (fk2 !== 'action' && fk2 !== 'payload') data[fk2] = form2[fk2];
        }
      }
    }

    if (!data.action) return createResponse('error','No action specified');
    return handleAction(data);
  }catch(err){
    return createResponse('error', String(err));
  }
}

function createResponse(status, data){
  return ContentService.createTextOutput(JSON.stringify({
    status: status,
    success: status === 'success',
    data: data,
    timestamp: Date.now()
  })).setMimeType(ContentService.MimeType.JSON);
}

/* ===========================
   Helpers (general)
=========================== */
function _ss(){ return SpreadsheetApp.openById(SPREADSHEET_ID); }
function _safeJSON(s){ try{ return JSON.parse(s); }catch(_){ return null; } }
function _parseFormBody(raw){
  var out = {};
  String(raw).split('&').forEach(function(p){
    if(!p) return;
    var i = p.indexOf('=');
    var k = i>=0 ? p.slice(0,i) : p;
    var v = i>=0 ? p.slice(i+1) : '';
    var key = decodeURIComponent(k.replace(/\+/g,' '));
    var val = decodeURIComponent(v.replace(/\+/g,' '));
    out[key] = val;
  });
  return out;
}
var TZ = Session.getScriptTimeZone();
function formatTimeHMS(d){ return Utilities.formatDate(d, TZ, 'HH:mm:ss'); }
function todayYMD(){ return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'); }

/* ===========================
   Header mapping + synonyms
=========================== */
function _hdrIndexFlex_(hdrRow){
  var norm = function(s){ return String(s||'').toLowerCase().replace(/[\.\s_]+/g,' ').trim(); };
  var pos = {}; hdrRow.forEach(function(h,i){ pos[norm(h)] = i; });
  var find = function(){ for (var a=0; a<arguments.length; a++){ var i = pos[norm(arguments[a])]; if (i != null) return i; } return -1; };
  return {
    Date:        find('date'),
    Time:        find('time','timestamp'),
    Category:    find('category'),
    Code:        find('code','item code','sku'),
    ItemName:    find('item name','item','name'),
    Physical:    find('physical','physical stock','physical qty','physical quantity'),
    PUnit:       find('p.unit','p unit','phys unit','physical unit'),
    Transfer:    find('transfer','stock transfer'),
    TUnit:       find('t.unit','t unit','transfer unit'),
    AddTransfer: find('additional transfer','additional trans','add transfer','addl transfer','add. transfer'),
    AddUnit:     find('add unit','additional transfer unit','additional trans add unit','a.unit','addl unit'),
    System:      find('system','system stock'),
    SUnit:       find('s.unit','s unit','system unit'),
    Difference:  find('difference','diff'),
    Reimbursed:  find('reimbursed','reimburse','pieces reimbursed','reimbursed pcs'),
    RUnit:       find('r.unit','r unit','reimbursed unit')
  };
}
function _normYmd_(v){
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v,TZ,'yyyy-MM-dd');
  var s = String(v||'').trim(); if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  var cleaned = s.replace(/[\.\/]/g,'-');
  var d = new Date(cleaned);
  if (!isNaN(d)) return Utilities.formatDate(d,TZ,'yyyy-MM-dd');
  var m = cleaned.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m){ d = new Date(+m[3], +m[2]-1, +m[1]); if(!isNaN(d)) return Utilities.formatDate(d,TZ,'yyyy-MM-dd'); }
  return s;
}

/* Ensure Additional Transfer & Add Unit exist after T.Unit */
function _ensureAddlCols_(sh){
  var hdr = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  var idx = _hdrIndexFlex_(hdr);
  if (idx.AddTransfer >= 0 && idx.AddUnit >= 0) return {hdr:hdr, idx:idx};

  var after0 = (idx.TUnit >= 0) ? idx.TUnit : ((idx.Transfer >= 0) ? idx.Transfer : hdr.length-1);

  if (idx.AddTransfer < 0){
    sh.insertColumnAfter(after0+1);
    sh.getRange(1, after0+2).setValue('Additional Transfer');
    after0++;
  }
  if (idx.AddUnit < 0){
    sh.insertColumnAfter(after0+1);
    sh.getRange(1, after0+2).setValue('Add Unit');
  }

  hdr = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  idx = _hdrIndexFlex_(hdr);
  return {hdr:hdr, idx:idx};
}

/* ===========================
   Router
=========================== */
function handleAction(d){
  switch (d.action){
    case 'ping':
    case 'testConnection':
      return createResponse('success','Connection established');
    case 'init':
      return initializeApp();

    case 'heartbeat':       return handleHeartbeat(d);
    case 'getActiveUsers':  return getActiveUsers();
    case 'getRealTimeData': return getRealTimeData(d);
    case 'lockItem':        return lockItem(d);
    case 'unlockItem':      return unlockItem(d);

    case 'saveInventoryData': {
      var res = saveInventoryData(d);
      broadcastUpdate('inventory', d.route);
      return createResponse(res.status, res.data);
    }
    case 'getInventoryData':         return getInventoryData(d);
    case 'calculateSalesFromInventory':
      return calculateSalesFromInventory(d);

    case 'saveCashReconciliation': {
      var v = validateCashData(d);
      if (!v.valid) return createResponse('error', v.error);
      var result = saveCashReconciliation(d);
      broadcastUpdate('cash', d.route);
      return createResponse('success', result);
    }

    case 'getSummary': return getSummaryData();

    case 'saveStockOutwards': {
      var res = saveStockOutwards(d);
      return createResponse(res.status, res.data);
    }
    case 'getStockOutwards': return getStockOutwards(d);

    default: return createResponse('error','Invalid action: ' + d.action);
  }
}

/* ===========================
   App bootstrap (catalog)
=========================== */
function initializeApp(){
  var catalog = {
    sunflower_seeds: [
      {code:'4402',name:'200g',unit:'bag',price:58,bundle:5},
      {code:'4401',name:'100g',unit:'bag',price:34,bundle:5},
      {code:'1129',name:'25g', unit:'bag',price:16,bundle:6},
      {code:'1116',name:'800g',unit:'bag',price:17,carton:12},
      {code:'1145',name:'130g',unit:'box',price:54,carton:6},
      {code:'1126',name:'10KG',unit:'sack',price:170}
    ],
    pumpkin_seeds: [
      {code:'8001',name:'15g', unit:'box',price:16,carton:6},
      {code:'8002',name:'110g',unit:'box',price:54,carton:6},
      {code:'1142',name:'10KG',unit:'sack',price:230}
    ],
    melon_seeds: [
      {code:'9001',name:'15g', unit:'box',price:16,carton:6},
      {code:'9002',name:'110g',unit:'box',price:54,carton:6}
    ],
    popcorn: [
      {code:'1710',name:'Cheese',         unit:'bag',price:5,carton:8},
      {code:'1711   ',name:'Butter',         unit:'bag',price:5,carton:8},
      {code:'1703',name:'Lightly Salted', unit:'bag',price:5,carton:8}
    ]
  };
  return createResponse('success',{ catalog: catalog });
}

/* ===========================
   Inventory I/O
=========================== */
function saveInventoryData(payload){
  try{
    var route = payload && payload.route;
    var date  = payload && payload.date;
    var items = (payload && payload.items) || [];
    if (!route) return { status:'error', data:'Route is required' };

    var ss = _ss();
    var sh = ss.getSheetByName(route);
    if (!sh) return { status:'error', data:'Route sheet not found' };

    var meta = _ensureAddlCols_(sh);
    var hdr  = meta.hdr;
    var idx  = meta.idx;
    var lastCol = sh.getLastColumn();
    var when = formatTimeHMS(new Date());

    var n = function(v){ return (v===''||v==null)?0:Number(v); };

    function rowFromItem(it){
      var row = new Array(lastCol).fill('');
      if (idx.Date       >= 0) row[idx.Date]       = _normYmd_(date || todayYMD());
      if (idx.Time       >= 0) row[idx.Time]       = when;
      if (idx.Category   >= 0) row[idx.Category]   = it.category || '';
      if (idx.Code       >= 0) row[idx.Code]       = it.code || '';
      if (idx.ItemName   >= 0) row[idx.ItemName]   = it.name || '';

      if (idx.Physical   >= 0) row[idx.Physical]   = n(it.physical);
      if (idx.PUnit      >= 0) row[idx.PUnit]      = it.physUnit || 'bag';

      if (idx.Transfer   >= 0) row[idx.Transfer]   = n(it.transfer);
      if (idx.TUnit      >= 0) row[idx.TUnit]      = it.transUnit || it.physUnit || 'bag';

      var addQty  = (it.hasOwnProperty('additionalTransfer') ? it.additionalTransfer : (it.addTransfer || 0));
      var addUnit = it.addUnit || it.transUnit || it.physUnit || 'bag';
      if (idx.AddTransfer>=0) row[idx.AddTransfer]= n(addQty);
      if (idx.AddUnit    >=0) row[idx.AddUnit]    = addUnit;

      if (idx.System     >= 0) row[idx.System]     = n(it.system);
      if (idx.SUnit      >= 0) row[idx.SUnit]      = it.sysUnit || it.physUnit || 'bag';

      if (idx.Difference >= 0) row[idx.Difference] = n(it.difference);
      if (idx.Reimbursed >= 0) row[idx.Reimbursed] = n(it.reimburse);
      if (idx.RUnit      >= 0) row[idx.RUnit]      = it.reimbUnit || 'pieces';
      return row;
    }

    if (!items.length) return { status:'success', data:'Nothing to save' };

    var values = items.map(rowFromItem);
    var start  = Math.max(sh.getLastRow()+1, 2);
    sh.getRange(start, 1, values.length, lastCol).setValues(values);

    saveDailyInventorySnapshot(ss, { date: _normYmd_(date||todayYMD()), route: route, items: items });

    return { status:'success', data:{ rowsAppended: values.length } };
  }catch(err){
    return { status:'error', data:String(err) };
  }
}

function getInventoryData(payload){
  try{
    var route = payload && payload.route;
    var date  = payload && payload.date;
    var ss = _ss(); var sh = ss.getSheetByName(route);
    if (!sh) return createResponse('error','Route sheet not found');
    if (sh.getLastRow() < 2) return createResponse('success', []);

    var hdr = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
    var idx = _hdrIndexFlex_(hdr);
    var data = sh.getRange(2,1, sh.getLastRow()-1, sh.getLastColumn()).getValues();

    var want = _normYmd_(date || todayYMD());
    var items = [];
    data.forEach(function(r){
      if (_normYmd_(r[idx.Date]) !== want) return;
      items.push({
        category: r[idx.Category], code: r[idx.Code], name: r[idx.ItemName],
        physical: Number(r[idx.Physical]||0), physUnit: r[idx.PUnit]||'bag',
        transfer: Number(r[idx.Transfer]||0), transUnit: r[idx.TUnit]||'bag',
        additionalTransfer: Number(idx.AddTransfer>=0 ? r[idx.AddTransfer]||0 : 0),
        addUnit: r[idx.AddUnit] || (r[idx.TUnit]||r[idx.PUnit]||'bag'),
        system: Number(r[idx.System]||0), sysUnit: r[idx.SUnit]||'bag',
        difference: Number(r[idx.Difference]||0),
        reimburse: Number(r[idx.Reimbursed]||0),
        reimbUnit: r[idx.RUnit] || 'pieces'
      });
    });

    return createResponse('success', items);
  }catch(err){
    return createResponse('error', String(err));
  }
}

function saveDailyInventorySnapshot(ss, data){
  var sh = ss.getSheetByName(SHEET_NAMES.INVENTORY_SNAPSHOT);
  if (!sh){
    sh = ss.insertSheet(SHEET_NAMES.INVENTORY_SNAPSHOT);
    sh.appendRow(['Date','Route','Category','Code','Item Name','Physical','P.Unit','Transfer','T.Unit','Additional Transfer','Add Unit','System','S.Unit','Difference','Last Updated']);
    sh.setFrozenRows(1);
  }
  var lr = sh.getLastRow();
  if (lr > 1){
    var vals = sh.getRange(2,1,lr-1,2).getValues();
    for (var i=vals.length-1;i>=0;i--){
      if (_normYmd_(vals[i][0])===_normYmd_(data.date) && vals[i][1]===data.route){
        sh.deleteRow(i+2);
      }
    }
  }
  var rows = [];
  (data.items||[]).forEach(function(it){
    rows.push([
      _normYmd_(data.date), data.route, it.category||'', it.code||'', it.name||'',
      Number(it.physical||0), it.physUnit||'bag',
      Number(it.transfer||0), it.transUnit||'bag',
      Number((it.hasOwnProperty('additionalTransfer')?it.additionalTransfer:(it.addTransfer||0))||0),
      it.addUnit || it.transUnit || it.physUnit || 'bag',
      Number(it.system||0), it.sysUnit||'bag',
      Number(it.difference||0),
      new Date()
    ]);
  });
  if (rows.length) sh.getRange(sh.getLastRow()+1,1,rows.length, rows[0].length).setValues(rows);
}

/* ===========================
   Sales from Inventory
=========================== */
function calculateSalesFromInventory(payload){
  try{
    var route = payload && payload.route;
    var previousDate = payload && payload.previousDate;
    var currentDate  = payload && payload.currentDate;
    if (!route || !previousDate || !currentDate){
      return createResponse('error','Missing route/previousDate/currentDate');
    }
    var ss = _ss(); var sh = ss.getSheetByName(route);
    if (!sh) return createResponse('error','Route sheet not found');
    if (sh.getLastRow() < 2) return createResponse('success',[]);

    var hdr = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
    var idx = _hdrIndexFlex_(hdr);
    var rows = sh.getRange(2,1, sh.getLastRow()-1, sh.getLastColumn()).getValues();

    var toNum = function(v){ var n=Number(String(v==null?'':v).replace(/[, ]/g,'')); return isNaN(n)?0:n; };

    var roll = {}; // key: date__code
    rows.forEach(function(r){
      var d = _normYmd_(r[idx.Date]);
      var code = String(r[idx.Code]||'').trim();
      if (!d || !code) return;
      var key = d + '__' + code;
      if (!roll[key]) roll[key] = { physical:0, transfer:0, add:0 };
      roll[key].physical += toNum(r[idx.Physical]);
      roll[key].transfer += toNum(r[idx.Transfer]);
      if (idx.AddTransfer >= 0) roll[key].add += toNum(r[idx.AddTransfer]);
    });

    function byDate(d){
      var out={}, want=_normYmd_(d);
      Object.keys(roll).forEach(function(k){
        var sp=k.split('__'); if (sp[0]===want) out[sp[1]]=roll[k];
      });
      return out;
    }

    var prev = byDate(previousDate);
    var curr = byDate(currentDate);

    var result = Object.keys(prev).map(function(code){
      var p = prev[code];
      var currPhysical = (curr[code] && curr[code].physical) || 0;
      var salesQty = (p.physical + p.transfer + p.add) - currPhysical;
      return { code: code, salesQty: salesQty };
    });

    return createResponse('success', result);
  }catch(err){
    return createResponse('error', String(err));
  }
}

/* ===========================
   Cash reconciliation (+discount)
   FIX: saveSalesItems now reuses a single sheet
=========================== */
function validateCashData(d){
  if (!d.route) return {valid:false,error:'Route is required'};
  if (!d.date)  return {valid:false,error:'Date is required'};
  return {valid:true};
}

function createCashReconciliationSheet(ss){
  var sh = ss.insertSheet(SHEET_NAMES.CASH_RECONCILIATION);
  sh.appendRow([
    'Date','Time','Route','Total Sales',
    'Discount (Base)','Discount (+15%)',
    'Credit Sales','Credit Repayment','Bank POS','Bank Transfer','Cheque',
    'Expected Cash','Cash Notes','Coins','Actual Cash','Difference','Status'
  ]);
  sh.setFrozenRows(1);
  return sh;
}

function saveCashDenominations(ss, data){
  var sh = ss.getSheetByName(SHEET_NAMES.CASH_DENOMINATIONS);
  if (!sh){
    sh = ss.insertSheet(SHEET_NAMES.CASH_DENOMINATIONS);
    sh.appendRow(['Date','Route','SAR 500','SAR 100','SAR 50','SAR 20','SAR 10','SAR 5','Notes Total','SAR 2','SAR 1','SAR 0.50','SAR 0.25','Coins Total','Grand Total']);
    sh.setFrozenRows(1);
  }
  var d = (data.cashNotes && data.cashNotes.denominations) ? data.cashNotes.denominations : {};
  function n(k){ return Number(d[k] || 0); }
  var notes = n('500')*500 + n('100')*100 + n('50')*50 + n('20')*20 + n('10')*10 + n('5')*5;
  var coins = n('2')*2 + n('1')*1 + (n('0.50')||n('0.5'))*0.5 + n('0.25')*0.25;
  var grand = notes + coins;
  var row = [ data.date, data.route, n('500'),n('100'),n('50'),n('20'),n('10'),n('5'),notes, n('2'),n('1'),(n('0.50')||n('0.5')),n('0.25'),coins, grand ];
  sh.getRange(sh.getLastRow()+1,1,1,row.length).setValues([row]);
}

function saveSalesItems(ss, data){
  // FIX: Use a single SALES_ITEMS sheet instead of creating date-specific sheets
  var sh = ss.getSheetByName(SHEET_NAMES.SALES_ITEMS);
  if (!sh){
    sh = ss.insertSheet(SHEET_NAMES.SALES_ITEMS);
    sh.appendRow(['Date','Time','Route','Category','Code','Item Name','Unit','Unit Price','Quantity','Total Value']);
    sh.setFrozenRows(1);
  }
  var when = formatTimeHMS(new Date());
  var rows = (data.salesItems||[]).map(function(it){
    return [
      data.date,
      when,
      data.route,  // Add route column
      it.category||'',
      it.code||'',
      it.name||'',
      it.unit||'',
      Number(it.price||0),
      Number(it.quantity||0),
      Number(it.total||0)
    ];
  });
  if (rows.length) sh.getRange(sh.getLastRow()+1,1,rows.length, rows[0].length).setValues(rows);
}

function saveCashReconciliation(d){
  var ss = _ss();
  var sh = ss.getSheetByName(SHEET_NAMES.CASH_RECONCILIATION);
  if (!sh) sh = createCashReconciliationSheet(ss);

  var discountBase    = Number(d.discountBase || 0);
  var discountWithVAT = Number(d.discountWithVAT || 0);

  var row = [
    d.date, formatTimeHMS(new Date()), d.route,
    Number(d.totalSales||0),
    discountBase, discountWithVAT,
    Number(d.creditSales||0),
    Number(d.creditRepayment||0),
    Number(d.bankPOS||0),
    Number(d.bankTransfer||0),
    Number(d.cheque||0),
    Number(d.expectedCash||0),
    Number((d.cashNotes&&d.cashNotes.total)||0),
    Number(d.coins||0),
    Number(d.actualCash||0),
    Number(d.difference||0),
    (Number(d.difference||0)===0 ? 'BALANCED' : (Number(d.difference)>0 ? 'EXCESS' : 'SHORTAGE'))
  ];
  sh.getRange(sh.getLastRow()+1,1,1,row.length).setValues([row]);

  if (Array.isArray(d.salesItems) && d.salesItems.length) saveSalesItems(ss, d);
  saveCashDenominations(ss, d);
  updateLastModified(ss, d.route);
  return 'Cash reconciliation saved';
}

/* ===========================
   Stock Outwards
=========================== */
function saveStockOutwards(d){
  try{
    var date = d.date || todayYMD();
    var category = d.category || '';
    var productCategory = d.productCategory || '';
    var productCode = d.productCode || '';
    var productName = d.productName || '';
    var quantity = Number(d.quantity || 0);
    var recipient = d.recipient || '';
    var notes = d.notes || '';

    if (!category || !productCategory || !productCode || !quantity || !recipient){
      return { status:'error', data:'Missing required fields' };
    }

    var ss = _ss();
    var sh = ss.getSheetByName(SHEET_NAMES.STOCK_OUTWARDS);

    if (!sh){
      sh = ss.insertSheet(SHEET_NAMES.STOCK_OUTWARDS);
      sh.appendRow(['Date','Time','Category','Product Category','Product Code','Product Name','Quantity','Recipient','Notes']);
      sh.setFrozenRows(1);
    }

    var when = formatTimeHMS(new Date());
    var row = [
      _normYmd_(date),
      when,
      category,
      productCategory,
      productCode,
      productName,
      quantity,
      recipient,
      notes
    ];

    sh.getRange(sh.getLastRow()+1,1,1,row.length).setValues([row]);

    return { status:'success', data:{ message:'Stock outwards saved successfully' } };
  }catch(err){
    return { status:'error', data:String(err) };
  }
}

function getStockOutwards(d){
  try{
    var ss = _ss();
    var sh = ss.getSheetByName(SHEET_NAMES.STOCK_OUTWARDS);

    if (!sh || sh.getLastRow() < 2){
      return createResponse('success', []);
    }

    var data = sh.getRange(2,1, sh.getLastRow()-1, sh.getLastColumn()).getValues();

    var items = data.map(function(r){
      return {
        date: _normYmd_(r[0]),
        time: r[1],
        category: r[2],
        productCategory: r[3],
        productCode: r[4],
        productName: r[5],
        quantity: Number(r[6] || 0),
        recipient: r[7],
        notes: r[8]
      };
    });

    return createResponse('success', items);
  }catch(err){
    return createResponse('error', String(err));
  }
}

/* ===========================
   Presence + locks
=========================== */
function handleHeartbeat(d){
  var ss=_ss(); var sh=ss.getSheetByName(SHEET_NAMES.ACTIVE_USERS);
  if(!sh){ sh=ss.insertSheet(SHEET_NAMES.ACTIVE_USERS); sh.appendRow(['User ID','Last Seen','Route','Module','User Name']); sh.setFrozenRows(1); }
  var uid=d.userId||Utilities.getUuid(), now=Date.now(), route=d.route||'', module=d.module||'inventory';
  var lr=sh.getLastRow(), row=-1;
  if(lr>1){
    var ids=sh.getRange(2,1,lr-1,1).getValues();
    for(var i=0;i<ids.length;i++){ if(ids[i][0]===uid){ row=i+2; break; } }
  }
  if(row===-1) sh.appendRow([uid, now, route, module, d.userName||'User']); else sh.getRange(row,2,1,3).setValues([[now, route, module]]);
  cleanupInactiveUsers(sh);
  return createResponse('success',{ userId:uid, activeUsers:getActiveUsersCount(sh), timestamp: now });
}
function cleanupInactiveUsers(sh){
  var lr=sh.getLastRow(); if(lr<=1) return;
  var vals=sh.getRange(2,1,lr-1,2).getValues(), now=Date.now();
  for(var i=vals.length-1;i>=0;i--){ if(now-vals[i][1]>ACTIVE_USERS_TIMEOUT) sh.deleteRow(i+2); }
}
function getActiveUsersCount(sh){
  var lr=sh.getLastRow(); if(lr<=1) return 0;
  var ts=sh.getRange(2,2,lr-1,1).getValues(), now=Date.now();
  return ts.filter(function(r){ return now - r[0] < ACTIVE_USERS_TIMEOUT; }).length;
}
function getActiveUsers(){
  var ss=_ss(); var sh=ss.getSheetByName(SHEET_NAMES.ACTIVE_USERS);
  if(!sh) return createResponse('success',{ users:[], count:0 });
  cleanupInactiveUsers(sh);
  var lr=sh.getLastRow(); if(lr<=1) return createResponse('success',{ users:[], count:0 });
  var rows=sh.getRange(2,1,lr-1,5).getValues(), now=Date.now();
  var users = rows.filter(function(r){ return now - r[1] < ACTIVE_USERS_TIMEOUT; })
                  .map(function(r){ return { userId:r[0], route:r[2], module:r[3], userName:r[4]||'User', lastSeen:new Date(r[1]).toISOString() }; });
  return createResponse('success',{ users: users, count: users.length });
}
function lockItem(d){
  var ss=_ss(); var sh=ss.getSheetByName(SHEET_NAMES.ITEM_LOCKS);
  if(!sh){ sh=ss.insertSheet(SHEET_NAMES.ITEM_LOCKS); sh.appendRow(['Lock Key','User ID','Timestamp']); sh.setFrozenRows(1); }
  var key=d.route + '_' + d.itemCode, uid=d.userId, now=Date.now();
  var locks=_locksMap(sh);
  if (locks[key] && locks[key].userId !== uid && now - locks[key].timestamp < 60000){
    return createResponse('error','Item locked by another user');
  }
  _setLock(sh, key, uid, now);
  return createResponse('success','Item locked');
}
function unlockItem(d){
  var ss=_ss(); var sh=ss.getSheetByName(SHEET_NAMES.ITEM_LOCKS);
  if(!sh) return createResponse('success','No locks');
  _removeLock(sh, d.route + '_' + d.itemCode);
  return createResponse('success','Item unlocked');
}
function _locksMap(sh){
  var map={}, lr=sh.getLastRow(); if(lr>1){
    sh.getRange(2,1,lr-1,3).getValues().forEach(function(r){ map[r[0]]={userId:r[1], timestamp:r[2]}; });
  } return map;
}
function _setLock(sh,key,uid,ts){
  var lr=sh.getLastRow();
  if(lr>1){
    var keys=sh.getRange(2,1,lr-1,1).getValues();
    for(var i=0;i<keys.length;i++){ if(keys[i][0]===key){ sh.getRange(i+2,2,1,2).setValues([[uid,ts]]); return; } }
  }
  sh.appendRow([key,uid,ts]);
}
function _removeLock(sh,key){
  var lr=sh.getLastRow(); if(lr>1){
    var keys=sh.getRange(2,1,lr-1,1).getValues();
    for(var i=keys.length-1;i>=0;i--){ if(keys[i][0]===key){ sh.deleteRow(i+2); return; } }
  }
}
function getLockedItems(ss){
  var sh=ss.getSheetByName(SHEET_NAMES.ITEM_LOCKS); if(!sh) return [];
  var map=_locksMap(sh), out=[], now=Date.now();
  Object.keys(map).forEach(function(k){ if(now-map[k].timestamp<60000) out.push({ itemKey:k, userId:map[k].userId, timestamp:map[k].timestamp }); });
  return out;
}

/* ===========================
   Realtime metadata
=========================== */
function getRealTimeData(p){
  var ss=_ss(); var updates=[];
  var meta = getOrCreateMetaSheet(ss);
  var last = getLastModifiedData(meta);
  var clientTs = Number(p.timestamp||0);

  if (p.route && last[p.route] > clientTs){
    var routeData = JSON.parse(getInventoryData({route:p.route, date:p.date||todayYMD()}).getContent()).data;
    updates.push({ type:'route_update', route:p.route, data: routeData, timestamp: last[p.route] });
  }
  var lockedItems = getLockedItems(ss);
  return createResponse('success',{ updates: updates, lockedItems: lockedItems, serverTimestamp: Date.now() });
}
function broadcastUpdate(_type, route){ updateLastModified(_ss(), route); }
function getOrCreateMetaSheet(ss){
  var sh=ss.getSheetByName(SHEET_NAMES.METADATA);
  if(!sh){ sh=ss.insertSheet(SHEET_NAMES.METADATA); sh.appendRow(['Route','Last Modified']); sh.setFrozenRows(1); }
  return sh;
}
function updateLastModified(ss, route){
  var sh=getOrCreateMetaSheet(ss); var lr=sh.getLastRow(), ts=Date.now();
  if(lr>1){
    var routes=sh.getRange(2,1,lr-1,1).getValues();
    for(var i=0;i<routes.length;i++){ if(routes[i][0]===route){ sh.getRange(i+2,2).setValue(ts); return; } }
  }
  sh.appendRow([route, ts]);
}
function getLastModifiedData(meta){
  var m={}, lr=meta.getLastRow(); if(lr>1){
    meta.getRange(2,1,lr-1,2).getValues().forEach(function(r){ m[r[0]]=r[1]; });
  } return m;
}

/* ===========================
   Summary
=========================== */
function getSummaryData(){
  var ss=_ss(), out={};
  ROUTES.forEach(function(route){
    var sh=ss.getSheetByName(route);
    if(!sh || sh.getLastRow()<2){ out[route]={totalItems:0, shortageItems:0, excessItems:0, matchedItems:0, lastUpdated:null}; return; }
    var hdr=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0]; var idx=_hdrIndexFlex_(hdr);
    var vals=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues();
    var t=0,s=0,e=0,m=0;
    vals.forEach(function(r){ var d=Number(r[idx.Difference]||0); t++; if(d<0)s++; else if(d>0)e++; else m++; });
    out[route]={ totalItems:t, shortageItems:s, excessItems:e, matchedItems:m, lastUpdated: _normYmd_(vals[vals.length-1][idx.Date]) };
  });
  return createResponse('success', out);
}

/* ===========================
   Migration (safe backup + align headers)
=========================== */
function migrateAllInventorySheets(){
  var ss=_ss();
  DriveApp.getFileById(ss.getId()).makeCopy(ss.getName() + '__backup_' + Utilities.formatDate(new Date(),TZ,'yyyy-MM-dd_HH.mm'));

  var CANON = [
    'Date','Time','Category','Code','Item Name',
    'Physical','P.Unit',
    'Transfer','T.Unit','Additional Transfer','Add Unit',
    'System','S.Unit',
    'Difference','Reimbursed','R.Unit'
  ];

  function syn(s){ return String(s||'').toLowerCase().replace(/\s+/g,' ').trim(); }
  var synonyms = {
    'date':['date'],'time':['time','timestamp'],'category':['category'],
    'code':['code','item code','sku'],
    'item name':['item name','item','name'],
    'physical':['physical','physical stock','physical qty','physical quantity'],
    'p.unit':['p.unit','p unit','phys unit','physical unit'],
    'transfer':['transfer','stock transfer','transfer qty','transfer quantity'],
    't.unit':['t.unit','t unit','transfer unit'],
    'additional transfer':['additional transfer','additional trans','add transfer','addl transfer','add. transfer'],
    'add unit':['add unit','additional unit','additional transfer unit','additional trans add unit','a.unit','addl unit'],
    'system':['system','system stock','system qty','system quantity'],
    's.unit':['s.unit','s unit','system unit'],
    'difference':['difference','diff'],
    'reimbursed':['reimbursed','reimburse','pieces reimbursed','reimbursed pcs'],
    'r.unit':['r.unit','r unit','reimbursed unit']
  };
  function findCol(hdr, key){
    var wants=[key].concat(synonyms[key]||[]).map(syn);
    for (var i=0;i<hdr.length;i++){ if (wants.indexOf(syn(hdr[i]))>-1) return i; }
    return -1;
  }

  ROUTES.forEach(function(route){
    var sh=ss.getSheetByName(route); if(!sh) return;

    _ensureAddlCols_(sh);

    var hdr=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
    var all=sh.getDataRange().getValues();
    var idxList = CANON.map(function(k){ return findCol(hdr,k); });
    var out = all.map(function(row){ return idxList.map(function(i){ return (i>=0? row[i] : ''); }); });
    sh.clearContents();
    sh.getRange(1,1,out.length,out[0].length).setValues(out);

    var lr=sh.getLastRow(); if(lr>1){
      var body=sh.getRange(2,1,lr-1, sh.getLastColumn()).getValues();
      var h = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
      var idx = _hdrIndexFlex_(h);
      for (var r=0;r<body.length;r++){
        var row=body[r];
        if (idx.Date>=0) row[idx.Date] = _normYmd_(row[idx.Date]);
        if (idx.Time>=0 && !row[idx.Time]) row[idx.Time] = formatTimeHMS(new Date());
        var numCols = [idx.Physical,idx.Transfer,idx.AddTransfer,idx.System,idx.Difference,idx.Reimbursed];
        numCols.forEach(function(i){ if(i>=0 && (row[i]===''||row[i]==null)) row[i]=0; });
        if (idx.PUnit>=0 && !row[idx.PUnit]) row[idx.PUnit]='bag';
        if (idx.TUnit>=0 && !row[idx.TUnit]) row[idx.TUnit]=row[idx.PUnit]||'bag';
        if (idx.AddUnit>=0 && !row[idx.AddUnit]) row[idx.AddUnit]=row[idx.TUnit]||row[idx.PUnit]||'bag';
        if (idx.SUnit>=0 && !row[idx.SUnit]) row[idx.SUnit]=row[idx.PUnit]||'bag';
        if (idx.RUnit>=0 && !row[idx.RUnit]) row[idx.RUnit]='pieces';
      }
      sh.getRange(2,1,lr-1, sh.getLastColumn()).setValues(body);
      if (idx.Date>=0) sh.getRange(2, idx.Date+1, lr-1, 1).setNumberFormat('yyyy-mm-dd');
    }
  });

  SpreadsheetApp.flush();
}

/* Menu */
function onOpen(){
  SpreadsheetApp.getUi().createMenu('Utilities')
    .addItem('Migrate inventory sheets (safe backup)', 'migrateAllInventorySheets')
    .addToUi();
}
