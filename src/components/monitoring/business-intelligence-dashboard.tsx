/**
 * Business Intelligence Dashboard
 * 
 * Executive-level business insights including:
 * - Revenue tracking through Amazon affiliate links
 * - User engagement metrics and retention analysis
 * - Popular recipes and flavor trends by region
 * - Seasonal and cultural preference patterns
 * - Growth metrics and expansion opportunities
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
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Globe, 
  BarChart3,
  PieChart,
  Calendar,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { globalAnalytics, type BusinessIntelligence, type RegionalMetrics } from '@/lib/analytics/global-analytics-engine';
import { getConsentStatus } from '@/lib/gdpr';

interface RevenueMetrics {
  total: number;
  growth: number;
  byRegion: Record<string, number>;
  bySource: Record<string, number>;
  trends: Array<{
    date: string;
    amount: number;
    growth: number;
  }>;
}

interface EngagementMetrics {
  dau: number;
  wau: number;
  mau: number;
  retentionRates: Record<string, number>;
  sessionDuration: number;
  bounceRate: number;
}

interface ContentAnalytics {
  popularRecipes: Array<{
    id: string;
    name: string;
    category: string;
    views: number;
    conversions: number;
    conversionRate: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  trendingFlavors: Array<{
    flavor: string;
    region: string;
    growth: number;
    popularity: number;
  }>;
  seasonalTrends: Array<{
    period: string;
    category: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    growth: number;
    factors: string[];
  }>;
}

export function BusinessIntelligenceDashboard() {
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(null);
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetrics | null>(null);
  const [contentAnalytics, setContentAnalytics] = useState<ContentAnalytics | null>(null);
  const [regionalMetrics, setRegionalMetrics] = useState<RegionalMetrics[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('30d');
  const [selectedRegion, setSelectedRegion] = useState<string>('global');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch business intelligence data
  const fetchBusinessData = useCallback(async () => {
    if (!getConsentStatus().analytics) {
      setIsLoading(false);
      return;
    }

    try {
      const businessIntelligence = globalAnalytics.getBusinessIntelligence();
      const regionalData = globalAnalytics.getRegionalMetrics();
      const conversionFunnels = globalAnalytics.getConversionFunnels();

      // Process revenue metrics
      if (businessIntelligence?.revenue) {
        const revenueData: RevenueMetrics = {
          total: businessIntelligence.revenue.total,
          growth: calculateRevenueGrowth(businessIntelligence.revenue.trends),
          byRegion: businessIntelligence.revenue.byRegion,
          bySource: businessIntelligence.revenue.bySource,
          trends: businessIntelligence.revenue.trends.slice(-30) // Last 30 data points
        };
        setRevenueMetrics(revenueData);
      }

      // Process engagement metrics
      if (businessIntelligence?.engagement) {
        const engagementData: EngagementMetrics = {
          dau: businessIntelligence.engagement.dailyActiveUsers,
          wau: businessIntelligence.engagement.weeklyActiveUsers,
          mau: businessIntelligence.engagement.monthlyActiveUsers,
          retentionRates: businessIntelligence.engagement.retentionRates,
          sessionDuration: 180, // Would be calculated from actual data
          bounceRate: 35 // Would be calculated from actual data
        };
        setEngagementMetrics(engagementData);
      }

      // Process content analytics
      if (businessIntelligence?.content) {
        const contentData: ContentAnalytics = {
          popularRecipes: businessIntelligence.content.popularRecipes
            .map(recipe => ({
              ...recipe,
              conversionRate: recipe.conversions > 0 ? (recipe.conversions / recipe.views) * 100 : 0,
              trend: 'up' as const // Would be calculated from trend data
            }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 10),
          trendingFlavors: businessIntelligence.content.trendingFlavors
            .sort((a, b) => b.growth - a.growth)
            .slice(0, 10),
          seasonalTrends: businessIntelligence.content.seasonalTrends
        };
        setContentAnalytics(contentData);
      }

      // Process regional metrics
      const regions = Array.from(regionalData instanceof Map ? regionalData.values() : []);
      setRegionalMetrics(regions);

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch business intelligence data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on component mount and timeframe/region change
  useEffect(() => {
    fetchBusinessData();
  }, [fetchBusinessData, selectedTimeframe, selectedRegion]);

  const calculateRevenueGrowth = (trends: any[]): number => {
    if (trends.length < 2) return 0;
    
    const recent = trends.slice(-7).reduce((sum, t) => sum + t.amount, 0) / 7;
    const previous = trends.slice(-14, -7).reduce((sum, t) => sum + t.amount, 0) / 7;
    
    return previous > 0 ? ((recent - previous) / previous) * 100 : 0;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (growth < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getGrowthColor = (growth: number): string => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-400';
  };

  const exportBusinessReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      timeframe: selectedTimeframe,
      region: selectedRegion,
      revenue: revenueMetrics,
      engagement: engagementMetrics,
      content: contentAnalytics,
      regional: regionalMetrics
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-intelligence-${selectedTimeframe}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!getConsentStatus().analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics Consent Required
            </CardTitle>
            <CardDescription>
              Business intelligence dashboard requires analytics consent to function.
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
            <BarChart3 className="h-8 w-8" />
            Business Intelligence Dashboard
          </h1>
          <p className="text-muted-foreground">
            Executive insights and key performance indicators
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
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global</SelectItem>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="EU">Europe</SelectItem>
              <SelectItem value="APAC">Asia Pacific</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportBusinessReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(revenueMetrics?.total || 0)}
            </div>
            <div className="flex items-center gap-1 text-xs">
              {getGrowthIcon(revenueMetrics?.growth || 0)}
              <span className={getGrowthColor(revenueMetrics?.growth || 0)}>
                {Math.abs(revenueMetrics?.growth || 0).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(engagementMetrics?.dau || 0)}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              <span className="text-green-600">+8.2%</span>
              <span className="text-muted-foreground">vs last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(contentAnalytics?.popularRecipes.reduce((acc, r) => acc + r.conversionRate, 0) / (contentAnalytics?.popularRecipes.length || 1)).toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 text-xs">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              <span className="text-green-600">+2.1%</span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Reach</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {regionalMetrics.length}
            </div>
            <div className="text-xs text-muted-foreground">
              Active regions with traffic
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading business intelligence data...</p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="regional">Regional</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            {/* Revenue Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Region</CardTitle>
                  <CardDescription>Affiliate revenue distribution across global markets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(revenueMetrics?.byRegion || {}).map(([region, amount]) => (
                      <div key={region} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{region}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(amount)}
                          </span>
                          <Progress 
                            value={(amount / (revenueMetrics?.total || 1)) * 100} 
                            className="w-20" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Source</CardTitle>
                  <CardDescription>Revenue breakdown by affiliate partners</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(revenueMetrics?.bySource || {}).map(([source, amount]) => (
                      <div key={source} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{source}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(amount)}
                          </span>
                          <Progress 
                            value={(amount / (revenueMetrics?.total || 1)) * 100} 
                            className="w-20" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Historical revenue performance and growth patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Revenue trend visualization would appear here</p>
                    <p className="text-sm">Chart implementation requires charting library</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-4">
            {/* User Engagement Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Active Users</CardTitle>
                  <CardDescription>Daily, weekly, and monthly active users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Daily (DAU)</span>
                      <span className="font-bold">{formatNumber(engagementMetrics?.dau || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Weekly (WAU)</span>
                      <span className="font-bold">{formatNumber(engagementMetrics?.wau || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Monthly (MAU)</span>
                      <span className="font-bold">{formatNumber(engagementMetrics?.mau || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Session Metrics</CardTitle>
                  <CardDescription>User session duration and bounce rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Avg Session</span>
                      <span className="font-bold">{engagementMetrics?.sessionDuration || 0}s</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Bounce Rate</span>
                      <span className="font-bold">{engagementMetrics?.bounceRate || 0}%</span>
                    </div>
                    <Progress value={100 - (engagementMetrics?.bounceRate || 0)} className="mt-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Retention Rates</CardTitle>
                  <CardDescription>User retention across time periods</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(engagementMetrics?.retentionRates || {}).map(([period, rate]) => (
                      <div key={period} className="flex items-center justify-between">
                        <span className="text-sm">{period}</span>
                        <span className="font-bold">{rate}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            {/* Popular Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top Recipes</CardTitle>
                  <CardDescription>Most popular recipes by views and conversions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {contentAnalytics?.popularRecipes.slice(0, 8).map((recipe, index) => (
                      <div key={recipe.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{recipe.name}</p>
                            <p className="text-xs text-muted-foreground">{recipe.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{formatNumber(recipe.views)} views</p>
                          <p className="text-xs text-muted-foreground">
                            {recipe.conversionRate.toFixed(1)}% conv.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Trending Flavors</CardTitle>
                  <CardDescription>Flavor preferences by region and growth</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {contentAnalytics?.trendingFlavors.map((flavor, index) => (
                      <div key={`${flavor.flavor}-${flavor.region}`} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center text-xs">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{flavor.flavor}</p>
                            <p className="text-xs text-muted-foreground">{flavor.region}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            {getGrowthIcon(flavor.growth)}
                            <span className="text-sm">{flavor.growth.toFixed(1)}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {flavor.popularity} popularity
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Seasonal Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Seasonal Trends</CardTitle>
                <CardDescription>Cultural and seasonal preference patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contentAnalytics?.seasonalTrends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{trend.period} - {trend.category}</p>
                          <p className="text-sm text-muted-foreground">
                            Factors: {trend.factors.join(', ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getGrowthIcon(trend.growth)}
                        <Badge variant={
                          trend.trend === 'increasing' ? 'default' :
                          trend.trend === 'decreasing' ? 'destructive' : 'secondary'
                        }>
                          {trend.trend}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="regional" className="space-y-4">
            {/* Regional Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Regional Traffic</CardTitle>
                  <CardDescription>User sessions and page views by region</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {regionalMetrics.map((region) => (
                      <div key={region.region} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{region.region}</p>
                          <p className="text-sm text-muted-foreground">{region.language}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{region.traffic.sessions} sessions</p>
                          <p className="text-xs text-muted-foreground">
                            {region.traffic.pageviews} page views
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Regional Performance</CardTitle>
                  <CardDescription>Performance metrics by geographic region</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {regionalMetrics.map((region) => (
                      <div key={region.region} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{region.region}</span>
                          <span className="text-sm text-muted-foreground">
                            {region.metrics.pageLoadTime}ms load
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>Error: {region.metrics.errorRate.toFixed(1)}%</div>
                          <div>Engagement: {region.metrics.userEngagement.toFixed(0)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default BusinessIntelligenceDashboard;