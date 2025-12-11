/**
 * Flexible Business Rule Engine
 * 
 * Comprehensive business logic system for handling complex pricing calculations,
 * regional compliance, user access control, feature gating, and dynamic content
 * filtering across all beverage categories and global regions.
 * 
 * Features:
 * - Rule-based pricing and cost calculation
 * - Regional availability and compliance checking
 * - User eligibility and access control
 * - Feature gating based on user segments
 * - Dynamic content filtering and recommendations
 * 
 * @author Energy Drink App Team
 * @since 3.0.0
 */

import { performanceMonitor } from './performance-monitor';
import { logger } from './logger';
import { getLimitsData } from './safety-data-service';

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  type: 'pricing' | 'compliance' | 'access-control' | 'feature-gating' | 'content-filtering' | 'recommendation';
  category: string;
  priority: number;
  enabled: boolean;
  
  // Rule conditions
  conditions: RuleCondition[];
  
  // Rule actions
  actions: RuleAction[];
  
  // Rule metadata
  metadata: {
    region?: string;
    userSegment?: string;
    beverageCategory?: string;
    validFrom?: string;
    validTo?: string;
    version: string;
    createdBy: string;
    tags: string[];
  };
  
  // Performance and monitoring
  executionCount: number;
  successRate: number;
  lastExecuted?: string;
  averageExecutionTime: number;
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'not-equals' | 'greater-than' | 'less-than' | 'contains' | 'in' | 'not-in' | 'between' | 'regex' | 'exists' | 'not-exists';
  value: any;
  logicalOperator?: 'AND' | 'OR';
  groupId?: string;
}

export interface RuleAction {
  type: 'calculate-price' | 'apply-discount' | 'set-availability' | 'grant-access' | 'restrict-access' | 'enable-feature' | 'disable-feature' | 'filter-content' | 'recommend' | 'log' | 'notify';
  parameters: Record<string, any>;
  priority: number;
}

export interface PricingRule extends BusinessRule {
  type: 'pricing';
  pricingModel: 'fixed' | 'percentage' | 'tiered' | 'dynamic' | 'cost-plus' | 'competitive' | 'promotional';
  calculationMethod: string;
  currency?: string;
  taxInclusive: boolean;
}

export interface ComplianceRule extends BusinessRule {
  type: 'compliance';
  regulatoryBody: 'FDA' | 'EFSA' | 'Health-Canada' | 'FSANZ' | 'MHLW' | 'COFEPRIS' | 'ANVISA' | 'SFDA';
  complianceType: 'ingredient' | 'labeling' | 'age-restriction' | 'caffeine-limit' | 'allergen' | 'health-claim';
  mandatory: boolean;
}

export interface AccessControlRule extends BusinessRule {
  type: 'access-control';
  accessLevel: 'public' | 'registered' | 'premium' | 'admin' | 'medical-professional' | 'age-verified';
  resourceType: 'feature' | 'content' | 'api-endpoint' | 'calculation' | 'recipe';
  permissions: string[];
}

export interface FeatureGatingRule extends BusinessRule {
  type: 'feature-gating';
  featureName: string;
  gatingStrategy: 'whitelist' | 'blacklist' | 'percentage' | 'a-b-test' | 'progressive-rollout' | 'region-based' | 'user-segment';
  rolloutPercentage?: number;
  userSegments?: string[];
  regions?: string[];
}

export interface ExecutionContext {
  userId?: string;
  userProfile?: UserProfile;
  region: string;
  language: string;
  sessionId: string;
  timestamp: string;
  requestMetadata: Record<string, any>;
}

export interface ExecutionResult {
  ruleId: string;
  success: boolean;
  executedActions: RuleActionResult[];
  executionTime: number;
  error?: string;
  context: ExecutionContext;
}

export interface RuleActionResult {
  actionType: string;
  success: boolean;
  result: any;
  error?: string;
  metadata: Record<string, any>;
}

export interface UserProfile {
  id: string;
  age: number;
  region: string;
  language: string;
  subscriptionTier: 'free' | 'basic' | 'premium' | 'professional';
  userSegment: 'new' | 'regular' | 'power' | 'business' | 'medical';
  verificationStatus: {
    ageVerified: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    medicalVerified: boolean;
  };
  preferences: {
    dietaryRestrictions: string[];
    allergens: string[];
    caffeinePreference: 'low' | 'medium' | 'high';
    budgetRange: { min: number; max: number };
  };
  usage: {
    totalRecipes: number;
    monthlyUsage: number;
    lastActive: string;
    favoriteCategories: string[];
  };
}

export interface PricingContext {
  baseCost: number;
  ingredients: Array<{
    id: string;
    quantity: number;
    unitCost: number;
    supplier?: string;
  }>;
  batchSize: number;
  servings: number;
  category: 'classic' | 'energy' | 'hybrid';
  region: string;
  currency: string;
  taxRate: number;
}

export interface ComplianceContext {
  recipe: any;
  userProfile: UserProfile;
  region: string;
  regulatoryRequirements: string[];
  ingredientRestrictions: Record<string, any>;
  labelingRequirements: Record<string, any>;
}

export class FlexibleBusinessRuleEngine {
  private rules: Map<string, BusinessRule> = new Map();
  private ruleCategories: Map<string, string[]> = new Map();
  private ruleCache: Map<string, { rules: BusinessRule[]; timestamp: number }> = new Map();
  private performanceMetrics: Map<string, RulePerformanceMetrics> = new Map();
  private ruleDependencies: Map<string, string[]> = new Map();

  constructor() {
    this.initializeDefaultRules();
    this.initializeRuleCategories();
    this.initializeRuleDependencies();
  }

  /**
   * Executes all applicable business rules for a given context
   */
  async executeRules(context: ExecutionContext, ruleTypes?: string[]): Promise<ExecutionResult[]> {
    const startTime = performance.now();
    
    try {
      // Get applicable rules for the context
      const applicableRules = await this.getApplicableRules(context, ruleTypes);
      
      // Sort rules by priority and dependencies
      const sortedRules = this.sortRulesByPriorityAndDependencies(applicableRules);
      
      const executionResults: ExecutionResult[] = [];
      
      // Execute rules in order
      for (const rule of sortedRules) {
        const result = await this.executeRule(rule, context);
        executionResults.push(result);
        
        // Update rule performance metrics
        this.updateRuleMetrics(rule.id, result);
      }

      performanceMonitor.recordMetric('business.rules.execution', performance.now() - startTime, {
        context: context.region,
        ruleCount: executionResults.length.toString(),
        ruleTypes: (ruleTypes || []).join(',')
      });

      return executionResults;

    } catch (error) {
      logger.error('Business rule execution failed', error);
      performanceMonitor.recordMetric('business.rules.execution_error', performance.now() - startTime);
      throw error;
    }
  }

  /**
   * Calculates pricing based on business rules and context
   */
  async calculatePricing(pricingContext: PricingContext, userProfile?: UserProfile): Promise<{
    basePrice: number;
    adjustments: Array<{
      ruleId: string;
      type: string;
      amount: number;
      description: string;
    }>;
    totalPrice: number;
    taxes: number;
    finalPrice: number;
    currency: string;
    metadata: Record<string, any>;
  }> {
    const startTime = performance.now();
    
    try {
      const pricingRules = await this.getPricingRules(pricingContext, userProfile);
      
      let currentPrice = pricingContext.baseCost;
      const adjustments: Array<{
        ruleId: string;
        type: string;
        amount: number;
        description: string;
      }> = [];

      // Execute pricing rules
      for (const rule of pricingRules) {
        if (rule.type !== 'pricing') continue;
        
        const pricingRule = rule as PricingRule;
        const adjustment = await this.applyPricingRule(pricingRule, currentPrice, pricingContext, userProfile);
        
        if (adjustment) {
          adjustments.push(adjustment);
          currentPrice = this.applyPriceAdjustment(currentPrice, adjustment);
        }
      }

      // Calculate taxes
      const taxes = pricingContext.taxInclusive ? 0 : currentPrice * (pricingContext.taxRate / 100);
      const finalPrice = currentPrice + taxes;

      performanceMonitor.recordMetric('business.rules.pricing', performance.now() - startTime, {
        region: pricingContext.region,
        category: pricingContext.category,
        basePrice: pricingContext.baseCost.toString(),
        finalPrice: finalPrice.toString()
      });

      return {
        basePrice: pricingContext.baseCost,
        adjustments,
        totalPrice: currentPrice,
        taxes,
        finalPrice,
        currency: pricingContext.currency,
        metadata: {
          calculationTime: performance.now() - startTime,
          rulesApplied: adjustments.length,
          pricingContext: { ...pricingContext, userProfile: userProfile?.id }
        }
      };

    } catch (error) {
      logger.error('Pricing calculation failed', error);
      performanceMonitor.recordMetric('business.rules.pricing_error', performance.now() - startTime);
      throw error;
    }
  }

  /**
   * Checks compliance for a recipe and user context
   */
  async checkCompliance(complianceContext: ComplianceContext): Promise<{
    compliant: boolean;
    violations: Array<{
      ruleId: string;
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      recommendation?: string;
    }>;
    warnings: Array<{
      ruleId: string;
      type: string;
      message: string;
      suggestion?: string;
    }>;
    metadata: Record<string, any>;
  }> {
    const startTime = performance.now();
    
    try {
      const complianceRules = await this.getComplianceRules(complianceContext);
      
      const violations: Array<{
        ruleId: string;
        type: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        message: string;
        recommendation?: string;
      }> = [];

      const warnings: Array<{
        ruleId: string;
        type: string;
        message: string;
        suggestion?: string;
      }> = [];

      // Execute compliance rules
      for (const rule of complianceRules) {
        if (rule.type !== 'compliance') continue;
        
        const complianceRule = rule as ComplianceRule;
        const result = await this.checkComplianceRule(complianceRule, complianceContext);
        
        if (!result.compliant) {
          if (result.severity === 'critical' || result.severity === 'high') {
            violations.push({
              ruleId: rule.id,
              type: result.type,
              severity: result.severity,
              message: result.message,
              recommendation: result.recommendation
            });
          } else {
            warnings.push({
              ruleId: rule.id,
              type: result.type,
              message: result.message,
              suggestion: result.suggestion
            });
          }
        }
      }

      const compliant = violations.length === 0;

      performanceMonitor.recordMetric('business.rules.compliance', performance.now() - startTime, {
        region: complianceContext.region,
        compliant: compliant.toString(),
        violations: violations.length.toString(),
        warnings: warnings.length.toString()
      });

      return {
        compliant,
        violations,
        warnings,
        metadata: {
          checkTime: performance.now() - startTime,
          rulesChecked: complianceRules.length,
          complianceContext: {
            region: complianceContext.region,
            userSegment: complianceContext.userProfile?.userSegment,
            category: complianceContext.recipe?.category
          }
        }
      };

    } catch (error) {
      logger.error('Compliance check failed', error);
      performanceMonitor.recordMetric('business.rules.compliance_error', performance.now() - startTime);
      throw error;
    }
  }

  /**
   * Determines user access permissions for resources
   */
  async checkAccess(accessContext: {
    userProfile: UserProfile;
    resourceType: string;
    resourceId?: string;
    action: string;
    region: string;
  }): Promise<{
    allowed: boolean;
    permissions: string[];
    restrictions: Array<{
      ruleId: string;
      reason: string;
      expiresAt?: string;
    }>;
    alternativeAccess?: Array<{
      type: string;
      description: string;
      action: string;
    }>;
    metadata: Record<string, any>;
  }> {
    const startTime = performance.now();
    
    try {
      const accessRules = await this.getAccessControlRules(accessContext);
      
      const permissions: string[] = [];
      const restrictions: Array<{
        ruleId: string;
        reason: string;
        expiresAt?: string;
      }> = [];

      // Execute access control rules
      for (const rule of accessRules) {
        if (rule.type !== 'access-control') continue;
        
        const accessRule = rule as AccessControlRule;
        const result = await this.checkAccessRule(accessRule, accessContext);
        
        if (result.granted) {
          permissions.push(...result.permissions);
        } else {
          restrictions.push({
            ruleId: rule.id,
            reason: result.denialReason,
            expiresAt: result.expiresAt
          });
        }
      }

      // Determine if access is allowed
      const allowed = permissions.length > 0 && restrictions.length === 0;

      // Generate alternative access suggestions
      const alternativeAccess = !allowed ? await this.suggestAlternativeAccess(accessContext, permissions) : undefined;

      performanceMonitor.recordMetric('business.rules.access', performance.now() - startTime, {
        userSegment: accessContext.userProfile.userSegment,
        resourceType: accessContext.resourceType,
        allowed: allowed.toString()
      });

      return {
        allowed,
        permissions: [...new Set(permissions)], // Remove duplicates
        restrictions,
        alternativeAccess,
        metadata: {
          checkTime: performance.now() - startTime,
          rulesChecked: accessRules.length,
          accessContext: {
            userSegment: accessContext.userProfile.userSegment,
            subscriptionTier: accessContext.userProfile.subscriptionTier,
            region: accessContext.region,
            verificationStatus: accessContext.userProfile.verificationStatus
          }
        }
      };

    } catch (error) {
      logger.error('Access control check failed', error);
      performanceMonitor.recordMetric('business.rules.access_error', performance.now() - startTime);
      throw error;
    }
  }

  /**
   * Manages feature gating based on user segments and rollout strategies
   */
  async evaluateFeatureGating(featureContext: {
    featureName: string;
    userProfile: UserProfile;
    region: string;
    rolloutPercentage?: number;
  }): Promise<{
    enabled: boolean;
    reason: string;
    alternativeFeatures?: string[];
    rolloutInfo?: {
      percentage: number;
      eligibleUsers: number;
      totalUsers: number;
    };
    metadata: Record<string, any>;
  }> {
    const startTime = performance.now();
    
    try {
      const gatingRules = await this.getFeatureGatingRules(featureContext.featureName);
      
      for (const rule of gatingRules) {
        if (rule.type !== 'feature-gating') continue;
        
        const gatingRule = rule as FeatureGatingRule;
        const result = await this.evaluateFeatureGate(gatingRule, featureContext);
        
        if (result.enabled !== undefined) {
          performanceMonitor.recordMetric('business.rules.feature_gating', performance.now() - startTime, {
            featureName: featureContext.featureName,
            userSegment: featureContext.userProfile.userSegment,
            enabled: result.enabled.toString(),
            reason: result.reason
          });

          return {
            enabled: result.enabled,
            reason: result.reason,
            alternativeFeatures: result.alternativeFeatures,
            rolloutInfo: result.rolloutInfo,
            metadata: {
              evaluationTime: performance.now() - startTime,
              ruleId: rule.id,
              gatingStrategy: gatingRule.gatingStrategy
            }
          };
        }
      }

      // Default behavior if no specific gating rule found
      return {
        enabled: false,
        reason: 'No gating rule found',
        metadata: {
          evaluationTime: performance.now() - startTime,
          ruleId: 'default'
        }
      };

    } catch (error) {
      logger.error('Feature gating evaluation failed', error);
      performanceMonitor.recordMetric('business.rules.feature_gating_error', performance.now() - startTime);
      throw error;
    }
  }

  /**
   * Filters and recommends content based on user profile and business rules
   */
  async filterAndRecommendContent(contentContext: {
    userProfile: UserProfile;
    contentType: 'recipe' | 'article' | 'guide' | 'promotion' | 'feature';
    availableContent: any[];
    region: string;
    filters?: Record<string, any>;
  }): Promise<{
    filteredContent: any[];
    recommendations: Array<{
      content: any;
      score: number;
      reasons: string[];
    }>;
    excludedContent: Array<{
      content: any;
      reason: string;
      ruleId: string;
    }>;
    metadata: Record<string, any>;
  }> {
    const startTime = performance.now();
    
    try {
      const filteringRules = await this.getContentFilteringRules(contentContext);
      
      let filteredContent = [...contentContext.availableContent];
      const excludedContent: Array<{
        content: any;
        reason: string;
        ruleId: string;
      }> = [];

      // Apply content filtering rules
      for (const rule of filteringRules) {
        if (rule.type !== 'content-filtering') continue;
        
        const result = await this.applyContentFiltering(rule, contentContext, filteredContent);
        
        filteredContent = result.included;
        excludedContent.push(...result.excluded);
      }

      // Generate recommendations
      const recommendations = await this.generateRecommendations(contentContext, filteredContent);

      performanceMonitor.recordMetric('business.rules.content_filtering', performance.now() - startTime, {
        userSegment: contentContext.userProfile.userSegment,
        contentType: contentContext.contentType,
        originalCount: contentContext.availableContent.length.toString(),
        filteredCount: filteredContent.length.toString(),
        recommendationCount: recommendations.length.toString()
      });

      return {
        filteredContent,
        recommendations,
        excludedContent,
        metadata: {
          filterTime: performance.now() - startTime,
          rulesApplied: filteringRules.length,
          contentContext: {
            userSegment: contentContext.userProfile.userSegment,
            region: contentContext.region,
            subscriptionTier: contentContext.userProfile.subscriptionTier
          }
        }
      };

    } catch (error) {
      logger.error('Content filtering and recommendation failed', error);
      performanceMonitor.recordMetric('business.rules.content_filtering_error', performance.now() - startTime);
      throw error;
    }
  }

  // Private helper methods

  private async executeRule(rule: BusinessRule, context: ExecutionContext): Promise<ExecutionResult> {
    const startTime = performance.now();
    
    try {
      // Check if rule conditions are met
      if (!this.evaluateConditions(rule.conditions, context)) {
        return {
          ruleId: rule.id,
          success: false,
          executedActions: [],
          executionTime: performance.now() - startTime,
          context,
          error: 'Rule conditions not met'
        };
      }

      const executedActions: RuleActionResult[] = [];

      // Execute rule actions
      for (const action of rule.actions.sort((a, b) => a.priority - b.priority)) {
        const result = await this.executeAction(action, context);
        executedActions.push(result);
      }

      return {
        ruleId: rule.id,
        success: true,
        executedActions,
        executionTime: performance.now() - startTime,
        context
      };

    } catch (error) {
      return {
        ruleId: rule.id,
        success: false,
        executedActions: [],
        executionTime: performance.now() - startTime,
        context,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private evaluateConditions(conditions: RuleCondition[], context: ExecutionContext): boolean {
    let result = true;
    
    for (const condition of conditions) {
      const conditionResult = this.evaluateCondition(condition, context);
      
      if (condition.logicalOperator === 'OR') {
        result = result || conditionResult;
      } else {
        result = result && conditionResult;
      }
    }
    
    return result;
  }

  private evaluateCondition(condition: RuleCondition, context: ExecutionContext): boolean {
    const fieldValue = this.getFieldValue(condition.field, context);
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not-equals':
        return fieldValue !== condition.value;
      case 'greater-than':
        return fieldValue > condition.value;
      case 'less-than':
        return fieldValue < condition.value;
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not-in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      case 'between':
        return fieldValue >= condition.value[0] && fieldValue <= condition.value[1];
      case 'regex':
        return new RegExp(condition.value).test(String(fieldValue));
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      case 'not-exists':
        return fieldValue === undefined || fieldValue === null;
      default:
        return false;
    }
  }

  private getFieldValue(field: string, context: ExecutionContext): any {
    const fieldParts = field.split('.');
    let value: any = context;
    
    for (const part of fieldParts) {
      value = value?.[part];
      if (value === undefined) break;
    }
    
    return value;
  }

  private async executeAction(action: RuleAction, context: ExecutionContext): Promise<RuleActionResult> {
    try {
      switch (action.type) {
        case 'calculate-price':
          return await this.executeCalculatePrice(action, context);
        case 'apply-discount':
          return await this.executeApplyDiscount(action, context);
        case 'set-availability':
          return await this.executeSetAvailability(action, context);
        case 'grant-access':
          return await this.executeGrantAccess(action, context);
        case 'restrict-access':
          return await this.executeRestrictAccess(action, context);
        case 'enable-feature':
          return await this.executeEnableFeature(action, context);
        case 'disable-feature':
          return await this.executeDisableFeature(action, context);
        case 'filter-content':
          return await this.executeFilterContent(action, context);
        case 'recommend':
          return await this.executeRecommend(action, context);
        case 'log':
          return await this.executeLog(action, context);
        case 'notify':
          return await this.executeNotify(action, context);
        default:
          return {
            actionType: action.type,
            success: false,
            result: null,
            error: `Unknown action type: ${action.type}`,
            metadata: action.parameters
          };
      }
    } catch (error) {
      return {
        actionType: action.type,
        success: false,
        result: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: action.parameters
      };
    }
  }

  // Action execution methods (simplified implementations)
  private async executeCalculatePrice(action: RuleAction, context: ExecutionContext): Promise<RuleActionResult> {
    const basePrice = action.parameters.basePrice || 0;
    const calculationType = action.parameters.calculationType || 'fixed';
    
    let result: number;
    switch (calculationType) {
      case 'fixed':
        result = basePrice + (action.parameters.fixedAmount || 0);
        break;
      case 'percentage':
        result = basePrice * (1 + (action.parameters.percentage || 0) / 100);
        break;
      case 'tiered':
        result = this.calculateTieredPrice(basePrice, action.parameters.tiers || []);
        break;
      default:
        result = basePrice;
    }
    
    return {
      actionType: 'calculate-price',
      success: true,
      result: { price: result, calculationType },
      metadata: action.parameters
    };
  }

  private async executeApplyDiscount(action: RuleAction, context: ExecutionContext): Promise<RuleActionResult> {
    const discountType = action.parameters.type || 'percentage';
    const discountValue = action.parameters.value || 0;
    
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (context.requestMetadata.basePrice || 0) * (discountValue / 100);
    } else if (discountType === 'fixed') {
      discountAmount = discountValue;
    }
    
    return {
      actionType: 'apply-discount',
      success: true,
      result: { discountAmount, discountType, discountValue },
      metadata: action.parameters
    };
  }

  private async executeSetAvailability(action: RuleAction, context: ExecutionContext): Promise<RuleActionResult> {
    const available = action.parameters.available !== false;
    const reason = action.parameters.reason || 'Business rule decision';
    
    return {
      actionType: 'set-availability',
      success: true,
      result: { available, reason },
      metadata: action.parameters
    };
  }

  private async executeGrantAccess(action: RuleAction, context: ExecutionContext): Promise<RuleActionResult> {
    const permissions = action.parameters.permissions || [];
    const expiresAt = action.parameters.expiresAt;
    
    return {
      actionType: 'grant-access',
      success: true,
      result: { permissions, expiresAt },
      metadata: action.parameters
    };
  }

  private async executeRestrictAccess(action: RuleAction, context: ExecutionContext): Promise<RuleActionResult> {
    const reason = action.parameters.reason || 'Access restricted by business rule';
    const restrictionLevel = action.parameters.level || 'standard';
    
    return {
      actionType: 'restrict-access',
      success: true,
      result: { reason, restrictionLevel },
      metadata: action.parameters
    };
  }

  private async executeEnableFeature(action: RuleAction, context: ExecutionContext): Promise<RuleActionResult> {
    const featureName = action.parameters.featureName;
    const configuration = action.parameters.configuration || {};
    
    return {
      actionType: 'enable-feature',
      success: true,
      result: { featureName, configuration, enabled: true },
      metadata: action.parameters
    };
  }

  private async executeDisableFeature(action: RuleAction, context: ExecutionContext): Promise<RuleActionResult> {
    const featureName = action.parameters.featureName;
    const reason = action.parameters.reason || 'Feature disabled by business rule';
    
    return {
      actionType: 'disable-feature',
      success: true,
      result: { featureName, reason, enabled: false },
      metadata: action.parameters
    };
  }

  private async executeFilterContent(action: RuleAction, context: ExecutionContext): Promise<RuleActionResult> {
    const filterType = action.parameters.filterType;
    const criteria = action.parameters.criteria;
    
    return {
      actionType: 'filter-content',
      success: true,
      result: { filterType, criteria, filtered: true },
      metadata: action.parameters
    };
  }

  private async executeRecommend(action: RuleAction, context: ExecutionContext): Promise<RuleActionResult> {
    const recommendationType = action.parameters.type;
    const content = action.parameters.content;
    const score = action.parameters.score || 0.5;
    
    return {
      actionType: 'recommend',
      success: true,
      result: { recommendationType, content, score },
      metadata: action.parameters
    };
  }

  private async executeLog(action: RuleAction, context: ExecutionContext): Promise<RuleActionResult> {
    const message = action.parameters.message || 'Business rule executed';
    const level = action.parameters.level || 'info';
    
    logger.log(level, message, { context, ruleAction: action });
    
    return {
      actionType: 'log',
      success: true,
      result: { message, level, logged: true },
      metadata: action.parameters
    };
  }

  private async executeNotify(action: RuleAction, context: ExecutionContext): Promise<RuleActionResult> {
    const notificationType = action.parameters.type;
    const recipients = action.parameters.recipients || [];
    const message = action.parameters.message;
    
    // Implementation would send actual notifications
    return {
      actionType: 'notify',
      success: true,
      result: { notificationType, recipients, message, sent: true },
      metadata: action.parameters
    };
  }

  // Rule retrieval and management methods
  private async getApplicableRules(context: ExecutionContext, ruleTypes?: string[]): Promise<BusinessRule[]> {
    const cacheKey = `rules_${context.region}_${(ruleTypes || []).sort().join('_')}`;
    
    // Check cache first
    const cached = this.ruleCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
      return cached.rules;
    }

    const applicableRules: BusinessRule[] = [];
    
    for (const [ruleId, rule] of this.rules) {
      // Filter by rule types if specified
      if (ruleTypes && !ruleTypes.includes(rule.type)) continue;
      
      // Check if rule is enabled
      if (!rule.enabled) continue;
      
      // Check region-specific rules
      if (rule.metadata.region && rule.metadata.region !== context.region) continue;
      
      // Check validity period
      if (rule.metadata.validFrom && new Date(rule.metadata.validFrom) > new Date(context.timestamp)) continue;
      if (rule.metadata.validTo && new Date(rule.metadata.validTo) < new Date(context.timestamp)) continue;
      
      applicableRules.push(rule);
    }

    // Cache the results
    this.ruleCache.set(cacheKey, {
      rules: applicableRules,
      timestamp: Date.now()
    });

    return applicableRules;
  }

  private sortRulesByPriorityAndDependencies(rules: BusinessRule[]): BusinessRule[] {
    // Sort by priority first
    const sortedByPriority = rules.sort((a, b) => b.priority - a.priority);
    
    // Check for dependency conflicts
    const executedRules = new Set<string>();
    const sortedRules: BusinessRule[] = [];
    
    for (const rule of sortedByPriority) {
      const dependencies = this.ruleDependencies.get(rule.id) || [];
      const unmetDependencies = dependencies.filter(dep => !executedRules.has(dep));
      
      if (unmetDependencies.length === 0) {
        sortedRules.push(rule);
        executedRules.add(rule.id);
      } else {
        // Add to end and let dependency resolver handle it
        sortedRules.push(rule);
      }
    }
    
    return sortedRules;
  }

  // Pricing-specific methods
  private async getPricingRules(pricingContext: PricingContext, userProfile?: UserProfile): Promise<PricingRule[]> {
    const applicableRules = await this.getApplicableRules({
      userId: userProfile?.id,
      userProfile,
      region: pricingContext.region,
      language: 'en',
      sessionId: 'pricing-session',
      timestamp: new Date().toISOString(),
      requestMetadata: { pricingContext }
    }, ['pricing']);

    return applicableRules.filter(rule => rule.type === 'pricing') as PricingRule[];
  }

  private async applyPricingRule(rule: PricingRule, currentPrice: number, context: PricingContext, userProfile?: UserProfile): Promise<{
    ruleId: string;
    type: string;
    amount: number;
    description: string;
  } | null> {
    // Simplified pricing rule application
    switch (rule.pricingModel) {
      case 'fixed':
        return {
          ruleId: rule.id,
          type: 'fixed',
          amount: rule.actions[0]?.parameters.fixedAmount || 0,
          description: rule.name
        };
      case 'percentage':
        const percentage = rule.actions[0]?.parameters.percentage || 0;
        return {
          ruleId: rule.id,
          type: 'percentage',
          amount: currentPrice * (percentage / 100),
          description: `${percentage}% adjustment: ${rule.name}`
        };
      default:
        return null;
    }
  }

  private applyPriceAdjustment(currentPrice: number, adjustment: any): number {
    switch (adjustment.type) {
      case 'fixed':
        return currentPrice + adjustment.amount;
      case 'percentage':
        return currentPrice + adjustment.amount;
      default:
        return currentPrice;
    }
  }

  private calculateTieredPrice(basePrice: number, tiers: any[]): number {
    // Simplified tiered pricing
    for (const tier of tiers) {
      if (basePrice >= tier.min && basePrice <= tier.max) {
        return tier.price;
      }
    }
    return basePrice;
  }

  // Compliance-specific methods
  private async getComplianceRules(complianceContext: ComplianceContext): Promise<ComplianceRule[]> {
    const applicableRules = await this.getApplicableRules({
      userId: complianceContext.userProfile?.id,
      userProfile: complianceContext.userProfile,
      region: complianceContext.region,
      language: 'en',
      sessionId: 'compliance-session',
      timestamp: new Date().toISOString(),
      requestMetadata: { complianceContext }
    }, ['compliance']);

    return applicableRules.filter(rule => rule.type === 'compliance') as ComplianceRule[];
  }

  private async checkComplianceRule(rule: ComplianceRule, context: ComplianceContext): Promise<{
    compliant: boolean;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    recommendation?: string;
    suggestion?: string;
  }> {
    // Simplified compliance checking
    switch (rule.complianceType) {
      case 'age-restriction':
        const ageRestriction = rule.actions[0]?.parameters.minAge || 18;
        if (context.userProfile && context.userProfile.age < ageRestriction) {
          return {
            compliant: false,
            type: 'age-restriction',
            severity: 'high',
            message: `Age restriction: minimum age is ${ageRestriction}`,
            recommendation: 'Verify user age or restrict access'
          };
        }
        break;
      case 'caffeine-limit':
        const maxCaffeine = rule.actions[0]?.parameters.maxCaffeine || 160;
        const recipeCaffeine = context.recipe?.ingredients?.reduce((sum: number, ing: any) => {
          return sum + (ing.caffeine || 0);
        }, 0) || 0;
        
        if (recipeCaffeine > maxCaffeine) {
          return {
            compliant: false,
            type: 'caffeine-limit',
            severity: rule.mandatory ? 'high' : 'medium',
            message: `Caffeine content (${recipeCaffeine}mg) exceeds limit (${maxCaffeine}mg)`,
            recommendation: 'Reduce caffeine content or split into multiple servings'
          };
        }
        break;
    }

    return {
      compliant: true,
      type: rule.complianceType,
      severity: 'low',
      message: 'Compliant'
    };
  }

  // Access control methods
  private async getAccessControlRules(accessContext: any): Promise<AccessControlRule[]> {
    const applicableRules = await this.getApplicableRules({
      userId: accessContext.userProfile.id,
      userProfile: accessContext.userProfile,
      region: accessContext.region,
      language: 'en',
      sessionId: 'access-session',
      timestamp: new Date().toISOString(),
      requestMetadata: { accessContext }
    }, ['access-control']);

    return applicableRules.filter(rule => rule.type === 'access-control') as AccessControlRule[];
  }

  private async checkAccessRule(rule: AccessControlRule, accessContext: any): Promise<{
    granted: boolean;
    permissions: string[];
    denialReason?: string;
    expiresAt?: string;
  }> {
    const userProfile = accessContext.userProfile;
    const resourceType = accessContext.resourceType;
    const action = accessContext.action;

    // Check if rule applies to this resource and action
    if (rule.resourceType !== resourceType && rule.resourceType !== '*') {
      return { granted: false, permissions: [] };
    }

    // Check user access level
    const accessLevels = {
      'public': 0,
      'registered': 1,
      'premium': 2,
      'admin': 3,
      'medical-professional': 4,
      'age-verified': 1.5
    };

    const userLevel = accessLevels[userProfile.subscriptionTier] || 0;
    const requiredLevel = accessLevels[rule.accessLevel] || 0;

    if (userLevel >= requiredLevel) {
      return {
        granted: true,
        permissions: rule.permissions,
        expiresAt: rule.actions[0]?.parameters.expiresAt
      };
    }

    return {
      granted: false,
      permissions: [],
      denialReason: `Insufficient access level. Required: ${rule.accessLevel}, Current: ${userProfile.subscriptionTier}`
    };
  }

  private async suggestAlternativeAccess(accessContext: any, currentPermissions: string[]): Promise<Array<{
    type: string;
    description: string;
    action: string;
  }>> {
    const suggestions = [];

    // Suggest subscription upgrade if permissions are limited
    if (currentPermissions.length === 0) {
      suggestions.push({
        type: 'subscription-upgrade',
        description: 'Upgrade to premium for additional features',
        action: 'upgrade-subscription'
      });
    }

    // Suggest age verification if needed
    if (!accessContext.userProfile.verificationStatus.ageVerified) {
      suggestions.push({
        type: 'age-verification',
        description: 'Verify your age to access age-restricted content',
        action: 'verify-age'
      });
    }

    return suggestions;
  }

  // Feature gating methods
  private async getFeatureGatingRules(featureName: string): Promise<FeatureGatingRule[]> {
    const applicableRules = await this.getApplicableRules({
      region: 'global',
      language: 'en',
      sessionId: 'feature-session',
      timestamp: new Date().toISOString(),
      requestMetadata: { featureName }
    }, ['feature-gating']);

    return applicableRules.filter(rule => 
      rule.type === 'feature-gating' && 
      (rule as FeatureGatingRule).featureName === featureName
    ) as FeatureGatingRule[];
  }

  private async evaluateFeatureGate(rule: FeatureGatingRule, featureContext: any): Promise<{
    enabled?: boolean;
    reason: string;
    alternativeFeatures?: string[];
    rolloutInfo?: {
      percentage: number;
      eligibleUsers: number;
      totalUsers: number;
    };
  }> {
    const { userProfile, region, rolloutPercentage } = featureContext;

    switch (rule.gatingStrategy) {
      case 'whitelist':
        if (rule.userSegments?.includes(userProfile.userSegment) || 
            rule.regions?.includes(region)) {
          return { enabled: true, reason: 'Whitelisted user/region' };
        }
        return { enabled: false, reason: 'Not in whitelist' };

      case 'blacklist':
        if (rule.userSegments?.includes(userProfile.userSegment) || 
            rule.regions?.includes(region)) {
          return { enabled: false, reason: 'Blacklisted user/region' };
        }
        return { enabled: true, reason: 'Not in blacklist' };

      case 'percentage':
        const percentage = rolloutPercentage || rule.rolloutPercentage || 0;
        const userHash = this.hashUserId(userProfile.id);
        const isInPercentage = (userHash % 100) < percentage;
        return { 
          enabled: isInPercentage, 
          reason: `Percentage rollout: ${percentage}%`,
          rolloutInfo: {
            percentage,
            eligibleUsers: Math.floor(userHash % 100),
            totalUsers: 100
          }
        };

      case 'progressive-rollout':
        const progressivePercentage = this.calculateProgressiveRollout(userProfile);
        return { 
          enabled: progressivePercentage > 50, 
          reason: `Progressive rollout: ${progressivePercentage}%`
        };

      default:
        return { enabled: false, reason: 'Unknown gating strategy' };
    }
  }

  // Content filtering methods
  private async getContentFilteringRules(contentContext: any): Promise<BusinessRule[]> {
    return await this.getApplicableRules({
      userId: contentContext.userProfile.id,
      userProfile: contentContext.userProfile,
      region: contentContext.region,
      language: 'en',
      sessionId: 'content-session',
      timestamp: new Date().toISOString(),
      requestMetadata: { contentContext }
    }, ['content-filtering']);
  }

  private async applyContentFiltering(rule: BusinessRule, contentContext: any, content: any[]): Promise<{
    included: any[];
    excluded: Array<{ content: any; reason: string; ruleId: string }>;
  }> {
    const included: any[] = [];
    const excluded: Array<{ content: any; reason: string; ruleId: string }> = [];

    for (const item of content) {
      let shouldInclude = true;
      
      // Apply filtering logic based on rule conditions
      for (const condition of rule.conditions) {
        const fieldValue = item[condition.field];
        if (!this.evaluateCondition(condition, { ...contentContext, requestMetadata: { item } } as any)) {
          shouldInclude = false;
          break;
        }
      }

      if (shouldInclude) {
        included.push(item);
      } else {
        excluded.push({
          content: item,
          reason: 'Filtered by business rule',
          ruleId: rule.id
        });
      }
    }

    return { included, excluded };
  }

  private async generateRecommendations(contentContext: any, filteredContent: any[]): Promise<Array<{
    content: any;
    score: number;
    reasons: string[];
  }>> {
    const recommendations = [];

    for (const item of filteredContent) {
      let score = 0.5; // Base score
      const reasons: string[] = [];

      // Score based on user preferences
      if (contentContext.userProfile.preferences.caffeinePreference === 'low' && item.caffeine < 25) {
        score += 0.2;
        reasons.push('Matches low caffeine preference');
      }

      // Score based on usage patterns
      if (contentContext.userProfile.favoriteCategories.includes(item.category)) {
        score += 0.3;
        reasons.push('Matches favorite category');
      }

      // Score based on budget range
      const price = item.estimatedCost || 0;
      if (price >= contentContext.userProfile.preferences.budgetRange.min && 
          price <= contentContext.userProfile.preferences.budgetRange.max) {
        score += 0.1;
        reasons.push('Within budget range');
      }

      recommendations.push({
        content: item,
        score: Math.min(1.0, score),
        reasons
      });
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  // Utility methods
  private updateRuleMetrics(ruleId: string, result: ExecutionResult): void {
    const existing = this.performanceMetrics.get(ruleId) || {
      executionCount: 0,
      successRate: 0,
      averageExecutionTime: 0
    };

    existing.executionCount++;
    existing.averageExecutionTime = (existing.averageExecutionTime * (existing.executionCount - 1) + result.executionTime) / existing.executionCount;
    existing.successRate = ((existing.successRate * (existing.executionCount - 1)) + (result.success ? 1 : 0)) / existing.executionCount;

    this.performanceMetrics.set(ruleId, existing);
  }

  private initializeDefaultRules(): void {
    // Pricing rules
    const pricingRules: PricingRule[] = [
      {
        id: 'premium-user-discount',
        name: 'Premium User Discount',
        description: 'Apply discount for premium users',
        type: 'pricing',
        category: 'user-discounts',
        priority: 10,
        enabled: true,
        conditions: [
          { field: 'userProfile.subscriptionTier', operator: 'equals', value: 'premium' }
        ],
        actions: [
          { type: 'apply-discount', parameters: { type: 'percentage', value: 10 }, priority: 1 }
        ],
        metadata: {
          version: '1.0',
          createdBy: 'system',
          tags: ['pricing', 'premium']
        },
        executionCount: 0,
        successRate: 0,
        averageExecutionTime: 0,
        pricingModel: 'percentage',
        calculationMethod: 'user-tier-discount',
        taxInclusive: false
      },
      {
        id: 'bulk-pricing',
        name: 'Bulk Purchase Pricing',
        description: 'Apply bulk pricing for large orders',
        type: 'pricing',
        category: 'volume-pricing',
        priority: 5,
        enabled: true,
        conditions: [
          { field: 'pricingContext.batchSize', operator: 'greater-than', value: 10 }
        ],
        actions: [
          { type: 'apply-discount', parameters: { type: 'percentage', value: 15 }, priority: 1 }
        ],
        metadata: {
          version: '1.0',
          createdBy: 'system',
          tags: ['pricing', 'bulk']
        },
        executionCount: 0,
        successRate: 0,
        averageExecutionTime: 0,
        pricingModel: 'percentage',
        calculationMethod: 'volume-discount',
        taxInclusive: false
      }
    ];

    // Compliance rules
    const complianceRules: ComplianceRule[] = [
      {
        id: 'eu-caffeine-limit',
        name: 'EU Caffeine Limit Compliance',
        description: 'Ensure compliance with EU caffeine limits',
        type: 'compliance',
        category: 'caffeine-regulations',
        priority: 20,
        enabled: true,
        conditions: [
          { field: 'region', operator: 'in', value: ['EU', 'DE', 'FR', 'NL', 'IT', 'ES'] }
        ],
        actions: [
          { type: 'set-availability', parameters: { maxCaffeine: 160 }, priority: 1 }
        ],
        metadata: {
          version: '1.0',
          createdBy: 'system',
          tags: ['compliance', 'eu', 'caffeine']
        },
        executionCount: 0,
        successRate: 0,
        averageExecutionTime: 0,
        regulatoryBody: 'EFSA',
        complianceType: 'caffeine-limit',
        mandatory: true
      },
      {
        id: 'age-verification-energy',
        name: 'Energy Drink Age Verification',
        description: 'Require age verification for energy drinks',
        type: 'compliance',
        category: 'age-restrictions',
        priority: 15,
        enabled: true,
        conditions: [
          { field: 'recipe.category', operator: 'equals', value: 'energy' }
        ],
        actions: [
          { type: 'restrict-access', parameters: { minAge: 16 }, priority: 1 }
        ],
        metadata: {
          version: '1.0',
          createdBy: 'system',
          tags: ['compliance', 'age', 'energy']
        },
        executionCount: 0,
        successRate: 0,
        averageExecutionTime: 0,
        regulatoryBody: 'EFSA',
        complianceType: 'age-restriction',
        mandatory: true
      }
    ];

    // Access control rules
    const accessControlRules: AccessControlRule[] = [
      {
        id: 'premium-features',
        name: 'Premium Features Access',
        description: 'Grant access to premium features',
        type: 'access-control',
        category: 'feature-access',
        priority: 10,
        enabled: true,
        conditions: [
          { field: 'userProfile.subscriptionTier', operator: 'in', value: ['premium', 'professional'] }
        ],
        actions: [
          { type: 'grant-access', parameters: { permissions: ['advanced-calculator', 'recipe-library', 'premium_support'] }, priority: 1 }
        ],
        metadata: {
          version: '1.0',
          createdBy: 'system',
          tags: ['access', 'premium']
        },
        executionCount: 0,
        successRate: 0,
        averageExecutionTime: 0,
        accessLevel: 'premium',
        resourceType: '*',
        permissions: ['advanced-calculator', 'recipe-library']
      }
    ];

    // Feature gating rules
    const featureGatingRules: FeatureGatingRule[] = [
      {
        id: 'new-calculator-ui',
        name: 'New Calculator UI Rollout',
        description: 'Progressive rollout of new calculator interface',
        type: 'feature-gating',
        category: 'ui-rollout',
        priority: 5,
        enabled: true,
        conditions: [],
        actions: [
          { type: 'enable-feature', parameters: { featureName: 'new-calculator-ui' }, priority: 1 }
        ],
        metadata: {
          version: '1.0',
          createdBy: 'system',
          tags: ['feature', 'rollout']
        },
        executionCount: 0,
        successRate: 0,
        averageExecutionTime: 0,
        featureName: 'new-calculator-ui',
        gatingStrategy: 'percentage',
        rolloutPercentage: 25,
        userSegments: ['new', 'regular'],
        regions: ['US', 'EU', 'CA']
      }
    ];

    // Add all rules to the rules map
    [...pricingRules, ...complianceRules, ...accessControlRules, ...featureGatingRules].forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  private initializeRuleCategories(): void {
    this.ruleCategories.set('pricing', ['user-discounts', 'volume-pricing', 'promotional', 'competitive']);
    this.ruleCategories.set('compliance', ['caffeine-regulations', 'age-restrictions', 'allergen-rules', 'labeling']);
    this.ruleCategories.set('access-control', ['feature-access', 'content-access', 'api-access']);
    this.ruleCategories.set('feature-gating', ['ui-rollout', 'experimental-features', 'regional-features']);
    this.ruleCategories.set('content-filtering', ['user-preferences', 'safety-filtering', 'age-appropriate']);
  }

  private initializeRuleDependencies(): void {
    // Define rule dependencies
    this.ruleDependencies.set('eu-caffeine-limit', ['age-verification-energy']);
    this.ruleDependencies.set('premium-features', ['premium-user-discount']);
  }

  private hashUserId(userId: string): number {
    // Simple hash function for percentage-based feature gating
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private calculateProgressiveRollout(userProfile: UserProfile): number {
    // Calculate progressive rollout percentage based on user engagement
    const daysSinceSignup = Math.floor((Date.now() - new Date(userProfile.id).getTime()) / (1000 * 60 * 60 * 24));
    const engagementScore = Math.min(100, userProfile.usage.monthlyUsage * 10 + daysSinceSignup / 7);
    
    return Math.min(100, engagementScore);
  }
}

interface RulePerformanceMetrics {
  executionCount: number;
  successRate: number;
  averageExecutionTime: number;
}

// Export singleton instance
export const flexibleBusinessRuleEngine = new FlexibleBusinessRuleEngine();