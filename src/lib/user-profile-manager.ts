/**
 * User Profile and Preference Management System
 * 
 * Comprehensive user profile management with taste profile creation,
 * dietary restrictions tracking, cultural adaptation, and privacy controls.
 * 
 * @example
 * ```typescript
 * const profileManager = new UserProfileManager();
 * const userProfile = await profileManager.getUserProfile(userId);
 * await profileManager.updateTastePreferences(userId, {
 *   sweetness: 'high',
 *   sourness: 'medium',
 *   carbonation: 'high'
 * });
 * ```
 */

import { EnhancedFlavorRecipe } from './types';
import { CulturalAdaptation } from './cultural-adaptation';
import { RegionalCompliance } from './regional-compliance';

export interface TasteProfile {
  sweetness: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
  sourness: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
  bitterness: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
  umami: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
  carbonation: 'none' | 'light' | 'medium' | 'high' | 'very-high';
  body: 'light' | 'medium' | 'full' | 'very-full';
  color: 'pale' | 'medium' | 'dark' | 'very-dark';
  temperature: 'iced' | 'chilled' | 'room-temp' | 'warm';
  serving: 'shot' | 'small' | 'medium' | 'large' | 'bottle';
  occasions: string[];
  flavorNotes: string[];
}

export interface DietaryRestrictions {
  sugarFree: boolean;
  caffeineFree: boolean;
  artificialSweeteners: 'allowed' | 'limited' | 'avoid';
  artificialColors: 'allowed' | 'limited' | 'avoid';
  artificialFlavors: 'allowed' | 'limited' | 'avoid';
  allergens: string[];
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  ketoFriendly: boolean;
  diabeticSafe: boolean;
  customRestrictions: string[];
}

export interface CulturalPreferences {
  primaryRegion: string;
  language: string;
  currency: string;
  culturalFlavors: string[];
  traditionalPreferences: string[];
  seasonalAdaptations: Record<string, string[]>;
  regionalIngredients: string[];
  culturalEvents: string[];
  holidayBeverages: string[];
  foodPairingPreferences: string[];
}

export interface AccessibilityPreferences {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  voiceCommands: boolean;
  colorBlindSupport: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
  cognitiveAssistance: boolean;
  simplifiedInterface: boolean;
}

export interface UserProfile {
  userId: string;
  createdAt: Date;
  lastActive: Date;
  preferences: {
    taste: TasteProfile;
    dietary: DietaryRestrictions;
    cultural: CulturalPreferences;
    accessibility: AccessibilityPreferences;
    language: string;
    region: string;
    currency: string;
    privacy: PrivacySettings;
  };
  behavior: UserBehavior;
  settings: UserSettings;
  consent: ConsentRecord;
}

export interface PrivacySettings {
  dataCollection: 'minimal' | 'standard' | 'comprehensive';
  personalization: boolean;
  analytics: boolean;
  marketing: boolean;
  sharing: boolean;
  retention: 'session' | 'monthly' | 'yearly' | 'indefinite';
  anonymization: boolean;
  exportData: boolean;
  deleteData: boolean;
}

export interface UserBehavior {
  totalSessions: number;
  averageSessionDuration: number;
  lastVisit: Date;
  visitFrequency: number;
  featureUsage: Record<string, number>;
  recipePreferences: Record<string, number>;
  categoryPreferences: Record<string, number>;
  timeOfDayUsage: Record<string, number>;
  devicePreferences: Record<string, number>;
  completionRates: Record<string, number>;
  abandonmentPoints: Record<string, number>;
}

export interface UserSettings {
  notifications: NotificationSettings;
  calculator: CalculatorSettings;
  display: DisplaySettings;
  privacy: PrivacySettings;
  sync: SyncSettings;
}

export interface NotificationSettings {
  enabled: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
  frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
  timing: 'morning' | 'afternoon' | 'evening' | 'anytime';
  recipeReminders: boolean;
  safetyAlerts: boolean;
  seasonalRecommendations: boolean;
  communityUpdates: boolean;
}

export interface CalculatorSettings {
  defaultUnits: 'metric' | 'imperial';
  defaultBatchSize: number;
  defaultStrength: 'light' | 'medium' | 'strong';
  showCostAnalysis: boolean;
  showNutrition: boolean;
  showSafetyWarnings: boolean;
  autoCalculate: boolean;
  showAlternatives: boolean;
  preferredMode: 'diy' | 'premade' | 'hybrid';
}

export interface DisplaySettings {
  theme: 'light' | 'dark' | 'auto';
  density: 'compact' | 'comfortable' | 'spacious';
  animations: boolean;
  advancedFeatures: boolean;
  showTips: boolean;
  showAdvancedOptions: boolean;
  layout: 'list' | 'grid' | 'cards';
}

export interface SyncSettings {
  crossDevice: boolean;
  cloudBackup: boolean;
  autoSync: boolean;
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  offlineMode: boolean;
  conflictResolution: 'local' | 'remote' | 'manual';
}

export interface ConsentRecord {
  consentVersion: string;
  timestamp: Date;
  categories: Record<string, {
    granted: boolean;
    timestamp: Date;
    method: 'explicit' | 'implied' | 'legitimate-interest';
    scope: string[];
  }>;
  withdrawal: {
    available: boolean;
    method: string;
    timestamp?: Date;
  };
}

export class UserProfileManager {
  private culturalAdaptation: CulturalAdaptation;
  private regionalCompliance: RegionalCompliance;
  private profiles: Map<string, UserProfile> = new Map();

  constructor() {
    this.culturalAdaptation = new CulturalAdaptation();
    this.regionalCompliance = new RegionalCompliance();
  }

  /**
   * Get or create user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    let profile = this.profiles.get(userId);
    
    if (!profile) {
      profile = await this.createDefaultProfile(userId);
      this.profiles.set(userId, profile);
    }

    return profile;
  }

  /**
   * Create default user profile with regional/cultural adaptation
   */
  private async createDefaultProfile(userId: string): Promise<UserProfile> {
    const region = await this.culturalAdaptation.detectUserRegion(userId);
    const culture = await this.culturalAdaptation.getCulturalPreferences(region);
    
    return {
      userId,
      createdAt: new Date(),
      lastActive: new Date(),
      preferences: {
        taste: this.getDefaultTasteProfile(),
        dietary: this.getDefaultDietaryRestrictions(),
        cultural: culture,
        accessibility: this.getDefaultAccessibility(),
        language: culture.language || 'en',
        region,
        currency: culture.currency || 'USD',
        privacy: this.getDefaultPrivacySettings()
      },
      behavior: this.getDefaultUserBehavior(),
      settings: this.getDefaultUserSettings(),
      consent: this.getDefaultConsentRecord()
    };
  }

  /**
   * Update taste profile preferences
   */
  async updateTastePreferences(userId: string, tastePreferences: Partial<TasteProfile>): Promise<UserProfile> {
    const profile = await this.getUserProfile(userId);
    profile.preferences.taste = { ...profile.preferences.taste, ...tastePreferences };
    profile.lastActive = new Date();
    
    // Learn from preferences
    await this.learnTastePatterns(userId, tastePreferences);
    
    return profile;
  }

  /**
   * Update dietary restrictions and preferences
   */
  async updateDietaryRestrictions(userId: string, dietary: Partial<DietaryRestrictions>): Promise<UserProfile> {
    const profile = await this.getUserProfile(userId);
    profile.preferences.dietary = { ...profile.preferences.dietary, ...dietary };
    profile.lastActive = new Date();
    
    // Validate restrictions against regional compliance
    await this.validateDietaryCompliance(userId, profile.preferences.dietary);
    
    return profile;
  }

  /**
   * Update cultural preferences
   */
  async updateCulturalPreferences(userId: string, cultural: Partial<CulturalPreferences>): Promise<UserProfile> {
    const profile = await this.getUserProfile(userId);
    profile.preferences.cultural = { ...profile.preferences.cultural, ...cultural };
    profile.lastActive = new Date();
    
    // Update related settings
    if (cultural.primaryRegion) {
      const culture = await this.culturalAdaptation.getCulturalPreferences(cultural.primaryRegion);
      profile.preferences.language = culture.language || profile.preferences.language;
      profile.preferences.currency = culture.currency || profile.preferences.currency;
    }
    
    return profile;
  }

  /**
   * Update accessibility preferences
   */
  async updateAccessibilityPreferences(userId: string, accessibility: Partial<AccessibilityPreferences>): Promise<UserProfile> {
    const profile = await this.getUserProfile(userId);
    profile.preferences.accessibility = { ...profile.preferences.accessibility, ...accessibility };
    profile.lastActive = new Date();
    
    // Apply accessibility settings to interface
    await this.applyAccessibilitySettings(userId, profile.preferences.accessibility);
    
    return profile;
  }

  /**
   * Track user behavior for personalization
   */
  async trackUserBehavior(userId: string, behavior: {
    action: string;
    category?: string;
    recipe?: string;
    duration?: number;
    device?: string;
    timestamp?: Date;
  }): Promise<void> {
    const profile = await this.getUserProfile(userId);
    
    profile.behavior.totalSessions++;
    profile.behavior.lastVisit = behavior.timestamp || new Date();
    profile.behavior.lastActive = new Date();
    
    // Update feature usage
    if (behavior.action) {
      profile.behavior.featureUsage[behavior.action] = 
        (profile.behavior.featureUsage[behavior.action] || 0) + 1;
    }
    
    // Update recipe preferences
    if (behavior.recipe) {
      profile.behavior.recipePreferences[behavior.recipe] = 
        (profile.behavior.recipePreferences[behavior.recipe] || 0) + 1;
    }
    
    // Update category preferences
    if (behavior.category) {
      profile.behavior.categoryPreferences[behavior.category] = 
        (profile.behavior.categoryPreferences[behavior.category] || 0) + 1;
    }
    
    // Update time of day usage
    const hour = (behavior.timestamp || new Date()).getHours();
    const timeSlot = this.getTimeSlot(hour);
    profile.behavior.timeOfDayUsage[timeSlot] = 
      (profile.behavior.timeOfDayUsage[timeSlot] || 0) + 1;
    
    // Update device preferences
    if (behavior.device) {
      profile.behavior.devicePreferences[behavior.device] = 
        (profile.behavior.devicePreferences[behavior.device] || 0) + 1;
    }
  }

  /**
   * Analyze user preferences and generate insights
   */
  async generateUserInsights(userId: string): Promise<{
    tasteProfile: TasteProfile;
    dietaryProfile: DietaryRestrictions;
    usagePatterns: Record<string, any>;
    recommendations: string[];
    riskFactors: string[];
    preferences: Record<string, any>;
  }> {
    const profile = await this.getUserProfile(userId);
    
    // Analyze usage patterns
    const usagePatterns = this.analyzeUsagePatterns(profile.behavior);
    
    // Generate personalized recommendations
    const recommendations = await this.generatePersonalizedRecommendations(profile);
    
    // Identify risk factors
    const riskFactors = await this.identifyRiskFactors(profile);
    
    return {
      tasteProfile: profile.preferences.taste,
      dietaryProfile: profile.preferences.dietary,
      usagePatterns,
      recommendations,
      riskFactors,
      preferences: {
        cultural: profile.preferences.cultural,
        accessibility: profile.preferences.accessibility,
        language: profile.preferences.language,
        region: profile.preferences.region
      }
    };
  }

  /**
   * Export user profile data (GDPR compliance)
   */
  async exportUserData(userId: string): Promise<{
    profile: UserProfile;
    behavioralData: UserBehavior[];
    consentHistory: ConsentRecord[];
    generatedAt: Date;
    format: 'json' | 'csv';
  }> {
    const profile = await this.getUserProfile(userId);
    
    return {
      profile,
      behavioralData: [profile.behavior], // Would include historical data in real implementation
      consentHistory: [profile.consent], // Would include consent history in real implementation
      generatedAt: new Date(),
      format: 'json'
    };
  }

  /**
   * Delete user profile and all associated data
   */
  async deleteUserProfile(userId: string, reason?: string): Promise<{ deleted: boolean; timestamp: Date }> {
    const profile = await this.getUserProfile(userId);
    
    // Log deletion for compliance
    console.log(`User profile deleted: ${userId}`, {
      reason,
      timestamp: new Date(),
      profile: { created: profile.createdAt, lastActive: profile.lastActive }
    });
    
    // Remove from memory (in production, would also remove from database)
    this.profiles.delete(userId);
    
    // Schedule for complete deletion (GDPR right to be forgotten)
    setTimeout(() => {
      this.profiles.delete(userId); // Double-check deletion
    }, 1000 * 60 * 60 * 24 * 7); // 7 days grace period
    
    return {
      deleted: true,
      timestamp: new Date()
    };
  }

  /**
   * Privacy-compliant data anonymization
   */
  async anonymizeUserData(userId: string): Promise<{ anonymized: boolean; timestamp: Date }> {
    const profile = await this.getUserProfile(userId);
    
    // Remove personally identifiable information
    const anonymizedProfile: UserProfile = {
      ...profile,
      userId: `anonymous-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      preferences: {
        ...profile.preferences,
        cultural: {
          ...profile.preferences.cultural,
          // Keep only general preferences, remove specific cultural identifiers
          culturalFlavors: [],
          traditionalPreferences: [],
          regionalIngredients: []
        }
      }
    };
    
    // Store anonymized data for analytics
    this.profiles.set(anonymizedProfile.userId, anonymizedProfile);
    
    // Remove original profile
    this.profiles.delete(userId);
    
    return {
      anonymized: true,
      timestamp: new Date()
    };
  }

  // Private helper methods

  private getDefaultTasteProfile(): TasteProfile {
    return {
      sweetness: 'medium',
      sourness: 'medium',
      bitterness: 'low',
      umami: 'medium',
      carbonation: 'high',
      body: 'medium',
      color: 'medium',
      temperature: 'chilled',
      serving: 'medium',
      occasions: [],
      flavorNotes: []
    };
  }

  private getDefaultDietaryRestrictions(): DietaryRestrictions {
    return {
      sugarFree: false,
      caffeineFree: false,
      artificialSweeteners: 'allowed',
      artificialColors: 'allowed',
      artificialFlavors: 'allowed',
      allergens: [],
      vegetarian: false,
      vegan: false,
      glutenFree: false,
      ketoFriendly: false,
      diabeticSafe: false,
      customRestrictions: []
    };
  }

  private getDefaultAccessibility(): AccessibilityPreferences {
    return {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      screenReader: false,
      keyboardNavigation: true,
      voiceCommands: false,
      colorBlindSupport: 'none',
      cognitiveAssistance: false,
      simplifiedInterface: false
    };
  }

  private getDefaultPrivacySettings(): PrivacySettings {
    return {
      dataCollection: 'standard',
      personalization: true,
      analytics: true,
      marketing: false,
      sharing: false,
      retention: 'yearly',
      anonymization: true,
      exportData: true,
      deleteData: true
    };
  }

  private getDefaultUserBehavior(): UserBehavior {
    return {
      totalSessions: 0,
      averageSessionDuration: 0,
      lastVisit: new Date(),
      visitFrequency: 0,
      featureUsage: {},
      recipePreferences: {},
      categoryPreferences: {},
      timeOfDayUsage: {},
      devicePreferences: {},
      completionRates: {},
      abandonmentPoints: {}
    };
  }

  private getDefaultUserSettings(): UserSettings {
    return {
      notifications: {
        enabled: true,
        email: true,
        push: false,
        sms: false,
        frequency: 'weekly',
        timing: 'anytime',
        recipeReminders: true,
        safetyAlerts: true,
        seasonalRecommendations: true,
        communityUpdates: false
      },
      calculator: {
        defaultUnits: 'metric',
        defaultBatchSize: 500,
        defaultStrength: 'medium',
        showCostAnalysis: true,
        showNutrition: false,
        showSafetyWarnings: true,
        autoCalculate: true,
        showAlternatives: true,
        preferredMode: 'diy'
      },
      display: {
        theme: 'auto',
        density: 'comfortable',
        animations: true,
        advancedFeatures: false,
        showTips: true,
        showAdvancedOptions: false,
        layout: 'grid'
      },
      privacy: this.getDefaultPrivacySettings(),
      sync: {
        crossDevice: true,
        cloudBackup: true,
        autoSync: true,
        syncFrequency: 'realtime',
        offlineMode: true,
        conflictResolution: 'manual'
      }
    };
  }

  private getDefaultConsentRecord(): ConsentRecord {
    return {
      consentVersion: '1.0',
      timestamp: new Date(),
      categories: {
        analytics: {
          granted: true,
          timestamp: new Date(),
          method: 'implied',
          scope: ['page-views', 'user-behavior']
        },
        personalization: {
          granted: true,
          timestamp: new Date(),
          method: 'explicit',
          scope: ['recommendations', 'interface-adaptation']
        }
      },
      withdrawal: {
        available: true,
        method: 'profile-settings'
      }
    };
  }

  private async learnTastePatterns(userId: string, preferences: Partial<TasteProfile>): Promise<void> {
    // Machine learning would be implemented here
    // For now, just log the preference changes
    console.log(`User ${userId} updated taste preferences:`, preferences);
  }

  private async validateDietaryCompliance(userId: string, dietary: DietaryRestrictions): Promise<void> {
    // Validate dietary restrictions against regional regulations
    const profile = await this.getUserProfile(userId);
    await this.regionalCompliance.validateDietaryRestrictions(
      profile.preferences.region,
      dietary
    );
  }

  private async applyAccessibilitySettings(userId: string, accessibility: AccessibilityPreferences): Promise<void> {
    // Apply accessibility settings to the interface
    const profile = await this.getUserProfile(userId);
    
    // Store accessibility preferences for immediate application
    if (typeof window !== 'undefined') {
      localStorage.setItem(`accessibility-${userId}`, JSON.stringify(accessibility));
      
      // Apply CSS classes for visual accessibility
      document.documentElement.classList.toggle('high-contrast', accessibility.highContrast);
      document.documentElement.classList.toggle('large-text', accessibility.largeText);
      document.documentElement.classList.toggle('reduced-motion', accessibility.reducedMotion);
      document.documentElement.classList.toggle('simplified-interface', accessibility.simplifiedInterface);
    }
  }

  private getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  private analyzeUsagePatterns(behavior: UserBehavior): Record<string, any> {
    const patterns = {
      mostUsedFeatures: Object.entries(behavior.featureUsage)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([feature]) => feature),
      favoriteCategories: Object.entries(behavior.categoryPreferences)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category),
      preferredTimeSlots: Object.entries(behavior.timeOfDayUsage)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2)
        .map(([time]) => time),
      devicePreference: Object.entries(behavior.devicePreferences)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'desktop',
      engagementLevel: behavior.totalSessions > 100 ? 'high' : 
                     behavior.totalSessions > 20 ? 'medium' : 'low'
    };
    
    return patterns;
  }

  private async generatePersonalizedRecommendations(profile: UserProfile): Promise<string[]> {
    const recommendations = [];
    
    // Based on taste profile
    if (profile.preferences.taste.sweetness === 'high') {
      recommendations.push('Try high-sugar energy drinks for maximum sweetness');
    }
    
    // Based on dietary restrictions
    if (profile.preferences.dietary.sugarFree) {
      recommendations.push('Explore sugar-free recipe alternatives');
    }
    
    // Based on usage patterns
    const topCategories = Object.entries(profile.behavior.categoryPreferences)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([category]) => category);
    
    if (topCategories.length > 0) {
      recommendations.push(`Discover new recipes in ${topCategories[0]} category`);
    }
    
    return recommendations;
  }

  private async identifyRiskFactors(profile: UserProfile): Promise<string[]> {
    const risks = [];
    
    // High caffeine usage
    const energyUsage = profile.behavior.categoryPreferences['energy'] || 0;
    if (energyUsage > 10) {
      risks.push('High energy drink consumption - monitor caffeine intake');
    }
    
    // Dietary conflicts
    if (profile.preferences.dietary.diabeticSafe && 
        profile.behavior.recipePreferences['high-sugar'] > 5) {
      risks.push('Potential conflict between diabetic-safe preference and high-sugar recipe usage');
    }
    
    return risks;
  }
}