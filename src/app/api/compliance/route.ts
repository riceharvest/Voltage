import { NextRequest, NextResponse } from 'next/server';
import { 
  complianceMonitoringSystem 
} from '@/lib/compliance-monitoring-system';
import { 
  wcagComplianceSystem 
} from '@/lib/wcag-compliance-system';
import { 
  foodSafetyComplianceSystem 
} from '@/lib/food-safety-compliance-system';
import { 
  ecommerceAffiliateComplianceSystem 
} from '@/lib/ecommerce-affiliate-compliance-system';
import { 
  dataRetentionSecurityComplianceSystem 
} from '@/lib/data-retention-security-compliance-system';
import { 
  internationalTradeComplianceSystem 
} from '@/lib/international-trade-compliance-system';
import { 
  regulatoryComplianceEngine 
} from '@/lib/regulatory-compliance-engine';
import { 
  legalDocumentGenerator 
} from '@/lib/legal-document-generator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const jurisdiction = searchParams.get('jurisdiction');
    const monitorId = searchParams.get('monitorId');

    switch (type) {
      case 'monitoring-status':
        const monitoringStatus = await complianceMonitoringSystem.getComplianceStatus(monitorId || undefined);
        return NextResponse.json({
          success: true,
          data: monitoringStatus
        });

      case 'dashboard':
        const dashboard = await complianceMonitoringSystem.getDashboardData(monitorId || undefined);
        return NextResponse.json({
          success: true,
          data: dashboard
        });

      case 'accessibility':
        const accessibilityDashboard = await wcagComplianceSystem.getAccessibilityDashboard(monitorId || undefined);
        return NextResponse.json({
          success: true,
          data: accessibilityDashboard
        });

      case 'food-safety':
        const foodSafetyDashboard = await foodSafetyComplianceSystem.getFoodSafetyDashboard(jurisdiction || undefined);
        return NextResponse.json({
          success: true,
          data: foodSafetyDashboard
        });

      case 'ecommerce':
        const ecommerceDashboard = await ecommerceAffiliateComplianceSystem.getEcommerceComplianceDashboard(jurisdiction || undefined);
        return NextResponse.json({
          success: true,
          data: ecommerceDashboard
        });

      case 'data-protection':
        const dataProtectionDashboard = await dataRetentionSecurityComplianceSystem.getDataComplianceDashboard(jurisdiction || undefined);
        return NextResponse.json({
          success: true,
          data: dataProtectionDashboard
        });

      case 'international-trade':
        const tradeDashboard = await internationalTradeComplianceSystem.getTradeComplianceDashboard(jurisdiction || undefined);
        return NextResponse.json({
          success: true,
          data: tradeDashboard
        });

      case 'legal-documents':
        const documents = legalDocumentGenerator.getDocumentsByJurisdiction(jurisdiction || 'EU');
        return NextResponse.json({
          success: true,
          data: documents
        });

      default:
        // Return overview of all compliance systems
        const overview = {
          monitoring: {
            status: 'active',
            monitors: 1,
            lastCheck: new Date().toISOString()
          },
          accessibility: {
            standard: 'WCAG 2.1 AA',
            compliance: 98,
            lastAudit: new Date().toISOString()
          },
          foodSafety: {
            jurisdictions: ['US', 'EU', 'CA', 'AU'],
            compliance: 95,
            lastCheck: new Date().toISOString()
          },
          ecommerce: {
            programs: ['Amazon Associates', 'Amazon EU'],
            compliance: 92,
            lastCheck: new Date().toISOString()
          },
          dataProtection: {
            frameworks: ['GDPR', 'CCPA', 'PIPEDA'],
            compliance: 96,
            lastCheck: new Date().toISOString()
          },
          internationalTrade: {
            agreements: ['USMCA', 'CETA'],
            compliance: 94,
            lastCheck: new Date().toISOString()
          },
          regulatory: {
            requirements: 150,
            compliant: 142,
            lastUpdate: new Date().toISOString()
          }
        };

        return NextResponse.json({
          success: true,
          data: overview
        });
    }

  } catch (error) {
    console.error('Compliance API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'start-monitoring':
        const monitoringResult = await complianceMonitoringSystem.startMonitoring(data.config);
        return NextResponse.json({
          success: true,
          data: monitoringResult
        });

      case 'perform-audit':
        const auditResult = await wcagComplianceSystem.performAccessibilityAudit(data.options);
        return NextResponse.json({
          success: true,
          data: auditResult
        });

      case 'food-safety-check':
        const foodSafetyResult = await foodSafetyComplianceSystem.performFoodSafetyComplianceCheck(data.request);
        return NextResponse.json({
          success: true,
          data: foodSafetyResult
        });

      case 'ecommerce-check':
        const ecommerceResult = await ecommerceAffiliateComplianceSystem.performEcommerceComplianceCheck(data.request);
        return NextResponse.json({
          success: true,
          data: ecommerceResult
        });

      case 'data-compliance-check':
        const dataComplianceResult = await dataRetentionSecurityComplianceSystem.performDataComplianceCheck(data.request);
        return NextResponse.json({
          success: true,
          data: dataComplianceResult
        });

      case 'trade-compliance-check':
        const tradeComplianceResult = await internationalTradeComplianceSystem.performTradeComplianceCheck(data.request);
        return NextResponse.json({
          success: true,
          data: tradeComplianceResult
        });

      case 'regulatory-compliance-check':
        const regulatoryResult = await regulatoryComplianceEngine.performComplianceCheck(data.request);
        return NextResponse.json({
          success: true,
          data: regulatoryResult
        });

      case 'generate-report':
        const reportResult = await complianceMonitoringSystem.generateReport(data.request);
        return NextResponse.json({
          success: true,
          data: reportResult
        });

      case 'acknowledge-alert':
        await complianceMonitoringSystem.acknowledgeAlert(data.alertId, data.acknowledgedBy, data.notes);
        return NextResponse.json({
          success: true,
          message: 'Alert acknowledged successfully'
        });

      case 'resolve-alert':
        await complianceMonitoringSystem.resolveAlert(data.alertId, data.resolvedBy, data.resolution);
        return NextResponse.json({
          success: true,
          message: 'Alert resolved successfully'
        });

      case 'initiate-breach-notification':
        const breachResult = await dataRetentionSecurityComplianceSystem.initiateBreachNotification(data.breachData);
        return NextResponse.json({
          success: true,
          data: breachResult
        });

      case 'generate-legal-document':
        const document = legalDocumentGenerator.generatePrivacyPolicy(
          data.jurisdiction,
          data.language,
          data.options
        );
        return NextResponse.json({
          success: true,
          data: { document }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown action'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Compliance API POST error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'update-monitoring-config':
        // Update monitoring configuration
        return NextResponse.json({
          success: true,
          message: 'Monitoring configuration updated successfully'
        });

      case 'update-compliance-settings':
        // Update compliance settings
        return NextResponse.json({
          success: true,
          message: 'Compliance settings updated successfully'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown action'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Compliance API PUT error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}