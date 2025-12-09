import { describe, it, expect } from 'vitest'
import { getColorHex } from '../color-utils'

describe('getColorHex', () => {
  it('should return the string directly if input is a string', () => {
    expect(getColorHex('#FF0000')).toBe('#FF0000')
    expect(getColorHex('red')).toBe('red')
  })

  it('should return correct hex for red colors', () => {
    expect(getColorHex({ type: 'natural', description: 'bright red' })).toBe('#FF6B6B')
    expect(getColorHex({ type: 'artificial', description: 'Red Bull red' })).toBe('#FF6B6B')
  })

  it('should return correct hex for green colors', () => {
    expect(getColorHex({ type: 'natural', description: 'green apple' })).toBe('#32CD32')
    expect(getColorHex({ type: 'artificial', description: 'Green Tea' })).toBe('#32CD32')
  })

  it('should return correct hex for blue colors', () => {
    expect(getColorHex({ type: 'natural', description: 'blue raspberry' })).toBe('#0000FF')
    expect(getColorHex({ type: 'artificial', description: 'Blue Voltage' })).toBe('#0000FF')
  })

  it('should return correct hex for orange colors', () => {
    expect(getColorHex({ type: 'natural', description: 'orange burst' })).toBe('#FFA500')
  })

  it('should return correct hex for purple colors', () => {
    expect(getColorHex({ type: 'artificial', description: 'purple haze' })).toBe('#800080')
  })

  it('should return correct hex for pink colors', () => {
    expect(getColorHex({ type: 'natural', description: 'pink lemonade' })).toBe('#FFC0CB')
  })

  it('should return correct hex for yellow colors', () => {
    expect(getColorHex({ type: 'natural', description: 'yellow sunshine' })).toBe('#FFFF00')
  })

  it('should return correct hex for brown colors', () => {
    expect(getColorHex({ type: 'artificial', description: 'brown cola' })).toBe('#A52A2A')
  })

  it('should return correct hex for clear colors', () => {
    expect(getColorHex({ type: 'natural', description: 'clear crystal' })).toBe('#FFFFFF')
  })

  it('should return default grey for unknown colors', () => {
    expect(getColorHex({ type: 'natural', description: 'unknown color' })).toBe('#E0E0E0')
  })

  it('should return white for null or undefined color spec', () => {
    expect(getColorHex(null as any)).toBe('#FFFFFF')
    expect(getColorHex(undefined as any)).toBe('#FFFFFF')
  })

  it('should return white for color spec without description', () => {
    expect(getColorHex({ type: 'natural' } as any)).toBe('#FFFFFF')
  })

  it('should be case insensitive', () => {
    expect(getColorHex({ type: 'natural', description: 'RED' })).toBe('#FF6B6B')
    expect(getColorHex({ type: 'artificial', description: 'Green' })).toBe('#32CD32')
  })
})