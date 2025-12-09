'use client';

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, X, Globe } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { locales, type Locale } from '@/i18n'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false)
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
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold" aria-label={t('home')}>
            {t('home')}
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Main navigation" className="hidden md:flex space-x-4 items-center">
            <Link href="/guide">
              <Button variant="ghost" aria-label={t('guide')}>{t('guide')}</Button>
            </Link>
            <Link href="/calculator">
              <Button variant="ghost" aria-label={t('calculator')}>{t('calculator')}</Button>
            </Link>
            <Link href="/recipes">
              <Button variant="ghost" aria-label={t('recipes')}>{t('recipes')}</Button>
            </Link>
            <Link href="/flavors">
              <Button variant="ghost" aria-label={t('flavors')}>{t('flavors')}</Button>
            </Link>
            <Link href="/phases">
              <Button variant="ghost" aria-label={t('phases')}>{t('phases')}</Button>
            </Link>
            <Link href="/safety">
              <Button variant="ghost" aria-label={t('safety')}>{t('safety')}</Button>
            </Link>

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
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <nav
            id="mobile-menu"
            className="md:hidden mt-4 pb-4 border-t pt-4"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col space-y-2">
              <Link href="/guide" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start" aria-label={t('guide')}>{t('guide')}</Button>
              </Link>
              <Link href="/calculator" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start" aria-label={t('calculator')}>{t('calculator')}</Button>
              </Link>
              <Link href="/recipes" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start" aria-label={t('recipes')}>{t('recipes')}</Button>
              </Link>
              <Link href="/flavors" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start" aria-label={t('flavors')}>{t('flavors')}</Button>
              </Link>
              <Link href="/phases" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start" aria-label={t('phases')}>{t('phases')}</Button>
              </Link>
              <Link href="/safety" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start" aria-label={t('safety')}>{t('safety')}</Button>
              </Link>

              {/* Mobile Language Switcher */}
              <div className="border-t pt-2 mt-2">
                <div className="text-sm font-medium text-muted-foreground mb-2">Language</div>
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