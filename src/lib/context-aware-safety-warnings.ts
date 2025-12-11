/**
 * Context-Aware Safety Warning System
 * 
 * Advanced safety warning system that provides dynamic, personalized warnings
 * based on user profiles, cultural contexts, consumption patterns, and 
 * regional safety regulations.
 * 
 * Features:
 * - Dynamic warning generation based on user profile
 * - Cultural and regional safety adaptations
 * - Historical consumption pattern analysis
 * - Personalized safety recommendations
 * - Emergency contact integration for severe reactions
 * 
 * @author Energy Drink App Team
 * @since 3.0.0
 */

import { intelligentRecipeValidationEngine } from './intelligent-recipe-validation-engine';
import { performanceMonitor } from './performance-monitor';
import { logger } from './logger';

export interface ContextAwareWarning {
  id: string;
  type: 'immediate' | 'preventive' | 'educational' | 'emergency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'caffeine' | 'allergen' | 'medical' | 'regulatory' | 'cultural' | 'consumption-pattern' | 'interaction';
  
  // Core warning content
  title: string;
  titleNl?: string;
  message: string;
  messageNl?: string;
  description?: string;
  descriptionNl?: string;
  
  // Context information
  context: {
    userProfile: UserProfile;
    recipeContext: RecipeContext;
    regionalContext: RegionalContext;
    temporalContext: TemporalContext;
    culturalContext: CulturalContext;
  };
  
  // Personalization
  personalizedFor: {
    age: boolean;
    medicalHistory: boolean;
    consumptionHistory: boolean;
    culturalBackground: boolean;
    regionalLocation: boolean;
  };
  
  // Actions and recommendations
  actions: WarningAction[];
  recommendations: string[];
  recommendationsNl?: string[];
  
  // Escalation
  escalationTriggers: EscalationTrigger[];
  emergencyContacts?: EmergencyContact[];
  
  // Timing
  createdAt: string;
  expiresAt?: string;
  dismissible: boolean;
  requiresAcknowledgment: boolean;
  
  // Analytics
  displayed: boolean;
  acknowledged: boolean;
  actionTaken?: string;
}

export interface WarningAction {
  id: string;
  type: 'informational' | 'preventive' | 'emergency' | 'educational';
  label: string;
  labelNl?: string;
  action: 'dismiss' | 'acknowledge' | 'emergency-contact' | 'view-details' | 'adjust-recipe' | 'emergency-protocol';
  url?: string;
  requiresConfirmation: boolean;
  icon?: string;
}

export interface EscalationTrigger {
  condition: string;
  threshold: number;
  action: 'auto-escalate' | 'notify-medical' | 'notify-emergency' | 'require-confirmation';
  contactType?: 'medical' | 'emergency' | 'family' | 'support';
}

export interface EmergencyContact {
  id: string;
  type: 'medical' | 'emergency' | 'poison-control' | 'family' | 'support';
  name: string;
  phone: string;
  region: string;
  available24x7: boolean;
  languages: string[];
  specialization?: string;
}

export interface UserProfile {
  id: string;
  age: number;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  region: string;
  language: string;
  medicalHistory: MedicalCondition[];
  allergies: string[];
  medications: Medication[];
  consumptionHistory: ConsumptionPattern[];
  tolerance: CaffeineTolerance;
  sensitivity: SensitivityProfile;
  preferences: UserPreferences;
  emergencyContacts: EmergencyContact[];
  riskFactors: RiskFactor[];
}

export interface MedicalCondition {
  condition: string;
  severity: 'mild' | 'moderate' | 'severe';
  diagnosed: boolean;
  medications?: string[];
  dietaryRestrictions?: string[];
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  interactions: string[];
  contraindications: string[];
}

export interface ConsumptionPattern {
  date: string;
  beverageType: string;
  caffeineContent: number;
  timeOfDay: string;
  context: 'morning' | 'afternoon' | 'evening' | 'night';
  effects: string[];
  symptoms?: string[];
}

export interface CaffeineTolerance {
  level: 'low' | 'medium' | 'high';
  dailyLimit: number;
  halfLife: number; // hours
  withdrawalSymptoms: string[];
}

export interface SensitivityProfile {
  caffeine: 'very-sensitive' | 'sensitive' | 'normal' | 'tolerant' | 'very-tolerant';
  sugar: 'very-sensitive' | 'sensitive' | 'normal' | 'tolerant';
  artificialSweeteners: 'very-sensitive' | 'sensitive' | 'normal' | 'tolerant';
  allergens: Record<string, 'none' | 'mild' | 'moderate' | 'severe'>;
}

export interface UserPreferences {
  language: string;
  culturalConsiderations: string[];
  dietaryRestrictions: string[];
  emergencyProtocols: string[];
  notificationSettings: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  emergencyOnly: boolean;
  frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
}

export interface RiskFactor {
  type: 'genetic' | 'lifestyle' | 'medical' | 'environmental';
  factor: string;
  impact: 'low' | 'medium' | 'high';
  modifiable: boolean;
  mitigationStrategies: string[];
}

export interface RecipeContext {
  id: string;
  name: string;
  category: 'classic' | 'energy' | 'hybrid';
  caffeineContent: number;
  sugarContent: number;
  ingredients: string[];
  batchSize: number;
  servings: number;
  preparationTime: number;
  difficulty: 'easy' | 'medium' | 'advanced';
  nutritionalProfile: any;
}

export interface RegionalContext {
  region: string;
  regulations: RegionalRegulation[];
  culturalNorm: CulturalNorm[];
  emergencyServices: EmergencyContact[];
  dietaryGuidelines: DietaryGuideline[];
}

export interface RegionalRegulation {
  type: 'caffeine-limit' | 'age-restriction' | 'labeling' | 'safety' | 'allergen';
  requirement: string;
  limit?: number;
  penalty?: string;
  enforcement: 'strict' | 'moderate' | 'lax';
}

export interface CulturalNorm {
  type: 'consumption-timing' | 'dietary-restrictions' | 'health-beliefs' | 'age-appropriateness';
  description: string;
  applicableTo: string[];
  flexibility: 'strict' | 'moderate' | 'flexible';
}

export interface DietaryGuideline {
  type: 'daily-limits' | 'contraindications' | 'recommendations' | 'restrictions';
  description: string;
  limits: Record<string, number>;
  source: string;
}

export interface TemporalContext {
  timeOfDay: string;
  dayOfWeek: string;
  season: string;
  timezone: string;
  localTime: string;
  consumptionWindow: {
    appropriate: boolean;
    reason: string;
    alternatives: string[];
  };
}

export interface CulturalContext {
  primaryCulture: string;
  secondaryCultures: string[];
  religiousConsiderations: string[];
  dietaryTraditions: string[];
  healthBeliefs: string[];
 禁忌: string[]; // Taboos in Chinese
  习俗: string[]; // Customs in Chinese
  信仰: string[]; // Beliefs in Chinese
}

export class ContextAwareSafetyWarningSystem {
  private warningDatabase: Map<string, WarningTemplate> = new Map();
  private emergencyContacts: Map<string, EmergencyContact[]> = new Map();
  private culturalAdaptations: Map<string, CulturalWarningAdapter> = new Map();
  private consumptionAnalyzer: ConsumptionPatternAnalyzer;
  private personalizationEngine: PersonalizationEngine;

  constructor() {
    this.consumptionAnalyzer = new ConsumptionPatternAnalyzer();
    this.personalizationEngine = new PersonalizationEngine();
    this.initializeWarningDatabase();
    this.initializeEmergencyContacts();
    this.initializeCulturalAdaptations();
  }

  /**
   * Generates context-aware safety warnings for a recipe and user
   */
  async generateWarnings(recipe: any, userProfile: UserProfile): Promise<ContextAwareWarning[]> {
    const startTime = performance.now();
    
    try {
      // Get validation results from the intelligent engine
      const validationResult = await intelligentRecipeValidationEngine.validateRecipe({
        ...recipe,
        userAge: userProfile.age,
        userRegion: userProfile.region,
        allergies: userProfile.allergies,
        healthConditions: userProfile.medicalHistory.map(c => c.condition)
      });

      const warnings: ContextAwareWarning[] = [];

      // Generate immediate safety warnings
      const immediateWarnings = await this.generateImmediateWarnings(recipe, userProfile, validationResult);
      warnings.push(...immediateWarnings);

      // Generate preventive warnings based on patterns
      const preventiveWarnings = await this.generatePreventiveWarnings(recipe, userProfile);
      warnings.push(...preventiveWarnings);

      // Generate educational warnings
      const educationalWarnings = await this.generateEducationalWarnings(recipe, userProfile, validationResult);
      warnings.push(...educationalWarnings);

      // Generate emergency warnings for high-risk scenarios
      const emergencyWarnings = await this.generateEmergencyWarnings(recipe, userProfile, validationResult);
      warnings.push(...emergencyWarnings);

      // Personalize and prioritize warnings
      const personalizedWarnings = await this.personalizeWarnings(warnings, userProfile);

      // Sort by severity and relevance
      const sortedWarnings = this.prioritizeWarnings(personalizedWarnings);

      performanceMonitor.recordMetric('context.warnings.generation', performance.now() - startTime, {
        recipeId: recipe.id,
        userId: userProfile.id,
        warningCount: sortedWarnings.length.toString()
      });

      return sortedWarnings;

    } catch (error) {
      logger.error('Context-aware warning generation failed', error);
      performanceMonitor.recordMetric('context.warnings.error', performance.now() - startTime);
      
      // Return basic safety warning as fallback
      return [this.createBasicSafetyWarning(recipe, userProfile)];
    }
  }

  /**
   * Analyzes consumption patterns and generates warnings
   */
  async analyzeConsumptionPatterns(userProfile: UserProfile): Promise<ContextAwareWarning[]> {
    const warnings: ContextAwareWarning[] = [];

    try {
      const patterns = userProfile.consumptionHistory;
      
      // Analyze caffeine consumption patterns
      const caffeinePatterns = this.consumptionAnalyzer.analyzeCaffeinePatterns(patterns);
      if (caffeinePatterns.concerning) {
        warnings.push({
          id: `caffeine-pattern-${Date.now()}`,
          type: 'preventive',
          severity: caffeinePatterns.severity,
          category: 'consumption-pattern',
          title: 'Caffeine Consumption Pattern Alert',
          message: `Your caffeine consumption patterns show ${caffeinePatterns.concerning} trends`,
          context: {
            userProfile,
            recipeContext: {} as RecipeContext,
            regionalContext: {} as RegionalContext,
            temporalContext: {} as TemporalContext,
            culturalContext: {} as CulturalContext
          },
          personalizedFor: {
            age: true,
            medicalHistory: true,
            consumptionHistory: true,
            culturalBackground: true,
            regionalLocation: true
          },
          actions: [
            {
              id: 'view-patterns',
              type: 'informational',
              label: 'View Consumption Patterns',
              action: 'view-details'
            }
          ],
          recommendations: caffeinePatterns.recommendations,
          escalationTriggers: caffeinePatterns.escalationTriggers,
          createdAt: new Date().toISOString(),
          dismissible: true,
          requiresAcknowledgment: caffeinePatterns.severity === 'high'
        });
      }

      // Analyze timing patterns
      const timingPatterns = this.consumptionAnalyzer.analyzeTimingPatterns(patterns);
      if (timingPatterns.inappropriate) {
        warnings.push({
          id: `timing-pattern-${Date.now()}`,
          type: 'preventive',
          severity: 'medium',
          category: 'consumption-pattern',
          title: 'Consumption Timing Pattern Alert',
          message: `Your consumption timing shows patterns that may affect sleep quality`,
          context: {
            userProfile,
            recipeContext: {} as RecipeContext,
            regionalContext: {} as RegionalContext,
            temporalContext: {} as TemporalContext,
            culturalContext: {} as CulturalContext
          },
          personalizedFor: {
            age: true,
            medicalHistory: false,
            consumptionHistory: true,
            culturalBackground: true,
            regionalLocation: true
          },
          actions: [
            {
              id: 'adjust-timing',
              type: 'preventive',
              label: 'Adjust Consumption Timing',
              action: 'adjust-recipe'
            }
          ],
          recommendations: timingPatterns.recommendations,
          createdAt: new Date().toISOString(),
          dismissible: true,
          requiresAcknowledgment: false
        });
      }

    } catch (error) {
      logger.error('Consumption pattern analysis failed', error);
    }

    return warnings;
  }

  /**
   * Generates emergency warnings for high-risk situations
   */
  async generateEmergencyWarnings(recipe: any, userProfile: UserProfile, validationResult: any): Promise<ContextAwareWarning[]> {
    const warnings: ContextAwareWarning[] = [];

    // Check for severe medical conditions
    const severeConditions = userProfile.medicalHistory.filter(c => 
      c.severity === 'severe' && this.isRelevantMedicalCondition(c.condition, recipe)
    );

    if (severeConditions.length > 0) {
      const emergencyContacts = this.getEmergencyContacts(userProfile.region, 'medical');
      
      warnings.push({
        id: `medical-emergency-${Date.now()}`,
        type: 'emergency',
        severity: 'critical',
        category: 'medical',
        title: 'Medical Emergency Risk Detected',
        message: `This beverage may interact with your severe medical condition(s): ${severeConditions.map(c => c.condition).join(', ')}`,
        context: {
          userProfile,
          recipeContext: this.createRecipeContext(recipe),
          regionalContext: this.getRegionalContext(userProfile.region),
          temporalContext: this.getTemporalContext(),
          culturalContext: this.getCulturalContext(userProfile)
        },
        personalizedFor: {
          age: true,
          medicalHistory: true,
          consumptionHistory: false,
          culturalBackground: false,
          regionalLocation: true
        },
        actions: [
          {
            id: 'emergency-contact',
            type: 'emergency',
            label: 'Contact Emergency Services',
            action: 'emergency-contact',
            requiresConfirmation: true,
            icon: 'phone'
          },
          {
            id: 'dismiss type: 'inform-emergency',
           ational',
            label: 'I Understand the Risk',
            action: 'acknowledge',
            requiresConfirmation: true
          }
        ],
        recommendations: [
          'Consult your healthcare provider before consuming',
          'Have emergency contacts readily available',
          'Monitor for adverse reactions closely'
        ],
        emergencyContacts,
        escalationTriggers: [
          {
            condition: 'no-acknowledgment',
            threshold: 300, // 5 minutes
            action: 'notify-medical',
            contactType: 'medical'
          }
        ],
        createdAt: new Date().toISOString(),
        dismissible: false,
        requiresAcknowledgment: true
      });
    }

    // Check for extreme caffeine content
    const totalCaffeine = recipe.ingredients?.reduce((sum: number, ing: any) => {
      return sum + (ing.caffeine || 0);
    }, 0) || 0;

    if (totalCaffeine > userProfile.caffeineTolerance.dailyLimit * 1.5) {
      const emergencyContacts = this.getEmergencyContacts(userProfile.region, 'poison-control');
      
      warnings.push({
        id: `caffeine-overdose-${Date.now()}`,
        type: 'emergency',
        severity: 'critical',
        category: 'caffeine',
        title: 'Potential Caffeine Overdose Risk',
        message: `This beverage contains ${totalCaffeine}mg caffeine, which exceeds 150% of your daily limit`,
        context: {
          userProfile,
          recipeContext: this.createRecipeContext(recipe),
          regionalContext: this.getRegionalContext(userProfile.region),
          temporalContext: this.getTemporalContext(),
          culturalContext: this.getCulturalContext(userProfile)
        },
        personalizedFor: {
          age: true,
          medicalHistory: true,
          consumptionHistory: true,
          culturalBackground: false,
          regionalLocation: true
        },
        actions: [
          {
            id: 'emergency-protocol',
            type: 'emergency',
            label: 'Emergency Protocol',
            action: 'emergency-protocol',
            requiresConfirmation: true
          },
          {
            id: 'reduce-caffeine',
            type: 'preventive',
            label: 'Reduce Caffeine Content',
            action: 'adjust-recipe'
          }
        ],
        recommendations: [
          'Reduce portion size',
          'Consider caffeine-free alternatives',
          'Monitor for symptoms: rapid heartbeat, anxiety, nausea',
          'Seek medical attention if symptoms occur'
        ],
        emergencyContacts,
        escalationTriggers: [
          {
            condition: 'caffeine-over-limit',
            threshold: userProfile.caffeineTolerance.dailyLimit * 2,
            action: 'notify-emergency',
            contactType: 'emergency'
          }
        ],
        createdAt: new Date().toISOString(),
        dismissible: false,
        requiresAcknowledgment: true
      });
    }

    return warnings;
  }

  /**
   * Cultural and regional adaptation of warnings
   */
  async adaptWarningsForCulture(warnings: ContextAwareWarning[], userProfile: UserProfile): Promise<ContextAwareWarning[]> {
    const adaptedWarnings: ContextAwareWarning[] = [];

    for (const warning of warnings) {
      const adapter = this.culturalAdaptations.get(userProfile.primaryCulture);
      if (adapter) {
        const adaptedWarning = await adapter.adaptWarning(warning, userProfile);
        adaptedWarnings.push(adaptedWarning);
      } else {
        adaptedWarnings.push(warning); // Fallback to original
      }
    }

    return adaptedWarnings;
  }

  // Private helper methods

  private async generateImmediateWarnings(recipe: any, userProfile: UserProfile, validationResult: any): Promise<ContextAwareWarning[]> {
    const warnings: ContextAwareWarning[] = [];

    // Check for immediate safety concerns from validation
    const criticalErrors = validationResult.errors?.filter((e: any) => e.severity === 'critical') || [];
    
    for (const error of criticalErrors) {
      warnings.push({
        id: `immediate-${error.code}-${Date.now()}`,
        type: 'immediate',
        severity: 'high',
        category: 'regulatory',
        title: 'Immediate Safety Concern',
        message: error.message,
        context: {
          userProfile,
          recipeContext: this.createRecipeContext(recipe),
          regionalContext: this.getRegionalContext(userProfile.region),
          temporalContext: this.getTemporalContext(),
          culturalContext: this.getCulturalContext(userProfile)
        },
        personalizedFor: {
          age: false,
          medicalHistory: false,
          consumptionHistory: false,
          culturalBackground: false,
          regionalLocation: true
        },
        actions: [
          {
            id: 'acknowledge-immediate',
            type: 'informational',
            label: 'I Understand',
            action: 'acknowledge',
            requiresConfirmation: true
          }
        ],
        recommendations: ['Do not consume this recipe as-is', 'Modify ingredients to meet safety standards'],
        createdAt: new Date().toISOString(),
        dismissible: false,
        requiresAcknowledgment: true
      });
    }

    return warnings;
  }

  private async generatePreventiveWarnings(recipe: any, userProfile: UserProfile): Promise<ContextAwareWarning[]> {
    const warnings: ContextAwareWarning[] = [];

    // Age-specific warnings
    if (userProfile.age < 18) {
      const energyIngredients = recipe.ingredients?.filter((ing: any) => 
        ['caffeine', 'guarana', 'yerba-mate'].includes(ing.id)
      ) || [];

      if (energyIngredients.length > 0) {
        warnings.push({
          id: `age-restriction-${Date.now()}`,
          type: 'preventive',
          severity: 'medium',
          category: 'regulatory',
          title: 'Age Restriction Notice',
          message: 'Energy drink ingredients are not recommended for minors under 18',
          context: {
            userProfile,
            recipeContext: this.createRecipeContext(recipe),
            regionalContext: this.getRegionalContext(userProfile.region),
            temporalContext: this.getTemporalContext(),
            culturalContext: this.getCulturalContext(userProfile)
          },
          personalizedFor: {
            age: true,
            medicalHistory: false,
            consumptionHistory: false,
            culturalBackground: true,
            regionalLocation: true
          },
          actions: [
            {
              id: 'parental-consent',
              type: 'informational',
              label: 'Request Parental Consent',
              action: 'view-details'
            }
          ],
          recommendations: [
            'Consider age-appropriate alternatives',
            'Consult with parents or guardians',
            'Start with smaller portions'
          ],
          createdAt: new Date().toISOString(),
          dismissible: true,
          requiresAcknowledgment: false
        });
      }
    }

    // Medication interaction warnings
    const interactingMedications = userProfile.medications.filter(med =>
      recipe.ingredients?.some((ing: any) => 
        med.interactions.some(interaction => 
          ing.id.toLowerCase().includes(interaction.toLowerCase())
        )
      )
    );

    if (interactingMedications.length > 0) {
      warnings.push({
        id: `medication-interaction-${Date.now()}`,
        type: 'preventive',
        severity: 'high',
        category: 'medical',
        title: 'Medication Interaction Warning',
        message: `This recipe may interact with your medication: ${interactingMedications.map(m => m.name).join(', ')}`,
        context: {
          userProfile,
          recipeContext: this.createRecipeContext(recipe),
          regionalContext: this.getRegionalContext(userProfile.region),
          temporalContext: this.getTemporalContext(),
          culturalContext: this.getCulturalContext(userProfile)
        },
        personalizedFor: {
          age: false,
          medicalHistory: true,
          consumptionHistory: false,
          culturalBackground: false,
          regionalLocation: false
        },
        actions: [
          {
            id: 'consult-pharmacist',
            type: 'informational',
            label: 'Consult Pharmacist',
            action: 'view-details'
          }
        ],
        recommendations: [
          'Consult your pharmacist or doctor before consuming',
          'Monitor for unusual symptoms',
          'Consider timing adjustments for medication'
        ],
        createdAt: new Date().toISOString(),
        dismissible: true,
        requiresAcknowledgment: true
      });
    }

    return warnings;
  }

  private async generateEducationalWarnings(recipe: any, userProfile: UserProfile, validationResult: any): Promise<ContextAwareWarning[]> {
    const warnings: ContextAwareWarning[] = [];

    // First-time user educational warnings
    if (userProfile.consumptionHistory.length < 5) {
      warnings.push({
        id: `first-time-user-${Date.now()}`,
        type: 'educational',
        severity: 'low',
        category: 'consumption-pattern',
        title: 'Welcome! Safety Guidelines for New Users',
        message: 'Here are important safety guidelines for responsible consumption',
        context: {
          userProfile,
          recipeContext: this.createRecipeContext(recipe),
          regionalContext: this.getRegionalContext(userProfile.region),
          temporalContext: this.getTemporalContext(),
          culturalContext: this.getCulturalContext(userProfile)
        },
        personalizedFor: {
          age: true,
          medicalHistory: false,
          consumptionHistory: true,
          culturalBackground: true,
          regionalLocation: true
        },
        actions: [
          {
            id: 'safety-education',
            type: 'educational',
            label: 'View Safety Education',
            action: 'view-details'
          }
        ],
        recommendations: [
          'Start with small amounts to test tolerance',
          'Monitor how your body responds',
          'Keep a consumption log',
          'Stay hydrated'
        ],
        createdAt: new Date().toISOString(),
        dismissible: true,
        requiresAcknowledgment: false
      });
    }

    return warnings;
  }

  private async personalizeWarnings(warnings: ContextAwareWarning[], userProfile: UserProfile): Promise<ContextAwareWarning[]> {
    return this.personalizationEngine.personalizeWarnings(warnings, userProfile);
  }

  private prioritizeWarnings(warnings: ContextAwareWarning[]): ContextAwareWarning[] {
    return warnings.sort((a, b) => {
      // Sort by severity first
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      
      if (severityDiff !== 0) return severityDiff;
      
      // Then by type
      const typeOrder = { emergency: 4, immediate: 3, preventive: 2, educational: 1 };
      const typeDiff = typeOrder[b.type] - typeOrder[a.type];
      
      if (typeDiff !== 0) return typeDiff;
      
      // Finally by creation time (newer first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  private createBasicSafetyWarning(recipe: any, userProfile: UserProfile): ContextAwareWarning {
    return {
      id: `basic-safety-${Date.now()}`,
      type: 'immediate',
      severity: 'medium',
      category: 'regulatory',
      title: 'Safety Notice',
      message: 'Please review this recipe for safety before consumption',
      context: {
        userProfile,
        recipeContext: this.createRecipeContext(recipe),
        regionalContext: this.getRegionalContext(userProfile.region),
        temporalContext: this.getTemporalContext(),
        culturalContext: this.getCulturalContext(userProfile)
      },
      personalizedFor: {
        age: true,
        medicalHistory: true,
        consumptionHistory: false,
        culturalBackground: false,
        regionalLocation: true
      },
      actions: [
        {
          id: 'acknowledge-basic',
          type: 'informational',
          label: 'I Understand',
          action: 'acknowledge'
        }
      ],
      recommendations: ['Review all ingredients', 'Check for allergens', 'Start with small amounts'],
      createdAt: new Date().toISOString(),
      dismissible: true,
      requiresAcknowledgment: false
    };
  }

  private initializeWarningDatabase(): void {
    // Initialize with comprehensive warning templates
    const templates: WarningTemplate[] = [
      {
        id: 'caffeine-overdose',
        type: 'emergency',
        baseContent: {
          title: 'Caffeine Overdose Risk',
          message: 'This beverage contains dangerously high levels of caffeine'
        }
      },
      {
        id: 'medical-interaction',
        type: 'preventive',
        baseContent: {
          title: 'Medical Interaction Warning',
          message: 'This recipe may interact with your medical conditions'
        }
      },
      {
        id: 'age-restriction',
        type: 'preventive',
        baseContent: {
          title: 'Age Restriction',
          message: 'This beverage is not recommended for your age group'
        }
      }
    ];

    templates.forEach(template => {
      this.warningDatabase.set(template.id, template);
    });
  }

  private initializeEmergencyContacts(): void {
    // Initialize emergency contacts for different regions
    const contacts: Record<string, EmergencyContact[]> = {
      'US': [
        {
          id: 'poison-control-us',
          type: 'poison-control',
          name: 'Poison Control Center',
          phone: '1-800-222-1222',
          region: 'US',
          available24x7: true,
          languages: ['en', 'es']
        },
        {
          id: 'emergency-us',
          type: 'emergency',
          name: 'Emergency Services',
          phone: '911',
          region: 'US',
          available24x7: true,
          languages: ['en']
        }
      ],
      'EU': [
        {
          id: 'poison-control-eu',
          type: 'poison-control',
          name: 'European Poison Control',
          phone: '+33 1 40 05 48 48',
          region: 'EU',
          available24x7: true,
          languages: ['en', 'fr', 'de', 'es', 'it']
        },
        {
          id: 'emergency-eu',
          type: 'emergency',
          name: 'Emergency Services',
          phone: '112',
          region: 'EU',
          available24x7: true,
          languages: ['en', 'fr', 'de', 'es', 'it']
        }
      ],
      'CA': [
        {
          id: 'poison-control-ca',
          type: 'poison-control',
          name: 'Poison Control Canada',
          phone: '1-800-268-9017',
          region: 'CA',
          available24x7: true,
          languages: ['en', 'fr']
        }
      ]
    };

    Object.entries(contacts).forEach(([region, regionContacts]) => {
      this.emergencyContacts.set(region, regionContacts);
    });
  }

  private initializeCulturalAdaptations(): void {
    // Initialize cultural adapters for different regions
    this.culturalAdaptations.set('CN', new ChineseCulturalAdapter());
    this.culturalAdaptations.set('JP', new JapaneseCulturalAdapter());
    this.culturalAdaptations.set('IN', new IndianCulturalAdapter());
    this.culturalAdaptations.set('US', new WesternCulturalAdapter());
    this.culturalAdaptations.set('EU', new EuropeanCulturalAdapter());
  }

  // Helper methods for context creation
  private createRecipeContext(recipe: any): RecipeContext {
    return {
      id: recipe.id || 'unknown',
      name: recipe.name || 'Unknown Recipe',
      category: recipe.category || 'classic',
      caffeineContent: recipe.ingredients?.reduce((sum: number, ing: any) => sum + (ing.caffeine || 0), 0) || 0,
      sugarContent: recipe.sugarContent || 0,
      ingredients: recipe.ingredients?.map((ing: any) => ing.id) || [],
      batchSize: recipe.batchSize || 1,
      servings: recipe.servings || 1,
      preparationTime: recipe.preparationTime || 0,
      difficulty: recipe.difficulty || 'easy',
      nutritionalProfile: recipe.nutritionalProfile || {}
    };
  }

  private getRegionalContext(region: string): RegionalContext {
    // Simplified regional context - would be more comprehensive in production
    return {
      region,
      regulations: [],
      culturalNorm: [],
      emergencyServices: this.getEmergencyContacts(region, 'emergency') || [],
      dietaryGuidelines: []
    };
  }

  private getTemporalContext(): TemporalContext {
    const now = new Date();
    return {
      timeOfDay: this.getTimeOfDay(now),
      dayOfWeek: now.getDay().toString(),
      season: this.getSeason(now),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      localTime: now.toLocaleTimeString(),
      consumptionWindow: {
        appropriate: this.isAppropriateTime(now),
        reason: this.getAppropriateTimeReason(now),
        alternatives: []
      }
    };
  }

  private getCulturalContext(userProfile: UserProfile): CulturalContext {
    return {
      primaryCulture: userProfile.region,
      secondaryCultures: [],
      religiousConsiderations: [],
      dietaryTraditions: [],
      healthBeliefs: [],
      禁忌: [],
      习俗: [],
      信仰: []
    };
  }

  private getEmergencyContacts(region: string, type?: string): EmergencyContact[] {
    const contacts = this.emergencyContacts.get(region) || [];
    return type ? contacts.filter(c => c.type === type) : contacts;
  }

  private getTimeOfDay(date: Date): string {
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  private getSeason(date: Date): string {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  private isAppropriateTime(date: Date): boolean {
    const hour = date.getHours();
    return hour >= 8 && hour <= 20; // 8 AM to 8 PM
  }

  private getAppropriateTimeReason(date: Date): string {
    const hour = date.getHours();
    if (hour < 8) return 'Too early - may affect sleep';
    if (hour > 20) return 'Too late - may affect sleep';
    return 'Appropriate time for consumption';
  }

  private isRelevantMedicalCondition(condition: string, recipe: any): boolean {
    const relevantConditions = ['heart', 'cardiac', 'hypertension', 'anxiety', 'pregnancy', 'diabetes'];
    return relevantConditions.some(relevant => 
      condition.toLowerCase().includes(relevant)
    );
  }
}

// Supporting interfaces and classes

interface WarningTemplate {
  id: string;
  type: 'immediate' | 'preventive' | 'educational' | 'emergency';
  baseContent: {
    title: string;
    message: string;
  };
}

class ConsumptionPatternAnalyzer {
  analyzeCaffeinePatterns(patterns: ConsumptionPattern[]) {
    const dailyCaffeine = patterns.reduce((sum, p) => sum + p.caffeineContent, 0);
    const averageDaily = dailyCaffeine / patterns.length;
    
    if (averageDaily > 400) {
      return {
        concerning: 'excessive caffeine consumption',
        severity: 'high' as const,
        recommendations: [
          'Gradually reduce caffeine intake',
          'Consult healthcare provider',
          'Monitor withdrawal symptoms'
        ],
        escalationTriggers: []
      };
    }
    
    return { concerning: null };
  }

  analyzeTimingPatterns(patterns: ConsumptionPattern[]) {
    const lateConsumption = patterns.filter(p => 
      p.context === 'night' || p.timeOfDay > '20:00'
    );
    
    if (lateConsumption.length > patterns.length * 0.3) {
      return {
        inappropriate: true,
        recommendations: [
          'Avoid caffeine after 6 PM',
          'Switch to caffeine-free alternatives in evening',
          'Establish better sleep hygiene'
        ]
      };
    }
    
    return { inappropriate: false };
  }
}

class PersonalizationEngine {
  async personalizeWarnings(warnings: ContextAwareWarning[], userProfile: UserProfile): Promise<ContextAwareWarning[]> {
    // Personalize warnings based on user profile
    return warnings.map(warning => {
      // Add user-specific information
      if (userProfile.age < 18) {
        warning.message = `For minors: ${warning.message}`;
      }
      
      // Add cultural context
      if (userProfile.region === 'CN' || userProfile.region === 'JP') {
        warning.messageNl = this.translateForAsianMarkets(warning.message);
      }
      
      return warning;
    });
  }

  private translateForAsianMarkets(message: string): string {
    // Simplified translation - would use proper translation service
    const translations: Record<string, string> = {
      'caffeine': '咖啡因',
      'medical': '医疗',
      'emergency': '紧急情况'
    };
    
    let translated = message;
    Object.entries(translations).forEach(([en, zh]) => {
      translated = translated.replace(new RegExp(en, 'gi'), zh);
    });
    
    return translated;
  }
}

// Cultural adapters
class ChineseCulturalAdapter {
  async adaptWarning(warning: ContextAwareWarning, userProfile: UserProfile): Promise<ContextAwareWarning> {
    // Adapt for Chinese cultural context
    warning.messageNl = this.translateToChinese(warning.message);
    warning.titleNl = this.translateToChinese(warning.title);
    
    // Add culturally appropriate recommendations
    warning.recommendations.unshift('请咨询中医师意见');
    
    return warning;
  }

  private translateToChinese(text: string): string {
    // Simplified translation
    const translations: Record<string, string> = {
      'caffeine': '咖啡因',
      'medical': '医疗',
      'emergency': '紧急情况',
      'warning': '警告',
      'consult': '咨询'
    };
    
    let translated = text;
    Object.entries(translations).forEach(([en, zh]) => {
      translated = translated.replace(new RegExp(en, 'gi'), zh);
    });
    
    return translated;
  }
}

class JapaneseCulturalAdapter {
  async adaptWarning(warning: ContextAwareWarning, userProfile: UserProfile): Promise<ContextAwareWarning> {
    // Adapt for Japanese cultural context
    warning.messageNl = this.translateToJapanese(warning.message);
    return warning;
  }

  private translateToJapanese(text: string): string {
    // Simplified Japanese translation
    const translations: Record<string, string> = {
      'caffeine': 'カフェイン',
      'medical': '医療',
      'emergency': '緊急'
    };
    
    let translated = text;
    Object.entries(translations).forEach(([en, ja]) => {
      translated = translated.replace(new RegExp(en, 'gi'), ja);
    });
    
    return translated;
  }
}

class IndianCulturalAdapter {
  async adaptWarning(warning: ContextAwareWarning, userProfile: UserProfile): Promise<ContextAwareWarning> {
    // Adapt for Indian cultural context
    warning.recommendations.unshift('कृपया आयुर्वेदिक चिकित्सक से सलाह लें');
    return warning;
  }
}

class WesternCulturalAdapter {
  async adaptWarning(warning: ContextAwareWarning, userProfile: UserProfile): Promise<ContextAwareWarning> {
    // Western cultural adaptation
    warning.recommendations.unshift('Consult your healthcare provider');
    return warning;
  }
}

class EuropeanCulturalAdapter {
  async adaptWarning(warning: ContextAwareWarning, userProfile: UserProfile): Promise<ContextAwareWarning> {
    // European cultural adaptation
    warning.recommendations.unshift('Consultez votre médecin');
    return warning;
  }
}

// Export singleton instance
export const contextAwareSafetyWarningSystem = new ContextAwareSafetyWarningSystem();