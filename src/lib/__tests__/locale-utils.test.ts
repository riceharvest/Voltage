import { describe, it, expect } from 'vitest'
import { isRTLLocale, getDirection, formatDate, formatNumber, formatCurrency, formatRelativeTime } from '../locale-utils'

describe('isRTLLocale', () => {
  it('should return true for RTL locales', () => {
    expect(isRTLLocale('ar')).toBe(true)
    expect(isRTLLocale('he')).toBe(true)
    expect(isRTLLocale('fa')).toBe(true)
    expect(isRTLLocale('ur')).toBe(true)
    expect(isRTLLocale('yi')).toBe(true)
  })

  it('should return false for LTR locales', () => {
    expect(isRTLLocale('en')).toBe(false)
    expect(isRTLLocale('nl')).toBe(false)
    expect(isRTLLocale('fr')).toBe(false)
    expect(isRTLLocale('de')).toBe(false)
  })

  it('should handle locale variants', () => {
    expect(isRTLLocale('ar-SA')).toBe(true)
    expect(isRTLLocale('he-IL')).toBe(true)
    expect(isRTLLocale('en-US')).toBe(false)
  })
})

describe('getDirection', () => {
  it('should return rtl for RTL locales', () => {
    expect(getDirection('ar')).toBe('rtl')
    expect(getDirection('he')).toBe('rtl')
  })

  it('should return ltr for LTR locales', () => {
    expect(getDirection('en')).toBe('ltr')
    expect(getDirection('nl')).toBe('ltr')
    expect(getDirection('fr')).toBe('ltr')
  })
})

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2023-12-25')
    const result = formatDate(date, 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    expect(result).toBe('December 25, 2023')
  })

  it('should handle different locales', () => {
    const date = new Date('2023-12-25')
    const enResult = formatDate(date, 'en-US', { month: 'short', day: 'numeric' })
    const nlResult = formatDate(date, 'nl-NL', { month: 'short', day: 'numeric' })

    expect(enResult).toBe('Dec 25')
    expect(nlResult).toBe('25 dec')
  })
})

describe('formatNumber', () => {
  it('should format numbers correctly', () => {
    expect(formatNumber(1234.56, 'en-US')).toBe('1,234.56')
    expect(formatNumber(1234.56, 'nl-NL')).toBe('1.234,56')
  })

  it('should handle different number formats', () => {
    expect(formatNumber(1234, 'en-US', { minimumFractionDigits: 2 })).toBe('1,234.00')
    expect(formatNumber(0.5, 'en-US', { style: 'percent' })).toBe('50%')
  })
})

describe('formatCurrency', () => {
  it('should format currency correctly', () => {
    expect(formatCurrency(1234.56, 'en-US', 'USD')).toBe('$1,234.56')
    expect(formatCurrency(1234.56, 'nl-NL', 'EUR')).toBe('€\u00a01.234,56')
  })

  it('should use default EUR currency', () => {
    expect(formatCurrency(1234.56, 'en-US')).toContain('€')
  })
})

describe('formatRelativeTime', () => {
  it('should format relative time correctly', () => {
    expect(formatRelativeTime(2, 'day', 'en')).toBe('in 2 days')
    expect(formatRelativeTime(-1, 'hour', 'en')).toBe('1 hour ago')
  })

  it('should handle different locales', () => {
    const enResult = formatRelativeTime(1, 'day', 'en')
    const nlResult = formatRelativeTime(1, 'day', 'nl')

    expect(enResult).toBe('in 1 day')
    expect(nlResult).toBe('over 1 dag')
  })

  it('should handle different units', () => {
    expect(formatRelativeTime(30, 'minute', 'en')).toBe('in 30 minutes')
    expect(formatRelativeTime(2, 'week', 'en')).toBe('in 2 weeks')
  })
})