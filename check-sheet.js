// Script to check Google Sheet data
const GOOGLE_SHEETS_API_KEY = 'AIzaSyBXhap6yMJqBEp40cgJ5Kyhv7Ia_9wDzgs';
const SPREADSHEET_ID = '1UYeOfBCs_VXT4ubE-X-qXLPHYSJPG1rIW2oTNUtUqMo';

async function checkSheet(sheetName) {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}?key=${GOOGLE_SHEETS_API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Error fetching ${sheetName}: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error checking sheet ${sheetName}:`, error.message);
    return null;
  }
}

async function getAllSheets() {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?key=${GOOGLE_SHEETS_API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Error fetching spreadsheet metadata: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data.sheets.map(sheet => sheet.properties.title);
  } catch (error) {
    console.error('Error getting sheets:', error.message);
    return null;
  }
}

async function main() {
  console.log('Checking Google Sheets...\n');
  console.log(`Spreadsheet ID: ${SPREADSHEET_ID}\n`);

  // Get all sheet names
  const sheetNames = await getAllSheets();

  if (!sheetNames) {
    console.error('Failed to retrieve sheet names');
    return;
  }

  console.log(`Found ${sheetNames.length} sheets:\n`);

  for (const sheetName of sheetNames) {
    console.log(`\n========== ${sheetName} ==========`);
    const data = await checkSheet(sheetName);

    if (data && data.values) {
      console.log(`Rows: ${data.values.length}`);
      console.log(`Headers: ${data.values[0] ? data.values[0].join(', ') : 'No headers'}`);
      console.log(`Sample data (first 3 rows):`);
      data.values.slice(0, 3).forEach((row, idx) => {
        console.log(`  Row ${idx}: ${JSON.stringify(row)}`);
      });
    } else {
      console.log('No data found');
    }
  }
}

main();
