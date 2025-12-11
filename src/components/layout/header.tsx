'use client';

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, X, Globe, ChevronDown } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { locales, type Locale } from '@/i18n'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false)
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('navigation')

  const switchLocale = (newLocale: Locale) => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`)
    router.push(newPath)
    setIsLangMenuOpen(false)
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-gradient bg-gradient-to-r from-orange-600 via-blue-600 to-purple-600 bg-clip-text text-transparent" aria-label={t('home')}>
            Voltage
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Main navigation" className="hidden lg:flex items-center space-x-8">
            {/* Primary Categories with Dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                className="flex items-center space-x-1 font-medium"
                aria-expanded={isCategoryMenuOpen}
                aria-haspopup="true"
              >
                <span>Browse Flavors</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
              
              {isCategoryMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-background border border-border rounded-lg shadow-lg z-50 p-2">
                  <Link href="/flavors?category=classic" onClick={() => setIsCategoryMenuOpen(false)} className="block">
                    <div className="p-3 rounded-md hover:bg-orange-50 transition-colors">
                      <div className="font-medium text-orange-700">Classic Sodas</div>
                      <div className="text-sm text-muted-foreground">Traditional cola, lemon-lime, root beer, and more</div>
                    </div>
                  </Link>
                  <Link href="/flavors?category=energy" onClick={() => setIsCategoryMenuOpen(false)} className="block">
                    <div className="p-3 rounded-md hover:bg-blue-50 transition-colors">
                      <div className="font-medium text-blue-700">Energy Drinks</div>
                      <div className="text-sm text-muted-foreground">High-caffeine blends and performance formulas</div>
                    </div>
                  </Link>
                  <Link href="/flavors?category=hybrid" onClick={() => setIsCategoryMenuOpen(false)} className="block">
                    <div className="p-3 rounded-md hover:bg-purple-50 transition-colors">
                      <div className="font-medium text-purple-700">Hybrid Recipes</div>
                      <div className="text-sm text-muted-foreground">Creative combinations of classic and energy</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
            
            {/* Secondary Navigation */}
            <div className="flex items-center space-x-4">
              <Link href="/calculator">
                <Button variant="ghost" size="sm">Calculator</Button>
              </Link>
              <Link href="/marketplace">
                <Button variant="ghost" size="sm">Marketplace</Button>
              </Link>
              <Link href="/recipes">
                <Button variant="ghost" size="sm">Recipes</Button>
              </Link>
              <Link href="/safety">
                <Button variant="ghost" size="sm">Safety</Button>
              </Link>
            </div>

            {/* Language Switcher */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                aria-label="Switch language"
              >
                <Globe className="h-4 w-4" />
              </Button>
              {isLangMenuOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-background border border-border rounded-md shadow-lg z-50">
                  {locales.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => switchLocale(loc)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-accent ${
                        locale === loc ? 'bg-accent font-medium' : ''
                      }`}
                    >
                      {loc === 'en' ? 'English' : 'Nederlands'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsMenuOpen(!isMenuOpen)
              }
            }}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-haspopup="true"
            tabIndex={0}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <nav
            id="mobile-menu"
            className="lg:hidden mt-4 pb-4 border-t pt-4"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col space-y-1">
              {/* Primary Categories */}
              <div className="text-sm font-medium text-muted-foreground mb-3 px-2">Categories</div>
              <Link href="/flavors?category=classic" onClick={() => setIsMenuOpen(false)} className="w-full">
                <Button variant="ghost" className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                  Classic Sodas
                </Button>
              </Link>
              <Link href="/flavors?category=energy" onClick={() => setIsMenuOpen(false)} className="w-full">
                <Button variant="ghost" className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                  Energy Drinks
                </Button>
              </Link>
              <Link href="/flavors?category=hybrid" onClick={() => setIsMenuOpen(false)} className="w-full">
                <Button variant="ghost" className="w-full justify-start text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                  Hybrid Recipes
                </Button>
              </Link>
              
              {/* Secondary Navigation */}
              <div className="border-t pt-3 mt-3">
                <div className="text-sm font-medium text-muted-foreground mb-3 px-2">Tools & Features</div>
                <Link href="/calculator" onClick={() => setIsMenuOpen(false)} className="w-full">
                  <Button variant="ghost" className="w-full justify-start">Calculator</Button>
                </Link>
                <Link href="/marketplace" onClick={() => setIsMenuOpen(false)} className="w-full">
                  <Button variant="ghost" className="w-full justify-start">Marketplace</Button>
                </Link>
                <Link href="/recipes" onClick={() => setIsMenuOpen(false)} className="w-full">
                  <Button variant="ghost" className="w-full justify-start">Recipes</Button>
                </Link>
                <Link href="/safety" onClick={() => setIsMenuOpen(false)} className="w-full">
                  <Button variant="ghost" className="w-full justify-start">Safety</Button>
                </Link>
              </div>

              {/* Mobile Language Switcher */}
              <div className="border-t pt-3 mt-3">
                <div className="text-sm font-medium text-muted-foreground mb-2 px-2">Language</div>
                {locales.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => {
                      switchLocale(loc)
                      setIsMenuOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-accent rounded ${
                      locale === loc ? 'bg-accent font-medium' : ''
                    }`}
                  >
                    {loc === 'en' ? 'English' : 'Nederlands'}
                  </button>
                ))}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}