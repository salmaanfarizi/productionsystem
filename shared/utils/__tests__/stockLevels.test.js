import { describe, it, expect } from 'vitest';
import {
  STOCK_LEVEL_THRESHOLDS,
  getStockLevelStatus,
  getStockPercentage,
  formatStockLevels
} from '../stockLevels.js';

describe('stockLevels', () => {
  describe('STOCK_LEVEL_THRESHOLDS', () => {
    it('should have correct threshold values', () => {
      expect(STOCK_LEVEL_THRESHOLDS.CRITICAL).toBe(0.2);
      expect(STOCK_LEVEL_THRESHOLDS.LOW).toBe(0.5);
      expect(STOCK_LEVEL_THRESHOLDS.NORMAL).toBe(1.0);
      expect(STOCK_LEVEL_THRESHOLDS.HIGH).toBe(1.5);
    });
  });

  describe('getStockLevelStatus', () => {
    const minLevel = 100;
    const maxLevel = 500;

    describe('critical status (< 20% of min)', () => {
      it('should return critical when qty is 0', () => {
        const result = getStockLevelStatus(0, minLevel, maxLevel);

        expect(result.status).toBe('critical');
        expect(result.color).toBe('red');
        expect(result.bgColor).toBe('bg-red-50');
      });

      it('should return critical when qty is below 20% of min', () => {
        const result = getStockLevelStatus(15, minLevel, maxLevel);

        expect(result.status).toBe('critical');
      });

      it('should return critical at exactly 19.9% of min', () => {
        const result = getStockLevelStatus(19.9, minLevel, maxLevel);

        expect(result.status).toBe('critical');
      });
    });

    describe('low status (20% - 50% of min)', () => {
      it('should return low when qty is at 20% of min', () => {
        const result = getStockLevelStatus(20, minLevel, maxLevel);

        expect(result.status).toBe('low');
        expect(result.color).toBe('orange');
        expect(result.bgColor).toBe('bg-orange-50');
      });

      it('should return low when qty is between 20% and 50% of min', () => {
        const result = getStockLevelStatus(35, minLevel, maxLevel);

        expect(result.status).toBe('low');
      });

      it('should return low at just under 50% of min', () => {
        const result = getStockLevelStatus(49.9, minLevel, maxLevel);

        expect(result.status).toBe('low');
      });
    });

    describe('below-min status (50% - 100% of min)', () => {
      it('should return below-min when qty is at 50% of min', () => {
        const result = getStockLevelStatus(50, minLevel, maxLevel);

        expect(result.status).toBe('below-min');
        expect(result.color).toBe('yellow');
        expect(result.bgColor).toBe('bg-yellow-50');
      });

      it('should return below-min when qty is between 50% and 100% of min', () => {
        const result = getStockLevelStatus(75, minLevel, maxLevel);

        expect(result.status).toBe('below-min');
      });

      it('should return below-min at just under min', () => {
        const result = getStockLevelStatus(99.9, minLevel, maxLevel);

        expect(result.status).toBe('below-min');
      });
    });

    describe('normal status (min <= qty <= max)', () => {
      it('should return normal when qty equals min', () => {
        const result = getStockLevelStatus(100, minLevel, maxLevel);

        expect(result.status).toBe('normal');
        expect(result.color).toBe('green');
        expect(result.bgColor).toBe('bg-green-50');
      });

      it('should return normal when qty is between min and max', () => {
        const result = getStockLevelStatus(300, minLevel, maxLevel);

        expect(result.status).toBe('normal');
      });

      it('should return normal when qty equals max', () => {
        const result = getStockLevelStatus(500, minLevel, maxLevel);

        expect(result.status).toBe('normal');
      });
    });

    describe('high status (max < qty <= 150% of max)', () => {
      it('should return high when qty is just above max', () => {
        const result = getStockLevelStatus(501, minLevel, maxLevel);

        expect(result.status).toBe('high');
        expect(result.color).toBe('blue');
        expect(result.bgColor).toBe('bg-blue-50');
      });

      it('should return high when qty is at 150% of max', () => {
        const result = getStockLevelStatus(750, minLevel, maxLevel);

        expect(result.status).toBe('high');
      });
    });

    describe('overstock status (> 150% of max)', () => {
      it('should return overstock when qty exceeds 150% of max', () => {
        const result = getStockLevelStatus(751, minLevel, maxLevel);

        expect(result.status).toBe('overstock');
        expect(result.color).toBe('purple');
        expect(result.bgColor).toBe('bg-purple-50');
      });

      it('should return overstock for very high quantities', () => {
        const result = getStockLevelStatus(1000, minLevel, maxLevel);

        expect(result.status).toBe('overstock');
      });
    });

    describe('unknown status (no limits set)', () => {
      it('should return unknown when both limits are missing', () => {
        const result = getStockLevelStatus(100, null, null);

        expect(result.status).toBe('unknown');
        expect(result.color).toBe('gray');
      });

      it('should return unknown when both limits are 0', () => {
        const result = getStockLevelStatus(100, 0, 0);

        expect(result.status).toBe('unknown');
      });

      it('should return unknown when both limits are undefined', () => {
        const result = getStockLevelStatus(100, undefined, undefined);

        expect(result.status).toBe('unknown');
      });
    });

    describe('edge cases', () => {
      it('should handle string values', () => {
        const result = getStockLevelStatus('300', '100', '500');

        expect(result.status).toBe('normal');
      });

      it('should handle negative quantity as critical', () => {
        const result = getStockLevelStatus(-10, minLevel, maxLevel);

        expect(result.status).toBe('critical');
      });

      it('should handle only min level set', () => {
        const result = getStockLevelStatus(150, 100, null);

        expect(result.status).toBe('normal');
      });

      it('should handle only max level set (min defaults to 0)', () => {
        const result = getStockLevelStatus(600, null, 500);

        expect(result.status).toBe('high');
      });

      it('should use Infinity for max when not set with min', () => {
        const result = getStockLevelStatus(1000000, 100, null);

        expect(result.status).toBe('normal');
      });

      it('should return complete status object with all properties', () => {
        const result = getStockLevelStatus(50, minLevel, maxLevel);

        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('color');
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('icon');
        expect(result).toHaveProperty('bgColor');
        expect(result).toHaveProperty('textColor');
        expect(result).toHaveProperty('borderColor');
      });
    });
  });

  describe('getStockPercentage', () => {
    it('should calculate percentage correctly within range', () => {
      // 200 is halfway between 100 (min) and 300 (max)
      const result = getStockPercentage(200, 100, 300);

      expect(result).toBe(50);
    });

    it('should return 0 when qty equals min', () => {
      const result = getStockPercentage(100, 100, 300);

      expect(result).toBe(0);
    });

    it('should return 100 when qty equals max', () => {
      const result = getStockPercentage(300, 100, 300);

      expect(result).toBe(100);
    });

    it('should cap at 0 when below min', () => {
      const result = getStockPercentage(50, 100, 300);

      expect(result).toBe(0);
    });

    it('should cap at 100 when above max', () => {
      const result = getStockPercentage(500, 100, 300);

      expect(result).toBe(100);
    });

    it('should return 100 when min equals max', () => {
      const result = getStockPercentage(100, 100, 100);

      expect(result).toBe(100);
    });

    it('should use min * 2 as default max when max is 0', () => {
      // With min=100 and max defaulting to 200, qty=150 is 50%
      const result = getStockPercentage(150, 100, 0);

      expect(result).toBe(50);
    });

    it('should handle string values', () => {
      const result = getStockPercentage('200', '100', '300');

      expect(result).toBe(50);
    });

    it('should handle null values as 0', () => {
      // With min=0 and max=0 (defaulting to 0), should return 100
      const result = getStockPercentage(100, null, null);

      expect(result).toBe(100);
    });

    it('should handle edge case where min is 0', () => {
      // 50 out of 0-100 range = 50%
      const result = getStockPercentage(50, 0, 100);

      expect(result).toBe(50);
    });
  });

  describe('formatStockLevels', () => {
    it('should format stock levels correctly', () => {
      const settings = {
        'SS-200G': { minLevel: '100', maxLevel: '500', reorderLevel: '200' },
        'SS-100G': { minLevel: '150', maxLevel: '800', reorderLevel: '300' }
      };

      const result = formatStockLevels(settings);

      expect(result['SS-200G']).toEqual({ min: 100, max: 500, reorder: 200 });
      expect(result['SS-100G']).toEqual({ min: 150, max: 800, reorder: 300 });
    });

    it('should handle missing values as 0', () => {
      const settings = {
        'SS-200G': { minLevel: '100' }
      };

      const result = formatStockLevels(settings);

      expect(result['SS-200G']).toEqual({ min: 100, max: 0, reorder: 0 });
    });

    it('should handle numeric values', () => {
      const settings = {
        'SS-200G': { minLevel: 100, maxLevel: 500, reorderLevel: 200 }
      };

      const result = formatStockLevels(settings);

      expect(result['SS-200G']).toEqual({ min: 100, max: 500, reorder: 200 });
    });

    it('should return empty object for null settings', () => {
      const result = formatStockLevels(null);

      expect(result).toEqual({});
    });

    it('should return empty object for undefined settings', () => {
      const result = formatStockLevels(undefined);

      expect(result).toEqual({});
    });

    it('should handle empty settings object', () => {
      const result = formatStockLevels({});

      expect(result).toEqual({});
    });

    it('should handle invalid string values as 0', () => {
      const settings = {
        'SS-200G': { minLevel: 'invalid', maxLevel: 'bad', reorderLevel: 'wrong' }
      };

      const result = formatStockLevels(settings);

      expect(result['SS-200G']).toEqual({ min: 0, max: 0, reorder: 0 });
    });

    it('should process multiple SKUs', () => {
      const settings = {
        'SKU1': { minLevel: '10', maxLevel: '50', reorderLevel: '20' },
        'SKU2': { minLevel: '20', maxLevel: '100', reorderLevel: '40' },
        'SKU3': { minLevel: '30', maxLevel: '150', reorderLevel: '60' }
      };

      const result = formatStockLevels(settings);

      expect(Object.keys(result)).toHaveLength(3);
      expect(result['SKU1'].min).toBe(10);
      expect(result['SKU2'].min).toBe(20);
      expect(result['SKU3'].min).toBe(30);
    });
  });
});
