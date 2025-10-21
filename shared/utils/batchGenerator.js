/**
 * Batch Number Generator
 * Automatically generates batch numbers based on consumption
 */

import { BATCH_PREFIX } from '../config/products.js';

/**
 * Generate batch ID in format: PKG-YYMMDD-SEQ
 * @param {string} seedType - Seed type (T6, 361, etc.)
 * @param {Date} date - Production date
 * @param {number} sequence - Sequence number for the day
 * @returns {string} Batch ID
 */
export function generateBatchId(seedType, date = new Date(), sequence = 1) {
  const prefix = BATCH_PREFIX[seedType] || 'PKG';
  const dateStr = formatDateForBatch(date);
  const seqStr = String(sequence).padStart(3, '0');

  return `${prefix}-${dateStr}-${seqStr}`;
}

/**
 * Format date as YYMMDD
 */
export function formatDateForBatch(date) {
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}${month}${day}`;
}

/**
 * Parse batch ID to extract components
 */
export function parseBatchId(batchId) {
  // Format: PREFIX-YYMMDD-SEQ
  const parts = batchId.split('-');

  if (parts.length !== 3) {
    return null;
  }

  return {
    prefix: parts[0],
    dateStr: parts[1],
    sequence: parseInt(parts[2], 10),
    fullId: batchId
  };
}

/**
 * Get next sequence number for a given prefix and date
 */
export function getNextSequence(existingBatches, seedType, date = new Date()) {
  const prefix = BATCH_PREFIX[seedType] || 'PKG';
  const dateStr = formatDateForBatch(date);
  const pattern = `${prefix}-${dateStr}-`;

  let maxSequence = 0;

  existingBatches.forEach(batch => {
    if (batch.batchId && batch.batchId.startsWith(pattern)) {
      const parsed = parseBatchId(batch.batchId);
      if (parsed && parsed.sequence > maxSequence) {
        maxSequence = parsed.sequence;
      }
    }
  });

  return maxSequence + 1;
}

/**
 * Calculate remaining weight in a batch
 */
export function calculateRemainingWeight(batch) {
  const initialWeight = parseFloat(batch.initialWeight) || 0;
  const consumedWeight = parseFloat(batch.consumedWeight) || 0;
  return Math.max(0, initialWeight - consumedWeight);
}

/**
 * Check if batch should be closed based on remaining weight
 */
export function shouldCloseBatch(batch, threshold = 0.001) {
  const remaining = calculateRemainingWeight(batch);
  return remaining <= threshold; // Less than 1kg
}

/**
 * Find active batch for consumption (FIFO - First In First Out)
 */
export function findActiveBatchForConsumption(batches, seedType, size, variant = '') {
  // Filter active batches matching the criteria
  const matchingBatches = batches.filter(batch =>
    batch.seedType === seedType &&
    batch.size === size &&
    (batch.variant || '') === variant &&
    batch.status === 'ACTIVE' &&
    calculateRemainingWeight(batch) > 0.001
  );

  // Sort by production date (oldest first - FIFO)
  matchingBatches.sort((a, b) => {
    const dateA = new Date(a.productionDate || a.date);
    const dateB = new Date(b.productionDate || b.date);
    return dateA - dateB;
  });

  return matchingBatches[0] || null;
}

/**
 * Calculate consumption across multiple batches
 */
export function calculateConsumptionAcrossBatches(batches, requiredWeight) {
  const consumptions = [];
  let remainingWeight = requiredWeight;

  for (const batch of batches) {
    if (remainingWeight <= 0.001) break;

    const batchRemaining = calculateRemainingWeight(batch);
    const consumeFromBatch = Math.min(remainingWeight, batchRemaining);

    consumptions.push({
      batchId: batch.batchId,
      consumed: consumeFromBatch,
      batchRemainingAfter: batchRemaining - consumeFromBatch,
      shouldClose: (batchRemaining - consumeFromBatch) <= 0.001
    });

    remainingWeight -= consumeFromBatch;
  }

  return {
    consumptions,
    fullyConsumed: remainingWeight <= 0.001,
    shortBy: Math.max(0, remainingWeight)
  };
}

/**
 * Validate batch data
 */
export function validateBatchData(batchData) {
  const errors = [];

  if (!batchData.seedType) {
    errors.push('Seed type is required');
  }

  if (!batchData.size) {
    errors.push('Size is required');
  }

  if (!batchData.weight || parseFloat(batchData.weight) <= 0) {
    errors.push('Valid weight is required');
  }

  if (!batchData.productionDate) {
    errors.push('Production date is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Format weight for display
 */
export function formatWeight(weight, unit = 'T', decimals = 3) {
  const num = parseFloat(weight) || 0;
  return `${num.toFixed(decimals)} ${unit}`;
}

/**
 * Convert weight units
 */
export function convertWeight(weight, fromUnit, toUnit) {
  const conversions = {
    'kg': 1,
    'T': 1000,
    'g': 0.001
  };

  const weightInKg = weight * conversions[fromUnit];
  return weightInKg / conversions[toUnit];
}

export default {
  generateBatchId,
  formatDateForBatch,
  parseBatchId,
  getNextSequence,
  calculateRemainingWeight,
  shouldCloseBatch,
  findActiveBatchForConsumption,
  calculateConsumptionAcrossBatches,
  validateBatchData,
  formatWeight,
  convertWeight
};
