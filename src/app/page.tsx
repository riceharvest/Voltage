import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Calculator, FlaskConical, BookOpen, Zap, Coffee, Mountain, Sparkles, Globe } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center space-y-20 py-10">
      
      {/* Hero Section - Redesigned for Dual Categories */}
      <div className="relative w-full max-w-6xl text-center flex flex-col items-center space-y-8">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-r from-orange-500/10 via-blue-500/10 to-purple-500/10 blur-[120px] rounded-full -z-10"></div>
        
        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-blue-600 to-purple-600">
          Voltage
        </h1>
        <p className="text-2xl md:text-3xl font-light text-muted-foreground tracking-wide max-w-3xl px-4">
          The Complete <span className="text-orange-600 font-semibold">Soda</span> & <span className="text-blue-600 font-semibold">Energy Drink</span> Platform
        </p>
        
        <p className="max-w-3xl text-lg text-white/70 px-4">
          Create EU-compliant classic sodas, energy drinks, and innovative hybrid recipes at home. 
          Precision recipes, safety verification, and cultural adaptations for global tastes.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 pt-8">
          <Link href="/flavors">
            <Button size="lg" className="h-16 px-10 text-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 shadow-lg">
              <Coffee className="mr-3 h-6 w-6" />
              Explore Flavors
            </Button>
          </Link>
          <Link href="/calculator">
            <Button variant="outline" size="lg" className="h-16 px-10 text-xl border-white/20 hover:border-white/50 bg-white/5 backdrop-blur-sm">
              <Calculator className="mr-3 h-6 w-6" />
              Start Mixing
            </Button>
          </Link>
        </div>
      </div>

      {/* Category Showcase */}
      <div className="w-full max-w-6xl px-4">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Classic Sodas Section className="group border-orange-200 hover:border-orange-400 bg-gradient-to-br from-orange-50 to-orange-100/50 */}
          <Card dark:from-orange-950/50 dark:to-orange-900/20 transition-all duration-500 hover:shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Mountain className="w-8 h-8 text-orange-600" />
              </div>
              <CardTitle className="text-3xl font-bold text-orange-700 dark:text-orange-400">
                Classic Sodas
              </CardTitle>
              <CardDescription className="text-orange-600/80 dark:text-orange-300/80 text-lg">
                Traditional cola, lemon-lime, root beer, and timeless flavors
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Recreate beloved classic soda flavors with authentic recipes and cultural variations. 
                From vintage cola formulations to modern sugar-free alternatives.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-orange-200 dark:bg-orange-800 rounded-full text-sm text-orange-800 dark:text-orange-200">Cola</span>
                <span className="px-3 py-1 bg-orange-200 dark:bg-orange-800 rounded-full text-sm text-orange-800 dark:text-orange-200">Lemon-Lime</span>
                <span className="px-3 py-1 bg-orange-200 dark:bg-orange-800 rounded-full text-sm text-orange-800 dark:text-orange-200">Root Beer</span>
                <span className="px-3 py-1 bg-orange-200 dark:bg-orange-800 rounded-full text-sm text-orange-800 dark:text-orange-200">Cream Soda</span>
              </div>
              <Link href="/flavors?category=classic">
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                  Browse Classic Recipes
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Energy Drinks Section */}
          <Card className="group border-blue-200 hover:border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/20 transition-all duration-500 hover:shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                Energy Drinks
              </CardTitle>
              <CardDescription className="text-blue-600/80 dark:text-blue-300/80 text-lg">
                High-caffeine blends and performance-enhancing formulas
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Design powerful energy drinks with precise caffeine control and safety validation. 
                Clone famous brands or create custom performance blends.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-blue-200 dark:bg-blue-800 rounded-full text-sm text-blue-800 dark:text-blue-200">High Caffeine</span>
                <span className="px-3 py-1 bg-blue-200 dark:bg-blue-800 rounded-full text-sm text-blue-800 dark:text-blue-200">Performance</span>
                <span className="px-3 py-1 bg-blue-200 dark:bg-blue-800 rounded-full text-sm text-blue-800 dark:text-blue-200">Fruit Blends</span>
                <span className="px-3 py-1 bg-blue-200 dark:bg-blue-800 rounded-full text-sm text-blue-800 dark:text-blue-200">Sugar-Free</span>
              </div>
              <Link href="/flavors?category=energy">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Explore Energy Recipes
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Hybrid Recipes Highlight */}
        <Card className="mt-8 border-purple-200 hover:border-purple-400 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/20 transition-all duration-500">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-10 h-10 text-purple-600" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-400 mb-2">
                  Hybrid Recipes
                </h3>
                <p className="text-muted-foreground mb-4">
                  Innovative combinations that blend the comfort of classic sodas with the energy of modern blends. 
                  Discover unique flavor profiles that push the boundaries of traditional soda-making.
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                  <span className="px-3 py-1 bg-purple-200 dark:bg-purple-800 rounded-full text-sm text-purple-800 dark:text-purple-200">Caffeinated Cola</span>
                  <span className="px-3 py-1 bg-purple-200 dark:bg-purple-800 rounded-full text-sm text-purple-800 dark:text-purple-200">Energy Lemonade</span>
                  <span className="px-3 py-1 bg-purple-200 dark:bg-purple-800 rounded-full text-sm text-purple-800 dark:text-purple-200">Performance Root Beer</span>
                </div>
                <Link href="/flavors?category=hybrid">
                  <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                    Try Hybrid Recipes
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Safety Warning - Updated for Soda Platform */}
      <div className="w-full max-w-4xl px-4">
        <div className="relative group overflow-hidden rounded-xl border border-dotted border-destructive/50 bg-destructive/5 p-1 transition-all hover:bg-destructive/10 hover:border-destructive">
          <div className="flex flex-col md:flex-row items-center gap-6 p-6">
             <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/20 text-destructive shrink-0">
               <AlertTriangle className="w-8 h-8" />
             </div>
             <div className="flex-1 text-center md:text-left">
               <h3 className="text-2xl font-bold text-destructive mb-2 uppercase tracking-widest">Safety First</h3>
               <p className="text-destructive-foreground/80 font-mono text-sm leading-relaxed">
                 Precise measurement is mandatory for all ingredients, especially caffeine. 
                 Our recipes comply with EU safety limits and include comprehensive safety checks. 
                 Always respect the chemistry and follow recommended dosages.
                 <span className="block mt-2 font-bold text-white">— CRAFT RESPONSIBLY —</span>
               </p>
             </div>
          </div>
        </div>
      </div>

      {/* Features Grid - Updated for Soda Platform */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl px-4">
        <Card className="group border-orange-200 hover:border-orange-400 transition-all duration-500">
          <CardHeader>
            <Calculator className="w-12 h-12 text-orange-600 mb-4 group-hover:scale-110 transition-transform duration-300" />
            <CardTitle className="text-2xl text-orange-700">Smart Calculator</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Design custom sodas with precise ingredient ratios. Supports DIY, premade, and hybrid modes 
              with cost analysis and cultural preference integration.
            </p>
          </CardContent>
        </Card>

        <Card className="group border-blue-200 hover:border-blue-400 transition-all duration-500">
          <CardHeader>
            <FlaskConical className="w-12 h-12 text-blue-600 mb-4 group-hover:scale-110 transition-transform duration-300" />
            <CardTitle className="text-2xl text-blue-700">Recipe Library</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Extensive collection of classic soda recipes, energy drink formulations, and innovative hybrid creations 
              with regional variations and cultural adaptations.
            </p>
          </CardContent>
        </Card>

        <Card className="group border-purple-200 hover:border-purple-400 transition-all duration-500">
          <CardHeader>
            <Globe className="w-12 h-12 text-purple-600 mb-4 group-hover:scale-110 transition-transform duration-300" />
            <CardTitle className="text-2xl text-purple-700">Global Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Multi-language support with regional ingredient sourcing, pricing in local currencies, 
              and marketplace integration for convenient shopping.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Section */}
      <div className="w-full max-w-4xl px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Quick Start Tools</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/calculator" className="block">
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2 hover:bg-orange-50 hover:border-orange-300">
              <Calculator className="w-6 h-6 text-orange-600" />
              <span className="text-sm">Calculator</span>
            </Button>
          </Link>
          <Link href="/flavors" className="block">
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-300">
              <FlaskConical className="w-6 h-6 text-blue-600" />
              <span className="text-sm">Recipes</span>
            </Button>
          </Link>
          <Link href="/marketplace" className="block">
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2 hover:bg-green-50 hover:border-green-300">
              <BookOpen className="w-6 h-6 text-green-600" />
              <span className="text-sm">Marketplace</span>
            </Button>
          </Link>
          <Link href="/safety" className="block">
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2 hover:bg-red-50 hover:border-red-300">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <span className="text-sm">Safety</span>
            </Button>
          </Link>
        </div>
      </div>

    </div>
  )
}