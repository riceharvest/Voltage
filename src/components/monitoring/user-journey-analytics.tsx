/**
 * User Journey Analytics
 * 
 * Complete user experience tracking including:
 * - Navigation flow analysis and optimization
 * - Recipe discovery and calculation journeys
 * - Drop-off point identification and improvement
 * - Mobile user experience optimization
 * - Accessibility usage and improvement tracking
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  MapPin, 
  TrendingDown, 
  ArrowRight,
  Smartphone,
  Monitor,
  Eye,
  Target,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { getConsentStatus } from '@/lib/gdpr';

interface UserJourney {
  id: string;
  name: string;
  description: string;
  steps: JourneyStep[];
  completionRate: number;
  avgTimeToComplete: number;
  dropoffPoints: DropoffPoint[];
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
}

interface JourneyStep {
  id: string;
  name: string;
  page: string;
  event: string;
  visitors: number;
  conversionRate: number;
  avgTimeSpent: number;
  nextStep?: string;
  dropoffRate: number;
}

interface DropoffPoint {
  step: string;
  dropoffRate: number;
  reasons: string[];
  impact: 'high' | 'medium' | 'low';
  suggestions: string[];
}

interface FunnelAnalysis {
  name: string;
  steps: FunnelStep[];
  overallConversion: number;
  totalUsers: number;
}

interface FunnelStep {
  name: string;
  users: number;
  conversionRate: number;
  dropoffRate: number;
  avgTimeSpent: number;
}

interface PathAnalysis {
  entryPoint: string;
  paths: Array<{
    path: string[];
    users: number;
    conversionRate: number;
    avgTime: number;
  }>;
}

interface AccessibilityMetrics {
  screenReaderUsage: number;
  keyboardNavigation: number;
  highContrastMode: number;
  reducedMotion: number;
  accessibilityScore: number;
  improvements: Array<{
    area: string;
    impact: number;
    status: 'completed' | 'in-progress' | 'planned';
  }>;
}

export function UserJourneyAnalytics() {
  const [journeys, setJourneys] = useState<UserJourney[]>([]);
  const [funnelAnalysis, setFunnelAnalysis] = useState<FunnelAnalysis[]>([]);
  const [pathAnalysis, setPathAnalysis] = useState<PathAnalysis[]>([]);
  const [accessibilityMetrics, setAccessibilityMetrics] = useState<AccessibilityMetrics | null>(null);
  const [selectedJourney, setSelectedJourney] = useState<string>('recipe-discovery');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('30d');

  // Fetch user journey analytics data
  const fetchJourneyData = useCallback(async () => {
    if (!getConsentStatus().analytics) {
      setIsLoading(false);
      return;
    }

    try {
      // Simulate API call - in production, this would fetch from analytics engine
      const mockJourneys: UserJourney[] = [
        {
          id: 'recipe-discovery',
          name: 'Recipe Discovery Journey',
          description: 'User path from landing to recipe calculation and completion',
          completionRate: 68.5,
          avgTimeToComplete: 245,
          deviceBreakdown: {
            mobile: 45,
            desktop: 42,
            tablet: 13
          },
          dropoffPoints: [
            {
              step: 'recipe-selection',
              dropoffRate: 23.5,
              reasons: ['Recipe complexity', 'Loading time', 'Content relevance'],
              impact: 'high',
              suggestions: [
                'Improve recipe filtering and search',
                'Optimize image loading',
                'Add recipe previews'
              ]
            },
            {
              step: 'calculator-start',
              dropoffRate: 15.2,
              reasons: ['Form complexity', 'Mobile UX', 'Time investment'],
              impact: 'medium',
              suggestions: [
                'Simplify calculator interface',
                'Add progress indicators',
                'Implement save/resume functionality'
              ]
            }
          ],
          steps: [
            {
              id: 'landing',
              name: 'Landing Page',
              page: '/',
              event: 'page_view',
              visitors: 10000,
              conversionRate: 100,
              avgTimeSpent: 45,
              nextStep: 'recipe-browsing',
              dropoffRate: 0
            },
            {
              id: 'browsing',
              name: 'Recipe Browsing',
              page: '/flavors',
              event: 'recipe_view',
              visitors: 7500,
              conversionRate: 75,
              avgTimeSpent: 120,
              nextStep: 'recipe-selection',
              dropoffRate: 25
            },
            {
              id: 'selection',
              name: 'Recipe Selection',
              page: '/flavors/[id]',
              event: 'recipe_select',
              visitors: 5625,
              conversionRate: 75,
              avgTimeSpent: 85,
              nextStep: 'calculator',
              dropoffRate: 23.5
            },
            {
              id: 'calculator',
              name: 'Calculator Start',
              page: '/calculator',
              event: 'calculator_start',
              visitors: 4305,
              conversionRate: 76.5,
              avgTimeSpent: 180,
              nextStep: 'completion',
              dropoffRate: 15.2
            },
            {
              id: 'completion',
              name: 'Calculation Complete',
              page: '/calculator',
              event: 'calculator_complete',
              visitors: 3297,
              conversionRate: 76.6,
              avgTimeSpent: 65,
              dropoffRate: 23.4
            }
          ]
        },
        {
          id: 'safety-journey',
          name: 'Safety & Guidelines Journey',
          description: 'User engagement with safety information and guidelines',
          completionRate: 42.3,
          avgTimeToComplete: 180,
          deviceBreakdown: {
            mobile: 38,
            desktop: 48,
            tablet: 14
          },
          dropoffPoints: [
            {
              step: 'safety-warning',
              dropoffRate: 35.7,
              reasons: ['Warning dismissal', 'Trust issues', 'Mobile notifications'],
              impact: 'medium',
              suggestions: [
                'Improve warning UX',
                'Add educational content',
                'Mobile-specific messaging'
              ]
            }
          ],
          steps: [
            {
              id: 'safety-entry',
              name: 'Safety Page Visit',
              page: '/safety',
              event: 'safety_view',
              visitors: 3200,
              conversionRate: 100,
              avgTimeSpent: 90,
              nextStep: 'guidelines',
              dropoffRate: 0
            },
            {
              id: 'guidelines',
              name: 'Guidelines Review',
              page: '/safety',
              event: 'guidelines_view',
              visitors: 2560,
              conversionRate: 80,
              avgTimeSpent: 120,
              dropoffRate: 20
            }
          ]
        }
      ];

      const mockFunnelAnalysis: FunnelAnalysis[] = [
        {
          name: 'Recipe Discovery Funnel',
          overallConversion: 32.97,
          totalUsers: 10000,
          steps: [
            { name: 'Landing', users: 10000, conversionRate: 100, dropoffRate: 0, avgTimeSpent: 45 },
            { name: 'Browse Recipes', users: 7500, conversionRate: 75, dropoffRate: 25, avgTimeSpent: 120 },
            { name: 'Select Recipe', users: 5625, conversionRate: 75, dropoffRate: 23.5, avgTimeSpent: 85 },
            { name: 'Start Calculator', users: 4305, conversionRate: 76.5, dropoffRate: 15.2, avgTimeSpent: 180 },
            { name: 'Complete Calculation', users: 3297, conversionRate: 76.6, dropoffRate: 23.4, avgTimeSpent: 65 }
          ]
        },
        {
          name: 'Affiliate Conversion Funnel',
          overallConversion: 8.5,
          totalUsers: 5000,
          steps: [
            { name: 'Recipe View', users: 5000, conversionRate: 100, dropoffRate: 0, avgTimeSpent: 60 },
            { name: 'Affiliate Link Click', users: 850, conversionRate: 17, dropoffRate: 83, avgTimeSpent: 15 },
            { name: 'Purchase Intent', users: 425, conversionRate: 50, dropoffRate: 50, avgTimeSpent: 120 },
            { name: 'Purchase Complete', users: 425, conversionRate: 100, dropoffRate: 0, avgTimeSpent: 300 }
          ]
        }
      ];

      const mockPathAnalysis: PathAnalysis[] = [
        {
          entryPoint: 'Direct/Organic',
          paths: [
            { path: ['/', '/flavors', '/flavors/cola-kick', '/calculator'], users: 2500, conversionRate: 68, avgTime: 320 },
            { path: ['/', '/flavors', '/calculator'], users: 1800, conversionRate: 45, avgTime: 280 },
            { path: ['/', '/calculator'], users: 1200, conversionRate: 35, avgTime: 180 }
          ]
        },
        {
          entryPoint: 'Social Media',
          paths: [
            { path: ['/flavors', '/flavors/cherry-blast', '/calculator'], users: 800, conversionRate: 52, avgTime: 290 },
            { path: ['/flavors', '/calculator'], users: 600, conversionRate: 38, avgTime: 240 }
          ]
        }
      ];

      const mockAccessibilityMetrics: AccessibilityMetrics = {
        screenReaderUsage: 2.3,
        keyboardNavigation: 15.7,
        highContrastMode: 3.2,
        reducedMotion: 1.8,
        accessibilityScore: 94.5,
        improvements: [
          {
            area: 'Keyboard Navigation',
            impact: 15.7,
            status: 'completed'
          },
          {
            area: 'Screen Reader Support',
            impact: 2.3,
            status: 'in-progress'
          },
          {
            area: 'Color Contrast',
            impact: 100,
            status: 'completed'
          },
          {
            area: 'Focus Management',
            impact: 12.5,
            status: 'planned'
          }
        ]
      };

      setJourneys(mockJourneys);
      setFunnelAnalysis(mockFunnelAnalysis);
      setPathAnalysis(mockPathAnalysis);
      setAccessibilityMetrics(mockAccessibilityMetrics);
    } catch (error) {
      console.error('Failed to fetch user journey data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJourneyData();
  }, [fetchJourneyData, selectedTimeframe]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'desktop': return <Monitor className="h-4 w-4" />;
      case 'tablet': return <Monitor className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const selectedJourneyData = journeys.find(j => j.id === selectedJourney);

  if (!getConsentStatus().analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Analytics Consent Required
            </CardTitle>
            <CardDescription>
              User journey analytics requires analytics consent to function.
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
            <MapPin className="h-8 w-8" />
            User Journey Analytics
          </h1>
          <p className="text-muted-foreground">
            Complete user experience tracking and optimization insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedJourney} onValueChange={setSelectedJourney}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {journeys.map((journey) => (
                <SelectItem key={journey.id} value={journey.id}>
                  {journey.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading user journey data...</p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="journeys" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="journeys">User Journeys</TabsTrigger>
            <TabsTrigger value="funnels">Funnel Analysis</TabsTrigger>
            <TabsTrigger value="paths">Path Analysis</TabsTrigger>
            <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
          </TabsList>

          <TabsContent value="journeys" className="space-y-4">
            {/* Journey Overview */}
            {selectedJourneyData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedJourneyData.completionRate}%</div>
                      <Progress value={selectedJourneyData.completionRate} className="mt-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg Time to Complete</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatTime(selectedJourneyData.avgTimeToComplete)}</div>
                      <p className="text-xs text-muted-foreground">
                        {selectedJourneyData.avgTimeToComplete < 180 ? 'Fast' : 
                         selectedJourneyData.avgTimeToComplete < 300 ? 'Moderate' : 'Slow'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Drop-off Points</CardTitle>
                      <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedJourneyData.dropoffPoints.length}</div>
                      <p className="text-xs text-muted-foreground">
                        Areas for improvement
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Mobile Usage</CardTitle>
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedJourneyData.deviceBreakdown.mobile}%</div>
                      <p className="text-xs text-muted-foreground">
                        Primary device type
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Journey Flow */}
                <Card>
                  <CardHeader>
                    <CardTitle>Journey Flow</CardTitle>
                    <CardDescription>
                      User progression through {selectedJourneyData.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedJourneyData.steps.map((step, index) => (
                        <div key={step.id} className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium">{step.name}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{step.conversionRate}% conversion</Badge>
                                <Badge variant={step.dropoffRate > 20 ? "destructive" : "secondary"}>
                                  {step.dropoffRate}% drop-off
                                </Badge>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{step.page}</p>
                            <div className="grid grid-cols-3 gap-4 text-xs">
                              <div>
                                <span className="font-medium">{step.visitors.toLocaleString()}</span>
                                <p className="text-muted-foreground">visitors</p>
                              </div>
                              <div>
                                <span className="font-medium">{formatTime(step.avgTimeSpent)}</span>
                                <p className="text-muted-foreground">avg time</p>
                              </div>
                              <div>
                                <span className="font-medium">{step.conversionRate}%</span>
                                <p className="text-muted-foreground">to next step</p>
                              </div>
                            </div>
                          </div>
                          {index < selectedJourneyData.steps.length - 1 && (
                            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Drop-off Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Drop-off Point Analysis
                    </CardTitle>
                    <CardDescription>
                      Critical points where users leave the journey and improvement opportunities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedJourneyData.dropoffPoints.map((dropoff, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge className={getImpactColor(dropoff.impact)}>
                                {dropoff.impact} impact
                              </Badge>
                              <span className="font-medium">{dropoff.step}</span>
                            </div>
                            <Badge variant="destructive">{dropoff.dropoffRate}% drop-off</Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium mb-2">Common Reasons</h4>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {dropoff.reasons.map((reason, idx) => (
                                  <li key={idx} className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-muted-foreground"></div>
                                    {reason}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium mb-2">Improvement Suggestions</h4>
                              <ul className="text-sm space-y-1">
                                {dropoff.suggestions.map((suggestion, idx) => (
                                  <li key={idx} className="flex items-center gap-2">
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                    {suggestion}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="funnels" className="space-y-4">
            {/* Funnel Analysis */}
            {funnelAnalysis.map((funnel, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{funnel.name}</CardTitle>
                  <CardDescription>
                    Overall conversion: {funnel.overallConversion}% ({funnel.totalUsers.toLocaleString()} users)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {funnel.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {stepIndex + 1}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{step.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{step.users.toLocaleString()} users</Badge>
                              <Badge variant={step.dropoffRate > 30 ? "destructive" : "secondary"}>
                                {step.dropoffRate}% drop-off
                              </Badge>
                            </div>
                          </div>
                          <Progress value={step.conversionRate} className="h-2" />
                          <div className="grid grid-cols-2 gap-4 mt-2 text-xs text-muted-foreground">
                            <div>Conversion: {step.conversionRate}%</div>
                            <div>Avg time: {formatTime(step.avgTimeSpent)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="paths" className="space-y-4">
            {/* Path Analysis */}
            {pathAnalysis.map((analysis, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>Paths from {analysis.entryPoint}</CardTitle>
                  <CardDescription>
                    Most common user paths and their conversion rates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysis.paths.map((path, pathIndex) => (
                      <div key={pathIndex} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{path.users.toLocaleString()} users</Badge>
                            <Badge variant="secondary">{path.conversionRate}% conversion</Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            Avg: {formatTime(path.avgTime)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 overflow-x-auto">
                          {path.path.map((step, stepIndex) => (
                            <React.Fragment key={stepIndex}>
                              <div className="flex-shrink-0 px-3 py-1 bg-primary/10 rounded text-sm">
                                {step}
                              </div>
                              {stepIndex < path.path.length - 1 && (
                                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="accessibility" className="space-y-4">
            {/* Accessibility Metrics */}
            {accessibilityMetrics && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Accessibility Score</CardTitle>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{accessibilityMetrics.accessibilityScore}%</div>
                      <Progress value={accessibilityMetrics.accessibilityScore} className="mt-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Keyboard Navigation</CardTitle>
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{accessibilityMetrics.keyboardNavigation}%</div>
                      <p className="text-xs text-muted-foreground">of users</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Screen Reader Usage</CardTitle>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{accessibilityMetrics.screenReaderUsage}%</div>
                      <p className="text-xs text-muted-foreground">of users</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">High Contrast</CardTitle>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{accessibilityMetrics.highContrastMode}%</div>
                      <p className="text-xs text-muted-foreground">of users</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Accessibility Improvements</CardTitle>
                    <CardDescription>
                      Ongoing efforts to improve accessibility and user experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {accessibilityMetrics.improvements.map((improvement, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant={
                              improvement.status === 'completed' ? 'default' :
                              improvement.status === 'in-progress' ? 'secondary' : 'outline'
                            }>
                              {improvement.status}
                            </Badge>
                            <div>
                              <p className="font-medium">{improvement.area}</p>
                              <p className="text-sm text-muted-foreground">
                                Impact: {improvement.impact}% of users
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getDeviceIcon('desktop')}
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default UserJourneyAnalytics;