"use client"

import { useState } from 'react'
import { getBases, getFlavors } from '@/core/data'
import Link from 'next/link'
import Layout from '@/components/Layout'

export default function RecipesPage() {
  const bases = getBases()
  const flavors = getFlavors()

  const [selectedBaseId, setSelectedBaseId] = useState<string>(bases[0]?.id || '')
  const [selectedFlavorId, setSelectedFlavorId] = useState<string>(flavors[0]?.id || '')

  const selectedBase = bases.find(b => b.id === selectedBaseId)
  const selectedFlavor = flavors.find(f => f.id === selectedFlavorId)

  // Simple compatibility filter
  const compatibleFlavors = flavors.filter(f =>
    f.compatibleBases.includes(selectedBaseId)
  )

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Recipe Browser</h1>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Base Selector */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">1. Select Base</h2>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={selectedBaseId}
              onChange={(e) => setSelectedBaseId(e.target.value)}
            >
              {bases.map(base => (
                <option key={base.id} value={base.id}>{base.name}</option>
              ))}
            </select>
            {selectedBase && (
               <div className="mt-4 text-sm text-gray-600">
                  <p><strong>Description:</strong> {selectedBase.nameNl}</p>
                  <p className="mt-1"><strong>Type:</strong> {selectedBase.type}</p>
               </div>
            )}
          </div>

          {/* Flavor Selector */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">2. Select Flavor</h2>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={selectedFlavorId}
              onChange={(e) => setSelectedFlavorId(e.target.value)}
            >
              {compatibleFlavors.length > 0 ? (
                compatibleFlavors.map(flavor => (
                  <option key={flavor.id} value={flavor.id}>{flavor.name}</option>
                ))
              ) : (
                <option disabled>No compatible flavors found</option>
              )}
            </select>
             {selectedFlavor && (
               <div className="mt-4 text-sm text-gray-600">
                  <p><strong>Profile:</strong> {selectedFlavor.profile}</p>
                  <p className="mt-1"><strong>Aging:</strong> {selectedFlavor.aging.recommended} hours</p>
               </div>
            )}
          </div>
        </div>

        {/* Recipe Display */}
        {selectedBase && selectedFlavor && (
          <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-lg">
             <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center">
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full mr-3">Recipe</span>
                {selectedFlavor.name} on {selectedBase.name}
             </h2>

             <div className="grid md:grid-cols-2 gap-8">
                <div>
                   <h3 className="font-semibold text-lg mb-3 text-gray-800 border-b pb-2">Base Ingredients</h3>
                   <ul className="space-y-2">
                      {selectedBase.ingredients.map((ing: any) => (
                         <li key={ing.ingredientId} className="flex justify-between text-sm">
                            <span className="text-gray-700 capitalize">{ing.ingredientId.replace(/-/g, ' ')}</span>
                            <span className="font-mono text-gray-500">{ing.amount}g/L</span>
                         </li>
                      ))}
                   </ul>
                </div>

                <div>
                   <h3 className="font-semibold text-lg mb-3 text-gray-800 border-b pb-2">Flavor Ingredients</h3>
                   <ul className="space-y-2">
                      {selectedFlavor.ingredients.map((ing: any) => (
                         <li key={ing.ingredientId} className="flex justify-between text-sm">
                            <span className="text-gray-700 capitalize">{ing.ingredientId.replace(/-/g, ' ')}</span>
                            <span className="font-mono text-gray-500">{ing.amount}g/L</span>
                         </li>
                      ))}
                   </ul>
                </div>
             </div>

             <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center">
                <Link
                   href="/calculator"
                   className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                   Calculate Batch Size
                </Link>
             </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
