import { describe, it, expect } from 'vitest';
import {
  PRODUCT_TYPES,
  SEED_TYPES,
  BATCH_PREFIX,
  PACKAGING_CONFIG,
  getPackagingConfig,
  calculateWeightFromUnits,
  calculateUnitsFromWeight
} from '../products.js';

describe('products config', () => {
  describe('PRODUCT_TYPES', () => {
    it('should have all product types defined', () => {
      expect(PRODUCT_TYPES.SUNFLOWER).toBe('Sunflower Seeds');
      expect(PRODUCT_TYPES.MELON).toBe('Melon Seeds');
      expect(PRODUCT_TYPES.PUMPKIN).toBe('Pumpkin Seeds');
      expect(PRODUCT_TYPES.POPCORN).toBe('Popcorn');
    });
  });

  describe('SEED_TYPES', () => {
    it('should have all seed types defined', () => {
      expect(SEED_TYPES.T6).toBe('T6');
      expect(SEED_TYPES.S361).toBe('361');
      expect(SEED_TYPES.S363).toBe('363');
      expect(SEED_TYPES.S601).toBe('601');
      expect(SEED_TYPES.S9).toBe('S9');
    });
  });

  describe('BATCH_PREFIX', () => {
    it('should have batch prefixes for each seed type', () => {
      expect(BATCH_PREFIX['T6']).toBe('BT6');
      expect(BATCH_PREFIX['361']).toBe('B361');
      expect(BATCH_PREFIX['363']).toBe('B363');
      expect(BATCH_PREFIX['601']).toBe('B601');
      expect(BATCH_PREFIX['S9']).toBe('BS9');
    });
  });

  describe('PACKAGING_CONFIG', () => {
    it('should have configuration for Sunflower Seeds', () => {
      const config = PACKAGING_CONFIG[PRODUCT_TYPES.SUNFLOWER];

      expect(config).toBeDefined();
      expect(config.sizes).toContain('25g');
      expect(config.sizes).toContain('200g');
      expect(config.sizes).toContain('10kg');
    });

    it('should have correct packaging for Sunflower 25g', () => {
      const config = PACKAGING_CONFIG[PRODUCT_TYPES.SUNFLOWER].packaging['25g'];

      expect(config.unit1).toBe('Bag');
      expect(config.unit2).toBe('Bundle');
      expect(config.conversion).toBe(6);
      expect(config.weight).toBe(0.025);
      expect(config.pcsPerUnit1).toBe(24);
    });

    it('should have correct packaging for Sunflower 200g', () => {
      const config = PACKAGING_CONFIG[PRODUCT_TYPES.SUNFLOWER].packaging['200g'];

      expect(config.unit1).toBe('Bag');
      expect(config.unit2).toBe('Bundle');
      expect(config.conversion).toBe(5);
      expect(config.weight).toBe(0.2);
      expect(config.pcsPerUnit1).toBe(10);
    });

    it('should have correct packaging for Sunflower 10kg (no secondary unit)', () => {
      const config = PACKAGING_CONFIG[PRODUCT_TYPES.SUNFLOWER].packaging['10kg'];

      expect(config.unit1).toBe('Sack');
      expect(config.unit2).toBeNull();
      expect(config.conversion).toBe(1);
      expect(config.weight).toBe(10);
    });

    it('should have configuration for Melon Seeds', () => {
      const config = PACKAGING_CONFIG[PRODUCT_TYPES.MELON];

      expect(config).toBeDefined();
      expect(config.packaging['100g'].unit1).toBe('Box');
      expect(config.packaging['100g'].unit2).toBe('Carton');
    });

    it('should have configuration for Pumpkin Seeds', () => {
      const config = PACKAGING_CONFIG[PRODUCT_TYPES.PUMPKIN];

      expect(config).toBeDefined();
      expect(config.packaging['200g'].conversion).toBe(6);
    });

    it('should have configuration for Popcorn', () => {
      const config = PACKAGING_CONFIG[PRODUCT_TYPES.POPCORN];

      expect(config).toBeDefined();
      expect(config.sizes).not.toContain('10kg'); // Popcorn doesn't have 10kg
      expect(config.packaging['100g'].conversion).toBe(8); // Popcorn uses 8:1 ratio
    });
  });

  describe('getPackagingConfig', () => {
    it('should return packaging config for valid product and size', () => {
      const config = getPackagingConfig(PRODUCT_TYPES.SUNFLOWER, '200g');

      expect(config).toBeDefined();
      expect(config.weight).toBe(0.2);
      expect(config.unit1).toBe('Bag');
    });

    it('should return null for unknown product type', () => {
      const config = getPackagingConfig('Unknown Product', '200g');

      expect(config).toBeNull();
    });

    it('should return default config for unknown size with default defined', () => {
      const config = getPackagingConfig(PRODUCT_TYPES.MELON, 'unknown-size');

      // Melon has a default packaging config
      expect(config).toBeDefined();
      expect(config.unit1).toBe('Box');
      expect(config.unit2).toBe('Carton');
    });

    it('should return specific config over default when size exists', () => {
      const config = getPackagingConfig(PRODUCT_TYPES.MELON, '100g');

      expect(config.weight).toBe(0.1);
    });

    it('should return config for all sunflower sizes', () => {
      const sizes = ['25g', '100g', '150g', '200g', '800g', '10kg'];

      sizes.forEach(size => {
        const config = getPackagingConfig(PRODUCT_TYPES.SUNFLOWER, size);
        expect(config).toBeDefined();
        expect(config.weight).toBeGreaterThan(0);
      });
    });
  });

  describe('calculateWeightFromUnits', () => {
    it('should calculate weight for Sunflower 200g bags', () => {
      // 10 bags of 200g = 2kg = 0.002 tonnes
      const weight = calculateWeightFromUnits(PRODUCT_TYPES.SUNFLOWER, '200g', 10, 0);

      expect(weight).toBe(0.002);
    });

    it('should calculate weight including unit2 (bundles)', () => {
      // 5 bags + 2 bundles (2 * 5 = 10 bags) = 15 bags total
      // 15 bags * 0.2kg = 3kg = 0.003 tonnes
      const weight = calculateWeightFromUnits(PRODUCT_TYPES.SUNFLOWER, '200g', 5, 2);

      expect(weight).toBe(0.003);
    });

    it('should calculate weight for 10kg sacks', () => {
      // 5 sacks of 10kg = 50kg = 0.05 tonnes
      const weight = calculateWeightFromUnits(PRODUCT_TYPES.SUNFLOWER, '10kg', 5, 0);

      expect(weight).toBe(0.05);
    });

    it('should return 0 for unknown product type', () => {
      const weight = calculateWeightFromUnits('Unknown', '200g', 10, 0);

      expect(weight).toBe(0);
    });

    it('should handle zero units', () => {
      const weight = calculateWeightFromUnits(PRODUCT_TYPES.SUNFLOWER, '200g', 0, 0);

      expect(weight).toBe(0);
    });

    it('should calculate weight for Melon boxes and cartons', () => {
      // 6 boxes + 1 carton (1 * 6 = 6 boxes) = 12 boxes
      // 12 boxes * 0.1kg = 1.2kg = 0.0012 tonnes
      const weight = calculateWeightFromUnits(PRODUCT_TYPES.MELON, '100g', 6, 1);

      expect(weight).toBeCloseTo(0.0012, 6);
    });

    it('should calculate weight for Popcorn with 8:1 conversion', () => {
      // 4 bags + 1 carton (1 * 8 = 8 bags) = 12 bags
      // 12 bags * 0.1kg = 1.2kg = 0.0012 tonnes
      const weight = calculateWeightFromUnits(PRODUCT_TYPES.POPCORN, '100g', 4, 1);

      expect(weight).toBeCloseTo(0.0012, 6);
    });

    it('should handle only unit2 provided', () => {
      // 0 bags + 3 bundles (3 * 5 = 15 bags)
      // 15 bags * 0.2kg = 3kg = 0.003 tonnes
      const weight = calculateWeightFromUnits(PRODUCT_TYPES.SUNFLOWER, '200g', 0, 3);

      expect(weight).toBe(0.003);
    });
  });

  describe('calculateUnitsFromWeight', () => {
    it('should calculate units from weight for Sunflower 200g', () => {
      // 0.003 tonnes = 3kg = 15 bags of 200g
      // 15 bags = 3 bundles (5 bags each) + 0 loose bags
      const result = calculateUnitsFromWeight(PRODUCT_TYPES.SUNFLOWER, '200g', 0.003);

      expect(result.unit2).toBe(3);
      expect(result.unit1).toBe(0);
    });

    it('should calculate units with remainder', () => {
      // 0.0032 tonnes = 3.2kg = 16 bags of 200g
      // 16 bags = 3 bundles + 1 loose bag
      const result = calculateUnitsFromWeight(PRODUCT_TYPES.SUNFLOWER, '200g', 0.0032);

      expect(result.unit2).toBe(3);
      expect(result.unit1).toBe(1);
    });

    it('should handle products without secondary unit', () => {
      // 0.05 tonnes = 50kg = 5 sacks of 10kg
      const result = calculateUnitsFromWeight(PRODUCT_TYPES.SUNFLOWER, '10kg', 0.05);

      expect(result.unit1).toBe(5);
      expect(result.unit2).toBe(0);
    });

    it('should return zeros for unknown product', () => {
      const result = calculateUnitsFromWeight('Unknown', '200g', 0.003);

      expect(result.unit1).toBe(0);
      expect(result.unit2).toBe(0);
    });

    it('should handle zero weight', () => {
      const result = calculateUnitsFromWeight(PRODUCT_TYPES.SUNFLOWER, '200g', 0);

      expect(result.unit1).toBe(0);
      expect(result.unit2).toBe(0);
    });

    it('should floor partial units', () => {
      // 0.00025 tonnes = 0.25kg = 1.25 bags of 200g -> floors to 1 bag
      const result = calculateUnitsFromWeight(PRODUCT_TYPES.SUNFLOWER, '200g', 0.00025);

      expect(result.unit1).toBe(1);
      expect(result.unit2).toBe(0);
    });

    it('should calculate units for Popcorn with 8:1 ratio', () => {
      // 0.0016 tonnes = 1.6kg = 16 bags of 100g
      // 16 bags = 2 cartons (8 each) + 0 loose
      const result = calculateUnitsFromWeight(PRODUCT_TYPES.POPCORN, '100g', 0.0016);

      expect(result.unit2).toBe(2);
      expect(result.unit1).toBe(0);
    });

    it('should be inverse of calculateWeightFromUnits', () => {
      // Calculate weight from units, then convert back
      const originalUnit1 = 3;
      const originalUnit2 = 2;
      const weight = calculateWeightFromUnits(PRODUCT_TYPES.SUNFLOWER, '200g', originalUnit1, originalUnit2);
      const result = calculateUnitsFromWeight(PRODUCT_TYPES.SUNFLOWER, '200g', weight);

      // Total units should match: 3 + (2 * 5) = 13 bags = 2 bundles + 3 bags
      expect(result.unit2).toBe(2);
      expect(result.unit1).toBe(3);
    });
  });
});
