
import { describe, test, expect } from 'vitest';
import { calculateRecipe } from '../index';
import { BaseRecipe, FlavorRecipe } from '../../types';

const mockBase: BaseRecipe = {
  id: 'test-base',
  name: 'Test Base',
  nameNl: 'Test Basis',
  type: 'classic',
  yield: {
    syrup: 1000,
    drink: 5000
  },
  ingredients: [
    { ingredientId: 'caffeine', amount: 1.6 }, // 1.6g = 1600mg per 1000ml syrup -> 5000ml drink. 1600/5000 = 0.32mg/ml = 32mg/100ml.
    { ingredientId: 'sugar', amount: 500 }
  ],
  instructions: [],
  safetyChecks: []
};

const mockFlavor: FlavorRecipe = {
  id: 'test-flavor',
  name: 'Test Flavor',
  nameNl: 'Test Smaak',
  profile: 'Test Profile',
  profileNl: 'Test Profiel',
  ingredients: [
    { ingredientId: 'flavor-1', amount: 10 }
  ],
  color: { type: 'natural', description: 'Clear' },
  compatibleBases: ['test-base'],
  aging: { recommended: 0, optional: false }
};

describe('Calculator', () => {
  test('calculates correct volumes for 250ml drink', () => {
    // 250ml drink. Dilution 1:4 (1 part syrup, 4 parts water -> 5 total).
    // Syrup needed: 250 / 5 = 50ml.
    // Water needed: 250 - 50 = 200ml.

    const result = calculateRecipe(mockBase, mockFlavor, {
      volume: 250,
      targetCaffeine: 80, // 80mg per serving (standard)
      servingSize: 250
    });

    expect(result.volume).toBe(250);
    expect(result.syrupVolume).toBe(50);
    expect(result.waterVolume).toBe(200);
  });

  test('scales ingredients correctly for 50ml syrup', () => {
    // Base ingredients are for 1000ml syrup. We need 50ml syrup (for 250ml drink).
    // Scaling factor = 50 / 1000 = 0.05.

    const result = calculateRecipe(mockBase, mockFlavor, {
      volume: 250,
      targetCaffeine: 80, // Matches base concentration (32mg/100ml * 2.5 = 80mg)
      servingSize: 250
    });

    const sugar = result.ingredients.find(i => i.id === 'sugar');
    expect(sugar).toBeDefined();
    expect(sugar?.amount).toBe(500 * 0.05); // 25g

    const flavor1 = result.ingredients.find(i => i.id === 'flavor-1');
    expect(flavor1).toBeDefined();
    expect(flavor1?.amount).toBe(10 * 0.05); // 0.5g
  });

  test('adjusts caffeine correctly if target is higher', () => {
    // Base has 32mg/100ml.
    // Target: 64mg/100ml -> 160mg per 250ml serving.

    const result = calculateRecipe(mockBase, mockFlavor, {
      volume: 250,
      targetCaffeine: 160,
      servingSize: 250
    });

    const caffeine = result.ingredients.find(i => i.id === 'caffeine');
    expect(caffeine).toBeDefined();
    // Total caffeine needed for 250ml = 160mg = 0.16g.
    // The calculator logic sets the caffeine amount to the Total Target Caffeine.
    expect(caffeine?.amount).toBeCloseTo(0.16);
  });
});
