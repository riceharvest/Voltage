"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'

// Import centralized flavor data
import { flavors as allFlavors } from '@/data/index'
import { ColorSpec } from '@/lib/types'
import { getColorHex } from '@/lib/color-utils'

interface Flavor {
  id: string
  name: string
  profile: string
  compatibleBases: string[]
  color: string
}

const flavors: Flavor[] = allFlavors.map(f => ({
  id: f.id,
  name: f.name,
  profile: f.profile,
  compatibleBases: f.compatibleBases,
  color: getColorHex(f.color)
}))

interface FlavorSelectorProps {
  onFlavorSelect: (flavorId: string) => void
  selectedBase: string
}

export function FlavorSelector({ onFlavorSelect, selectedBase }: FlavorSelectorProps) {
  const [selectedFlavor, setSelectedFlavor] = useState<string>('')

  const compatibleFlavors = flavors.filter(flavor =>
    flavor.compatibleBases.includes(selectedBase)
  )

  const handleSelect = (flavorId: string) => {
    setSelectedFlavor(flavorId)
    onFlavorSelect(flavorId)
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Flavor Selection
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Choose from our curated flavor library to customize your energy drink.</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Select value={selectedFlavor} onValueChange={handleSelect}>
                    <SelectTrigger aria-label="Select a flavor">
                      <SelectValue placeholder="Choose a flavor" />
                    </SelectTrigger>
                    <SelectContent>
                      {compatibleFlavors.map((flavor) => (
                        <SelectItem key={flavor.id} value={flavor.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{flavor.name}</span>
                            <span className="text-sm text-muted-foreground">{flavor.profile}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Select a flavor that matches your preferred taste profile. Each flavor shows its characteristics.</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {selectedFlavor && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Selected Flavor Details</h4>
              {(() => {
                const flavor = flavors.find(f => f.id === selectedFlavor)
                return flavor ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: flavor.color }}
                      ></div>
                      <p className="text-sm">{flavor.profile}</p>
                    </div>
                    <div className="mt-2">
                      <Badge variant="secondary">Compatible with {selectedBase} base</Badge>
                    </div>
                  </div>
                ) : null
              })()}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}