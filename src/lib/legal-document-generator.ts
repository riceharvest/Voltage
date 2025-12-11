/**
 * International Legal Documents Generator
 * 
 * Generates comprehensive legal documents including privacy policies, terms of service,
 * cookie policies, and age-specific terms for all supported jurisdictions.
 */

import { getLegalComplianceFramework } from './legal-compliance';
import { getSupportedLegalRegions } from './legal-compliance';

export interface LegalDocument {
  id: string;
  type: 'privacy-policy' | 'terms-of-service' | 'cookie-policy' | 'age-terms' | 'data-processing-agreement';
  jurisdiction: string;
  language: string;
  title: string;
  content: string;
  effectiveDate: string;
  lastUpdated: string;
  version: string;
  status: 'draft' | 'active' | 'archived';
  requiredDisclosures: string[];
  consentRequired: boolean;
  ageRestrictions?: {
    minimumAge: number;
    requiresParentalConsent: boolean;
    verificationMethod: string;
  };
}

export interface PrivacyPolicySection {
  id: string;
  title: string;
  content: string;
  required: boolean;
  jurisdiction: string[];
  lastUpdated: string;
}

export interface TermsClause {
  id: string;
  title: string;
  content: string;
  required: boolean;
  jurisdiction: string[];
  category: 'general' | 'liability' | 'privacy' | 'age' | 'safety' | 'compliance';
  precedence: number;
}

export class LegalDocumentGenerator {
  private documents: Map<string, LegalDocument> = new Map();

  constructor() {
    this.initializeDefaultDocuments();
  }

  /**
   * Generate comprehensive privacy policy for jurisdiction
   */
  generatePrivacyPolicy(
    jurisdiction: string, 
    language: string = 'en',
    options: {
      includeDataProcessing?: boolean;
      includeCookiePolicy?: boolean;
      includeAgeRestrictions?: boolean;
      includeThirdPartyServices?: boolean;
      includeInternationalTransfers?: boolean;
    } = {}
  ): string {
    const framework = getLegalComplianceFramework(jurisdiction);
    const sections: PrivacyPolicySection[] = [];

    // Required sections based on jurisdiction
    sections.push({
      id: 'introduction',
      title: this.getLocalizedText('introduction', language),
      content: this.generateIntroduction(jurisdiction, language),
      required: true,
      jurisdiction: [jurisdiction],
      lastUpdated: new Date().toISOString()
    });

    sections.push({
      id: 'data-collection',
      title: this.getLocalizedText('dataCollection', language),
      content: this.generateDataCollectionSection(jurisdiction, language),
      required: true,
      jurisdiction: [jurisdiction],
      lastUpdated: new Date().toISOString()
    });

    sections.push({
      id: 'data-use',
      title: this.getLocalizedText('dataUse', language),
      content: this.generateDataUseSection(jurisdiction, language),
      required: true,
      jurisdiction: [jurisdiction],
      lastUpdated: new Date().toISOString()
    });

    // GDPR-specific sections
    if (jurisdiction === 'EU' || framework.privacyLaws.some(law => law.law.includes('GDPR'))) {
      sections.push({
        id: 'legal-basis',
        title: this.getLocalizedText('legalBasis', language),
        content: this.generateLegalBasisSection(jurisdiction, language),
        required: true,
        jurisdiction: [jurisdiction],
        lastUpdated: new Date().toISOString()
      });

      sections.push({
        id: 'data-subject-rights',
        title: this.getLocalizedText('dataSubjectRights', language),
        content: this.generateDataSubjectRightsSection(jurisdiction, language),
        required: true,
        jurisdiction: [jurisdiction],
        lastUpdated: new Date().toISOString()
      });

      sections.push({
        id: 'retention',
        title: this.getLocalizedText('dataRetention', language),
        content: this.generateRetentionSection(jurisdiction, language),
        required: true,
        jurisdiction: [jurisdiction],
        lastUpdated: new Date().toISOString()
      });
    }

    // Cookie policy if requested
    if (options.includeCookiePolicy) {
      sections.push({
        id: 'cookies',
        title: this.getLocalizedText('cookies', language),
        content: this.generateCookieSection(jurisdiction, language),
        required: framework.cookieConsent.consentRequired,
        jurisdiction: [jurisdiction],
        lastUpdated: new Date().toISOString()
      });
    }

    // International transfers
    if (options.includeInternationalTransfers) {
      sections.push({
        id: 'international-transfers',
        title: this.getLocalizedText('internationalTransfers', language),
        content: this.generateInternationalTransfersSection(jurisdiction, language),
        required: true,
        jurisdiction: [jurisdiction],
        lastUpdated: new Date().toISOString()
      });
    }

    // Third party services
    if (options.includeThirdPartyServices) {
      sections.push({
        id: 'third-party',
        title: this.getLocalizedText('thirdPartyServices', language),
        content: this.generateThirdPartySection(jurisdiction, language),
        required: true,
        jurisdiction: [jurisdiction],
        lastUpdated: new Date().toISOString()
      });
    }

    sections.push({
      id: 'contact',
      title: this.getLocalizedText('contact', language),
      content: this.generateContactSection(jurisdiction, language),
      required: true,
      jurisdiction: [jurisdiction],
      lastUpdated: new Date().toISOString()
    });

    return this.compileDocument(sections, 'privacy-policy', jurisdiction, language);
  }

  /**
   * Generate terms of service for jurisdiction
   */
  generateTermsOfService(
    jurisdiction: string,
    language: string = 'en',
    options: {
      includeAgeRestrictions?: boolean;
      includeLiability?: boolean;
      includeSafetyDisclaimers?: boolean;
      includeRegulatoryCompliance?: boolean;
    } = {}
  ): string {
    const framework = getLegalComplianceFramework(jurisdiction);
    const clauses: TermsClause[] = [];

    // Standard clauses
    clauses.push({
      id: 'acceptance',
      title: this.getLocalizedText('acceptance', language),
      content: this.generateAcceptanceClause(jurisdiction, language),
      required: true,
      jurisdiction: [jurisdiction],
      category: 'general',
      precedence: 1
    });

    clauses.push({
      id: 'service-description',
      title: this.getLocalizedText('serviceDescription', language),
      content: this.generateServiceDescriptionClause(jurisdiction, language),
      required: true,
      jurisdiction: [jurisdiction],
      category: 'general',
      precedence: 2
    });

    // Age restrictions if required
    if (options.includeAgeRestrictions || framework.ageVerification.required) {
      clauses.push({
        id: 'age-requirements',
        title: this.getLocalizedText('ageRequirements', language),
        content: this.generateAgeRequirementsClause(jurisdiction, language),
        required: framework.ageVerification.required,
        jurisdiction: [jurisdiction],
        category: 'age',
        precedence: 3
      });
    }

    // Safety disclaimers for energy drink platform
    if (options.includeSafetyDisclaimers) {
      clauses.push({
        id: 'safety-disclaimers',
        title: this.getLocalizedText('safetyDisclaimers', language),
        content: this.generateSafetyDisclaimersClause(jurisdiction, language),
        required: true,
        jurisdiction: [jurisdiction],
        category: 'safety',
        precedence: 4
      });

      clauses.push({
        id: 'caffeine-warnings',
        title: this.getLocalizedText('caffeineWarnings', language),
        content: this.generateCaffeineWarningsClause(jurisdiction, language),
        required: true,
        jurisdiction: [jurisdiction],
        category: 'safety',
        precedence: 5
      });
    }

    // Liability limitations
    if (options.includeLiability) {
      clauses.push({
        id: 'liability',
        title: this.getLocalizedText('liability', language),
        content: this.generateLiabilityClause(jurisdiction, language),
        required: true,
        jurisdiction: [jurisdiction],
        category: 'liability',
        precedence: 6
      });
    }

    // Regulatory compliance
    if (options.includeRegulatoryCompliance) {
      clauses.push({
        id: 'regulatory-compliance',
        title: this.getLocalizedText('regulatoryCompliance', language),
        content: this.generateRegulatoryComplianceClause(jurisdiction, language),
        required: true,
        jurisdiction: [jurisdiction],
        category: 'compliance',
        precedence: 7
      });
    }

    clauses.push({
      id: 'termination',
      title: this.getLocalizedText('termination', language),
      content: this.generateTerminationClause(jurisdiction, language),
      required: true,
      jurisdiction: [jurisdiction],
      category: 'general',
      precedence: 8
    });

    clauses.push({
      id: 'governing-law',
      title: this.getLocalizedText('governingLaw', language),
      content: this.generateGoverningLawClause(jurisdiction, language),
      required: true,
      jurisdiction: [jurisdiction],
      category: 'general',
      precedence: 9
    });

    return this.compileTermsDocument(clauses, jurisdiction, language);
  }

  /**
   * Generate cookie policy for jurisdiction
   */
  generateCookiePolicy(jurisdiction: string, language: string = 'en'): string {
    const framework = getLegalComplianceFramework(jurisdiction);
    const consent = framework.cookieConsent;

    let content = `# ${this.getLocalizedText('cookiePolicy', language)}\n\n`;
    content += this.getLocalizedText('cookiePolicyIntroduction', language) + '\n\n';

    // What are cookies
    content += `## ${this.getLocalizedText('whatAreCookies', language)}\n`;
    content += this.getLocalizedText('whatAreCookiesContent', language) + '\n\n';

    // Types of cookies
    content += `## ${this.getLocalizedText('typesOfCookies', language)}\n`;
    content += this.generateTypesOfCookiesSection(jurisdiction, language) + '\n\n';

    // How we use cookies
    content += `## ${this.getLocalizedText('howWeUseCookies', language)}\n`;
    content += this.generateHowWeUseCookiesSection(jurisdiction, language) + '\n\n';

    // Cookie consent
    if (consent.consentRequired) {
      content += `## ${this.getLocalizedText('cookieConsent', language)}\n`;
      content += this.generateCookieConsentSection(jurisdiction, language) + '\n\n';
    }

    // Managing cookies
    content += `## ${this.getLocalizedText('managingCookies', language)}\n`;
    content += this.generateManagingCookiesSection(jurisdiction, language) + '\n\n';

    // Contact information
    content += `## ${this.getLocalizedText('contact', language)}\n`;
    content += this.getLocalizedText('cookiePolicyContact', language) + '\n\n';

    return content;
  }

  /**
   * Generate age-specific terms for different verification levels
   */
  generateAgeSpecificTerms(
    ageGroup: 'minor' | 'young-adult' | 'adult',
    jurisdiction: string,
    language: string = 'en'
  ): string {
    const framework = getLegalComplianceFramework(jurisdiction);
    const minimumAge = framework.ageVerification.ageThresholds.general;

    let content = `# ${this.getLocalizedText('ageSpecificTerms', language)} - ${ageGroup}\n\n`;

    switch (ageGroup) {
      case 'minor':
        content += this.generateMinorTerms(jurisdiction, language, minimumAge);
        break;
      case 'young-adult':
        content += this.generateYoungAdultTerms(jurisdiction, language, minimumAge);
        break;
      case 'adult':
        content += this.generateAdultTerms(jurisdiction, language);
        break;
    }

    return content;
  }

  /**
   * Generate data processing agreement for GDPR compliance
   */
  generateDataProcessingAgreement(
    controllerDetails: any,
    processorDetails: any,
    jurisdiction: string = 'EU'
  ): string {
    let content = `# Data Processing Agreement (DPA)\n\n`;
    content += `**Effective Date:** ${new Date().toISOString().split('T')[0]}\n`;
    content += `**Jurisdiction:** ${jurisdiction}\n\n`;

    content += `## 1. Parties\n\n`;
    content += `**Controller:** ${controllerDetails.name}\n`;
    content += `**Processor:** ${processorDetails.name}\n\n`;

    content += `## 2. Subject Matter and Duration\n\n`;
    content += `This DPA governs the processing of personal data by the Processor on behalf of the Controller.\n\n`;

    content += `## 3. Types of Personal Data\n\n`;
    content += `- Account information (email, username)\n`;
    content += `- Recipe preferences and usage data\n`;
    content += `- Age verification data (where required)\n`;
    content += `- Analytics and performance data\n\n`;

    content += `## 4. Categories of Data Subjects\n\n`;
    content += `- Users of the energy drink calculator service\n`;
    content += `- Recipe contributors\n`;
    content += `- Customer support inquiries\n\n`;

    content += `## 5. Processor Obligations\n\n`;
    content += `The Processor shall:\n`;
    content += `- Process data only on documented instructions\n`;
    content += `- Ensure confidentiality of processing\n`;
    content += `- Implement appropriate technical and organizational measures\n`;
    content += `- Assist with data subject rights\n`;
    content += `- Delete or return data at the end of the service\n\n`;

    content += `## 6. Security Measures\n\n`;
    content += `- Encryption of personal data\n`;
    content += `- Pseudonymization where possible\n`;
    content += `- Regular security assessments\n`;
    content += `- Access controls and authentication\n\n`;

    content += `## 7. International Transfers\n\n`;
    content += `Any international transfers shall comply with Chapter V of the GDPR.\n\n`;

    return content;
  }

  /**
   * Store generated document
   */
  storeDocument(document: LegalDocument): void {
    this.documents.set(document.id, document);
  }

  /**
   * Get stored document
   */
  getDocument(id: string): LegalDocument | undefined {
    return this.documents.get(id);
  }

  /**
   * Get all documents for jurisdiction
   */
  getDocumentsByJurisdiction(jurisdiction: string): LegalDocument[] {
    return Array.from(this.documents.values()).filter(doc => doc.jurisdiction === jurisdiction);
  }

  // Private helper methods

  private initializeDefaultDocuments(): void {
    const regions = getSupportedLegalRegions();
    
    regions.forEach(region => {
      // Generate and store default documents for each region
      const privacyPolicy = this.generatePrivacyPolicy(region.code, 'en');
      const termsOfService = this.generateTermsOfService(region.code, 'en');
      const cookiePolicy = this.generateCookiePolicy(region.code, 'en');

      this.storeDocument({
        id: `privacy-${region.code}-en`,
        type: 'privacy-policy',
        jurisdiction: region.code,
        language: 'en',
        title: `Privacy Policy - ${region.name}`,
        content: privacyPolicy,
        effectiveDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        version: '1.0',
        status: 'active',
        requiredDisclosures: ['data-collection', 'data-use', 'contact'],
        consentRequired: region.requiresConsent
      });

      this.storeDocument({
        id: `terms-${region.code}-en`,
        type: 'terms-of-service',
        jurisdiction: region.code,
        language: 'en',
        title: `Terms of Service - ${region.name}`,
        content: termsOfService,
        effectiveDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        version: '1.0',
        status: 'active',
        requiredDisclosures: ['acceptance', 'service-description', 'liability'],
        consentRequired: false,
        ageRestrictions: {
          minimumAge: region.requiresAgeVerification ? 16 : 13,
          requiresParentalConsent: region.requiresAgeVerification,
          verificationMethod: region.requiresAgeVerification ? 'id_verification' : 'declaration'
        }
      });

      this.storeDocument({
        id: `cookies-${region.code}-en`,
        type: 'cookie-policy',
        jurisdiction: region.code,
        language: 'en',
        title: `Cookie Policy - ${region.name}`,
        content: cookiePolicy,
        effectiveDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        version: '1.0',
        status: 'active',
        requiredDisclosures: ['cookie-types', 'cookie-usage'],
        consentRequired: region.requiresConsent
      });
    });
  }

  private compileDocument(
    sections: PrivacyPolicySection[], 
    type: string, 
    jurisdiction: string, 
    language: string
  ): string {
    let content = `# ${this.getLocalizedText(type.replace('-', ' '), language)}\n\n`;
    content += `**${jurisdiction} - ${language.toUpperCase()}**\n`;
    content += `**Effective Date:** ${new Date().toISOString().split('T')[0]}\n`;
    content += `**Last Updated:** ${new Date().toISOString().split('T')[0]}\n\n`;

    // Sort sections by requirement (required first) then alphabetically
    sections.sort((a, b) => {
      if (a.required !== b.required) {
        return a.required ? -1 : 1;
      }
      return a.title.localeCompare(b.title);
    });

    sections.forEach(section => {
      content += `## ${section.title}\n\n`;
      content += `${section.content}\n\n`;
    });

    return content;
  }

  private compileTermsDocument(
    clauses: TermsClause[], 
    jurisdiction: string, 
    language: string
  ): string {
    let content = `# ${this.getLocalizedText('termsOfService', language)}\n\n`;
    content += `**${jurisdiction} - ${language.toUpperCase()}**\n`;
    content += `**Effective Date:** ${new Date().toISOString().split('T')[0]}\n`;
    content += `**Last Updated:** ${new Date().toISOString().split('T')[0]}\n\n`;

    // Sort clauses by precedence
    clauses.sort((a, b) => a.precedence - b.precedence);

    clauses.forEach(clause => {
      content += `## ${clause.title}\n\n`;
      content += `${clause.content}\n\n`;
    });

    return content;
  }

  private getLocalizedText(key: string, language: string): string {
    const translations: Record<string, Record<string, string>> = {
      en: {
        'introduction': 'Introduction',
        'dataCollection': 'Information We Collect',
        'dataUse': 'How We Use Your Information',
        'legalBasis': 'Legal Basis for Processing',
        'dataSubjectRights': 'Your Rights',
        'dataRetention': 'Data Retention',
        'cookies': 'Cookies and Tracking',
        'internationalTransfers': 'International Data Transfers',
        'thirdPartyServices': 'Third-Party Services',
        'contact': 'Contact Us',
        'acceptance': 'Acceptance of Terms',
        'serviceDescription': 'Service Description',
        'ageRequirements': 'Age Requirements',
        'safetyDisclaimers': 'Safety Disclaimers',
        'caffeineWarnings': 'Caffeine Content Warnings',
        'liability': 'Limitation of Liability',
        'regulatoryCompliance': 'Regulatory Compliance',
        'termination': 'Termination',
        'governingLaw': 'Governing Law',
        'cookiePolicy': 'Cookie Policy',
        'cookiePolicyIntroduction': 'This Cookie Policy explains how we use cookies and similar technologies.',
        'whatAreCookies': 'What are Cookies?',
        'whatAreCookiesContent': 'Cookies are small text files that are placed on your device when you visit our website.',
        'typesOfCookies': 'Types of Cookies',
        'howWeUseCookies': 'How We Use Cookies',
        'cookieConsent': 'Cookie Consent',
        'managingCookies': 'Managing Cookies',
        'cookiePolicyContact': 'For questions about cookies, contact us at privacy@energydrinkguide.com',
        'ageSpecificTerms': 'Age-Specific Terms',
        'termsOfService': 'Terms of Service'
      },
      es: {
        'introduction': 'Introducción',
        'contact': 'Contáctanos'
      }
    };

    return translations[language]?.[key] || translations['en'][key] || key;
  }

  private generateIntroduction(jurisdiction: string, language: string): string {
    return `This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our energy drink calculator and recipe guidance service. We are committed to protecting your privacy and complying with applicable data protection laws in ${jurisdiction}.`;
  }

  private generateDataCollectionSection(jurisdiction: string, language: string): string {
    return `We collect the following types of information:
- Account information (email address, username)
- Recipe preferences and usage data
- Age verification data (where required by law)
- Payment information (processed securely through third parties)
- Analytics and performance data
- Safety-related information and preferences`;
  }

  private generateDataUseSection(jurisdiction: string, language: string): string {
    return `Your information is used for:
- Providing and improving our energy drink calculator service
- Personalizing recipe recommendations
- Ensuring compliance with age verification requirements
- Processing transactions and payments
- Providing customer support
- Complying with legal obligations
- Protecting against fraud and abuse`;
  }

  private generateLegalBasisSection(jurisdiction: string, language: string): string {
    return `Under GDPR, we process personal data based on:
- **Consent:** For non-essential cookies and marketing communications
- **Contract:** For providing our services to users
- **Legal obligation:** For age verification and regulatory compliance
- **Legitimate interests:** For service improvement and security (balanced against your rights)`;
  }

  private generateDataSubjectRightsSection(jurisdiction: string, language: string): string {
    return `Under GDPR, you have the right to:
- **Access:** Request copies of your personal data
- **Rectification:** Request correction of inaccurate data
- **Erasure:** Request deletion of your data ('right to be forgotten')
- **Portability:** Request transfer of your data to another service
- **Restriction:** Request limitation of processing
- **Objection:** Object to processing based on legitimate interests
- **Withdraw consent:** At any time, where processing is based on consent`;
  }

  private generateRetentionSection(jurisdiction: string, language: string): string {
    return `We retain your personal data only as long as necessary for:
- Providing our services
- Complying with legal obligations
- Resolving disputes
- Enforcing our agreements

Typical retention periods:
- Account data: 7 years after account closure
- Usage data: 3 years for analytics
- Age verification data: As required by local law
- Support communications: 3 years`;
  }

  private generateCookieSection(jurisdiction: string, language: string): string {
    return `We use cookies and similar technologies to:
- Remember your preferences and settings
- Provide essential website functionality
- Analyze website usage and performance
- Provide personalized content and recommendations

You can manage your cookie preferences through our cookie consent banner or your browser settings.`;
  }

  private generateInternationalTransfersSection(jurisdiction: string, language: string): string {
    return `Your personal data may be transferred to and processed in countries outside your jurisdiction. We ensure appropriate safeguards are in place, including:
- Adequacy decisions by the European Commission
- Standard Contractual Clauses
- Binding Corporate Rules
- Other approved transfer mechanisms`;
  }

  private generateThirdPartySection(jurisdiction: string, language: string): string {
    return `We work with trusted third-party service providers who assist us in:
- Payment processing (Stripe, PayPal)
- Analytics (Google Analytics, with privacy controls)
- Email services (SendGrid)
- Cloud hosting (AWS, with EU regions)
- Age verification services (where required)

All third parties are bound by strict data protection agreements.`;
  }

  private generateContactSection(jurisdiction: string, language: string): string {
    return `For privacy questions or to exercise your rights, contact us at:
Email: privacy@energydrinkguide.com
Address: [Company Address]
Data Protection Officer: dpo@energydrinkguide.com

We will respond to your request within 30 days.`;
  }

  private generateAcceptanceClause(jurisdiction: string, language: string): string {
    return `By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.`;
  }

  private generateServiceDescriptionClause(jurisdiction: string, language: string): string {
    return `We provide an energy drink calculator and recipe guidance service. Our service helps users create personalized energy drink recipes while ensuring safety and regulatory compliance across different jurisdictions.`;
  }

  private generateAgeRequirementsClause(jurisdiction: string, language: string): string {
    const framework = getLegalComplianceFramework(jurisdiction);
    const minimumAge = framework.ageVerification.ageThresholds.general;
    
    return `You must be at least ${minimumAge} years old to use this service. 
${framework.ageVerification.required ? 'Age verification is required by law in your jurisdiction.' : 'Age verification may be required for certain features.'}
${framework.ageVerification.ageThresholds.restricted ? `Some features are restricted to users over ${framework.ageVerification.ageThresholds.restricted} years old.` : ''}`;
  }

  private generateSafetyDisclaimersClause(jurisdiction: string, language: string): string {
    return `**Important Safety Information:**
- This service provides general guidance and information only
- Always consult healthcare professionals for medical advice
- Caffeine content recommendations are estimates and may vary
- Individual tolerance to caffeine varies significantly
- Do not exceed recommended daily caffeine limits
- Stop consumption if you experience adverse reactions
- Not recommended for children, pregnant women, or individuals with certain medical conditions`;
  }

  private generateCaffeineWarningsClause(jurisdiction: string, language: string): string {
    return `**Caffeine Content Warnings:**
- Caffeine content is calculated based on ingredient amounts
- Actual caffeine content may vary based on preparation methods
- Individual sensitivity to caffeine varies
- Recommended daily caffeine limits should not be exceeded
- Caffeine can cause insomnia, anxiety, rapid heartbeat, and other side effects
- Consult healthcare providers before consuming high-caffeine beverages`;
  }

  private generateLiabilityClause(jurisdiction: string, language: string): string {
    const framework = getLegalComplianceFramework(jurisdiction);
    
    return `${framework.termsOfService.liability.limitation}

${framework.termsOfService.liability.exclusion}

We provide this service "as is" without warranties of any kind. We are not liable for any damages resulting from the use of our service, including but not limited to indirect, incidental, special, or consequential damages.`;
  }

  private generateRegulatoryComplianceClause(jurisdiction: string, language: string): string {
    return `Our service is designed to comply with applicable food safety, health, and privacy regulations in supported jurisdictions. Users are responsible for ensuring their use of our service complies with local laws and regulations. We provide compliance guidance but cannot guarantee compliance in all jurisdictions.`;
  }

  private generateTerminationClause(jurisdiction: string, language: string): string {
    const framework = getLegalComplianceFramework(jurisdiction);
    
    return `We may terminate or suspend your account immediately, without prior notice, for any breach of these Terms of Service. 

**Immediate termination triggers:**
${framework.termsOfService.termination.immediate.map(trigger => `- ${trigger.replace('_', ' ')}`).join('\n')}

**Notice termination:** ${framework.termsOfService.termination.notice}`;
  }

  private generateGoverningLawClause(jurisdiction: string, language: string): string {
    const framework = getLegalComplianceFramework(jurisdiction);
    
    return `These Terms of Service are governed by ${framework.termsOfService.applicableLaw}.

**Jurisdiction:** ${framework.termsOfService.jurisdiction}

Any disputes arising from these terms will be resolved in the courts of the applicable jurisdiction.`;
  }

  private generateTypesOfCookiesSection(jurisdiction: string, language: string): string {
    return `**Necessary Cookies:** Required for basic website functionality
**Functional Cookies:** Enable enhanced features and personalization
**Analytics Cookies:** Help us understand how you use our service
**Marketing Cookies:** Used to deliver relevant advertisements`;
  }

  private generateHowWeUseCookiesSection(jurisdiction: string, language: string): string {
    return `- Remember your language and region preferences
- Maintain your login sessions
- Store recipe calculations and preferences
- Analyze website performance and usage
- Provide personalized content and recommendations`;
  }

  private generateCookieConsentSection(jurisdiction: string, language: string): string {
    return `In accordance with ${jurisdiction} privacy laws, we require your consent before using non-essential cookies. You can:
- Accept all cookies
- Reject non-essential cookies
- Customize your cookie preferences
- Withdraw consent at any time through our cookie settings`;
  }

  private generateManagingCookiesSection(jurisdiction: string, language: string): string {
    return `You can manage cookies through:
- Our cookie consent banner
- Your browser settings
- Third-party opt-out tools
- Our privacy settings page

Please note that disabling certain cookies may affect website functionality.`;
  }

  private generateMinorTerms(jurisdiction: string, language: string, minimumAge: number): string {
    return `**For Users Under ${minimumAge} Years:**

If you are under ${minimumAge} years old, additional terms apply:
- Parental or guardian consent is required
- Limited access to certain features
- Enhanced privacy protections
- Special data handling procedures
- Safety monitoring and reporting

**Parental Involvement:**
- Parents/guardians must provide consent
- Parents can request data deletion
- Usage may be monitored for safety
- Educational resources provided`;
  }

  private generateYoungAdultTerms(jurisdiction: string, language: string, minimumAge: number): string {
    return `**For Users Aged ${minimumAge}-17 Years:**

- Full service access with enhanced safety features
- Detailed caffeine warnings and education
- Graduated access to higher caffeine recipes
- Parental notification for certain activities
- Enhanced data protection measures
- Safety check-ins and guidance`;
  }

  private generateAdultTerms(jurisdiction: string, language: string): string {
    return `**For Users 18 Years and Older:**

- Full access to all service features
- Adult-level recipe recommendations
- Standard privacy protections
- Professional-grade tools and resources
- Advanced customization options
- Direct customer support access`;
  }
}

// Export singleton instance
export const legalDocumentGenerator = new LegalDocumentGenerator();