/**
 * A/B Testing Infrastructure Dashboard
 * 
 * Advanced experimentation framework with:
 * - Multi-variant testing across regions
 * - Statistical significance testing
 * - Feature flag analytics and performance impact
 * - User experience optimization testing
 * - Regional customization effectiveness measurement
 * 
 * @author Global Platform Team
 * @version 3.0.0
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Beaker, 
  TrendingUp, 
  Users, 
  Target, 
  BarChart3,
  Settings,
  Play,
  Pause,
  Plus,
  Eye,
  CheckCircle,
  AlertTriangle,
  Clock,
  Globe,
  Smartphone,
  Monitor
} from 'lucide-react';
import { getConsentStatus } from '@/lib/gdpr';

interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'stopped';
  variants: ABTestVariant[];
  targetAudience: {
    regions: string[];
    devices: ('mobile' | 'desktop' | 'tablet')[];
    percentage: number;
  };
  metrics: ABTestMetrics;
  results: ABTestResults | null;
  startDate: string;
  endDate: string | null;
  confidenceLevel: number;
  createdBy: string;
}

interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  trafficAllocation: number;
  config: Record<string, any>;
  metrics: {
    users: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
    avgSessionDuration: number;
  };
}

interface ABTestMetrics {
  primary: string;
  secondary: string[];
  minimumSampleSize: number;
  testDuration: number; // days
}

interface ABTestResults {
  winner: string | null;
  confidence: number;
  isSignificant: boolean;
  pValue: number;
  uplift: {
    absolute: number;
    relative: number;
  };
  recommendations: string[];
}

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  targetAudience: {
    regions: string[];
    users: string[];
    percentage: number;
  };
  variants: FeatureFlagVariant[];
  analytics: {
    enabled: boolean;
    events: string[];
  };
}

interface FeatureFlagVariant {
  id: string;
  name: string;
  config: Record<string, any>;
  trafficAllocation: number;
}

interface StatisticalTest {
  testName: string;
  type: 't-test' | 'chi-square' | 'z-test';
  sampleSize: number;
  pValue: number;
  confidenceLevel: number;
  isSignificant: boolean;
  effectSize: number;
}

export function ABTestingDashboard() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [newTest, setNewTest] = useState({
    name: '',
    description: '',
    hypothesis: '',
    variants: [
      { name: 'Control', description: 'Current version', trafficAllocation: 50 },
      { name: 'Variant A', description: 'Test version', trafficAllocation: 50 }
    ],
    primaryMetric: 'conversion_rate',
    confidenceLevel: 95
  });

  // Fetch A/B testing data
  const fetchTestingData = useCallback(async () => {
    if (!getConsentStatus().analytics) {
      setIsLoading(false);
      return;
    }

    try {
      // Simulate API call - in production, this would fetch from analytics engine
      const mockTests: ABTest[] = [
        {
          id: 'test-1',
          name: 'Calculator UI Redesign',
          description: 'Testing new calculator interface with improved usability',
          status: 'running',
          variants: [
            {
              id: 'control',
              name: 'Control',
              description: 'Current calculator interface',
              trafficAllocation: 50,
              config: { uiVersion: 'v1' },
              metrics: {
                users: 1250,
                conversions: 187,
                conversionRate: 14.96,
                revenue: 2340,
                avgSessionDuration: 245
              }
            },
            {
              id: 'variant-a',
              name: 'New UI',
              description: 'Redesigned calculator interface',
              trafficAllocation: 50,
              config: { uiVersion: 'v2' },
              metrics: {
                users: 1248,
                conversions: 218,
                conversionRate: 17.47,
                revenue: 2875,
                avgSessionDuration: 278
              }
            }
          ],
          targetAudience: {
            regions: ['US', 'EU', 'APAC'],
            devices: ['desktop', 'mobile'],
            percentage: 100
          },
          metrics: {
            primary: 'conversion_rate',
            secondary: ['revenue', 'session_duration'],
            minimumSampleSize: 1000,
            testDuration: 14
          },
          results: {
            winner: 'variant-a',
            confidence: 96.8,
            isSignificant: true,
            pValue: 0.032,
            uplift: {
              absolute: 2.51,
              relative: 16.8
            },
            recommendations: [
              'Variant A shows significant improvement in conversion rate',
              'Consider implementing the new calculator UI',
              'Monitor long-term impact on user engagement'
            ]
          },
          startDate: '2025-12-01',
          endDate: null,
          confidenceLevel: 95,
          createdBy: 'Product Team'
        },
        {
          id: 'test-2',
          name: 'Recipe Card Layout',
          description: 'Testing different recipe card layouts for better engagement',
          status: 'completed',
          variants: [
            {
              id: 'control',
              name: 'Grid Layout',
              description: 'Current grid-based recipe cards',
              trafficAllocation: 33,
              config: { layout: 'grid' },
              metrics: {
                users: 856,
                conversions: 98,
                conversionRate: 11.45,
                revenue: 1250,
                avgSessionDuration: 198
              }
            },
            {
              id: 'variant-a',
              name: 'List Layout',
              description: 'List-based recipe cards',
              trafficAllocation: 33,
              config: { layout: 'list' },
              metrics: {
                users: 863,
                conversions: 112,
                conversionRate: 12.98,
                revenue: 1480,
                avgSessionDuration: 215
              }
            },
            {
              id: 'variant-b',
              name: 'Carousel Layout',
              description: 'Carousel-based recipe display',
              trafficAllocation: 34,
              config: { layout: 'carousel' },
              metrics: {
                users: 847,
                conversions: 89,
                conversionRate: 10.51,
                revenue: 1180,
                avgSessionDuration: 185
              }
            }
          ],
          targetAudience: {
            regions: ['US', 'EU'],
            devices: ['desktop', 'mobile', 'tablet'],
            percentage: 75
          },
          metrics: {
            primary: 'conversion_rate',
            secondary: ['revenue', 'session_duration'],
            minimumSampleSize: 750,
            testDuration: 10
          },
          results: {
            winner: 'variant-a',
            confidence: 94.2,
            isSignificant: true,
            pValue: 0.048,
            uplift: {
              absolute: 1.53,
              relative: 13.4
            },
            recommendations: [
              'List layout shows best conversion performance',
              'Consider implementing list layout for recipe cards',
              'Monitor impact on mobile user experience'
            ]
          },
          startDate: '2025-11-15',
          endDate: '2025-11-25',
          confidenceLevel: 95,
          createdBy: 'UX Team'
        }
      ];

      const mockFeatureFlags: FeatureFlag[] = [
        {
          id: 'flag-1',
          name: 'Enhanced Calculator',
          description: 'Advanced calculator features with cost analysis',
          enabled: true,
          targetAudience: {
            regions: ['US', 'EU', 'APAC'],
            users: [],
            percentage: 25
          },
          variants: [
            {
              id: 'basic',
              name: 'Basic',
              config: { features: ['basic_calculation'] },
              trafficAllocation: 75
            },
            {
              id: 'enhanced',
              name: 'Enhanced',
              config: { features: ['basic_calculation', 'cost_analysis', 'nutrition_info'] },
              trafficAllocation: 25
            }
          ],
          analytics: {
            enabled: true,
            events: ['calculator_usage', 'feature_interaction']
          }
        },
        {
          id: 'flag-2',
          name: 'Social Sharing',
          description: 'Social media sharing functionality',
          enabled: false,
          targetAudience: {
            regions: ['US', 'EU'],
            users: [],
            percentage: 10
          },
          variants: [
            {
              id: 'disabled',
              name: 'Disabled',
              config: { socialSharing: false },
              trafficAllocation: 90
            },
            {
              id: 'enabled',
              name: 'Enabled',
              config: { socialSharing: true },
              trafficAllocation: 10
            }
          ],
          analytics: {
            enabled: true,
            events: ['share_attempt', 'share_success']
          }
        }
      ];

      setTests(mockTests);
      setFeatureFlags(mockFeatureFlags);
    } catch (error) {
      console.error('Failed to fetch A/B testing data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestingData();
  }, [fetchTestingData]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'stopped': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSignificanceIcon = (isSignificant: boolean) => {
    return isSignificant ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <AlertTriangle className="h-4 w-4 text-yellow-600" />;
  };

  const calculateStatisticalSignificance = (variantA: any, variantB: any): StatisticalTest => {
    // Simplified statistical calculation - in production would use proper statistical library
    const n1 = variantA.users;
    const n2 = variantB.users;
    const p1 = variantA.conversionRate / 100;
    const p2 = variantB.conversionRate / 100;
    
    const pooledP = (variantA.conversions + variantB.conversions) / (n1 + n2);
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
    const z = Math.abs(p1 - p2) / se;
    
    // Approximate p-value calculation (simplified)
    const pValue = 2 * (1 - (Math.abs(z) > 1.96 ? 0.975 : 0.84));
    
    return {
      testName: 'Conversion Rate Comparison',
      type: 'z-test',
      sampleSize: n1 + n2,
      pValue: Math.max(0.001, Math.min(0.999, pValue)),
      confidenceLevel: 95,
      isSignificant: pValue < 0.05,
      effectSize: Math.abs(p1 - p2) / Math.max(p1, p2)
    };
  };

  const createNewTest = () => {
    const test: ABTest = {
      id: `test-${Date.now()}`,
      name: newTest.name,
      description: newTest.description,
      status: 'draft',
      variants: newTest.variants.map((variant, index) => ({
        id: `variant-${index}`,
        name: variant.name,
        description: variant.description,
        trafficAllocation: variant.trafficAllocation,
        config: {},
        metrics: {
          users: 0,
          conversions: 0,
          conversionRate: 0,
          revenue: 0,
          avgSessionDuration: 0
        }
      })),
      targetAudience: {
        regions: ['US', 'EU'],
        devices: ['desktop', 'mobile'],
        percentage: 100
      },
      metrics: {
        primary: newTest.primaryMetric,
        secondary: ['revenue'],
        minimumSampleSize: 1000,
        testDuration: 14
      },
      results: null,
      startDate: new Date().toISOString().split('T')[0],
      endDate: null,
      confidenceLevel: newTest.confidenceLevel,
      createdBy: 'Current User'
    };

    setTests(prev => [...prev, test]);
    setShowCreateTest(false);
    setNewTest({
      name: '',
      description: '',
      hypothesis: '',
      variants: [
        { name: 'Control', description: 'Current version', trafficAllocation: 50 },
        { name: 'Variant A', description: 'Test version', trafficAllocation: 50 }
      ],
      primaryMetric: 'conversion_rate',
      confidenceLevel: 95
    });
  };

  if (!getConsentStatus().analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Beaker className="h-5 w-5" />
              Analytics Consent Required
            </CardTitle>
            <CardDescription>
              A/B testing dashboard requires analytics consent to function.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Beaker className="h-8 w-8" />
            A/B Testing & Experimentation
          </h1>
          <p className="text-muted-foreground">
            Advanced experimentation framework with statistical analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreateTest(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Test
          </Button>
        </div>
      </div>

      {/* Test Creation Modal */}
      {showCreateTest && (
        <Card>
          <CardHeader>
            <CardTitle>Create New A/B Test</CardTitle>
            <CardDescription>
              Set up a new experiment to test variations and measure impact
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="test-name">Test Name</Label>
                <Input
                  id="test-name"
                  value={newTest.name}
                  onChange={(e) => setNewTest(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., New Homepage Design"
                />
              </div>
              <div>
                <Label htmlFor="confidence-level">Confidence Level (%)</Label>
                <Select 
                  value={newTest.confidenceLevel.toString()} 
                  onValueChange={(value) => setNewTest(prev => ({ ...prev, confidenceLevel: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="90">90%</SelectItem>
                    <SelectItem value="95">95%</SelectItem>
                    <SelectItem value="99">99%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="test-description">Description</Label>
              <Input
                id="test-description"
                value={newTest.description}
                onChange={(e) => setNewTest(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what you're testing and why"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateTest(false)}>
                Cancel
              </Button>
              <Button onClick={createNewTest} disabled={!newTest.name || !newTest.description}>
                Create Test
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Beaker className="h-8 w-8 animate-pulse mx-auto mb-4" />
            <p className="text-muted-foreground">Loading experimentation data...</p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="tests" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tests">Active Tests</TabsTrigger>
            <TabsTrigger value="feature-flags">Feature Flags</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="tests" className="space-y-4">
            {/* Test Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Tests</CardTitle>
                  <Beaker className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {tests.filter(t => t.status === 'running').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {tests.length} total tests
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Users in Tests</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {tests.reduce((sum, test) => 
                      sum + test.variants.reduce((vSum, variant) => vSum + variant.metrics.users, 0), 0
                    ).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across all active tests
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Significant Results</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {tests.filter(t => t.results?.isSignificant).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Statistically significant
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(tests.filter(t => t.results).reduce((sum, test) => 
                      sum + (test.results?.confidence || 0), 0) / tests.filter(t => t.results).length || 0).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across completed tests
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tests List */}
            <div className="space-y-4">
              {tests.map((test) => (
                <Card key={test.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedTest(test)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {test.name}
                          <Badge className={getStatusColor(test.status)}>
                            {test.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{test.description}</CardDescription>
                      </div>
                      <div className="text-right">
                        {test.results && (
                          <div className="flex items-center gap-1">
                            {getSignificanceIcon(test.results.isSignificant)}
                            <span className="text-sm font-medium">
                              {test.results.confidence.toFixed(1)}% confidence
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Started {new Date(test.startDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {test.variants.map((variant) => (
                        <div key={variant.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{variant.name}</span>
                            <Badge variant="outline">{variant.trafficAllocation}%</Badge>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Users:</span>
                              <span>{variant.metrics.users.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Conversions:</span>
                              <span>{variant.metrics.conversions}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Rate:</span>
                              <span>{variant.metrics.conversionRate.toFixed(2)}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {test.results && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-800">Test Results</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <strong>Winner:</strong> {test.results.winner}
                          </div>
                          <div>
                            <strong>Uplift:</strong> +{test.results.uplift.relative.toFixed(1)}%
                          </div>
                          <div>
                            <strong>P-value:</strong> {test.results.pValue.toFixed(3)}
                          </div>
                          <div>
                            <strong>Confidence:</strong> {test.results.confidence.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="feature-flags" className="space-y-4">
            {/* Feature Flags Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Flags</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{featureFlags.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {featureFlags.filter(f => f.enabled).length} enabled
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Global Coverage</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(featureFlags.reduce((sum, flag) => sum + flag.targetAudience.percentage, 0) / featureFlags.length)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average user coverage
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Analytics Enabled</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {featureFlags.filter(f => f.analytics.enabled).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Flags with tracking
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Feature Flags List */}
            <div className="space-y-4">
              {featureFlags.map((flag) => (
                <Card key={flag.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {flag.name}
                          <Badge variant={flag.enabled ? "default" : "secondary"}>
                            {flag.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{flag.description}</CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {flag.targetAudience.percentage}% coverage
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {flag.targetAudience.regions.join(', ')}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Variants</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {flag.variants.map((variant) => (
                            <div key={variant.id} className="p-2 border rounded">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{variant.name}</span>
                                <Badge variant="outline">{variant.trafficAllocation}%</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {flag.analytics.enabled && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Tracked Events</h4>
                          <div className="flex flex-wrap gap-1">
                            {flag.analytics.events.map((event) => (
                              <Badge key={event} variant="outline" className="text-xs">
                                {event}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {/* Statistical Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Statistical Analysis</CardTitle>
                <CardDescription>
                  Detailed statistical analysis of active and completed tests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tests.filter(test => test.variants.length >= 2).map((test) => {
                    const variantA = test.variants[0];
                    const variantB = test.variants[1];
                    const statisticalTest = calculateStatisticalSignificance(variantA, variantB);
                    
                    return (
                      <div key={test.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{test.name}</h4>
                          <div className="flex items-center gap-2">
                            {getSignificanceIcon(statisticalTest.isSignificant)}
                            <Badge variant={statisticalTest.isSignificant ? "default" : "secondary"}>
                              {statisticalTest.isSignificant ? "Significant" : "Not Significant"}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="font-medium">Sample Size</div>
                            <div>{statisticalTest.sampleSize.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="font-medium">P-value</div>
                            <div>{statisticalTest.pValue.toFixed(3)}</div>
                          </div>
                          <div>
                            <div className="font-medium">Effect Size</div>
                            <div>{(statisticalTest.effectSize * 100).toFixed(1)}%</div>
                          </div>
                          <div>
                            <div className="font-medium">Confidence</div>
                            <div>{statisticalTest.confidenceLevel}%</div>
                          </div>
                        </div>
                        
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                          <strong>Recommendation:</strong> {
                            statisticalTest.isSignificant 
                              ? `Variant ${variantB.name} shows statistically significant improvement`
                              : 'More data needed to determine winner'
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Test Performance Impact */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Impact Analysis</CardTitle>
                <CardDescription>
                  How tests and feature flags affect system performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <Monitor className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold">+2.3ms</div>
                      <div className="text-sm text-muted-foreground">Avg page load impact</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Smartphone className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold">-1.2ms</div>
                      <div className="text-sm text-muted-foreground">Mobile performance</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <div className="text-2xl font-bold">98.7%</div>
                      <div className="text-sm text-muted-foreground">Feature flag reliability</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default ABTestingDashboard;