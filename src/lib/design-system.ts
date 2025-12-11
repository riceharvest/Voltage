/**
 * Modern Visual Identity System for Complete Soda Platform
 * 
 * Provides category-specific design tokens, color palettes, and styling
 * for Classic Sodas, Energy Drinks, and Hybrid Recipes.
 */

export interface CategoryTheme {
  id: string;
  name: string;
  displayName: string;
  description: string;
  colors: {
    primary: string;
    primaryHover: string;
    secondary: string;
    secondaryHover: string;
    accent: string;
    accentHover: string;
    background: string;
    backgroundLight: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    borderHover: string;
    success: string;
    warning: string;
    error: string;
  };
  gradients: {
    primary: string;
    secondary: string;
    hero: string;
    surface: string;
  };
  typography: {
    headingWeight: string;
    bodyWeight: string;
    accentWeight: string;
  };
  icons: {
    category: string;
    background: string;
  };
  spacing: {
    section: string;
    component: string;
    element: string;
  };
  borderRadius: {
    small: string;
    medium: string;
    large: string;
    full: string;
  };
  shadows: {
    subtle: string;
    medium: string;
    strong: string;
    glow: string;
  };
  animations: {
    hover: string;
    focus: string;
    transition: string;
  };
}

export const designSystem = {
  // Classic Sodas Theme - Warm, nostalgic
  classic: {
    id: 'classic',
    name: 'classic',
    displayName: 'Classic Sodas',
    description: 'Traditional soda flavors with warm, nostalgic appeal',
    colors: {
      primary: '#FF8C00',
      primaryHover: '#FF7A00',
      secondary: '#FFA500',
      secondaryHover: '#FF9500',
      accent: '#FF6B35',
      accentHover: '#FF5722',
      background: '#FFF8F0',
      backgroundLight: '#FFFDF8',
      surface: '#FFFFFF',
      text: '#2D1810',
      textMuted: '#6B4423',
      border: '#E6D5C3',
      borderHover: '#D4C4B0',
      success: '#28A745',
      warning: '#FFC107',
      error: '#DC3545',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #FF8C00 0%, #FFA500 50%, #FFB347 100%)',
      secondary: 'linear-gradient(135deg, #FFA500 0%, #FFB347 50%, #FFC55A 100%)',
      hero: 'linear-gradient(135deg, #FF8C00 0%, #FFA500 50%, #FF6B35 100%)',
      surface: 'linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 50%, #FFFDF8 100%)',
    },
    typography: {
      headingWeight: '800',
      bodyWeight: '400',
      accentWeight: '600',
    },
    icons: {
      category: 'Mountain',
      background: 'bg-orange-100',
    },
    spacing: {
      section: 'space-y-12',
      component: 'space-y-6',
      element: 'space-y-3',
    },
    borderRadius: {
      small: 'rounded-lg',
      medium: 'rounded-xl',
      large: 'rounded-2xl',
      full: 'rounded-full',
    },
    shadows: {
      subtle: 'shadow-sm',
      medium: 'shadow-md',
      strong: 'shadow-lg',
      glow: 'shadow-[0_0_20px_rgba(255,140,0,0.3)]',
    },
    animations: {
      hover: 'hover:scale-105',
      focus: 'focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50',
      transition: 'transition-all duration-300 ease-in-out',
    },
  } as CategoryTheme,

  // Energy Drinks Theme - Dynamic, energetic
  energy: {
    id: 'energy',
    name: 'energy',
    displayName: 'Energy Drinks',
    description: 'High-performance beverages with dynamic, energetic design',
    colors: {
      primary: '#0066CC',
      primaryHover: '#0052A3',
      secondary: '#00BFFF',
      secondaryHover: '#0099CC',
      accent: '#00CED1',
      accentHover: '#008B8B',
      background: '#F0F8FF',
      backgroundLight: '#F8FCFF',
      surface: '#FFFFFF',
      text: '#1A1A2E',
      textMuted: '#4A5568',
      border: '#E2E8F0',
      borderHover: '#CBD5E0',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #0066CC 0%, #00BFFF 50%, #00CED1 100%)',
      secondary: 'linear-gradient(135deg, #00BFFF 0%, #87CEEB 50%, #B0E0E6 100%)',
      hero: 'linear-gradient(135deg, #0066CC 0%, #00BFFF 50%, #00CED1 100%)',
      surface: 'linear-gradient(135deg, #F0F8FF 0%, #FFFFFF 50%, #F8FCFF 100%)',
    },
    typography: {
      headingWeight: '900',
      bodyWeight: '500',
      accentWeight: '700',
    },
    icons: {
      category: 'Zap',
      background: 'bg-blue-100',
    },
    spacing: {
      section: 'space-y-16',
      component: 'space-y-8',
      element: 'space-y-4',
    },
    borderRadius: {
      small: 'rounded-lg',
      medium: 'rounded-xl',
      large: 'rounded-2xl',
      full: 'rounded-full',
    },
    shadows: {
      subtle: 'shadow-sm',
      medium: 'shadow-lg',
      strong: 'shadow-xl',
      glow: 'shadow-[0_0_30px_rgba(0,102,204,0.4)]',
    },
    animations: {
      hover: 'hover:scale-105 hover:-translate-y-1',
      focus: 'focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
      transition: 'transition-all duration-300 ease-out',
    },
  } as CategoryTheme,

  // Hybrid Recipes Theme - Modern, balanced
  hybrid: {
    id: 'hybrid',
    name: 'hybrid',
    displayName: 'Hybrid Recipes',
    description: 'Innovative combinations with modern, balanced aesthetics',
    colors: {
      primary: '#8B5CF6',
      primaryHover: '#7C3AED',
      secondary: '#A855F7',
      secondaryHover: '#9333EA',
      accent: '#EC4899',
      accentHover: '#DB2777',
      background: '#FAF5FF',
      backgroundLight: '#FEF7FF',
      surface: '#FFFFFF',
      text: '#1F2937',
      textMuted: '#6B7280',
      border: '#E5E7EB',
      borderHover: '#D1D5DB',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #EC4899 100%)',
      secondary: 'linear-gradient(135deg, #A855F7 0%, #C084FC 50%, #E879F9 100%)',
      hero: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #EC4899 100%)',
      surface: 'linear-gradient(135deg, #FAF5FF 0%, #FFFFFF 50%, #FEF7FF 100%)',
    },
    typography: {
      headingWeight: '800',
      bodyWeight: '500',
      accentWeight: '600',
    },
    icons: {
      category: 'Sparkles',
      background: 'bg-purple-100',
    },
    spacing: {
      section: 'space-y-14',
      component: 'space-y-7',
      element: 'space-y-3',
    },
    borderRadius: {
      small: 'rounded-lg',
      medium: 'rounded-xl',
      large: 'rounded-2xl',
      full: 'rounded-full',
    },
    shadows: {
      subtle: 'shadow-sm',
      medium: 'shadow-lg',
      strong: 'shadow-xl',
      glow: 'shadow-[0_0_25px_rgba(139,92,246,0.3)]',
    },
    animations: {
      hover: 'hover:scale-105 hover:rotate-1',
      focus: 'focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50',
      transition: 'transition-all duration-300 ease-in-out',
    },
  } as CategoryTheme,
};

// Utility functions for design system
export const getCategoryTheme = (category?: string): CategoryTheme => {
  switch (category) {
    case 'classic':
      return designSystem.classic;
    case 'energy':
      return designSystem.energy;
    case 'hybrid':
      return designSystem.hybrid;
    default:
      return designSystem.classic; // Default fallback
  }
};

export const getThemeClasses = (category?: string) => {
  const theme = getCategoryTheme(category);
  return {
    // Text colors
    textPrimary: `text-[${theme.colors.text}]`,
    textMuted: `text-[${theme.colors.textMuted}]`,
    
    // Background colors
    bgPrimary: `bg-[${theme.colors.primary}]`,
    bgSecondary: `bg-[${theme.colors.secondary}]`,
    bgSurface: `bg-[${theme.colors.surface}]`,
    bgBackground: `bg-[${theme.colors.background}]`,
    
    // Border colors
    borderPrimary: `border-[${theme.colors.border}]`,
    borderHover: `border-[${theme.colors.borderHover}]`,
    
    // Gradients
    gradientPrimary: theme.gradients.primary,
    gradientSecondary: theme.gradients.secondary,
    gradientHero: theme.gradients.hero,
    gradientSurface: theme.gradients.surface,
    
    // Typography
    headingWeight: `font-[${theme.typography.headingWeight}]`,
    bodyWeight: `font-[${theme.typography.bodyWeight}]`,
    accentWeight: `font-[${theme.typography.accentWeight}]`,
    
    // Spacing
    sectionSpacing: theme.spacing.section,
    componentSpacing: theme.spacing.component,
    elementSpacing: theme.spacing.element,
    
    // Border radius
    radiusSmall: theme.borderRadius.small,
    radiusMedium: theme.borderRadius.medium,
    radiusLarge: theme.borderRadius.large,
    radiusFull: theme.borderRadius.full,
    
    // Shadows
    shadowSubtle: theme.shadows.subtle,
    shadowMedium: theme.shadows.medium,
    shadowStrong: theme.shadows.strong,
    shadowGlow: theme.shadows.glow,
    
    // Animations
    hoverEffect: theme.animations.hover,
    focusEffect: theme.animations.focus,
    transitionEffect: theme.animations.transition,
  };
};

// Component variants using the design system
export const getButtonVariant = (category?: string, variant: 'primary' | 'secondary' | 'outline' = 'primary') => {
  const theme = getCategoryTheme(category);
  
  switch (variant) {
    case 'primary':
      return {
        className: `bg-[${theme.colors.primary}] hover:bg-[${theme.colors.primaryHover}] text-white ${theme.borderRadius.medium} ${theme.animations.transition} ${theme.animations.hover} ${theme.animations.focus} px-6 py-3 font-medium ${theme.typography.accentWeight}`,
      };
    case 'secondary':
      return {
        className: `bg-[${theme.colors.secondary}] hover:bg-[${theme.colors.secondaryHover}] text-white ${theme.borderRadius.medium} ${theme.animations.transition} ${theme.animations.hover} ${theme.animations.focus} px-6 py-3 font-medium ${theme.typography.accentWeight}`,
      };
    case 'outline':
      return {
        className: `border-2 border-[${theme.colors.border}] hover:border-[${theme.colors.borderHover}] bg-transparent text-[${theme.colors.text}] ${theme.borderRadius.medium} ${theme.animations.transition} ${theme.animations.hover} ${theme.animations.focus} px-6 py-3 font-medium ${theme.typography.accentWeight}`,
      };
    default:
      return getButtonVariant(category, 'primary');
  }
};

export const getCardVariant = (category?: string) => {
  const theme = getCategoryTheme(category);
  
  return {
    className: `bg-[${theme.colors.surface}] border border-[${theme.colors.border}] hover:border-[${theme.colors.borderHover}] ${theme.borderRadius.large} ${theme.shadows.medium} ${theme.animations.transition} overflow-hidden`,
    headerClassName: `bg-gradient-to-r ${theme.gradients.surface} px-6 py-4 border-b border-[${theme.colors.border}]`,
    contentClassName: `p-6 ${theme.spacing.element}`,
  };
};

export const getBadgeVariant = (category?: string) => {
  const theme = getCategoryTheme(category);
  
  return {
    className: `bg-[${theme.colors.primary}] text-white ${theme.borderRadius.full} ${theme.typography.accentWeight} px-3 py-1 text-sm`,
    outlineClassName: `border border-[${theme.colors.border}] text-[${theme.colors.text}] bg-transparent ${theme.borderRadius.full} ${theme.typography.accentWeight} px-3 py-1 text-sm`,
  };
};

// Export all themes as array for easy iteration
export const allThemes = [designSystem.classic, designSystem.energy, designSystem.hybrid];

// CSS custom properties generator for runtime theming
export const generateCSSCustomProperties = (category?: string): Record<string, string> => {
  const theme = getCategoryTheme(category);
  
  return {
    '--color-primary': theme.colors.primary,
    '--color-primary-hover': theme.colors.primaryHover,
    '--color-secondary': theme.colors.secondary,
    '--color-secondary-hover': theme.colors.secondaryHover,
    '--color-accent': theme.colors.accent,
    '--color-accent-hover': theme.colors.accentHover,
    '--color-background': theme.colors.background,
    '--color-surface': theme.colors.surface,
    '--color-text': theme.colors.text,
    '--color-text-muted': theme.colors.textMuted,
    '--color-border': theme.colors.border,
    '--gradient-primary': theme.gradients.primary,
    '--gradient-secondary': theme.gradients.secondary,
    '--gradient-hero': theme.gradients.hero,
    '--shadow-glow': theme.shadows.glow,
    '--font-heading-weight': theme.typography.headingWeight,
    '--font-body-weight': theme.typography.bodyWeight,
    '--font-accent-weight': theme.typography.accentWeight,
  };
};