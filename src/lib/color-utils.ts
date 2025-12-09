import { ColorSpec } from '@/lib/types';

export const getColorHex = (color: ColorSpec | string): string => {
  if (typeof color === 'string') return color
  if (color && color.description) {
    if (color.description.toLowerCase().includes('red')) return '#FF6B6B'
    if (color.description.toLowerCase().includes('green')) return '#32CD32'
    if (color.description.toLowerCase().includes('blue')) return '#0000FF'
    if (color.description.toLowerCase().includes('orange')) return '#FFA500'
    if (color.description.toLowerCase().includes('purple')) return '#800080'
    if (color.description.toLowerCase().includes('pink')) return '#FFC0CB'
    if (color.description.toLowerCase().includes('yellow')) return '#FFFF00'
    if (color.description.toLowerCase().includes('brown')) return '#A52A2A'
    if (color.description.toLowerCase().includes('clear')) return '#FFFFFF'
    return '#E0E0E0' // Default grey for unknown
  }
  return '#FFFFFF'
}