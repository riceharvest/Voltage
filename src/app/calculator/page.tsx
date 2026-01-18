
'use client';

import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { getBases, getFlavors } from '@/core/data';
import { calculateRecipe, CalculationResult } from '@/core/calculator';

export default function CalculatorPage() {
  const bases = getBases();
  const flavors = getFlavors();

  const [selectedBaseId, setSelectedBaseId] = useState<string>(bases[0]?.id || '');
  const [selectedFlavorId, setSelectedFlavorId] = useState<string>(flavors[0]?.id || '');
  const [volume, setVolume] = useState<number>(1000); // 1 Liter
  const [targetCaffeine, setTargetCaffeine] = useState<number>(32); // mg/100ml (Standard energy drink)
  const [servingSize] = useState<number>(250);

  const selectedBase = bases.find(b => b.id === selectedBaseId);
  const selectedFlavor = flavors.find(f => f.id === selectedFlavorId);

  const result: CalculationResult | null = useMemo(() => {
    if (!selectedBase || !selectedFlavor) return null;
    
    // Convert 32mg/100ml to mg/serving (250ml) -> 80mg
    const caffeinePerServing = (targetCaffeine / 100) * servingSize;

    return calculateRecipe(selectedBase, selectedFlavor, {
      volume,
      targetCaffeine: caffeinePerServing,
      servingSize
    });
  }, [selectedBase, selectedFlavor, volume, targetCaffeine, servingSize]);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Smart Calculator</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Base Recipe</label>
              <select
                value={selectedBaseId}
                onChange={(e) => setSelectedBaseId(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                {bases.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Flavor Profile</label>
              <select
                value={selectedFlavorId}
                onChange={(e) => setSelectedFlavorId(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                {flavors.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Total Batch Volume (ml)</label>
              <input
                type="number"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">Total amount of drink you want to make</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Caffeine Strength (mg/100ml)</label>
              <input
                type="number"
                value={targetCaffeine}
                onChange={(e) => setTargetCaffeine(Number(e.target.value))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">Standard energy drink is 32mg/100ml</p>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Recipe Output</h2>

            {result ? (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-md">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Volume:</span>
                    <span className="font-medium">{result.volume} ml</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">Syrup Needed:</span>
                    <span className="font-medium">{result.syrupVolume.toFixed(1)} ml</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">Water Needed:</span>
                    <span className="font-medium">{result.waterVolume.toFixed(1)} ml</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1 border-t border-blue-100 pt-1">
                    <span className="text-gray-600">Caffeine/Serving (250ml):</span>
                    <span className="font-medium">{result.caffeinePerServing.toFixed(1)} mg</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Ingredients Needed</h3>
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredient</th>
                          <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {result.ingredients.map((ing, idx) => (
                          <tr key={`${ing.id}-${idx}`}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{ing.name}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                              {ing.amount.toFixed(3)} {ing.unit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  <p>
                    <strong>Instructions:</strong> Mix ingredients to create the syrup ({result.syrupVolume.toFixed(0)}ml).
                    Then dilute with {result.waterVolume.toFixed(0)}ml of carbonated water.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">Select a base and flavor to calculate recipe.</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
