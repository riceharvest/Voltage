import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Calculator, FlaskConical, BookOpen, Zap } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center space-y-20 py-10">
      
      {/* Hero Section */}
      <div className="relative w-full max-w-4xl text-center flex flex-col items-center space-y-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full -z-10 animate-pulse-slow"></div>
        
        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary animate-glow drop-shadow-[0_0_15px_rgba(204,255,0,0.5)]">
          Voltage
        </h1>
        <p className="text-2xl md:text-3xl font-light text-muted-foreground tracking-wide max-w-2xl px-4">
          The Ultimate DIY <span className="text-primary font-semibold text-glow">Energy Drink</span> Guide
        </p>
        
        <p className="max-w-xl text-lg text-white/60">
          Create EU-compliant, safe, and powerful energy drinks at home. 
          Precision recipes, cost scaling, and safety verification.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 pt-8">
          <Link href="/calculator">
            <Button size="lg" className="h-16 px-10 text-xl shadow-[0_0_20px_rgba(204,255,0,0.4)] hover:shadow-[0_0_40px_rgba(204,255,0,0.6)]">
              <Calculator className="mr-3 h-6 w-6" />
              Start Mixing
            </Button>
          </Link>
          <Link href="/guide">
            <Button variant="outline" size="lg" className="h-16 px-10 text-xl border-white/20 hover:border-white/50 bg-white/5 backdrop-blur-sm">
              <BookOpen className="mr-3 h-6 w-6" />
              Documentation
            </Button>
          </Link>
        </div>
      </div>

      {/* Safety Warning - Styled for Cyberpunk */}
      <div className="w-full max-w-4xl px-4">
        <div className="relative group overflow-hidden rounded-xl border border-dotted border-destructive/50 bg-destructive/5 p-1 transition-all hover:bg-destructive/10 hover:border-destructive">
          <div className="flex flex-col md:flex-row items-center gap-6 p-6">
             <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/20 text-destructive shrink-0 animate-pulse">
               <AlertTriangle className="w-8 h-8" />
             </div>
             <div className="flex-1 text-center md:text-left">
               <h3 className="text-2xl font-bold text-destructive mb-2 uppercase tracking-widest">Lethal Hazard Warning</h3>
               <p className="text-destructive-foreground/80 font-mono text-sm leading-relaxed">
                 Pure caffeine is potentially lethal. Precise measurement (0.001g scale) is MANDATORY. 
                 This guide complies with EU safety limits. Negligence can cause severe injury or death.
                 <span className="block mt-2 font-bold text-white">— RESPECT THE CHEMISTRY —</span>
               </p>
             </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl px-4">
        <Card className="group border-primary/20 hover:border-primary/50 transition-all duration-500">
          <CardHeader>
            <Zap className="w-12 h-12 text-primary mb-4 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(204,255,0,0.5)]" aria-hidden="true" />
            <Zap className="w-12 h-12 text-primary mb-4 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(204,255,0,0.5)]" />
            <CardTitle className="text-2xl">Smart Calculator</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Input your desired volume and caffeine strength. We calculate precise powder ratios for perfect batches every time.
            </p>
          </CardContent>
        </Card>

              <FlaskConical className="w-12 h-12 text-cyan-400 mb-4 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" aria-hidden="true" />
        <Card className="group border-cyan-500/20 hover:border-cyan-500/50 transition-all duration-500">
          <CardHeader>
             <FlaskConical className="w-12 h-12 text-cyan-400 mb-4 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
            <CardTitle className="text-2xl text-cyan-50">Flavor Alchemy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Clone famous recipes or invent your own. Our library ensures chemical safety and flavor stability.
            </p>
          </CardContent>
              <BookOpen className="w-12 h-12 text-fuchsia-400 mb-4 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(232,121,249,0.5)]" aria-hidden="true" />
        </Card>

        <Card className="group border-fuchsia-500/20 hover:border-fuchsia-500/50 transition-all duration-500">
          <CardHeader>
             <BookOpen className="w-12 h-12 text-fuchsia-400 mb-4 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(232,121,249,0.5)]" />
            <CardTitle className="text-2xl text-fuchsia-50">Master Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              From sourcing ingredients to preservation techniques. A complete manual for the home energy brewer.
            </p>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
