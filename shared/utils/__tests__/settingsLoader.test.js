import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getDefaultSettings,
  getProductTypes,
  getSeedVarietiesForProduct,
  getSunflowerSizes,
  getRegions,
  getEmployees,
  getBagTypes,
  getDieselTrucks,
  getWastewaterTrucks,
  getRoutes,
  getSystemConfig,
  getOpeningBalances,
  calculateWIP,
  calculateWeightFromBags,
  calculateSaltWeight,
  productHasSizeVariant
} from '../settingsLoader.js';

describe('settingsLoader', () => {
  describe('getDefaultSettings', () => {
    it('should return default settings object', () => {
      const settings = getDefaultSettings();

      expect(settings).toBeDefined();
      expect(settings.products).toBeDefined();
      expect(settings.productMap).toBeDefined();
      expect(settings.seedVarieties).toBeDefined();
      expect(settings.sunflowerSizes).toBeDefined();
      expect(settings.regions).toBeDefined();
      expect(settings.employees).toBeDefined();
      expect(settings.bagTypes).toBeDefined();
      expect(settings.dieselTrucks).toBeDefined();
      expect(settings.wastewaterTrucks).toBeDefined();
      expect(settings.routes).toBeDefined();
      expect(settings.systemConfig).toBeDefined();
      expect(settings.openingBalances).toBeDefined();
    });

    it('should include default products', () => {
      const settings = getDefaultSettings();

      expect(settings.products).toHaveLength(4);
      expect(settings.products.map(p => p.code)).toContain('SUNFLOWER');
      expect(settings.products.map(p => p.code)).toContain('MELON');
      expect(settings.products.map(p => p.code)).toContain('PUMPKIN');
      expect(settings.products.map(p => p.code)).toContain('PEANUTS');
    });

    it('should include product map', () => {
      const settings = getDefaultSettings();

      expect(settings.productMap.SUNFLOWER).toBe('Sunflower Seeds');
      expect(settings.productMap.MELON).toBe('Melon Seeds');
    });

    it('should include seed varieties for each product type', () => {
      const settings = getDefaultSettings();

      expect(settings.seedVarieties['Sunflower Seeds']).toContain('T6');
      expect(settings.seedVarieties['Sunflower Seeds']).toContain('361');
      expect(settings.seedVarieties['Melon Seeds']).toContain('Shabah');
    });

    it('should include sunflower size ranges', () => {
      const settings = getDefaultSettings();

      expect(settings.sunflowerSizes).toContain('200-210');
      expect(settings.sunflowerSizes).toContain('290-300');
    });

    it('should include default employees', () => {
      const settings = getDefaultSettings();

      expect(settings.employees).toContain('Sikander');
      expect(settings.employees).toContain('Shihan');
    });

    it('should include bag types', () => {
      const settings = getDefaultSettings();

      expect(settings.bagTypes['25KG']).toEqual({ weight: 25, label: '25 kg' });
      expect(settings.bagTypes['20KG']).toEqual({ weight: 20, label: '20 kg' });
    });

    it('should include system configuration defaults', () => {
      const settings = getDefaultSettings();

      expect(settings.systemConfig.NORMAL_LOSS_PERCENT).toBe(2);
      expect(settings.systemConfig.SALT_BAG_WEIGHT).toBe(50);
      expect(settings.systemConfig.LOW_STOCK_THRESHOLD).toBe(100);
    });
  });

  describe('getProductTypes', () => {
    it('should return products array from settings', () => {
      const settings = {
        products: [
          { code: 'A', name: 'Product A' },
          { code: 'B', name: 'Product B' }
        ]
      };

      const result = getProductTypes(settings);

      expect(result).toEqual(settings.products);
    });

    it('should return empty array when products not defined', () => {
      const result = getProductTypes({});

      expect(result).toEqual([]);
    });

    it('should return empty array for null settings', () => {
      const result = getProductTypes({ products: null });

      expect(result).toEqual([]);
    });
  });

  describe('getSeedVarietiesForProduct', () => {
    const settings = {
      seedVarieties: {
        'Sunflower Seeds': ['T6', '361', '363'],
        'Melon Seeds': ['Shabah', 'Roomy']
      }
    };

    it('should return varieties for existing product', () => {
      const result = getSeedVarietiesForProduct(settings, 'Sunflower Seeds');

      expect(result).toEqual(['T6', '361', '363']);
    });

    it('should return empty array for non-existent product', () => {
      const result = getSeedVarietiesForProduct(settings, 'Unknown Product');

      expect(result).toEqual([]);
    });

    it('should throw when seedVarieties not defined (potential improvement: should return empty array)', () => {
      // NOTE: This test documents current behavior. The function should ideally
      // handle missing seedVarieties gracefully by returning an empty array.
      expect(() => getSeedVarietiesForProduct({}, 'Sunflower Seeds')).toThrow();
    });
  });

  describe('getSunflowerSizes', () => {
    it('should return sunflower sizes array', () => {
      const settings = {
        sunflowerSizes: ['200-210', '210-220', '220-230']
      };

      const result = getSunflowerSizes(settings);

      expect(result).toEqual(['200-210', '210-220', '220-230']);
    });

    it('should return empty array when not defined', () => {
      const result = getSunflowerSizes({});

      expect(result).toEqual([]);
    });
  });

  describe('getRegions', () => {
    it('should return regions array', () => {
      const settings = {
        regions: [
          { code: 'EASTERN', name: 'Eastern Province' },
          { code: 'RIYADH', name: 'Riyadh' }
        ]
      };

      const result = getRegions(settings);

      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('EASTERN');
    });

    it('should return empty array when not defined', () => {
      const result = getRegions({});

      expect(result).toEqual([]);
    });
  });

  describe('getEmployees', () => {
    it('should return employees array', () => {
      const settings = {
        employees: ['Alice', 'Bob', 'Charlie']
      };

      const result = getEmployees(settings);

      expect(result).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should return empty array when not defined', () => {
      const result = getEmployees({});

      expect(result).toEqual([]);
    });
  });

  describe('getBagTypes', () => {
    it('should return bag types object', () => {
      const settings = {
        bagTypes: {
          '25KG': { weight: 25, label: '25 kg' },
          '20KG': { weight: 20, label: '20 kg' }
        }
      };

      const result = getBagTypes(settings);

      expect(result['25KG'].weight).toBe(25);
    });

    it('should return empty object when not defined', () => {
      const result = getBagTypes({});

      expect(result).toEqual({});
    });
  });

  describe('getDieselTrucks', () => {
    it('should return diesel trucks array', () => {
      const settings = {
        dieselTrucks: [
          { capacity: 6000, label: 'Small' },
          { capacity: 15000, label: 'Large' }
        ]
      };

      const result = getDieselTrucks(settings);

      expect(result).toHaveLength(2);
      expect(result[0].capacity).toBe(6000);
    });

    it('should return empty array when not defined', () => {
      const result = getDieselTrucks({});

      expect(result).toEqual([]);
    });
  });

  describe('getWastewaterTrucks', () => {
    it('should return wastewater trucks array', () => {
      const settings = {
        wastewaterTrucks: [
          { capacity: 10000, label: 'Small' }
        ]
      };

      const result = getWastewaterTrucks(settings);

      expect(result).toHaveLength(1);
    });

    it('should return empty array when not defined', () => {
      const result = getWastewaterTrucks({});

      expect(result).toEqual([]);
    });
  });

  describe('getRoutes', () => {
    it('should return routes array', () => {
      const settings = {
        routes: [
          { code: 'R1', name: 'Route 1', region: 'Eastern' }
        ]
      };

      const result = getRoutes(settings);

      expect(result[0].code).toBe('R1');
    });

    it('should return empty array when not defined', () => {
      const result = getRoutes({});

      expect(result).toEqual([]);
    });
  });

  describe('getSystemConfig', () => {
    const settings = {
      systemConfig: {
        NORMAL_LOSS_PERCENT: 2,
        SALT_BAG_WEIGHT: 50,
        STRING_VALUE: 'test'
      }
    };

    it('should return config value for existing key', () => {
      const result = getSystemConfig(settings, 'NORMAL_LOSS_PERCENT');

      expect(result).toBe(2);
    });

    it('should return string values', () => {
      const result = getSystemConfig(settings, 'STRING_VALUE');

      expect(result).toBe('test');
    });

    it('should return default value for non-existent key', () => {
      const result = getSystemConfig(settings, 'NON_EXISTENT', 99);

      expect(result).toBe(99);
    });

    it('should return null as default when not specified', () => {
      const result = getSystemConfig(settings, 'NON_EXISTENT');

      expect(result).toBeNull();
    });

    it('should return 0 when value is explicitly 0', () => {
      const settingsWithZero = {
        systemConfig: { ZERO_VALUE: 0 }
      };

      const result = getSystemConfig(settingsWithZero, 'ZERO_VALUE', 99);

      expect(result).toBe(0);
    });
  });

  describe('getOpeningBalances', () => {
    it('should return opening balances array', () => {
      const settings = {
        openingBalances: [
          { itemType: 'RAW', itemName: 'Sunflower', quantity: 1000, unit: 'kg' }
        ]
      };

      const result = getOpeningBalances(settings);

      expect(result[0].itemName).toBe('Sunflower');
    });

    it('should return empty array when not defined', () => {
      const result = getOpeningBalances({});

      expect(result).toEqual([]);
    });
  });

  describe('calculateWIP', () => {
    it('should calculate WIP with default loss percentage', () => {
      const settings = {
        systemConfig: { NORMAL_LOSS_PERCENT: 2 }
      };

      const result = calculateWIP(settings, 1000);

      expect(result.rawMaterial).toBe(1000);
      expect(result.loss).toBe(20); // 2% of 1000
      expect(result.wip).toBe(980); // 1000 - 20
      expect(result.lossPercentage).toBe(2);
    });

    it('should use fallback loss percentage when not configured', () => {
      const settings = { systemConfig: {} };

      const result = calculateWIP(settings, 1000);

      expect(result.lossPercentage).toBe(2); // Default fallback
      expect(result.wip).toBe(980);
    });

    it('should handle custom loss percentage', () => {
      const settings = {
        systemConfig: { NORMAL_LOSS_PERCENT: 5 }
      };

      const result = calculateWIP(settings, 1000);

      expect(result.loss).toBe(50);
      expect(result.wip).toBe(950);
    });

    it('should handle zero raw material', () => {
      const settings = {
        systemConfig: { NORMAL_LOSS_PERCENT: 2 }
      };

      const result = calculateWIP(settings, 0);

      expect(result.rawMaterial).toBe(0);
      expect(result.loss).toBe(0);
      expect(result.wip).toBe(0);
    });

    it('should handle large weights', () => {
      const settings = {
        systemConfig: { NORMAL_LOSS_PERCENT: 2 }
      };

      const result = calculateWIP(settings, 100000);

      expect(result.loss).toBe(2000);
      expect(result.wip).toBe(98000);
    });
  });

  describe('calculateWeightFromBags', () => {
    const settings = {
      bagTypes: {
        '25KG': { weight: 25, label: '25 kg' },
        '20KG': { weight: 20, label: '20 kg' },
        'OTHER': { weight: 0, label: 'Other' }
      }
    };

    it('should calculate weight for known bag type', () => {
      const result = calculateWeightFromBags(settings, '25KG', 10);

      expect(result).toBe(250); // 25 * 10
    });

    it('should calculate weight for different bag type', () => {
      const result = calculateWeightFromBags(settings, '20KG', 5);

      expect(result).toBe(100); // 20 * 5
    });

    it('should return 0 for unknown bag type', () => {
      const result = calculateWeightFromBags(settings, 'UNKNOWN', 10);

      expect(result).toBe(0);
    });

    it('should return 0 for bag type with 0 weight', () => {
      const result = calculateWeightFromBags(settings, 'OTHER', 10);

      expect(result).toBe(0);
    });

    it('should handle 0 quantity', () => {
      const result = calculateWeightFromBags(settings, '25KG', 0);

      expect(result).toBe(0);
    });

    it('should handle empty bag types', () => {
      const result = calculateWeightFromBags({ bagTypes: {} }, '25KG', 10);

      expect(result).toBe(0);
    });
  });

  describe('calculateSaltWeight', () => {
    it('should calculate salt weight with configured bag weight', () => {
      const settings = {
        systemConfig: { SALT_BAG_WEIGHT: 50 }
      };

      const result = calculateSaltWeight(settings, 10);

      expect(result).toBe(500); // 50 * 10
    });

    it('should use default bag weight when not configured', () => {
      const settings = { systemConfig: {} };

      const result = calculateSaltWeight(settings, 10);

      expect(result).toBe(500); // Default 50 * 10
    });

    it('should handle 0 bags', () => {
      const settings = {
        systemConfig: { SALT_BAG_WEIGHT: 50 }
      };

      const result = calculateSaltWeight(settings, 0);

      expect(result).toBe(0);
    });

    it('should handle custom bag weight', () => {
      const settings = {
        systemConfig: { SALT_BAG_WEIGHT: 25 }
      };

      const result = calculateSaltWeight(settings, 4);

      expect(result).toBe(100);
    });
  });

  describe('productHasSizeVariant', () => {
    it('should return true for Sunflower Seeds', () => {
      const result = productHasSizeVariant({}, 'Sunflower Seeds');

      expect(result).toBe(true);
    });

    it('should return false for Melon Seeds', () => {
      const result = productHasSizeVariant({}, 'Melon Seeds');

      expect(result).toBe(false);
    });

    it('should return false for Pumpkin Seeds', () => {
      const result = productHasSizeVariant({}, 'Pumpkin Seeds');

      expect(result).toBe(false);
    });

    it('should return false for Peanuts', () => {
      const result = productHasSizeVariant({}, 'Peanuts');

      expect(result).toBe(false);
    });

    it('should return false for unknown product', () => {
      const result = productHasSizeVariant({}, 'Unknown Product');

      expect(result).toBe(false);
    });

    it('should be case sensitive', () => {
      const result = productHasSizeVariant({}, 'sunflower seeds');

      expect(result).toBe(false);
    });
  });
});
