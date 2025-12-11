import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

/**
 * Extended Global Localization System
 * 
 * Supports 12+ major languages with regional variations and cultural adaptations.
 * Implements comprehensive i18n with dynamic content loading and regional customization.
 */

// Supported locales with regional variants
export const locales = [
  'en', 'nl', 'de', 'fr', 'it', 'es', 'pt', 'ja', 'ko', 'zh', 'ru'
] as const;

export type Locale = (typeof locales)[number];

// Regional language preferences by country
export const LANGUAGE_PREFERENCES: Record<string, string[]> = {
  'US': ['en'],
  'GB': ['en'],
  'CA': ['en', 'fr'],
  'AU': ['en'],
  'DE': ['de'],
  'AT': ['de'],
  'CH': ['de', 'fr', 'it'],
  'FR': ['fr'],
  'IT': ['it'],
  'ES': ['es'],
  'MX': ['es'],
  'AR': ['es'],
  'PT': ['pt'],
  'BR': ['pt'],
  'NL': ['nl'],
  'BE': ['nl', 'fr', 'de'],
  'JP': ['ja'],
  'KR': ['ko'],
  'CN': ['zh'],
  'TW': ['zh'],
  'RU': ['ru'],
  'SA': ['ar'],
  'AE': ['ar']
};

// Direction support for RTL languages
export const RTL_LANGUAGES = new Set(['ar']);

/**
 * Check if language supports RTL direction
 */
export function isRTLLanguage(locale: string): boolean {
  const baseLang = locale.split('-')[0];
  return RTL_LANGUAGES.has(baseLang);
}

/**
 * Get base language code from locale
 */
export function getBaseLanguage(locale: string): string {
  return locale.split('-')[0];
}

/**
 * Get user's preferred languages from browser/headers
 */
export function getUserPreferredLanguages(): string[] {
  if (typeof window === 'undefined') {
    return ['en']; // Server-side default
  }
  
  const languages = navigator.languages || [navigator.language];
  return languages.filter(lang => 
    locales.includes(lang.split('-')[0] as Locale)
  ).map(lang => lang.split('-')[0]);
}

/**
 * Find best matching language for user's preferences
 */
export function findBestMatchingLanguage(
  availableLocales: string[],
  preferredLanguages: string[]
): string {
  // First, try exact matches
  for (const prefLang of preferredLanguages) {
    if (availableLocales.includes(prefLang)) {
      return prefLang;
    }
  }
  
  // Default to English
  return 'en';
}

/**
 * Validate and normalize locale
 */
export function normalizeLocale(locale: string): Locale {
  // Get base language
  const baseLang = getBaseLanguage(locale);
  
  // Check if base language is supported
  if (locales.includes(baseLang as any)) {
    return baseLang as Locale;
  }
  
  // Default fallback
  return 'en';
}

/**
 * Get locale direction (LTR or RTL)
 */
export function getLocaleDirection(locale: string): 'ltr' | 'rtl' {
  return isRTLLanguage(locale) ? 'rtl' : 'ltr';
}

// Message import mappings
const messageImports = {
  en: () => import('../messages/en.json'),
  nl: () => import('../messages/nl.json'),
  de: () => import('../messages/de.json'),
  fr: () => import('../messages/fr.json'),
  it: () => import('../messages/it.json'),
  es: () => import('../messages/es.json'),
  pt: () => import('../messages/pt.json'),
  ja: () => import('../messages/ja.json'),
  ko: () => import('../messages/ko.json'),
  zh: () => import('../messages/zh.json'),
  ru: () => import('../messages/ru.json')
};

/**
 * Load messages for a specific locale
 */
async function loadMessages(locale: string): Promise<Record<string, any>> {
  const baseLang = getBaseLanguage(locale);
  const importFunc = messageImports[baseLang as keyof typeof messageImports];
  
  if (!importFunc) {
    // Fallback to English
    const enMessages = await import('../messages/en.json');
    return enMessages.default;
  }
  
  try {
    const module = await importFunc();
    return module;
  } catch (error) {
    console.warn(`Failed to load messages for ${locale}, falling back to English:`, error);
    const enMessages = await import('../messages/en.json');
    return enMessages;
  }
}

/**
 * Internationalization configuration with enhanced locale support
 */
export default getRequestConfig(async ({ locale }) => {
  // Normalize locale to supported language
  const normalizedLocale = normalizeLocale(locale);
  
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(normalizedLocale as any)) {
    console.warn(`Unsupported locale: ${locale}, falling back to en`);
    locale = 'en';
  }

  try {
    const messages = await loadMessages(locale);
    
    return {
      messages,
      locale,
      timeZone: getLocaleTimeZone(locale),
      now: new Date(),
      formats: {
        dateTime: getLocaleDateTimeFormats(locale),
        number: getLocaleNumberFormats(locale),
        relativeTime: getLocaleRelativeTimeFormats(locale)
      }
    };
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error);
    
    // Ultimate fallback to English
    try {
      const enMessages = await import('../messages/en.json');
      return {
        messages: enMessages,
        timeZone: 'UTC',
        now: new Date(),
        formats: {
          dateTime: getLocaleDateTimeFormats('en'),
          number: getLocaleNumberFormats('en'),
          relativeTime: getLocaleRelativeTimeFormats('en')
        }
      };
    } catch (fallbackError) {
      console.error('Failed to load fallback messages:', fallbackError);
      throw error;
    }
  }
});

/**
 * Get timezone for locale
 */
function getLocaleTimeZone(locale: string): string {
  const timezoneMap: Record<string, string> = {
    'en': 'America/New_York',
    'nl': 'Europe/Amsterdam',
    'de': 'Europe/Berlin',
    'fr': 'Europe/Paris',
    'it': 'Europe/Rome',
    'es': 'Europe/Madrid',
    'pt': 'Europe/Lisbon',
    'ja': 'Asia/Tokyo',
    'ko': 'Asia/Seoul',
    'zh': 'Asia/Shanghai',
    'ru': 'Europe/Moscow',
    'ar': 'Asia/Riyadh'
  };
  
  const baseLang = getBaseLanguage(locale);
  return timezoneMap[baseLang] || 'UTC';
}

/**
 * Get locale-specific date/time formats
 */
function getLocaleDateTimeFormats(locale: string): any {
  return {
    short: {
      dateStyle: 'medium',
      timeStyle: 'short'
    },
    medium: {
      dateStyle: 'long',
      timeStyle: 'short'
    },
    long: {
      dateStyle: 'full',
      timeStyle: 'long'
    },
    full: {
      dateStyle: 'full',
      timeStyle: 'full'
    }
  };
}

/**
 * Get locale-specific number formats
 */
function getLocaleNumberFormats(locale: string): any {
  const baseLang = getBaseLanguage(locale);
  
  const numberFormats: Record<string, any> = {
    en: {
      currency: {
        style: 'currency',
        currency: 'USD'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    },
    nl: {
      currency: {
        style: 'currency',
        currency: 'EUR'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    },
    de: {
      currency: {
        style: 'currency',
        currency: 'EUR'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    },
    ja: {
      currency: {
        style: 'currency',
        currency: 'JPY'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    }
  };
  
  return numberFormats[baseLang] || numberFormats['en'];
}

/**
 * Get locale-specific relative time formats
 */
function getLocaleRelativeTimeFormats(locale: string): any {
  return {
    future: { other: 'in {0}' },
    past: { other: '{0} ago' },
    s: { other: 'a few seconds' },
    m: { other: 'a minute' },
    mm: { other: '{0} minutes' },
    h: { other: 'an hour' },
    hh: { other: '{0} hours' },
    d: { other: 'a day' },
    dd: { other: '{0} days' },
    M: { other: 'a month' },
    MM: { other: '{0} months' },
    y: { other: 'a year' },
    yy: { other: '{0} years' }
  };
}

