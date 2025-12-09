'use client'

import { useEffect, useState } from 'react'
import mermaid from 'mermaid'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ExternalLink, AlertTriangle, Wrench, ShoppingCart, Workflow, HelpCircle } from 'lucide-react'
import { flavors } from '@/lib/guide-data-service'
import { getSupplierById, getIngredientById, energyBaseIngredients, flavorIngredients } from '@/lib/guide-business-logic'

// Mermaid diagram component
function MermaidDiagram({ chart }: { chart: string }) {
  const [svg, setSvg] = useState<string>('')

  useEffect(() => {
    mermaid.initialize({ startOnLoad: true, theme: 'dark', themeVariables: { primaryColor: '#ccff00', lineColor: '#fafafa' } })
    mermaid.render('mermaid-diagram', chart).then((result) => {
      setSvg(result.svg)
    })
  }, [chart])

  return (
    <div
      className="mermaid bg-white/5 p-4 rounded-xl border border-white/10"
      // Safe usage: SVG is generated from controlled, hardcoded Mermaid chart with no user input
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

// Equipment checklist data
const equipmentChecklist = [
  {
    item: '0.001g Precision Scale',
    purpose: 'MANDATORY for weighing caffeine safely.',
    recommended: 'Bol.com',
    link: 'https://www.bol.com/nl/nl/s/?searchtext=precisieweegschaal+0.001g'
  },
  {
    item: 'SodaStream',
    purpose: 'For carbonating the final drink.',
    recommended: 'Any model',
    link: null
  },
  {
    item: '1 Liter Bottles',
    purpose: 'For storing your syrup base.',
    recommended: 'Glass or BPA-free plastic',
    link: null
  },
  {
    item: 'Small Glass Beakers',
    purpose: 'For mixing flavor concentrates (10ml - 50ml).',
    recommended: 'Lab supply / Bol.com',
    link: 'https://www.bol.com'
  },
  {
    item: 'Pipettes / Droppers',
    purpose: 'For measuring liquids (1ml, 3ml).',
    recommended: 'Plastic transfer pipettes',
    link: null
  },
  {
    item: 'Nitrile Gloves',
    purpose: 'Protection when handling caffeine/chemicals.',
    recommended: 'Supermarket',
    link: null
  }
]

// Troubleshooting data
const troubleshootingData = [
  {
    problem: 'Syrup is Cloudy',
    cause: 'Undissolved solids or oil separation.',
    solution: 'Heat gently to redissolve. Shake oils before pouring.'
  },
  {
    problem: 'Chemical / Harsh Taste',
    cause: 'Too much Ethyl Butyrate or Vanillin.',
    solution: 'Use less next time. Let syrup "age" for 24h to mellow.'
  },
  {
    problem: 'Not Sour Enough',
    cause: 'Low Citric Acid.',
    solution: 'Add 5-10g more Citric Acid per liter.'
  },
  {
    problem: 'Flat Carbonation',
    cause: 'Water not cold enough.',
    solution: 'Chill water to 4°C before carbonating.'
  }
]

// Mermaid chart for Phase 1
const phase1Chart = `
graph TD
    A[Start: 200ml Warm Water] -->|Add| B(Caffeine, Taurine, Acids)
    B -->|Add| C(Preservatives)
    C -->|Stir until Clear| D{Choose Base}
    D -->|Classic| E[Add Sugar + 400ml Water]
    D -->|Zero| F[Add Erythritol + 700ml Water]
    E --> G[Heat to Dissolve]
    F --> G
    G --> H[COOL DOWN < 30°C]
    H -->|Ready for Flavor| I[Master Base Complete]
style A stroke:#ccff00,stroke-width:2px
style I stroke:#ccff00,stroke-width:2px
`

export default function GuidePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-black mb-4 uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-primary to-white animate-glow">
          Knowledge Base
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          The comprehensive manual for Dutch Energy brewers.
        </p>

        {/* Cyberpunk Warning Box */}
        <div className="mt-8 p-1 rounded-xl bg-gradient-to-r from-red-500/20 via-red-500/10 to-transparent border border-red-500/50">
          <div className="bg-black/40 backdrop-blur-md rounded-lg p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="p-4 rounded-full bg-red-500/20 animate-pulse">
               <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <div className="text-left">
              <h2 className="text-xl font-bold text-red-500 uppercase tracking-widest mb-1">Critical Safety Protocols</h2>
              <p className="text-red-200/80">
                A single mistake with pure caffeine can be fatal. This guide assumes you are using a <span className="text-white font-bold">0.001g precision scale</span>. Never eyeball measurements.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Accordion type="single" collapsible className="space-y-6">

        {/* Equipment Checklist */}
        <AccordionItem value="equipment" className="border-none">
          <AccordionTrigger className="text-xl font-bold uppercase tracking-wider text-primary hover:text-primary/80">
            <div className="flex items-center gap-3">
              <Wrench className="h-6 w-6" />
              Equipment Checklist
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-4">
              {equipmentChecklist.map((item) => (
                <div key={item.item} className="glass-card p-4 flex flex-col justify-between hover:border-primary/50 transition-colors">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                       <h3 className="font-bold text-white">{item.item}</h3>
                       {item.link && (
                         <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                           <a href={item.link} target="_blank" rel="noopener noreferrer">
                             <ExternalLink className="h-4 w-4 text-primary" />
                           </a>
                         </Button>
                       )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{item.purpose}</p>
                  </div>
                  <Badge variant="secondary" className="self-start">{item.recommended}</Badge>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Shopping List */}
        <AccordionItem value="shopping" className="border-none">
          <AccordionTrigger className="text-xl font-bold uppercase tracking-wider text-primary hover:text-primary/80">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-6 w-6" />
              Supply Lines (NL)
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-6 pt-4">
              {/* Energy Base */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">The "Engine" (Base Inputs)</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                    {energyBaseIngredients.map((ingredient) => (
                      <div key={ingredient.id} className="group flex flex-col sm:flex-row justify-between items-center p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5 hover:border-primary/30">
                        <div className="mb-2 sm:mb-0 text-center sm:text-left">
                          <h4 className="font-bold text-white">{ingredient.name}</h4>
                          <p className="text-xs font-mono text-muted-foreground uppercase">{ingredient.nameNl}</p>
                        </div>
                        <div className="flex gap-2">
                          {ingredient.suppliers.map((supplierId) => {
                            const supplier = getSupplierById(supplierId)
                            return supplier ? (
                              <Button key={supplierId} variant="outline" size="sm" className="h-7 text-xs border-primary/30 text-primary hover:bg-primary hover:text-black" asChild>
                                <a href={supplier.url} target="_blank" rel="noopener noreferrer">
                                  {supplier.name}
                                </a>
                              </Button>
                            ) : null
                          })}
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>

              {/* Flavor Library */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">The "Soul" (Flavorings)</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                    {flavorIngredients.map((ingredient) => (
                      <div key={ingredient.id} className="group flex flex-col sm:flex-row justify-between items-center p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5 hover:border-cyan-400/30">
                        <div className="mb-2 sm:mb-0 text-center sm:text-left">
                          <h4 className="font-bold text-cyan-50">{ingredient.name}</h4>
                          <p className="text-xs font-mono text-muted-foreground uppercase">{ingredient.nameNl}</p>
                        </div>
                        <div className="flex gap-2">
                          {ingredient.suppliers.map((supplierId) => {
                            const supplier = getSupplierById(supplierId)
                            return supplier ? (
                              <Button key={supplierId} variant="outline" size="sm" className="h-7 text-xs" asChild>
                                <a href={supplier.url} target="_blank" rel="noopener noreferrer">
                                  {supplier.name}
                                </a>
                              </Button>
                            ) : null
                          })}
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Phase-by-Phase Workflow */}
        <AccordionItem value="phases" className="border-none">
          <AccordionTrigger className="text-xl font-bold uppercase tracking-wider text-primary hover:text-primary/80">
            <div className="flex items-center gap-3">
              <Workflow className="h-6 w-6" />
              Process Workflow
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-8 pt-4">

              {/* Phase 1 */}
              <div className="relative border-l-2 border-primary/20 pl-6 ml-3">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]"></div>
                <h3 className="text-2xl font-bold text-white mb-4">Phase 1: Master Base Synthesis</h3>
                <Card className="mb-6">
                  <CardContent className="pt-6">
                     <MermaidDiagram chart={phase1Chart} />
                     <div className="grid md:grid-cols-2 gap-4 mt-6">
                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                           <h4 className="font-bold text-lg mb-2 text-primary">Option A: Classic</h4>
                           <p className="text-sm text-muted-foreground mb-2">Full Sugar Base</p>
                           <ul className="text-sm space-y-1 font-mono text-white/80">
                             <li>Sugar: 550g</li>
                             <li>Water: 600ml (+200ml start)</li>
                           </ul>
                        </div>
                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                           <h4 className="font-bold text-lg mb-2 text-cyan-400">Option B: Zero Ultra</h4>
                           <p className="text-sm text-muted-foreground mb-2">Sugar Free Base</p>
                           <ul className="text-sm space-y-1 font-mono text-white/80">
                             <li>Erythritol: 150g</li>
                             <li>Sucralose: ~10ml</li>
                             <li>Water: 900ml (+200ml start)</li>
                           </ul>
                        </div>
                     </div>
                  </CardContent>
                </Card>
              </div>

              {/* Phase 2 */}
              <div className="relative border-l-2 border-cyan-400/20 pl-6 ml-3">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_10px_cyan]"></div>
                <h3 className="text-2xl font-bold text-white mb-4">Phase 2: Flavor Infusion</h3>
                 <div className="grid gap-4 md:grid-cols-2">
                    {flavors.map((flavor) => (
                      <Card key={flavor.id} className="bg-zinc-900/50 hover:bg-zinc-900 transition-colors border-white/5 hover:border-cyan-400/50">
                        <CardHeader>
                          <CardTitle className="text-lg flex justify-between">
                            <span>{flavor.name}</span>
                            <Badge variant="outline" className="text-cyan-400 border-cyan-400/30">{flavor.aging.recommended}h Age</Badge>
                          </CardTitle>
                          <CardDescription>{flavor.profileNl || flavor.profile}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-1 text-sm font-mono text-white/70">
                            {flavor.ingredients.map(ing => {
                               const details = getIngredientById(ing.ingredientId);
                               return (
                                 <li key={ing.ingredientId} className="flex justify-between border-b border-white/5 pb-1 last:border-0">
                                   <span>{details ? details.nameNl : ing.ingredientId}</span>
                                   <span className="text-cyan-400">{ing.amount} {details?.unit}</span>
                                 </li>
                               )
                            })}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                 </div>
              </div>

               {/* Phase 3 */}
               <div className="relative border-l-2 border-fuchsia-500/20 pl-6 ml-3">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-fuchsia-500 shadow-[0_0_10px_fuchsia]"></div>
                <h3 className="text-2xl font-bold text-white mb-4">Phase 3: Carbonation & Serving</h3>
                <Card>
                  <CardContent className="pt-6">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-primary uppercase font-bold tracking-wider">
                          <tr>
                            <th className="p-3 rounded-tl-lg">Format</th>
                            <th className="p-3">Syrup (Part)</th>
                            <th className="p-3">H2O (4 Parts)</th>
                            <th className="p-3 rounded-tr-lg">Caffeine</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10 font-mono text-white/80">
                          <tr>
                            <td className="p-3">250ml Can</td>
                            <td className="p-3 text-cyan-400">50ml</td>
                            <td className="p-3">200ml</td>
                            <td className="p-3 text-red-400">80mg</td>
                          </tr>
                          <tr>
                            <td className="p-3">330ml Can</td>
                            <td className="p-3 text-cyan-400">66ml</td>
                            <td className="p-3">264ml</td>
                            <td className="p-3 text-red-400">105mg</td>
                          </tr>
                          <tr>
                            <td className="p-3">500ml Can</td>
                            <td className="p-3 text-cyan-400">100ml</td>
                            <td className="p-3">400ml</td>
                            <td className="p-3 text-red-400">160mg</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Troubleshooting */}
        <AccordionItem value="troubleshooting" className="border-none">
          <AccordionTrigger className="text-xl font-bold uppercase tracking-wider text-primary hover:text-primary/80">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-6 w-6" />
              Debug Protcols
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-4 md:grid-cols-2 pt-4">
              {troubleshootingData.map((item) => (
                <div key={item.problem} className="glass-card p-5 border-l-4 border-l-red-500">
                  <h3 className="font-bold text-red-400 mb-2 uppercase">{item.problem}</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Cause:</strong> {item.cause}</p>
                    <p className="text-white/90"><strong>Fix:</strong> {item.solution}</p>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  )
}