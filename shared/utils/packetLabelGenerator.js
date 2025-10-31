// Region code mapping for batch labels
export const REGION_CODES = {
  'Riyadh': 'RR',
  'Riyadh Region': 'RR',
  'Makkah': 'MR',
  'Makkah Region': 'MR',
  'Madinah': 'MDR',
  'Madinah Region': 'MDR',
  'Eastern': 'ER',
  'Eastern Region': 'ER',
  'Eastern Province': 'ER',
  'Eastern Province Region': 'ER',
  'Asir': 'AR',
  'Asir Region': 'AR',
  'Tabuk': 'TR',
  'Tabuk Region': 'TR',
  'Qassim': 'QR',
  'Qassim Region': 'QR',
  'Hail': 'HR',
  'Hail Region': 'HR',
  'Jazan': 'JR',
  'Jazan Region': 'JR',
  'Najran': 'NR',
  'Najran Region': 'NR',
  'Al Baha': 'BR',
  'Al Baha Region': 'BR',
  'Northern Borders': 'NBR',
  'Northern Borders Region': 'NBR',
  'Jouf': 'JFR',
  'Jouf Region': 'JFR',
  'N/A': 'NA',
  'Default': 'GEN' // General/No region
};

/**
 * Generate packet label batch number
 * Format: DDMMDD-REGION-SEQ
 *
 * Example: 241025-RR-001
 * - 24 = WIP production date (from WIP batch)
 * - 10 = Month
 * - 25 = Packing date (today)
 * - RR = Region code (Riyadh Region)
 * - 001 = Sequence number
 *
 * @param {string} wipBatchId - WIP batch ID like "WIP-SUN-251024-001"
 * @param {string} region - Region name like "Riyadh Region"
 * @param {string} packingDate - Packing date in YYYY-MM-DD format
 * @param {number} sequence - Sequence number for this day/region
 * @returns {string} Packet label like "241025-RR-001"
 */
export function generatePacketLabel(wipBatchId, region, packingDate, sequence = 1) {
  try {
    console.log('🏷️ Generating Packet Label:');
    console.log('  - WIP Batch ID:', wipBatchId);
    console.log('  - Region:', region);
    console.log('  - Packing Date:', packingDate);
    console.log('  - Sequence:', sequence);

    // Parse WIP batch ID: WIP-SUN-251024-001
    // Format is: WIP-{PRODUCT}-{YYMMDD}-{SEQ}
    const parts = wipBatchId.split('-');
    if (parts.length < 3) {
      throw new Error('Invalid WIP batch ID format');
    }

    const wipDateStr = parts[2]; // "251024"
    console.log('  - WIP Date String:', wipDateStr);

    // Extract components from WIP date (YYMMDD)
    const wipDay = wipDateStr.substring(0, 2);   // "25" (actually day, not year)
    const wipMonth = wipDateStr.substring(2, 4); // "10"
    console.log('  - WIP Day:', wipDay, 'WIP Month:', wipMonth);

    // Extract packing day from packingDate (YYYY-MM-DD)
    const packingDay = packingDate.split('-')[2]; // "25"
    console.log('  - Packing Day:', packingDay);

    // Get region code
    const regionCode = REGION_CODES[region] || REGION_CODES['Default'];
    console.log('  - Region Code:', regionCode);

    // Format sequence as 3 digits
    const seqStr = sequence.toString().padStart(3, '0');
    console.log('  - Sequence String:', seqStr);

    // Build label: DDMMDD-REGION-SEQ
    const label = `${wipDay}${wipMonth}${packingDay}-${regionCode}-${seqStr}`;
    console.log('  ✅ FINAL LABEL:', label);

    return label;
  } catch (error) {
    console.error('❌ Error generating packet label:', error);
    return null;
  }
}

/**
 * Parse packet label to get components
 * @param {string} label - Label like "241025-RR-001"
 * @returns {object} Components: {wipDay, month, packingDay, regionCode, sequence}
 */
export function parsePacketLabel(label) {
  try {
    const parts = label.split('-');
    if (parts.length !== 3) {
      throw new Error('Invalid label format');
    }

    const dateStr = parts[0]; // "241025"
    const regionCode = parts[1]; // "RR"
    const sequence = parseInt(parts[2]); // "001" → 1

    return {
      wipDay: dateStr.substring(0, 2),
      month: dateStr.substring(2, 4),
      packingDay: dateStr.substring(4, 6),
      regionCode,
      sequence
    };
  } catch (error) {
    console.error('Error parsing packet label:', error);
    return null;
  }
}

/**
 * Get next sequence number for a region on a specific date
 * This should query the packing records to find the last sequence used
 * @param {string} region - Region name
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Array} existingLabels - Array of existing labels for the day
 * @returns {number} Next sequence number
 */
export function getNextSequence(region, date, existingLabels = []) {
  const regionCode = REGION_CODES[region] || REGION_CODES['Default'];
  const packingDay = date.split('-')[2];

  // Filter labels for same region and date
  const relevantLabels = existingLabels.filter(label => {
    const parsed = parsePacketLabel(label);
    return parsed &&
           parsed.regionCode === regionCode &&
           parsed.packingDay === packingDay;
  });

  if (relevantLabels.length === 0) {
    return 1;
  }

  // Find max sequence
  const maxSeq = Math.max(...relevantLabels.map(label => {
    const parsed = parsePacketLabel(label);
    return parsed ? parsed.sequence : 0;
  }));

  return maxSeq + 1;
}
