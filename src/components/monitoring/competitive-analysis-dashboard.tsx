/**
 * Competitive Intelligence Dashboard
 * 
 * Visualizes market position, competitor analysis, and strategic insights.
 * 
 * @author Global Platform Team
 * @version 1.0.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  TrendingUp, 
  Target, 
  Shield, 
  Globe, 
  DollarSign,
  BarChart3,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { competitiveIntelligence, type MarketAnalysis, type Competitor } from '@/lib/analytics/competitive-intelligence';

export default function CompetitiveAnalysisDashboard() {
  const [marketData, setMarketData] = useState<MarketAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data fetching
    const data = competitiveIntelligence.getMarketAnalysis();
    setMarketData(data);
    setLoading(false);
  }, []);

  if (loading || !marketData) {
    return <div>Loading competitive intelligence...</div>;
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Market Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(marketData.totalMarketSize / 1000).toFixed(1)}B</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{marketData.marketGrowthRate}% CAGR
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Our Market Share</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketData.ourMarketShare.toFixed(2)}%</div>
            <Progress value={marketData.ourMarketShare * 100} className="mt-2 h-2" />
            <div className="text-xs text-muted-foreground mt-2">Target: 0.5% by Q4</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Competitors Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketData.competitors.length}</div>
            <div className="flex -space-x-2 mt-2">
              {marketData.competitors.map((c, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold" title={c.name}>
                  {c.name[0]}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Threats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketData.threats.length}</div>
            <div className="text-xs text-red-600 mt-1 flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {marketData.threats.filter(t => t.severity === 'high' || t.severity === 'critical').length} Critical/High
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="competitors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="competitors">Competitor Analysis</TabsTrigger>
          <TabsTrigger value="trends">Market Trends</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities & Threats</TabsTrigger>
        </TabsList>

        <TabsContent value="competitors" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {marketData.competitors.map((competitor) => (
              <Card key={competitor.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{competitor.name}</CardTitle>
                      <CardDescription>
                        {competitor.regions.join(', ')} • {competitor.productCategories.join(', ')}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-lg">
                      {competitor.marketShare}% Share
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Growth Rate</div>
                      <div className="font-bold flex items-center text-green-600">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {competitor.growthRate}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Pricing Strategy</div>
                      <div className="font-bold capitalize">{competitor.pricingStrategy}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2 flex items-center">
                      <Zap className="h-4 w-4 mr-1 text-yellow-500" /> Strengths
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {competitor.strengths.map((s, i) => (
                        <Badge key={i} variant="secondary">{s}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2 flex items-center">
                      <Shield className="h-4 w-4 mr-1 text-blue-500" /> Weaknesses
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {competitor.weaknesses.map((w, i) => (
                        <Badge key={i} variant="outline" className="border-dashed">{w}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Market Trends Analysis</CardTitle>
              <CardDescription>Key industry shifts impacting our strategy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {marketData.trends.map((trend, i) => (
                  <div key={i} className="flex items-start space-x-4 pb-4 border-b last:border-0 last:pb-0">
                    <div className="mt-1">
                      {trend.impact === 'positive' ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : trend.impact === 'negative' ? (
                        <TrendingUp className="h-5 w-5 text-red-600 transform rotate-180" />
                      ) : (
                        <BarChart3 className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-medium">{trend.trend}</h4>
                        <span className={`text-sm font-medium capitalize ${getImpactColor(trend.impact)}`}>
                          {trend.impact} Impact
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{trend.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Magnitude:</span>
                        <Progress value={trend.magnitude * 10} className="w-24 h-2" />
                        <span className="text-xs font-medium">{trend.magnitude}/10</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-green-100 bg-green-50/20">
              <CardHeader>
                <CardTitle className="flex items-center text-green-700">
                  <Target className="h-5 w-5 mr-2" />
                  Market Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {marketData.opportunities.map((opp) => (
                  <div key={opp.id} className="p-4 bg-white rounded-lg border border-green-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-900">{opp.title}</h4>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                        {opp.difficulty} difficulty
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{opp.description}</p>
                    <div className="flex items-center text-sm font-medium text-green-600">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Potential: ${(opp.potentialRevenue / 1000000).toFixed(1)}M
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-red-100 bg-red-50/20">
              <CardHeader>
                <CardTitle className="flex items-center text-red-700">
                  <Shield className="h-5 w-5 mr-2" />
                  Market Threats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {marketData.threats.map((threat) => (
                  <div key={threat.id} className="p-4 bg-white rounded-lg border border-red-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-900">{threat.title}</h4>
                      <Badge variant="outline" className={getSeverityColor(threat.severity)}>
                        {threat.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{threat.description}</p>
                    <div className="text-sm">
                      <span className="font-medium text-red-700">Mitigation: </span>
                      <span className="text-gray-600">{threat.mitigationStrategy}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
