/**
 * Legal and Compliance Framework for Global Operations
 * 
 * Implements comprehensive legal compliance including:
 * - GDPR, CCPA, and other privacy law compliance
 * - Regional terms of service and privacy policies
 * - Cookie consent management by jurisdiction
 * - Data residency requirements
 * - Age verification legal compliance
 * 
 * @example
 * ```typescript
 * const compliance = await getLegalCompliance('EU');
 * const cookieConsent = generateCookieConsent('DE');
 * const privacyPolicy = generatePrivacyPolicy('CA');
 * ```
 */

export interface PrivacyLaw {
  region: string;
  law: string;
  jurisdiction: 'EU' | 'US' | 'CA' | 'AU' | 'Global';
  requirements: {
    consentRequired: boolean;
    dataMinimization: boolean;
    rightToErasure: boolean;
    dataPortability: boolean;
    breachNotification: boolean;
    consentAge?: number;
  };
  penalties: {
    maxFine: number;
    currency: string;
    additional: string[];
  };
  complianceDeadline: string;
}

export interface CookieConsentRequirement {
  region: string;
  consentRequired: boolean;
  consentTypes: {
    necessary: boolean;
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
  };
  consentGranularity: 'all_or_nothing' | 'by_category' | 'by_purpose';
  retentionPeriod: number; // days
  withdrawalMethod: string;
  consentProof: boolean;
}

export interface TermsOfService {
  region: string;
  applicableLaw: string;
  jurisdiction: string;
  requiredClauses: string[];
  disclaimers: string[];
  ageRequirements: {
    minimumAge: number;
    parentalConsent?: boolean;
    ageVerification?: boolean;
  };
  liability: {
    limitation: string;
    exclusion: string;
  };
  termination: {
    immediate: string[];
    notice: string;
  };
}

export interface DataResidency {
  region: string;
  residencyRequired: boolean;
  allowedRegions: string[];
  restrictedTransfer: boolean;
  adequacyDecision: boolean;
  safeguardsRequired: string[];
  storageLocation: string;
  retentionPeriod: number; // days
}

export interface AgeVerificationCompliance {
  region: string;
  required: boolean;
  methods: Array<{
    type: 'declaration' | 'id_verification' | 'credit_card' | 'third_party';
    accuracy: 'low' | 'medium' | 'high';
    cost: 'low' | 'medium' | 'high';
    userExperience: 'poor' | 'fair' | 'good';
  }>;
  ageThresholds: {
    general: number;
    restricted: number;
    prohibited: number;
  };
  penalties: string[];
}

export interface LegalComplianceFramework {
  region: string;
  privacyLaws: PrivacyLaw[];
  cookieConsent: CookieConsentRequirement;
  termsOfService: TermsOfService;
  dataResidency: DataResidency;
  ageVerification: AgeVerificationCompliance;
  additionalRequirements: string[];
  lastUpdated: string;
}

/**
 * Privacy laws database
 */
const PRIVACY_LAWS: Record<string, PrivacyLaw> = {
  'EU': {
    region: 'European Union',
    law: 'General Data Protection Regulation (GDPR)',
    jurisdiction: 'EU',
    requirements: {
      consentRequired: true,
      dataMinimization: true,
      rightToErasure: true,
      dataPortability: true,
      breachNotification: true,
      consentAge: 16
    },
    penalties: {
      maxFine: 20000000,
      currency: 'EUR',
      additional: ['or 4% of annual global turnover']
    },
    complianceDeadline: '2018-05-25'
  },
  'US_CA': {
    region: 'California',
    law: 'California Consumer Privacy Act (CCPA)',
    jurisdiction: 'US',
    requirements: {
      consentRequired: false, // Opt-out model
      dataMinimization: true,
      rightToErasure: true,
      dataPortability: true,
      breachNotification: true,
      consentAge: 16
    },
    penalties: {
      maxFine: 7500,
      currency: 'USD',
      additional: ['per violation']
    },
    complianceDeadline: '2020-01-01'
  },
  'US_VA': {
    region: 'Virginia',
    law: 'Virginia Consumer Data Protection Act (VCDPA)',
    jurisdiction: 'US',
    requirements: {
      consentRequired: true,
      dataMinimization: true,
      rightToErasure: true,
      dataPortability: true,
      breachNotification: true,
      consentAge: 16
    },
    penalties: {
      maxFine: 7500,
      currency: 'USD',
      additional: ['per violation']
    },
    complianceDeadline: '2023-01-01'
  },
  'CA': {
    region: 'Canada',
    law: 'Personal Information Protection and Electronic Documents Act (PIPEDA)',
    jurisdiction: 'CA',
    requirements: {
      consentRequired: true,
      dataMinimization: true,
      rightToErasure: true,
      dataPortability: false,
      breachNotification: true
    },
    penalties: {
      maxFine: 100000,
      currency: 'CAD',
      additional: ['for breach notification violations']
    },
    complianceDeadline: '2001-01-01'
  },
  'AU': {
    region: 'Australia',
    law: 'Privacy Act 1988',
    jurisdiction: 'AU',
    requirements: {
      consentRequired: true,
      dataMinimization: true,
      rightToErasure: true,
      dataPortability: false,
      breachNotification: true,
      consentAge: 16
    },
    penalties: {
      maxFine: 2220000,
      currency: 'AUD',
      additional: ['or 10% of annual turnover']
    },
    complianceDeadline: '1988-12-14'
  }
};

/**
 * Cookie consent requirements
 */
const COOKIE_CONSENT_REQUIREMENTS: Record<string, CookieConsentRequirement> = {
  'EU': {
    region: 'European Union',
    consentRequired: true,
    consentTypes: {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    },
    consentGranularity: 'by_category',
    retentionPeriod: 365, // 1 year
    withdrawalMethod: 'easy_withdrawal_option',
    consentProof: true
  },
  'US': {
    region: 'United States',
    consentRequired: false, // Opt-out model in most states
    consentTypes: {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    },
    consentGranularity: 'all_or_nothing',
    retentionPeriod: 90,
    withdrawalMethod: 'opt_out_link',
    consentProof: false
  },
  'CA': {
    region: 'Canada',
    consentRequired: true,
    consentTypes: {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    },
    consentGranularity: 'by_purpose',
    retentionPeriod: 180,
    withdrawalMethod: 'consent_withdrawal',
    consentProof: true
  }
};

/**
 * Terms of service templates
 */
const TERMS_OF_SERVICE_TEMPLATES: Record<string, TermsOfService> = {
  'EU': {
    region: 'European Union',
    applicableLaw: 'EU Consumer Rights Directive',
    jurisdiction: 'EU Member State of consumer residence',
    requiredClauses: [
      'Business information',
      'Contact details',
      'Product/service description',
      'Pricing and payment terms',
      'Delivery terms',
      'Right of withdrawal',
      'Warranty information',
      'Complaint procedures'
    ],
    disclaimers: [
      'Caffeine content warnings',
      'Health and safety disclaimers',
      'Age restrictions',
      'Professional advice disclaimer'
    ],
    ageRequirements: {
      minimumAge: 16,
      parentalConsent: false,
      ageVerification: false
    },
    liability: {
      limitation: 'Liability limited to direct damages only',
      exclusion: 'No liability for indirect or consequential damages'
    },
    termination: {
      immediate: ['breach_of_terms', 'fraud', 'illegal_use'],
      notice: '30 days notice for non-compliance'
    }
  },
  'US': {
    region: 'United States',
    applicableLaw: 'State consumer protection laws',
    jurisdiction: 'State law of user residence',
    requiredClauses: [
      'Service description',
      'User responsibilities',
      'Prohibited uses',
      'Intellectual property',
      'Limitation of liability',
      'Indemnification',
      'Termination',
      'Governing law'
    ],
    disclaimers: [
      'No warranty',
      'Caffeine warnings',
      'Age restrictions',
      'Professional advice disclaimer'
    ],
    ageRequirements: {
      minimumAge: 13,
      parentalConsent: false,
      ageVerification: false
    },
    liability: {
      limitation: 'Liability limited to amount paid',
      exclusion: 'No consequential damages'
    },
    termination: {
      immediate: ['violation_of_terms', 'fraud', 'illegal_activity'],
      notice: 'No notice required'
    }
  }
};

/**
 * Data residency requirements
 */
const DATA_RESIDENCY_REQUIREMENTS: Record<string, DataResidency> = {
  'EU': {
    region: 'European Union',
    residencyRequired: true,
    allowedRegions: ['EU', 'EEA', 'Adequate Countries'],
    restrictedTransfer: true,
    adequacyDecision: false,
    safeguardsRequired: [
      'Standard Contractual Clauses',
      'Binding Corporate Rules',
      'Certification schemes'
    ],
    storageLocation: 'EU/EEA',
    retentionPeriod: 2555 // 7 years
  },
  'US': {
    region: 'United States',
    residencyRequired: false,
    allowedRegions: ['US', 'Adequate Countries'],
    restrictedTransfer: false,
    adequacyDecision: false,
    safeguardsRequired: ['Privacy Shield', 'Standard Contractual Clauses'],
    storageLocation: 'US or adequate country',
    retentionPeriod: 1095 // 3 years
  },
  'CA': {
    region: 'Canada',
    residencyRequired: false,
    allowedRegions: ['CA', 'Adequate Countries'],
    restrictedTransfer: false,
    adequacyDecision: false,
    safeguardsRequired: ['Contractual safeguards'],
    storageLocation: 'Canada or adequate country',
    retentionPeriod: 1825 // 5 years
  }
};

/**
 * Age verification compliance
 */
const AGE_VERIFICATION_COMPLIANCE: Record<string, AgeVerificationCompliance> = {
  'US': {
    region: 'United States',
    required: false,
    methods: [
      {
        type: 'declaration',
        accuracy: 'low',
        cost: 'low',
        userExperience: 'good'
      },
      {
        type: 'credit_card',
        accuracy: 'medium',
        cost: 'Experience: 'fairmedium',
        user'
      },
      {
        type: 'third_party',
        accuracy: 'high',
        cost: 'high',
        userExperience: 'poor'
      }
    ],
    ageThresholds: {
      general: 13,
      restricted: 18,
      prohibited: 21
    },
    penalties: ['Business restrictions', 'State penalties']
  },
  'EU': {
    region: 'European Union',
    required: true,
    methods: [
      {
        type: 'id_verification',
        accuracy: 'high',
        cost: 'medium',
        userExperience: 'fair'
      },
      {
        type: 'declaration',
        accuracy: 'low',
        cost: 'low',
        userExperience: 'good'
      }
    ],
    ageThresholds: {
      general: 16,
      restricted: 18,
      prohibited: 16
    },
    penalties: ['Administrative fines', 'License suspension']
  },
  'AU': {
    region: 'Australia',
    required: true,
    methods: [
      {
        type: 'id_verification',
        accuracy: 'high',
        cost: 'medium',
        userExperience: 'fair'
      }
    ],
    ageThresholds: {
      general: 18,
      restricted: 18,
      prohibited: 18
    },
    penalties: ['Fines up to AUD 1.1M', 'Imprisonment up to 10 years']
  }
};

/**
 * Get legal compliance framework for a region
 */
export function getLegalComplianceFramework(region: string): LegalComplianceFramework {
  const privacyLaws = Object.values(PRIVACY_LAWS).filter(law => 
    law.region.toLowerCase().includes(region.toLowerCase()) ||
    region.toUpperCase() === 'EU' && (law.jurisdiction === 'EU' || law.region.includes('EU'))
  );

  return {
    region,
    privacyLaws,
    cookieConsent: COOKIE_CONSENT_REQUIREMENTS[region] || COOKIE_CONSENT_REQUIREMENTS['US'],
    termsOfService: TERMS_OF_SERVICE_TEMPLATES[region] || TERMS_OF_SERVICE_TEMPLATES['US'],
    dataResidency: DATA_RESIDENCY_REQUIREMENTS[region] || DATA_RESIDENCY_REQUIREMENTS['US'],
    ageVerification: AGE_VERIFICATION_COMPLIANCE[region] || AGE_VERIFICATION_COMPLIANCE['US'],
    additionalRequirements: [],
    lastUpdated: '2025-12-10'
  };
}

/**
 * Generate privacy policy for a region
 */
export function generatePrivacyPolicy(region: string): string {
  const framework = getLegalComplianceFramework(region);
  const privacyLaw = framework.privacyLaws[0];

  let policy = `# Privacy Policy - ${region}\n\n`;
  
  if (privacyLaw) {
    policy += `## Legal Basis\n`;
    policy += `This privacy policy is compliant with ${privacyLaw.law}.\n\n`;
  }

  policy += `## Data Collection\n`;
  policy += `We collect the following types of personal data:\n`;
  policy += `- Account information (email, username)\n`;
  policy += `- Recipe preferences and usage data\n`;
  policy += `- Payment information (processed securely)\n`;
  policy += `- Age verification data (where required)\n\n`;

  policy += `## Data Use\n`;
  policy += `Your data is used for:\n`;
  policy += `- Providing our energy drink calculator service\n`;
  policy += `- Recipe personalization\n`;
  policy += `- Age verification compliance\n`;
  policy += `- Service improvement\n\n`;

  if (privacyLaw?.requirements.rightToErasure) {
    policy += `## Your Rights\n`;
    policy += `Under ${privacyLaw.law}, you have the right to:\n`;
    policy += `- Access your personal data\n`;
    policy += `- Rectify inaccurate data\n`;
    policy += `- Erase your data ('right to be forgotten')\n`;
    if (privacyLaw.requirements.dataPortability) {
      policy += `- Data portability\n`;
    }
    policy += `- Object to processing\n`;
    policy += `- Withdraw consent\n\n`;
  }

  policy += `## Contact\n`;
  policy += `For privacy questions, contact: privacy@energydrinkguide.com\n\n`;

  return policy;
}

/**
 * Generate terms of service for a region
 */
export function generateTermsOfService(region: string): string {
  const framework = getLegalComplianceFramework(region);
  const terms = framework.termsOfService;

  let tos = `# Terms of Service - ${region}\n\n`;

  tos += `## Acceptance of Terms\n`;
  tos += `By using this service, you agree to these terms.\n\n`;

  tos += `## Service Description\n`;
  tos += `We provide an energy drink calculator and recipe guidance service.\n\n`;

  tos += `## Age Requirements\n`;
  tos += `You must be at least ${terms.ageRequirements.minimumAge} years old to use this service.\n`;
  if (terms.ageRequirements.ageVerification) {
    tos += `Age verification may be required.\n`;
  }
  tos += `\n`;

  tos += `## Safety Disclaimers\n`;
  tos += `- This service provides general guidance only\n`;
  tos += `- Consult healthcare professionals for medical advice\n`;
  tos += `- Caffeine content warnings must be respected\n`;
  tos += `- Follow all local regulations and safety guidelines\n\n`;

  tos += `## Limitation of Liability\n`;
  tos += `${terms.liability.limitation}\n`;
  tos += `${terms.liability.exclusion}\n\n`;

  tos += `## Governing Law\n`;
  tos += `These terms are governed by ${terms.applicableLaw}.\n`;
  tos += `Jurisdiction: ${terms.jurisdiction}\n\n`;

  return tos;
}

/**
 * Generate cookie consent banner content
 */
export function generateCookieConsent(region: string): {
  title: string;
  message: string;
  acceptButton: string;
  rejectButton?: string;
  settingsButton: string;
  categories: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
} {
  const requirements = COOKIE_CONSENT_REQUIREMENTS[region] || COOKIE_CONSENT_REQUIREMENTS['US'];

  const banner = {
    title: 'Cookie Consent',
    message: 'We use cookies to enhance your experience and analyze our service.',
    acceptButton: 'Accept All',
    settingsButton: 'Cookie Settings',
    categories: [
      {
        name: 'Necessary',
        description: 'Essential for website functionality',
        required: true
      },
      {
        name: 'Functional',
        description: 'Enables enhanced features and personalization',
        required: false
      },
      {
        name: 'Analytics',
        description: 'Helps us understand how you use our service',
        required: false
      },
      {
        name: 'Marketing',
        description: 'Used to deliver relevant advertisements',
        required: false
      }
    ]
  };

  if (requirements.consentRequired) {
    banner.rejectButton = 'Reject All';
  }

  return banner;
}

/**
 * Check if age verification is required for region
 */
export function isAgeVerificationRequired(region: string): boolean {
  const compliance = AGE_VERIFICATION_COMPLIANCE[region];
  return compliance?.required || false;
}

/**
 * Get required age for region
 */
export function getMinimumAge(region: string): number {
  const compliance = AGE_VERIFICATION_COMPLIANCE[region];
  return compliance?.ageThresholds.general || 13;
}

/**
 * Check data residency requirements
 */
export function checkDataResidencyCompliance(
  region: string,
  storageLocation: string
): {
  compliant: boolean;
  issues: string[];
  recommendations: string[];
} {
  const residency = DATA_RESIDENCY_REQUIREMENTS[region];
  
  if (!residency) {
    return {
      compliant: true,
      issues: [],
      recommendations: []
    };
  }

  const issues: string[] = [];
  const recommendations: string[] = [];

  if (residency.residencyRequired) {
    if (!residency.allowedRegions.some(allowed => 
      storageLocation.toLowerCase().includes(allowed.toLowerCase())
    )) {
      issues.push(`Data storage location ${storageLocation} not allowed for ${region}`);
      recommendations.push(`Move data to ${residency.storageLocation}`);
    }
  }

  return {
    compliant: issues.length === 0,
    issues,
    recommendations
  };
}

/**
 * Validate privacy policy compliance
 */
export function validatePrivacyPolicy(
  policy: string,
  region: string
): {
  compliant: boolean;
  missing: string[];
  recommendations: string[];
} {
  const framework = getLegalComplianceFramework(region);
  const privacyLaw = framework.privacyLaws[0];

  const requiredElements: string[] = [];
  const missing: string[] = [];
  const recommendations: string[] = [];

  if (privacyLaw) {
    if (privacyLaw.requirements.consentRequired) {
      requiredElements.push('consent mechanism');
    }
    if (privacyLaw.requirements.rightToErasure) {
      requiredElements.push('right to erasure');
    }
    if (privacyLaw.requirements.dataPortability) {
      requiredElements.push('data portability');
    }
    requiredElements.push('contact information');
    requiredElements.push('legal basis');
  }

  for (const element of requiredElements) {
    if (!policy.toLowerCase().includes(element.toLowerCase())) {
      missing.push(element);
    }
  }

  return {
    compliant: missing.length === 0,
    missing,
    recommendations: missing.map(m => `Add ${m} section`)
  };
}

/**
 * Get privacy law penalties for a region
 */
export function getPrivacyLawPenalties(region: string): Array<{
  law: string;
  maxFine: number;
  currency: string;
  additional: string[];
}> {
  const framework = getLegalComplianceFramework(region);
  
  return framework.privacyLaws.map(law => ({
    law: law.law,
    maxFine: law.penalties.maxFine,
    currency: law.penalties.currency,
    additional: law.penalties.additional
  }));
}

/**
 * Generate compliance checklist for region
 */
export function generateComplianceChecklist(region: string): Array<{
  category: string;
  requirement: string;
  status: 'compliant' | 'partial' | 'non_compliant';
  priority: 'high' | 'medium' | 'low';
  actionRequired: string;
}> {
  const framework = getLegalComplianceFramework(region);
  const checklist = [];

  // Privacy compliance
  checklist.push({
    category: 'Privacy',
    requirement: 'Privacy policy published',
    status: 'partial',
    priority: 'high',
    actionRequired: 'Generate and publish region-specific privacy policy'
  });

  checklist.push({
    category: 'Privacy',
    requirement: 'Cookie consent mechanism',
    status: framework.cookieConsent.consentRequired ? 'partial' : 'compliant',
    priority: 'high',
    actionRequired: framework.cookieConsent.consentRequired ? 
      'Implement cookie consent banner' : 'No action required (opt-out model)'
  });

  // Age verification
  checklist.push({
    category: 'Age Verification',
    requirement: 'Age verification system',
    status: isAgeVerificationRequired(region) ? 'partial' : 'compliant',
    priority: 'high',
    actionRequired: isAgeVerificationRequired(region) ?
      'Implement age verification system' : 'No action required'
  });

  // Data residency
  checklist.push({
    category: 'Data Residency',
    requirement: 'Data storage compliance',
    status: 'partial',
    priority: 'medium',
    actionRequired: 'Verify data storage locations comply with regional requirements'
  });

  // Terms of service
  checklist.push({
    category: 'Legal',
    requirement: 'Terms of service',
    status: 'partial',
    priority: 'high',
    actionRequired: 'Generate region-specific terms of service'
  });

  return checklist;
}

/**
 * Get all supported regions for legal compliance
 */
export function getSupportedLegalRegions(): Array<{
  code: string;
  name: string;
  primaryLaw: string;
  requiresConsent: boolean;
  requiresAgeVerification: boolean;
}> {
  const regions = [
    { code: 'EU', name: 'European Union', law: 'GDPR', consent: true, ageVerify: true },
    { code: 'US', name: 'United States', law: 'CCPA', consent: false, ageVerify: false },
    { code: 'CA', name: 'Canada', law: 'PIPEDA', consent: true, ageVerify: false },
    { code: 'AU', name: 'Australia', law: 'Privacy Act 1988', consent: true, ageVerify: true }
  ];

  return regions.map(region => ({
    code: region.code,
    name: region.name,
    primaryLaw: region.law,
    requiresConsent: region.consent,
    requiresAgeVerification: region.ageVerify
  }));
}

export default {
  getLegalComplianceFramework,
  generatePrivacyPolicy,
  generateTermsOfService,
  generateCookieConsent,
  isAgeVerificationRequired,
  getMinimumAge,
  checkDataResidencyCompliance,
  validatePrivacyPolicy,
  getPrivacyLawPenalties,
  generateComplianceChecklist,
  getSupportedLegalRegions
};