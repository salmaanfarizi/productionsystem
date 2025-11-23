import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateBatchId,
  formatDateForBatch,
  formatDateForPackingBatch,
  parseBatchId,
  getNextSequence,
  calculateRemainingWeight,
  shouldCloseBatch,
  findActiveBatchForConsumption,
  calculateConsumptionAcrossBatches,
  validateBatchData,
  formatWeight,
  convertWeight
} from '../batchGenerator.js';

describe('batchGenerator', () => {
  describe('generateBatchId', () => {
    it('should generate batch ID in ER-DDMMDD-SEQ format', () => {
      const packingDate = new Date(2024, 5, 15); // June 15, 2024
      const batchId = generateBatchId('T6', packingDate, 1);

      expect(batchId).toMatch(/^ER-\d{6}-\d{3}$/);
      expect(batchId).toBe('ER-150615-001');
    });

    it('should pad sequence numbers to 3 digits', () => {
      const packingDate = new Date(2024, 5, 15);

      expect(generateBatchId('T6', packingDate, 1)).toContain('-001');
      expect(generateBatchId('T6', packingDate, 10)).toContain('-010');
      expect(generateBatchId('T6', packingDate, 100)).toContain('-100');
      expect(generateBatchId('T6', packingDate, 999)).toContain('-999');
    });

    it('should use WIP date for the first part of date string when provided', () => {
      const packingDate = new Date(2024, 5, 15); // June 15
      const wipDate = new Date(2024, 5, 10); // June 10

      const batchId = generateBatchId('T6', packingDate, 1, wipDate);

      // Format is DDMMDD: WIP day (10) + month (06) + packing day (15)
      expect(batchId).toBe('ER-100615-001');
    });

    it('should use packing date for both parts when WIP date is null', () => {
      const packingDate = new Date(2024, 5, 15);

      const batchId = generateBatchId('T6', packingDate, 1, null);

      // WIP day = packing day when not provided
      expect(batchId).toBe('ER-150615-001');
    });

    it('should handle cross-month WIP/packing dates', () => {
      const packingDate = new Date(2024, 6, 2); // July 2
      const wipDate = new Date(2024, 5, 30); // June 30

      const batchId = generateBatchId('T6', packingDate, 1, wipDate);

      // WIP day (30) + packing month (07) + packing day (02)
      expect(batchId).toBe('ER-300702-001');
    });

    it('should use default date when no date provided', () => {
      const batchId = generateBatchId('T6');

      expect(batchId).toMatch(/^ER-\d{6}-001$/);
    });
  });

  describe('formatDateForPackingBatch', () => {
    it('should format date as DDMMDD (WIP day + month + packing day)', () => {
      const wipDate = new Date(2024, 5, 10); // June 10
      const packingDate = new Date(2024, 5, 15); // June 15

      const result = formatDateForPackingBatch(wipDate, packingDate);

      expect(result).toBe('100615');
    });

    it('should pad single digit days and months', () => {
      const wipDate = new Date(2024, 0, 5); // Jan 5
      const packingDate = new Date(2024, 0, 8); // Jan 8

      const result = formatDateForPackingBatch(wipDate, packingDate);

      expect(result).toBe('050108');
    });

    it('should handle December correctly', () => {
      const wipDate = new Date(2024, 11, 25); // Dec 25
      const packingDate = new Date(2024, 11, 31); // Dec 31

      const result = formatDateForPackingBatch(wipDate, packingDate);

      expect(result).toBe('251231');
    });
  });

  describe('formatDateForBatch', () => {
    it('should format date as YYMMDD', () => {
      const date = new Date(2024, 5, 15);

      const result = formatDateForBatch(date);

      expect(result).toBe('240615');
    });

    it('should pad single digit months and days', () => {
      const date = new Date(2024, 0, 5); // Jan 5, 2024

      const result = formatDateForBatch(date);

      expect(result).toBe('240105');
    });
  });

  describe('parseBatchId', () => {
    it('should parse valid batch ID correctly', () => {
      const result = parseBatchId('ER-150615-001');

      expect(result).toEqual({
        prefix: 'ER',
        dateStr: '150615',
        wipDay: '15',
        month: '06',
        packDay: '15',
        sequence: 1,
        fullId: 'ER-150615-001'
      });
    });

    it('should parse batch ID with different sequence numbers', () => {
      expect(parseBatchId('ER-100715-042').sequence).toBe(42);
      expect(parseBatchId('ER-100715-999').sequence).toBe(999);
    });

    it('should return null for malformed batch IDs', () => {
      expect(parseBatchId('invalid')).toBeNull();
      expect(parseBatchId('ER-150615')).toBeNull();
      expect(parseBatchId('ER150615001')).toBeNull();
      expect(parseBatchId('')).toBeNull();
    });

    it('should return null for batch ID with too many parts', () => {
      expect(parseBatchId('ER-15-06-15-001')).toBeNull();
    });
  });

  describe('getNextSequence', () => {
    it('should return 1 for empty batch list', () => {
      const result = getNextSequence([], 'T6', new Date(2024, 5, 15));

      expect(result).toBe(1);
    });

    it('should return next sequence after existing batches', () => {
      const existingBatches = [
        { batchId: 'ER-150615-001' },
        { batchId: 'ER-150615-002' },
        { batchId: 'ER-150615-003' }
      ];

      const result = getNextSequence(existingBatches, 'T6', new Date(2024, 5, 15));

      expect(result).toBe(4);
    });

    it('should find max sequence even when not in order', () => {
      const existingBatches = [
        { batchId: 'ER-150615-005' },
        { batchId: 'ER-150615-002' },
        { batchId: 'ER-150615-010' }
      ];

      const result = getNextSequence(existingBatches, 'T6', new Date(2024, 5, 15));

      expect(result).toBe(11);
    });

    it('should ignore batches from different dates', () => {
      const existingBatches = [
        { batchId: 'ER-150615-005' }, // Same date
        { batchId: 'ER-140615-010' }  // Different date (WIP day 14)
      ];

      const result = getNextSequence(existingBatches, 'T6', new Date(2024, 5, 15));

      expect(result).toBe(6);
    });

    it('should handle batches with null batchId', () => {
      const existingBatches = [
        { batchId: 'ER-150615-001' },
        { batchId: null },
        { batchId: undefined }
      ];

      const result = getNextSequence(existingBatches, 'T6', new Date(2024, 5, 15));

      expect(result).toBe(2);
    });

    it('should consider WIP date for sequence lookup', () => {
      const existingBatches = [
        { batchId: 'ER-100615-003' } // WIP day 10, month 06, pack day 15
      ];

      const packingDate = new Date(2024, 5, 15);
      const wipDate = new Date(2024, 5, 10);

      const result = getNextSequence(existingBatches, 'T6', packingDate, wipDate);

      expect(result).toBe(4);
    });
  });

  describe('calculateRemainingWeight', () => {
    it('should calculate remaining weight correctly', () => {
      const batch = { initialWeight: 100, consumedWeight: 30 };

      expect(calculateRemainingWeight(batch)).toBe(70);
    });

    it('should return 0 when consumed exceeds initial', () => {
      const batch = { initialWeight: 50, consumedWeight: 60 };

      expect(calculateRemainingWeight(batch)).toBe(0);
    });

    it('should handle missing values as 0', () => {
      expect(calculateRemainingWeight({})).toBe(0);
      expect(calculateRemainingWeight({ initialWeight: 100 })).toBe(100);
      expect(calculateRemainingWeight({ consumedWeight: 50 })).toBe(0);
    });

    it('should handle string values', () => {
      const batch = { initialWeight: '100', consumedWeight: '30' };

      expect(calculateRemainingWeight(batch)).toBe(70);
    });

    it('should handle null and undefined values', () => {
      expect(calculateRemainingWeight({ initialWeight: null, consumedWeight: null })).toBe(0);
      expect(calculateRemainingWeight({ initialWeight: undefined })).toBe(0);
    });
  });

  describe('shouldCloseBatch', () => {
    it('should return true when remaining weight is at or below threshold', () => {
      const batch = { initialWeight: 100, consumedWeight: 99.9995 };

      expect(shouldCloseBatch(batch)).toBe(true);
    });

    it('should return false when remaining weight exceeds threshold', () => {
      const batch = { initialWeight: 100, consumedWeight: 99 };

      expect(shouldCloseBatch(batch)).toBe(false);
    });

    it('should use custom threshold', () => {
      const batch = { initialWeight: 100, consumedWeight: 95 };

      expect(shouldCloseBatch(batch, 5)).toBe(true);
      expect(shouldCloseBatch(batch, 4)).toBe(false);
    });

    it('should return true for fully consumed batch', () => {
      const batch = { initialWeight: 100, consumedWeight: 100 };

      expect(shouldCloseBatch(batch)).toBe(true);
    });
  });

  describe('findActiveBatchForConsumption', () => {
    const batches = [
      {
        batchId: 'ER-150615-001',
        seedType: 'T6',
        size: '200-210',
        variant: 'Eastern',
        status: 'ACTIVE',
        initialWeight: 100,
        consumedWeight: 50,
        productionDate: '2024-06-10'
      },
      {
        batchId: 'ER-150615-002',
        seedType: 'T6',
        size: '200-210',
        variant: 'Eastern',
        status: 'ACTIVE',
        initialWeight: 100,
        consumedWeight: 0,
        productionDate: '2024-06-12'
      },
      {
        batchId: 'ER-150615-003',
        seedType: '361',
        size: '200-210',
        variant: 'Eastern',
        status: 'ACTIVE',
        initialWeight: 100,
        consumedWeight: 0,
        productionDate: '2024-06-11'
      }
    ];

    it('should find batch matching criteria using FIFO', () => {
      const result = findActiveBatchForConsumption(batches, 'T6', '200-210', 'Eastern');

      expect(result.batchId).toBe('ER-150615-001');
    });

    it('should return null when no matching batch found', () => {
      const result = findActiveBatchForConsumption(batches, 'T6', '210-220', 'Eastern');

      expect(result).toBeNull();
    });

    it('should filter by seed type', () => {
      const result = findActiveBatchForConsumption(batches, '361', '200-210', 'Eastern');

      expect(result.batchId).toBe('ER-150615-003');
    });

    it('should ignore batches with no remaining weight', () => {
      const batchesWithEmpty = [
        {
          batchId: 'ER-150615-001',
          seedType: 'T6',
          size: '200-210',
          variant: '',
          status: 'ACTIVE',
          initialWeight: 100,
          consumedWeight: 100,
          productionDate: '2024-06-10'
        },
        {
          batchId: 'ER-150615-002',
          seedType: 'T6',
          size: '200-210',
          variant: '',
          status: 'ACTIVE',
          initialWeight: 100,
          consumedWeight: 0,
          productionDate: '2024-06-12'
        }
      ];

      const result = findActiveBatchForConsumption(batchesWithEmpty, 'T6', '200-210', '');

      expect(result.batchId).toBe('ER-150615-002');
    });

    it('should ignore closed batches', () => {
      const batchesWithClosed = [
        {
          batchId: 'ER-150615-001',
          seedType: 'T6',
          size: '200-210',
          variant: '',
          status: 'CLOSED',
          initialWeight: 100,
          consumedWeight: 50,
          productionDate: '2024-06-10'
        },
        {
          batchId: 'ER-150615-002',
          seedType: 'T6',
          size: '200-210',
          variant: '',
          status: 'ACTIVE',
          initialWeight: 100,
          consumedWeight: 0,
          productionDate: '2024-06-12'
        }
      ];

      const result = findActiveBatchForConsumption(batchesWithClosed, 'T6', '200-210', '');

      expect(result.batchId).toBe('ER-150615-002');
    });

    it('should handle empty variant', () => {
      const batchesNoVariant = [
        {
          batchId: 'ER-150615-001',
          seedType: 'T6',
          size: '200-210',
          status: 'ACTIVE',
          initialWeight: 100,
          consumedWeight: 0,
          productionDate: '2024-06-10'
        }
      ];

      const result = findActiveBatchForConsumption(batchesNoVariant, 'T6', '200-210', '');

      expect(result.batchId).toBe('ER-150615-001');
    });
  });

  describe('calculateConsumptionAcrossBatches', () => {
    const batches = [
      { batchId: 'B1', initialWeight: 50, consumedWeight: 0 },
      { batchId: 'B2', initialWeight: 30, consumedWeight: 0 },
      { batchId: 'B3', initialWeight: 40, consumedWeight: 0 }
    ];

    it('should consume from single batch when sufficient', () => {
      const result = calculateConsumptionAcrossBatches(batches, 30);

      expect(result.fullyConsumed).toBe(true);
      expect(result.shortBy).toBe(0);
      expect(result.consumptions).toHaveLength(1);
      expect(result.consumptions[0].batchId).toBe('B1');
      expect(result.consumptions[0].consumed).toBe(30);
    });

    it('should consume across multiple batches', () => {
      const result = calculateConsumptionAcrossBatches(batches, 70);

      expect(result.fullyConsumed).toBe(true);
      expect(result.consumptions).toHaveLength(2);
      expect(result.consumptions[0]).toEqual({
        batchId: 'B1',
        consumed: 50,
        batchRemainingAfter: 0,
        shouldClose: true
      });
      expect(result.consumptions[1]).toEqual({
        batchId: 'B2',
        consumed: 20,
        batchRemainingAfter: 10,
        shouldClose: false
      });
    });

    it('should indicate when not fully consumed', () => {
      const result = calculateConsumptionAcrossBatches(batches, 150);

      expect(result.fullyConsumed).toBe(false);
      expect(result.shortBy).toBe(30);
      expect(result.consumptions).toHaveLength(3);
    });

    it('should handle zero required weight', () => {
      const result = calculateConsumptionAcrossBatches(batches, 0);

      expect(result.fullyConsumed).toBe(true);
      expect(result.consumptions).toHaveLength(0);
    });

    it('should handle empty batch list', () => {
      const result = calculateConsumptionAcrossBatches([], 50);

      expect(result.fullyConsumed).toBe(false);
      expect(result.shortBy).toBe(50);
    });

    it('should mark batches as shouldClose when fully consumed', () => {
      const result = calculateConsumptionAcrossBatches(batches, 50);

      expect(result.consumptions[0].shouldClose).toBe(true);
      expect(result.consumptions[0].batchRemainingAfter).toBe(0);
    });

    it('should handle partial batches correctly', () => {
      const partialBatches = [
        { batchId: 'B1', initialWeight: 100, consumedWeight: 60 }, // 40 remaining
        { batchId: 'B2', initialWeight: 50, consumedWeight: 0 }    // 50 remaining
      ];

      const result = calculateConsumptionAcrossBatches(partialBatches, 60);

      expect(result.consumptions[0].consumed).toBe(40);
      expect(result.consumptions[1].consumed).toBe(20);
      expect(result.fullyConsumed).toBe(true);
    });
  });

  describe('validateBatchData', () => {
    it('should validate correct batch data', () => {
      const batchData = {
        seedType: 'T6',
        size: '200-210',
        weight: 100,
        productionDate: '2024-06-15'
      };

      const result = validateBatchData(batchData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require seed type', () => {
      const batchData = {
        size: '200-210',
        weight: 100,
        productionDate: '2024-06-15'
      };

      const result = validateBatchData(batchData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Seed type is required');
    });

    it('should require size', () => {
      const batchData = {
        seedType: 'T6',
        weight: 100,
        productionDate: '2024-06-15'
      };

      const result = validateBatchData(batchData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Size is required');
    });

    it('should require positive weight', () => {
      const batchData = {
        seedType: 'T6',
        size: '200-210',
        weight: 0,
        productionDate: '2024-06-15'
      };

      const result = validateBatchData(batchData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid weight is required');
    });

    it('should require production date', () => {
      const batchData = {
        seedType: 'T6',
        size: '200-210',
        weight: 100
      };

      const result = validateBatchData(batchData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Production date is required');
    });

    it('should collect all errors', () => {
      const batchData = {};

      const result = validateBatchData(batchData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4);
    });

    it('should reject negative weight', () => {
      const batchData = {
        seedType: 'T6',
        size: '200-210',
        weight: -10,
        productionDate: '2024-06-15'
      };

      const result = validateBatchData(batchData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid weight is required');
    });
  });

  describe('formatWeight', () => {
    it('should format weight with default unit and decimals', () => {
      expect(formatWeight(10.5)).toBe('10.500 T');
    });

    it('should format weight with custom unit', () => {
      expect(formatWeight(10.5, 'kg')).toBe('10.500 kg');
    });

    it('should format weight with custom decimals', () => {
      expect(formatWeight(10.5, 'T', 1)).toBe('10.5 T');
      expect(formatWeight(10.5678, 'T', 2)).toBe('10.57 T');
    });

    it('should handle string input', () => {
      expect(formatWeight('10.5')).toBe('10.500 T');
    });

    it('should handle invalid input as 0', () => {
      expect(formatWeight(null)).toBe('0.000 T');
      expect(formatWeight(undefined)).toBe('0.000 T');
      expect(formatWeight('invalid')).toBe('0.000 T');
    });
  });

  describe('convertWeight', () => {
    it('should convert kg to T', () => {
      expect(convertWeight(1000, 'kg', 'T')).toBe(1);
      expect(convertWeight(500, 'kg', 'T')).toBe(0.5);
    });

    it('should convert T to kg', () => {
      expect(convertWeight(1, 'T', 'kg')).toBe(1000);
      expect(convertWeight(0.5, 'T', 'kg')).toBe(500);
    });

    it('should convert kg to g', () => {
      expect(convertWeight(1, 'kg', 'g')).toBe(1000);
    });

    it('should convert g to kg', () => {
      expect(convertWeight(1000, 'g', 'kg')).toBe(1);
    });

    it('should convert T to g', () => {
      expect(convertWeight(1, 'T', 'g')).toBe(1000000);
    });

    it('should handle same unit conversion', () => {
      expect(convertWeight(100, 'kg', 'kg')).toBe(100);
      expect(convertWeight(5, 'T', 'T')).toBe(5);
    });
  });
});
