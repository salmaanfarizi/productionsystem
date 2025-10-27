/**
 * Monthly Production Report Generator
 *
 * This script generates monthly reports for:
 * - Seed/Raw Material Consumption
 * - Production Output (WIP)
 * - Employee Overtime
 * - Diesel Consumption
 * - Wastewater Collection
 *
 * Usage:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Create a new script file and paste this code
 * 4. Add a custom menu or run manually
 */

/**
 * Add custom menu to Google Sheets
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📊 Production Reports')
    .addItem('Generate Monthly Report', 'generateMonthlyReport')
    .addItem('Generate Custom Date Range Report', 'showDateRangeDialog')
    .addToUi();
}

/**
 * Show dialog for custom date range
 */
function showDateRangeDialog() {
  const html = `
    <div style="padding: 20px; font-family: Arial;">
      <h3>Custom Date Range Report</h3>
      <label>Start Date:</label><br>
      <input type="date" id="startDate" style="margin: 5px 0; padding: 5px; width: 100%;"><br><br>
      <label>End Date:</label><br>
      <input type="date" id="endDate" style="margin: 5px 0; padding: 5px; width: 100%;"><br><br>
      <button onclick="generateCustomReport()" style="background: #4CAF50; color: white; padding: 10px 20px; border: none; cursor: pointer;">Generate Report</button>
    </div>
    <script>
      function generateCustomReport() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        google.script.run.withSuccessHandler(() => {
          alert('Report generated successfully!');
          google.script.host.close();
        }).generateCustomRangeReport(startDate, endDate);
      }
    </script>
  `;

  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(400)
    .setHeight(250);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Custom Date Range');
}

/**
 * Generate monthly report for current month
 */
function generateMonthlyReport() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0); // Last day of month

  generateReport(startDate, endDate, `Monthly Report - ${getMonthName(month)} ${year}`);
}

/**
 * Generate report for custom date range
 */
function generateCustomRangeReport(startDateStr, endDateStr) {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  const reportTitle = `Production Report - ${formatDate(startDate)} to ${formatDate(endDate)}`;
  generateReport(startDate, endDate, reportTitle);
}

/**
 * Main report generation function
 */
function generateReport(startDate, endDate, reportTitle) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Get or create report sheet
  let reportSheet = ss.getSheetByName('Monthly Reports');
  if (!reportSheet) {
    reportSheet = ss.insertSheet('Monthly Reports');
  }

  // Clear previous content
  reportSheet.clear();

  // Set up headers
  reportSheet.getRange('A1').setValue(reportTitle).setFontSize(16).setFontWeight('bold');
  reportSheet.getRange('A2').setValue(`Generated: ${new Date().toLocaleString()}`).setFontSize(10);

  let currentRow = 4;

  // Get production data
  const productionData = getProductionData(ss, startDate, endDate);

  // 1. SUMMARY SECTION
  currentRow = addSummarySection(reportSheet, currentRow, productionData);

  // 2. RAW MATERIAL CONSUMPTION
  currentRow = addRawMaterialSection(reportSheet, currentRow, productionData);

  // 3. PRODUCTION OUTPUT
  currentRow = addProductionOutputSection(reportSheet, currentRow, productionData);

  // 4. OVERTIME TRACKING
  currentRow = addOvertimeSection(reportSheet, currentRow, productionData);

  // 5. DIESEL CONSUMPTION
  currentRow = addDieselSection(reportSheet, currentRow, productionData);

  // 6. WASTEWATER COLLECTION
  currentRow = addWastewaterSection(reportSheet, currentRow, productionData);

  // Format the sheet
  formatReportSheet(reportSheet);

  SpreadsheetApp.getUi().alert('Report generated successfully!');
}

/**
 * Get production data for date range
 */
function getProductionData(ss, startDate, endDate) {
  const productionSheet = ss.getSheetByName('Production Data');
  if (!productionSheet) {
    throw new Error('Production Data sheet not found');
  }

  const data = productionSheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  // Filter by date range
  const dateColIndex = headers.indexOf('Date');
  const filtered = rows.filter(row => {
    const rowDate = new Date(row[dateColIndex]);
    return rowDate >= startDate && rowDate <= endDate;
  });

  return {
    headers: headers,
    rows: filtered,
    startDate: startDate,
    endDate: endDate
  };
}

/**
 * Add summary section
 */
function addSummarySection(sheet, startRow, data) {
  sheet.getRange(startRow, 1).setValue('📊 SUMMARY').setFontSize(14).setFontWeight('bold');
  startRow += 2;

  const totalEntries = data.rows.length;
  const totalRawMaterial = data.rows.reduce((sum, row) => sum + parseFloat(row[6] || 0), 0);
  const totalWIP = data.rows.reduce((sum, row) => sum + parseFloat(row[8] || 0), 0);
  const totalLoss = data.rows.reduce((sum, row) => sum + parseFloat(row[7] || 0), 0);

  sheet.getRange(startRow, 1, 4, 2).setValues([
    ['Total Production Entries:', totalEntries],
    ['Total Raw Material (Tonnes):', totalRawMaterial.toFixed(3)],
    ['Total WIP Output (Tonnes):', totalWIP.toFixed(3)],
    ['Total Loss (Tonnes):', totalLoss.toFixed(3)]
  ]);

  return startRow + 6;
}

/**
 * Add raw material consumption section
 */
function addRawMaterialSection(sheet, startRow, data) {
  sheet.getRange(startRow, 1).setValue('🌾 RAW MATERIAL CONSUMPTION').setFontSize(14).setFontWeight('bold');
  startRow += 2;

  // Group by product type and seed variety
  const consumption = {};

  data.rows.forEach(row => {
    const productType = row[1]; // Product Type
    const seedVariety = row[2]; // Seed Variety
    const weight = parseFloat(row[6] || 0); // Raw Material Weight

    const key = `${productType} - ${seedVariety}`;
    consumption[key] = (consumption[key] || 0) + weight;
  });

  sheet.getRange(startRow, 1, 1, 2).setValues([['Product - Variety', 'Weight (Tonnes)']]).setFontWeight('bold');
  startRow++;

  const consumptionData = Object.entries(consumption).map(([key, weight]) => [key, weight.toFixed(3)]);
  if (consumptionData.length > 0) {
    sheet.getRange(startRow, 1, consumptionData.length, 2).setValues(consumptionData);
    startRow += consumptionData.length;
  }

  return startRow + 2;
}

/**
 * Add production output section
 */
function addProductionOutputSection(sheet, startRow, data) {
  sheet.getRange(startRow, 1).setValue('🏭 PRODUCTION OUTPUT (WIP)').setFontSize(14).setFontWeight('bold');
  startRow += 2;

  // Group by product type
  const output = {};

  data.rows.forEach(row => {
    const productType = row[1];
    const wip = parseFloat(row[8] || 0);

    output[productType] = (output[productType] || 0) + wip;
  });

  sheet.getRange(startRow, 1, 1, 2).setValues([['Product Type', 'WIP Output (Tonnes)']]).setFontWeight('bold');
  startRow++;

  const outputData = Object.entries(output).map(([product, wip]) => [product, wip.toFixed(3)]);
  if (outputData.length > 0) {
    sheet.getRange(startRow, 1, outputData.length, 2).setValues(outputData);
    startRow += outputData.length;
  }

  return startRow + 2;
}

/**
 * Add overtime section
 */
function addOvertimeSection(sheet, startRow, data) {
  sheet.getRange(startRow, 1).setValue('⏰ EMPLOYEE OVERTIME').setFontSize(14).setFontWeight('bold');
  startRow += 2;

  // Parse overtime data
  const overtime = {};

  data.rows.forEach(row => {
    const overtimeText = row[15] || ''; // Overtime column
    if (overtimeText) {
      // Parse "Employee: Xh, Employee2: Yh"
      const entries = overtimeText.split(',');
      entries.forEach(entry => {
        const match = entry.trim().match(/(.+?):\s*([\d.]+)h/);
        if (match) {
          const employee = match[1].trim();
          const hours = parseFloat(match[2]);
          overtime[employee] = (overtime[employee] || 0) + hours;
        }
      });
    }
  });

  sheet.getRange(startRow, 1, 1, 2).setValues([['Employee', 'Total Hours']]).setFontWeight('bold');
  startRow++;

  const overtimeData = Object.entries(overtime).map(([employee, hours]) => [employee, hours.toFixed(2)]);
  if (overtimeData.length > 0) {
    sheet.getRange(startRow, 1, overtimeData.length, 2).setValues(overtimeData);
    startRow += overtimeData.length;
  } else {
    sheet.getRange(startRow, 1).setValue('No overtime recorded');
    startRow++;
  }

  return startRow + 2;
}

/**
 * Add diesel consumption section
 */
function addDieselSection(sheet, startRow, data) {
  sheet.getRange(startRow, 1).setValue('⛽ DIESEL CONSUMPTION').setFontSize(14).setFontWeight('bold');
  startRow += 2;

  // Group by truck type
  const diesel = {};
  let totalLiters = 0;

  data.rows.forEach(row => {
    const truckType = row[11] || 'Unknown'; // Diesel Truck
    const liters = parseFloat(row[12] || 0); // Diesel Liters

    if (liters > 0) {
      diesel[truckType] = (diesel[truckType] || 0) + liters;
      totalLiters += liters;
    }
  });

  sheet.getRange(startRow, 1, 1, 2).setValues([['Truck Type', 'Liters']]).setFontWeight('bold');
  startRow++;

  const dieselData = Object.entries(diesel).map(([truck, liters]) => [truck, liters.toFixed(2)]);
  if (dieselData.length > 0) {
    sheet.getRange(startRow, 1, dieselData.length, 2).setValues(dieselData);
    startRow += dieselData.length;
  }

  sheet.getRange(startRow, 1, 1, 2).setValues([['TOTAL DIESEL', totalLiters.toFixed(2)]]).setFontWeight('bold');
  startRow++;

  return startRow + 2;
}

/**
 * Add wastewater section
 */
function addWastewaterSection(sheet, startRow, data) {
  sheet.getRange(startRow, 1).setValue('💧 WASTEWATER COLLECTION').setFontSize(14).setFontWeight('bold');
  startRow += 2;

  // Group by truck type
  const wastewater = {};
  let totalLiters = 0;

  data.rows.forEach(row => {
    const truckType = row[13] || 'Unknown'; // Wastewater Truck
    const liters = parseFloat(row[14] || 0); // Wastewater Liters

    if (liters > 0) {
      wastewater[truckType] = (wastewater[truckType] || 0) + liters;
      totalLiters += liters;
    }
  });

  sheet.getRange(startRow, 1, 1, 2).setValues([['Truck Type', 'Liters']]).setFontWeight('bold');
  startRow++;

  const wastewaterData = Object.entries(wastewater).map(([truck, liters]) => [truck, liters.toFixed(2)]);
  if (wastewaterData.length > 0) {
    sheet.getRange(startRow, 1, wastewaterData.length, 2).setValues(wastewaterData);
    startRow += wastewaterData.length;
  }

  sheet.getRange(startRow, 1, 1, 2).setValues([['TOTAL WASTEWATER', totalLiters.toFixed(2)]]).setFontWeight('bold');
  startRow++;

  return startRow + 2;
}

/**
 * Format the report sheet
 */
function formatReportSheet(sheet) {
  // Auto-resize columns
  sheet.autoResizeColumns(1, 2);

  // Set alternating row colors
  const lastRow = sheet.getLastRow();
  const range = sheet.getRange(1, 1, lastRow, 2);
  range.setVerticalAlignment('middle');

  // Set column widths
  sheet.setColumnWidth(1, 300);
  sheet.setColumnWidth(2, 150);
}

/**
 * Helper functions
 */
function getMonthName(month) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month];
}

function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'MMM dd, yyyy');
}
