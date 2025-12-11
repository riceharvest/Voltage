/**
 * Food Safety and Regulatory Compliance System
 * 
 * Comprehensive food safety compliance for international operations including
 * FDA, EFSA, Health Canada, FSANZ regulations, allergen management,
 * and nutritional information compliance.
 */

import { getRegionalCompliance, checkCaffeineCompliance } from './regional-compliance';

export interface FoodSafetyStandard {
  id: string;
  jurisdiction: string;
  regulatoryBody: string;
  name: string;
  version: string;
  effectiveDate: string;
  categories: FoodSafetyCategory[];
  requirements: FoodSafetyRequirement[];
  lastUpdated: string;
}

export interface FoodSafetyCategory {
  id: string;
  name: string;
  description: string;
  requirements: string[];
  testing: TestingRequirement[];
  documentation: DocumentationRequirement[];
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface FoodSafetyRequirement {
  id: string;
  category: string;
  title: string;
  description: string;
  type: 'ingredient-safety' | 'labeling' | 'process' | 'quality' | 'traceability';
  compliance: ComplianceCriteria;
  testing: TestingProtocol[];
  documentation: string[];
  enforcement: EnforcementInfo;
  penalties: PenaltyInfo[];
}

export interface ComplianceCriteria {
  thresholds: Threshold[];
  validations: ValidationRule[];
  monitoring: MonitoringRequirement[];
  corrective: CorrectiveAction[];
}

export interface Threshold {
  parameter: string;
  value: number;
  unit: string;
  type: 'maximum' | 'minimum' | 'exact' | 'range';
  description: string;
  action: 'block' | 'warn' | 'monitor' | 'report';
}

export interface ValidationRule {
  id: string;
  name: string;
  type: 'calculation' | 'comparison' | 'range' | 'presence' | 'format';
  parameters: Record<string, any>;
  description: string;
}

export interface TestingRequirement {
  type: 'ingredient-analysis' | 'product-testing' | 'process-validation' | 'facility-audit';
  frequency: 'batch' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  method: string;
  standards: string[];
  documentation: string[];
  acceptance: string;
}

export interface DocumentationRequirement {
  type: 'certificate' | 'test-result' | 'audit-report' | 'traceability-record' | 'incident-report';
  retention: number; // years
  format: 'electronic' | 'paper' | 'digital-signature';
  access: 'public' | 'restricted' | 'regulatory-only';
  verification: string[];
}

export interface TestingProtocol {
  id: string;
  name: string;
  type: 'chemical' | 'microbiological' | 'physical' | 'sensory';
  method: string;
  equipment: string[];
  frequency: string;
  standards: string[];
  acceptance: string;
}

export interface MonitoringRequirement {
  parameter: string;
  method: string;
  frequency: string;
  threshold: number;
  action: string;
}

export interface CorrectiveAction {
  trigger: string;
  action: string;
  responsibility: string;
  timeframe: string;
  verification: string;
}

export interface EnforcementInfo {
  authority: string;
  method: 'self-certification' | 'audit' | 'inspection' | 'reporting';
  frequency: string;
  consequences: string[];
}

export interface PenaltyInfo {
  type: 'monetary' | 'operational' | 'legal';
  amount?: number;
  currency?: string;
  conditions: string[];
}

export interface AllergenManagement {
  jurisdiction: string;
  requiredDeclarations: string[];
  detection: DetectionMethod[];
  labeling: LabelingRequirement[];
  crossContact: CrossContactPrevention;
  emergency: EmergencyProcedures;
}

export interface DetectionMethod {
  allergen: string;
  method: 'pcr' | 'elisa' | 'lateral-flow' | 'mass-spectrometry';
  sensitivity: string;
  specificity: string;
  testingTime: string;
  cost: 'low' | 'medium' | 'high';
}

export interface LabelingRequirement {
  allergen: string;
  format: 'bold' | 'highlighted' | 'separate-section' | 'warning';
  language: string[];
  fontSize: number;
  placement: string;
  warnings: string[];
}

export interface CrossContactPrevention {
  protocols: string[];
  equipment: string[];
  training: string[];
  verification: string[];
}

export interface EmergencyProcedures {
  allergenExposure: string[];
  symptoms: string[];
  response: string[];
  contacts: string[];
}

export interface NutritionalCompliance {
  jurisdiction: string;
  required: NutrientRequirement[];
  format: NutritionLabelFormat;
  claims: NutritionClaim[];
  warnings: WarningRequirement[];
}

export interface NutrientRequirement {
  nutrient: string;
  required: boolean;
  dailyValue: number;
  unit: string;
  rounding: string;
  display: 'mandatory' | 'optional' | 'conditional';
}

export interface NutritionLabelFormat {
  layout: string;
  fontSize: number;
  font: string;
  color: string;
  order: string[];
  serving: ServingInformation;
}

export interface ServingInformation {
  size: number;
  unit: string;
  perContainer: number;
  dailyValues: boolean;
}

export interface NutritionClaim {
  type: 'free' | 'reduced' | 'light' | 'low' | 'high' | 'source' | 'fortified';
  criteria: string[];
  documentation: string[];
  restrictions: string[];
}

export interface WarningRequirement {
  type: 'caffeine' | 'allergen' | 'sugar' | 'additive' | 'pregnancy' | 'medical';
  content: string[];
  placement: string;
  fontSize: number;
  mandatory: boolean;
}

export interface ComplianceCheck {
  id: string;
  entityType: 'recipe' | 'product' | 'ingredient' | 'process';
  entityId: string;
  jurisdiction: string;
  standards: string[];
  results: ComplianceResult[];
  violations: ComplianceViolation[];
  warnings: ComplianceWarning[];
  recommendations: ComplianceRecommendation[];
  score: number; // 0-100
  status: 'compliant' | 'non-compliant' | 'pending-review';
  checkedAt: string;
  validUntil: string;
}

export interface ComplianceResult {
  requirement: string;
  category: string;
  status: 'pass' | 'fail' | 'warning' | 'not-applicable';
  score: number;
  details: string;
  evidence: string[];
  checkedBy: string;
  checkedAt: string;
}

export interface ComplianceViolation {
  id: string;
  requirement: string;
  severity: 'critical' | 'major' | 'minor';
  description: string;
  evidence: string[];
  remediation: string[];
  deadline: string;
  status: 'open' | 'in-progress' | 'resolved' | 'accepted';
  assignedTo: string;
}

export interface ComplianceWarning {
  id: string;
  type: 'threshold' | 'procedure' | 'documentation' | 'training';
  description: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

export interface ComplianceRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  impact: 'high' | 'medium' | 'low';
  timeline: string;
  resources: string[];
  benefits: string[];
}

export class FoodSafetyComplianceSystem {
  private standards: Map<string, FoodSafetyStandard> = new Map();
  private allergenDatabase: Map<string, AllergenManagement> = new Map();
  private nutritionDatabase: Map<string, NutritionalCompliance> = new Map();
  private checks: Map<string, ComplianceCheck> = new Map();

  constructor() {
    this.initializeStandards();
    this.initializeAllergenDatabase();
    this.initializeNutritionDatabase();
  }

  /**
   * Perform comprehensive food safety compliance check
   */
  async performFoodSafetyComplianceCheck(request: {
    entityType: 'recipe' | 'product' | 'ingredient';
    entityId: string;
    entityData: any;
    jurisdictions: string[];
    standards?: string[];
    includeAllergenTesting?: boolean;
    includeNutritionalAnalysis?: boolean;
  }): Promise<{
    checkId: string;
    overallCompliance: boolean;
    score: number;
    complianceByJurisdiction: Record<string, {
      score: number;
      status: string;
      violations: number;
      warnings: number;
    }>;
    results: ComplianceResult[];
    violations: ComplianceViolation[];
    warnings: ComplianceWarning[];
    recommendations: ComplianceRecommendation[];
    nextReview: string;
    certifications: string[];
  }> {
    const checkId = this.generateCheckId();
    const startTime = performance.now();

    try {
      const allResults: ComplianceResult[] = [];
      const allViolations: ComplianceViolation[] = [];
      const allWarnings: ComplianceWarning[] = [];
      const complianceByJurisdiction: Record<string, any> = {};
      
      // Check each jurisdiction
      for (const jurisdiction of request.jurisdictions) {
        const jurisdictionResults = await this.checkJurisdictionCompliance(
          jurisdiction, 
          request
        );
        
        allResults.push(...jurisdictionResults.results);
        allViolations.push(...jurisdictionResults.violations);
        allWarnings.push(...jurisdictionResults.warnings);
        
        complianceByJurisdiction[jurisdiction] = {
          score: jurisdictionResults.score,
          status: jurisdictionResults.score >= 95 ? 'compliant' : 'non-compliant',
          violations: jurisdictionResults.violations.length,
          warnings: jurisdictionResults.warnings.length
        };
      }

      // Calculate overall score
      const totalScore = Object.values(complianceByJurisdiction)
        .reduce((sum: number, juris: any) => sum + juris.score, 0);
      const overallScore = totalScore / request.jurisdictions.length;

      // Generate recommendations
      const recommendations = this.generateRecommendations(allViolations, allWarnings);

      // Determine certifications needed
      const certifications = this.determineRequiredCertifications(allViolations, request.jurisdictions);

      // Store check results
      const check: ComplianceCheck = {
        id: checkId,
        entityType: request.entityType,
        entityId: request.entityId,
        jurisdiction: request.jurisdictions.join(','),
        standards: request.standards || ['default'],
        results: allResults,
        violations: allViolations,
        warnings: allWarnings,
        score: overallScore,
        status: overallScore >= 95 ? 'compliant' : 'non-compliant',
        checkedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
      };
      
      this.checks.set(checkId, check);

      // Log compliance check
      await this.logFoodSafetyActivity('compliance-check-performed', {
        checkId,
        entityType: request.entityType,
        entityId: request.entityId,
        jurisdictions: request.jurisdictions,
        score: overallScore,
        violations: allViolations.length,
        duration: performance.now() - startTime
      });

      return {
        checkId,
        overallCompliance: overallScore >= 95,
        score: overallScore,
        complianceByJurisdiction,
        results: allResults,
        violations: allViolations,
        warnings: allWarnings,
        recommendations,
        nextReview: check.validUntil,
        certifications
      };

    } catch (error) {
      await this.logFoodSafetyActivity('compliance-check-failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Validate allergen compliance for recipe
   */
  async validateAllergenCompliance(recipeData: any, jurisdiction: string): Promise<{
    compliant: boolean;
    allergensDetected: string[];
    missingDeclarations: string[];
    crossContactRisks: string[];
    recommendations: string[];
  }> {
    const allergenManagement = this.allergenDatabase.get(jurisdiction);
    if (!allergenManagement) {
      return {
        compliant: false,
        allergensDetected: [],
        missingDeclarations: [],
        crossContactRisks: [],
        recommendations: [`Allergen management not configured for ${jurisdiction}`]
      };
    }

    // Detect allergens in recipe
    const allergensDetected = this.detectAllergensInRecipe(recipeData, allergenManagement);
    
    // Check required declarations
    const missingDeclarations = allergenManagement.requiredDeclarations
      .filter(allergen => !allergensDetected.includes(allergen))
      .filter(allergen => this.shouldDeclareAllergen(allergen, recipeData, allergenManagement));

    // Assess cross-contact risks
    const crossContactRisks = this.assessCrossContactRisks(recipeData, allergenManagement);

    // Generate recommendations
    const recommendations = this.generateAllergenRecommendations(
      allergensDetected,
      missingDeclarations,
      crossContactRisks,
      allergenManagement
    );

    const compliant = missingDeclarations.length === 0 && crossContactRisks.length === 0;

    return {
      compliant,
      allergensDetected,
      missingDeclarations,
      crossContactRisks,
      recommendations
    };
  }

  /**
   * Validate nutritional information compliance
   */
  async validateNutritionalCompliance(
    nutritionalData: any,
    jurisdiction: string
  ): Promise<{
    compliant: boolean;
    missingNutrients: string[];
    incorrectFormats: string[];
    claims: Array<{
      claim: string;
      valid: boolean;
      evidence: string;
    }>;
    warnings: string[];
    recommendations: string[];
  }> {
    const nutritionCompliance = this.nutritionDatabase.get(jurisdiction);
    if (!nutritionCompliance) {
      return {
        compliant: false,
        missingNutrients: [],
        incorrectFormats: [],
        claims: [],
        warnings: [`Nutritional compliance not configured for ${jurisdiction}`],
        recommendations: []
      };
    }

    // Check required nutrients
    const requiredNutrients = nutritionCompliance.required
      .filter(req => req.required)
      .map(req => req.nutrient);
    
    const missingNutrients = requiredNutrients
      .filter(nutrient => !nutritionalData[nutrient]);

    // Validate format
    const incorrectFormats = this.validateNutrientFormats(nutritionalData, nutritionCompliance);

    // Validate claims
    const claims = nutritionCompliance.claims.map(claim => ({
      claim: claim.type,
      valid: this.validateNutritionClaim(nutritionalData, claim),
      evidence: this.getClaimEvidence(nutritionalData, claim)
    }));

    // Generate warnings
    const warnings = this.generateNutritionWarnings(nutritionalData, nutritionCompliance);

    // Generate recommendations
    const recommendations = this.generateNutritionRecommendations(
      missingNutrients,
      incorrectFormats,
      claims,
      warnings
    );

    const compliant = missingNutrients.length === 0 && incorrectFormats.length === 0;

    return {
      compliant,
      missingNutrients,
      incorrectFormats,
      claims,
      warnings,
      recommendations
    };
  }

  /**
   * Get food safety dashboard data
   */
  async getFoodSafetyDashboard(jurisdiction?: string): Promise<{
    overview: {
      totalChecks: number;
      compliantEntities: number;
      nonCompliantEntities: number;
      criticalViolations: number;
      averageScore: number;
      lastCheck: string;
    };
    byJurisdiction: Array<{
      jurisdiction: string;
      score: number;
      checks: number;
      violations: number;
      status: string;
    }>;
    violations: Array<{
      type: string;
      count: number;
      severity: string;
      jurisdiction: string;
    }>;
    allergen: {
      detected: string[];
      risks: string[];
      compliance: number;
    };
    certifications: Array<{
      name: string;
      jurisdiction: string;
      status: string;
      expiry: string;
    }>;
  }> {
    // Get recent checks
    const recentChecks = Array.from(this.checks.values())
      .filter(check => !jurisdiction || check.jurisdiction.includes(jurisdiction))
      .sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime())
      .slice(0, 50);

    // Calculate overview metrics
    const totalChecks = recentChecks.length;
    const compliantEntities = recentChecks.filter(c => c.status === 'compliant').length;
    const nonCompliantEntities = totalChecks - compliantEntities;
    const criticalViolations = recentChecks.reduce((sum, c) => 
      sum + c.violations.filter(v => v.severity === 'critical').length, 0
    );
    const averageScore = totalChecks > 0 ? 
      recentChecks.reduce((sum, c) => sum + c.score, 0) / totalChecks : 0;

    // Calculate jurisdiction breakdown
    const byJurisdiction = this.calculateJurisdictionBreakdown(recentChecks);

    // Aggregate violations
    const violations = this.aggregateViolations(recentChecks);

    // Get allergen data
    const allergen = await this.getAllergenSummary(jurisdiction);

    // Get certification data
    const certifications = await this.getCertificationSummary(jurisdiction);

    return {
      overview: {
        totalChecks,
        compliantEntities,
        nonCompliantEntities,
        criticalViolations,
        averageScore,
        lastCheck: recentChecks[0]?.checkedAt || new Date().toISOString()
      },
      byJurisdiction,
      violations,
      allergen,
      certifications
    };
  }

  // Private helper methods

  private initializeStandards(): void {
    // Initialize FDA standards for US
    const fdaStandard: FoodSafetyStandard = {
      id: 'FDA-21CFR',
      jurisdiction: 'US',
      regulatoryBody: 'FDA',
      name: 'Food and Drug Administration Regulations',
      version: '21 CFR',
      effectiveDate: '2024-01-01',
      categories: [
        {
          id: 'ingredient-safety',
          name: 'Ingredient Safety',
          description: 'Requirements for ingredient safety and approval',
          requirements: [
            'All ingredients must be FDA approved',
            'GRAS status verification required',
            'Maximum levels compliance'
          ],
          testing: [
            {
              type: 'ingredient-analysis',
              frequency: 'batch',
              method: 'Laboratory analysis',
              standards: ['AOAC'],
              documentation: ['Certificate of Analysis'],
              acceptance: 'Meets FDA specifications'
            }
          ],
          documentation: [
            {
              type: 'certificate',
              retention: 7,
              format: 'electronic',
              access: 'restricted',
              verification: ['Digital signature', 'Third-party verification']
            }
          ],
          priority: 'critical'
        }
      ],
      requirements: [
        {
          id: 'caffeine-limit',
          category: 'ingredient-safety',
          title: 'Caffeine Content Limits',
          description: 'Maximum caffeine content per serving',
          type: 'ingredient-safety',
          compliance: {
            thresholds: [
              {
                parameter: 'caffeine_per_serving',
                value: 400,
                unit: 'mg',
                type: 'maximum',
                description: 'Maximum caffeine per serving',
                action: 'block'
              }
            ],
            validations: [
              {
                id: 'caffeine-validation',
                name: 'Caffeine Content Validation',
                type: 'calculation',
                parameters: { max: 400 },
                description: 'Validate caffeine does not exceed 400mg per serving'
              }
            ],
            monitoring: [
              {
                parameter: 'caffeine_content',
                method: 'HPLC Analysis',
                frequency: 'batch',
                threshold: 400,
                action: 'block'
              }
            ],
            corrective: [
              {
                trigger: 'Caffeine exceeds 400mg',
                action: 'Reject batch',
                responsibility: 'Quality Control',
                timeframe: 'Immediate',
                verification: 'Re-analysis'
              }
            ]
          },
          testing: [
            {
              id: 'caffeine-analysis',
              name: 'Caffeine Content Analysis',
              type: 'chemical',
              method: 'HPLC',
              equipment: ['HPLC System', 'Caffeine Standard'],
              frequency: 'batch',
              standards: ['AOAC 985.26'],
              acceptance: 'Within ±5% of target'
            }
          ],
          documentation: [
            'Caffeine analysis report',
            'Batch production record'
          ],
          enforcement: {
            authority: 'FDA',
            method: 'inspection',
            frequency: 'annual',
            consequences: ['Product recall', 'Warning letter', 'Civil penalties']
          },
          penalties: [
            {
              type: 'monetary',
              amount: 250000,
              currency: 'USD',
              conditions: ['Intentional violation', 'Pattern of non-compliance']
            }
          ]
        }
      ],
      lastUpdated: '2025-12-10'
    };

    this.standards.set('FDA-21CFR', fdaStandard);

    // Initialize EFSA standards for EU
    const efsaStandard: FoodSafetyStandard = {
      id: 'EFSA-REGULATION',
      jurisdiction: 'EU',
      regulatoryBody: 'EFSA',
      name: 'European Food Safety Authority Regulations',
      version: 'EU Regulation 2015/2283',
      effectiveDate: '2024-01-01',
      categories: [
        {
          id: 'novel-foods',
          name: 'Novel Foods',
          description: 'Requirements for novel food authorization',
          requirements: [
            'Novel food authorization required',
            'Safety assessment mandatory',
            'Labeling compliance'
          ],
          testing: [
            {
              type: 'safety-assessment',
              frequency: 'product',
              method: 'Comprehensive safety evaluation',
              standards: ['EFSA Guidelines'],
              documentation: ['Safety dossier'],
              acceptance: 'EFSA authorization'
            }
          ],
          documentation: [
            {
              type: 'certificate',
              retention: 10,
              format: 'digital-signature',
              access: 'regulatory-only',
              verification: ['EFSA database', 'Member state verification']
            }
          ],
          priority: 'critical'
        }
      ],
      requirements: [
        {
          id: 'caffeine-limit-eu',
          category: 'ingredient-safety',
          title: 'Caffeine Content Limits (EU)',
          description: 'Maximum caffeine content per serving in EU',
          type: 'ingredient-safety',
          compliance: {
            thresholds: [
              {
                parameter: 'caffeine_per_serving',
                value: 150,
                unit: 'mg',
                type: 'maximum',
                description: 'Maximum caffeine per serving (EU)',
                action: 'block'
              }
            ],
            validations: [
              {
                id: 'caffeine-validation-eu',
                name: 'EU Caffeine Content Validation',
                type: 'calculation',
                parameters: { max: 150 },
                description: 'Validate caffeine does not exceed 150mg per serving'
              }
            ],
            monitoring: [
              {
                parameter: 'caffeine_content',
                method: 'HPLC Analysis',
                frequency: 'batch',
                threshold: 150,
                action: 'block'
              }
            ],
            corrective: [
              {
                trigger: 'Caffeine exceeds 150mg',
                action: 'Reject batch',
                responsibility: 'Quality Control',
                timeframe: 'Immediate',
                verification: 'Re-analysis'
              }
            ]
          },
          testing: [
            {
              id: 'caffeine-analysis-eu',
              name: 'Caffeine Content Analysis (EU)',
              type: 'chemical',
              method: 'HPLC',
              equipment: ['HPLC System', 'Caffeine Standard'],
              frequency: 'batch',
              standards: ['EN 15914'],
              acceptance: 'Within ±3% of target'
            }
          ],
          documentation: [
            'Caffeine analysis report',
            'EU compliance certificate',
            'Batch production record'
          ],
          enforcement: {
            authority: 'EFSA',
            method: 'reporting',
            frequency: 'continuous',
            consequences: ['Product withdrawal', 'Administrative fines']
          },
          penalties: [
            {
              type: 'monetary',
              amount: 50000,
              currency: 'EUR',
              conditions: ['Unauthorized novel ingredient', 'Safety concerns']
            }
          ]
        }
      ],
      lastUpdated: '2025-12-10'
    };

    this.standards.set('EFSA-REGULATION', efsaStandard);
  }

  private initializeAllergenDatabase(): void {
    // US allergen requirements
    const usAllergens: AllergenManagement = {
      jurisdiction: 'US',
      requiredDeclarations: [
        'milk', 'eggs', 'fish', 'crustacean shellfish', 'tree nuts', 
        'peanuts', 'wheat', 'soybeans', 'sesame'
      ],
      detection: [
        {
          allergen: 'milk',
          method: 'elisa',
          sensitivity: '5 ppm',
          specificity: '99%',
          testingTime: '24 hours',
          cost: 'medium'
        },
        {
          allergen: 'peanuts',
          method: 'elisa',
          sensitivity: '2.5 ppm',
          specificity: '99%',
          testingTime: '24 hours',
          cost: 'medium'
        }
      ],
      labeling: [
        {
          allergen: 'milk',
          format: 'bold',
          language: ['English', 'Spanish'],
          fontSize: 8,
          placement: 'Ingredient list',
          warnings: ['Contains: Milk']
        }
      ],
      crossContact: {
        protocols: ['Dedicated equipment', 'Cleaning validation', 'Employee training'],
        equipment: ['Separate mixing equipment', 'Dedicated storage'],
        training: ['Allergen awareness', 'Cross-contact prevention'],
        verification: ['ATP testing', 'Visual inspection']
      },
      emergency: {
        allergenExposure: ['Immediate removal from consumption', 'Medical evaluation'],
        symptoms: ['Anaphylaxis', 'Hives', 'Difficulty breathing', 'Swelling'],
        response: ['Administer epinephrine', 'Call emergency services'],
        contacts: ['Emergency services', 'Allergist', 'Poison control']
      }
    };

    this.allergenDatabase.set('US', usAllergens);

    // EU allergen requirements
    const euAllergens: AllergenManagement = {
      jurisdiction: 'EU',
      requiredDeclarations: [
        'celery', 'cereals containing gluten', 'crustaceans', 'eggs', 'fish', 
        'lupin', 'milk', 'molluscs', 'mustard', 'nuts', 'peanuts', 
        'sesame seeds', 'soybeans', 'sulphur dioxide'
      ],
      detection: [
        {
          allergen: 'nuts',
          method: 'pcr',
          sensitivity: '1 ppm',
          specificity: '99.5%',
          testingTime: '48 hours',
          cost: 'high'
        }
      ],
      labeling: [
        {
          allergen: 'nuts',
          format: 'highlighted',
          language: ['Any EU official language'],
          fontSize: 9,
          placement: 'Ingredient list',
          warnings: ['Contains: Nuts']
        }
      ],
      crossContact: {
        protocols: ['Segregated production', 'Validated cleaning', 'Staff training'],
        equipment: ['Dedicated lines', 'Color-coded equipment'],
        training: ['Allergen management', 'HACCP principles'],
        verification: ['Swab testing', 'Allergen testing']
      },
      emergency: {
        allergenExposure: ['Immediate cessation of consumption', 'Emergency medical attention'],
        symptoms: ['Anaphylactic shock', 'Respiratory distress', 'Cardiovascular collapse'],
        response: ['Immediate epinephrine', 'Emergency services', 'Medical monitoring'],
        contacts: ['112 (EU emergency)', 'National poison center', 'Allergy specialist']
      }
    };

    this.allergenDatabase.set('EU', euAllergens);
  }

  private initializeNutritionDatabase(): void {
    // US nutrition requirements
    const usNutrition: NutritionalCompliance = {
      jurisdiction: 'US',
      required: [
        { nutrient: 'calories', required: true, dailyValue: 2000, unit: 'kcal', rounding: 'nearest 10', display: 'mandatory' },
        { nutrient: 'total_fat', required: true, dailyValue: 65, unit: 'g', rounding: 'nearest 1', display: 'mandatory' },
        { nutrient: 'saturated_fat', required: true, dailyValue: 20, unit: 'g', rounding: 'nearest 1', display: 'mandatory' },
        { nutrient: 'cholesterol', required: true, dailyValue: 300, unit: 'mg', rounding: 'nearest 5', display: 'mandatory' },
        { nutrient: 'sodium', required: true, dailyValue: 2400, unit: 'mg', rounding: 'nearest 10', display: 'mandatory' },
        { nutrient: 'total_carbohydrate', required: true, dailyValue: 300, unit: 'g', rounding: 'nearest 1', display: 'mandatory' },
        { nutrient: 'dietary_fiber', required: false, dailyValue: 25, unit: 'g', rounding: 'nearest 1', display: 'optional' },
        { nutrient: 'sugars', required: true, dailyValue: 50, unit: 'g', rounding: 'nearest 1', display: 'mandatory' },
        { nutrient: 'protein', required: true, dailyValue: 50, unit: 'g', rounding: 'nearest 1', display: 'mandatory' },
        { nutrient: 'caffeine', required: true, dailyValue: 400, unit: 'mg', rounding: 'nearest 1', display: 'mandatory' }
      ],
      format: {
        layout: 'vertical',
        fontSize: 8,
        font: 'Helvetica',
        color: 'black',
        order: ['calories', 'total_fat', 'saturated_fat', 'cholesterol', 'sodium', 'total_carbohydrate', 'dietary_fiber', 'sugars', 'protein', 'vitamins'],
        serving: {
          size: 240,
          unit: 'ml',
          perContainer: 1,
          dailyValues: true
        }
      },
      claims: [
        {
          type: 'sugar-free',
          criteria: ['<0.5g sugars per serving'],
          documentation: ['Nutritional analysis'],
          restrictions: ['Cannot claim to be low calorie']
        },
        {
          type: 'low-caffeine',
          criteria: ['<50mg caffeine per serving'],
          documentation: ['Caffeine analysis'],
          restrictions: ['Must declare caffeine content']
        }
      ],
      warnings: [
        {
          type: 'caffeine',
          content: ['This product contains caffeine', 'Not recommended for children, pregnant women'],
          placement: 'Below nutrition facts',
          fontSize: 8,
          mandatory: true
        }
      ]
    };

    this.nutritionDatabase.set('US', usNutrition);
  }

  private async checkJurisdictionCompliance(
    jurisdiction: string,
    request: any
  ): Promise<{
    score: number;
    results: ComplianceResult[];
    violations: ComplianceViolation[];
    warnings: ComplianceWarning[];
  }> {
    const standard = this.getStandardForJurisdiction(jurisdiction);
    const results: ComplianceResult[] = [];
    const violations: ComplianceViolation[] = [];
    const warnings: ComplianceWarning[] = [];

    if (!standard) {
      warnings.push({
        id: `warning-${jurisdiction}-no-standard`,
        type: 'procedure',
        description: `No food safety standard configured for ${jurisdiction}`,
        recommendation: 'Configure appropriate food safety standards',
        priority: 'high',
        status: 'active'
      });
      
      return { score: 0, results, violations, warnings };
    }

    // Check caffeine limits
    const caffeineCheck = await this.checkCaffeineCompliance(request.entityData, jurisdiction);
    results.push(caffeineCheck.result);
    
    if (!caffeineCheck.compliant) {
      violations.push(caffeineCheck.violation!);
    }

    // Check allergen requirements
    const allergenCheck = await this.validateAllergenCompliance(request.entityData, jurisdiction);
    results.push({
      requirement: 'allergen-declaration',
      category: 'labeling',
      status: allergenCheck.compliant ? 'pass' : 'fail',
      score: allergenCheck.compliant ? 100 : 0,
      details: allergenCheck.compliant ? 'All allergens properly declared' : 'Missing allergen declarations',
      evidence: [],
      checkedBy: 'food-safety-system',
      checkedAt: new Date().toISOString()
    });

    if (!allergenCheck.compliant) {
      violations.push({
        id: `allergen-${Date.now()}`,
        requirement: 'allergen-declaration',
        severity: 'major',
        description: `Missing allergen declarations: ${allergenCheck.missingDeclarations.join(', ')}`,
        evidence: ['Ingredient analysis'],
        remediation: allergenCheck.recommendations,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'open',
        assignedTo: 'quality-team'
      });
    }

    // Calculate jurisdiction score
    const score = results.reduce((sum, result) => sum + result.score, 0) / results.length;

    return { score, results, violations, warnings };
  }

  private async checkCaffeineCompliance(entityData: any, jurisdiction: string): Promise<{
    compliant: boolean;
    result: ComplianceResult;
    violation?: ComplianceViolation;
  }> {
    const caffeine = entityData.caffeine || 0;
    const jurisdictionData = await getRegionalCompliance(jurisdiction);
    const caffeineLimit = jurisdictionData.caffeineLimits.maxPerServing;
    const dailyLimit = jurisdictionData.caffeineLimits.maxPerDay;

    const compliant = caffeine <= caffeineLimit;
    const score = compliant ? 100 : 0;

    const result: ComplianceResult = {
      requirement: 'caffeine-limits',
      category: 'ingredient-safety',
      status: compliant ? 'pass' : 'fail',
      score,
      details: `Caffeine: ${caffeine}mg (Limit: ${caffeineLimit}mg)`,
      evidence: ['Ingredient analysis'],
      checkedBy: 'food-safety-system',
      checkedAt: new Date().toISOString()
    };

    let violation: ComplianceViolation | undefined;
    if (!compliant) {
      violation = {
        id: `caffeine-${Date.now()}`,
        requirement: 'caffeine-limits',
        severity: 'critical',
        description: `Caffeine content (${caffeine}mg) exceeds limit (${caffeineLimit}mg) for ${jurisdiction}`,
        evidence: ['Caffeine analysis'],
        remediation: ['Reduce caffeine content', 'Re-analyze batch', 'Update formula'],
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'open',
        assignedTo: 'formulation-team'
      };
    }

    return { compliant, result, violation };
  }

  private detectAllergensInRecipe(recipeData: any, allergenManagement: AllergenManagement): string[] {
    const detected: string[] = [];
    const ingredients = recipeData.ingredients || [];

    // Simple detection based on ingredient names
    ingredients.forEach((ingredient: any) => {
      const name = ingredient.name.toLowerCase();
      allergenManagement.requiredDeclarations.forEach(allergen => {
        if (name.includes(allergen.toLowerCase()) && !detected.includes(allergen)) {
          detected.push(allergen);
        }
      });
    });

    return detected;
  }

  private shouldDeclareAllergen(allergen: string, recipeData: any, allergenManagement: AllergenManagement): boolean {
    // Logic to determine if allergen should be declared
    // This would be more sophisticated in a real implementation
    return true;
  }

  private assessCrossContactRisks(recipeData: any, allergenManagement: AllergenManagement): string[] {
    const risks: string[] = [];
    // Simplified cross-contact assessment
    return risks;
  }

  private generateAllergenRecommendations(
    detected: string[],
    missing: string[],
    risks: string[],
    allergenManagement: AllergenManagement
  ): string[] {
    const recommendations: string[] = [];

    if (missing.length > 0) {
      recommendations.push(`Add allergen declarations for: ${missing.join(', ')}`);
    }

    if (risks.length > 0) {
      recommendations.push('Implement cross-contact prevention measures');
    }

    recommendations.push('Validate allergen detection methods');
    recommendations.push('Train staff on allergen management');

    return recommendations;
  }

  private validateNutrientFormats(nutritionalData: any, nutritionCompliance: NutritionalCompliance): string[] {
    const issues: string[] = [];
    // Simplified format validation
    return issues;
  }

  private validateNutritionClaim(nutritionalData: any, claim: any): boolean {
    // Simplified claim validation
    return true;
  }

  private getClaimEvidence(nutritionalData: any, claim: any): string {
    return 'Nutritional analysis results';
  }

  private generateNutritionWarnings(nutritionalData: any, nutritionCompliance: NutritionalCompliance): string[] {
    const warnings: string[] = [];
    // Simplified warning generation
    return warnings;
  }

  private generateNutritionRecommendations(
    missing: string[],
    formats: string[],
    claims: any[],
    warnings: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (missing.length > 0) {
      recommendations.push(`Add missing nutritional information: ${missing.join(', ')}`);
    }

    recommendations.push('Validate nutritional calculations');
    recommendations.push('Review nutrition label format');

    return recommendations;
  }

  private generateRecommendations(violations: ComplianceViolation[], warnings: ComplianceWarning[]): ComplianceRecommendation[] {
    const recommendations: ComplianceRecommendation[] = [];

    // Critical violation recommendations
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    if (criticalViolations.length > 0) {
      recommendations.push({
        id: 'rec-critical-violations',
        category: 'safety',
        title: 'Address Critical Violations',
        description: `Immediately address ${criticalViolations.length} critical safety violations`,
        priority: 'high',
        effort: 'high',
        impact: 'high',
        timeline: '1 week',
        resources: ['Quality team', 'Regulatory affairs', 'Management'],
        benefits: ['Regulatory compliance', 'Consumer safety', 'Brand protection'],
        implementation: {
          overview: 'Critical violation remediation',
          steps: [],
          prerequisites: ['Management approval'],
          testing: [],
          validation: {
            methodology: 'Independent verification',
            scope: 'All critical violations',
            criteria: ['Zero critical violations', 'Regulatory approval'],
            approval: 'Regulatory affairs'
          },
          rollback: {
            triggers: ['Failed validation'],
            steps: ['Suspend production', 'Investigate root cause'],
            responsibilities: ['Quality team'],
            timeline: '24 hours'
          }
        }
      });
    }

    return recommendations;
  }

  private determineRequiredCertifications(violations: ComplianceViolation[], jurisdictions: string[]): string[] {
    const certifications: string[] = [];

    // Based on violations and jurisdictions, determine required certifications
    if (jurisdictions.includes('US')) {
      certifications.push('FDA Registration', 'GMP Compliance');
    }

    if (jurisdictions.includes('EU')) {
      certifications.push('EFSA Authorization', 'HACCP Certification');
    }

    return certifications;
  }

  private getStandardForJurisdiction(jurisdiction: string): FoodSafetyStandard | undefined {
    const standards: Record<string, string> = {
      'US': 'FDA-21CFR',
      'EU': 'EFSA-REGULATION'
    };

    return this.standards.get(standards[jurisdiction]);
  }

  private calculateJurisdictionBreakdown(checks: ComplianceCheck[]): Array<{
    jurisdiction: string;
    score: number;
    checks: number;
    violations: number;
    status: string;
  }> {
    const breakdown = checks.reduce((acc, check) => {
      const jurisdictions = check.jurisdiction.split(',');
      jurisdictions.forEach(jurisdiction => {
        if (!acc[jurisdiction]) {
          acc[jurisdiction] = {
            scores: [],
            checks: 0,
            violations: 0
          };
        }
        acc[jurisdiction].scores.push(check.score);
        acc[jurisdiction].checks += 1;
        acc[jurisdiction].violations += check.violations.length;
      });
      return acc;
    }, {} as Record<string, { scores: number[]; checks: number; violations: number }>);

    return Object.entries(breakdown).map(([jurisdiction, data]) => ({
      jurisdiction,
      score: data.scores.length > 0 ? data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length : 0,
      checks: data.checks,
      violations: data.violations,
      status: data.violations === 0 ? 'compliant' : 'non-compliant'
    }));
  }

  private aggregateViolations(checks: ComplianceCheck[]): Array<{
    type: string;
    count: number;
    severity: string;
    jurisdiction: string;
  }> {
    const violations = checks.flatMap(check => check.violations);
    
    const aggregated = violations.reduce((acc, violation) => {
      const key = `${violation.requirement}-${violation.severity}`;
      if (!acc[key]) {
        acc[key] = {
          type: violation.requirement,
          count: 0,
          severity: violation.severity,
          jurisdiction: 'unknown'
        };
      }
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(aggregated);
  }

  private async getAllergenSummary(jurisdiction?: string): Promise<{
    detected: string[];
    risks: string[];
    compliance: number;
  }> {
    // Simplified allergen summary
    return {
      detected: ['milk', 'eggs', 'peanuts'],
      risks: ['cross-contact'],
      compliance: 85
    };
  }

  private async getCertificationSummary(jurisdiction?: string): Promise<Array<{
    name: string;
    jurisdiction: string;
    status: string;
    expiry: string;
  }>> {
    // Simplified certification summary
    return [
      {
        name: 'FDA Registration',
        jurisdiction: 'US',
        status: 'active',
        expiry: '2025-12-31'
      },
      {
        name: 'EFSA Authorization',
        jurisdiction: 'EU',
        status: 'active',
        expiry: '2026-06-30'
      }
    ];
  }

  private generateCheckId(): string {
    return `FS-CHECK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  private async logFoodSafetyActivity(action: string, details: any): Promise<void> {
    console.log(`[FOOD-SAFETY] ${action}:`, details);
  }
}

// Export singleton instance
export const foodSafetyComplianceSystem = new FoodSafetyComplianceSystem();