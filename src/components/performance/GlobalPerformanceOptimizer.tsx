'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Globe, 
  Clock, 
  Server, 
  Download, 
  Upload,
  Activity,
  TrendingUp,
  Database,
  Cloud,
  Shield,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react';

interface PerformanceMetrics {
  loadTime: number;
  bundleSize: number;
  imageOptimization: number;
  cacheHitRate: number;
  globalLatency: number;
  errorRate: number;
}

interface OptimizationConfig {
  lazyLoading: boolean;
  progressiveEnhancement: boolean;
  bundleSplitting: boolean;
  preloading: boolean;
  cdnIntegration: boolean;
  serviceWorkerCaching: boolean;
  imageOptimization: boolean;
  compression: boolean;
}

const defaultConfig: OptimizationConfig = {
  lazyLoading: true,
  progressiveEnhancement: true,
  bundleSplitting: true,
  preloading: true,
  cdnIntegration: true,
  serviceWorkerCaching: true,
  imageOptimization: true,
  compression: true,
};

interface GlobalPerformanceOptimizerProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  className?: string;
}

// Simulated performance data
const getSimulatedMetrics = (): PerformanceMetrics => ({
  loadTime: Math.random() * 2000 + 500, // 500-2500ms
  bundleSize: Math.random() * 500 + 200, // 200-700KB
  imageOptimization: Math.random() * 30 + 70, // 70-100%
  cacheHitRate: Math.random() * 20 + 80, // 80-100%
  globalLatency: Math.random() * 200 + 50, // 50-250ms
  errorRate: Math.random() * 2, // 0-2%
});

export function GlobalPerformanceOptimizer({ onMetricsUpdate, className }: GlobalPerformanceOptimizerProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(getSimulatedMetrics());
  const [config, setConfig] = useState<OptimizationConfig>(defaultConfig);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationLevel, setOptimizationLevel] = useState<'basic' | 'enhanced' | 'maximum'>('enhanced');

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const newMetrics = getSimulatedMetrics();
      setMetrics(newMetrics);
      onMetricsUpdate?.(newMetrics);
    }, 5000);

    return () => clearInterval(interval);
  }, [onMetricsUpdate]);

  // Performance optimization functions
  const optimizeForRegion = async (region: string) => {
    setIsOptimizing(true);
    
    // Simulate optimization process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Adjust metrics based on region
    const regionOptimizations: Record<string, Partial<PerformanceMetrics>> = {
      'US': { globalLatency: 80, cacheHitRate: 95 },
      'EU': { globalLatency: 120, cacheHitRate: 92 },
      'Asia': { globalLatency: 200, cacheHitRate: 88 },
      'Global': { globalLatency: 150, cacheHitRate: 90 }
    };
    
    const optimization = regionOptimizations[region] || regionOptimizations['Global'];
    setMetrics(prev => ({ ...prev, ...optimization }));
    setIsOptimizing(false);
  };

  const enableOptimization = (type: keyof OptimizationConfig) => {
    setConfig(prev => ({ ...prev, [type]: true }));
  };

  const getOptimizationScore = () => {
    const enabledCount = Object.values(config).filter(Boolean).length;
    return Math.round((enabledCount / Object.keys(config).length) * 100);
  };

  const getPerformanceGrade = () => {
    const score = getOptimizationScore();
    if (score >= 90) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 80) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 70) return { grade: 'B', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score >= 60) return { grade: 'C', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { grade: 'D', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const grade = getPerformanceGrade();

  // Bundle size optimization
  const optimizeBundleSplitting = () => {
    const categoryBundles = {
      classic: { size: '45KB', dependencies: 12 },
      energy: { size: '52KB', dependencies: 15 },
      hybrid: { size: '38KB', dependencies: 10 },
      shared: { size: '120KB', dependencies: 28 }
    };
    
    return categoryBundles;
  };

  const bundleSizes = useMemo(() => optimizeBundleSplitting(), []);

  return (
    <div className={`w-full max-w-6xl mx-auto space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-green-600 to-purple-600">
          Global Performance Optimization
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Optimize performance for global users with intelligent caching, bundle splitting, and CDN integration.
        </p>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Score */}
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold ${grade.color} ${grade.bg} mb-4`}>
              {grade.grade}
            </div>
            <div className="text-sm text-muted-foreground">
              {getOptimizationScore()}% optimization enabled
            </div>
          </CardContent>
        </Card>

        {/* Load Time */}
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Clock className="w-5 h-5" />
              Load Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {Math.round(metrics.loadTime)}ms
            </div>
            <Progress value={(3000 - metrics.loadTime) / 30} className="mb-2" />
            <div className="text-sm text-muted-foreground">
              {metrics.loadTime < 1000 ? 'Excellent' : metrics.loadTime < 2000 ? 'Good' : 'Needs Improvement'}
            </div>
          </CardContent>
        </Card>

        {/* Global Latency */}
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Globe className="w-5 h-5" />
              Global Latency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {Math.round(metrics.globalLatency)}ms
            </div>
            <Progress value={(300 - metrics.globalLatency) / 3} className="mb-2" />
            <div className="text-sm text-muted-foreground">
              Average worldwide response
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Performance Optimizations
          </CardTitle>
          <CardDescription>
            Configure global performance optimizations for your users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(config).map(([key, enabled]) => (
              <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {key === 'lazyLoading' && <Download className="w-4 h-4" />}
                  {key === 'progressiveEnhancement' && <Cpu className="w-4 h-4" />}
                  {key === 'bundleSplitting' && <Database className="w-4 h-4" />}
                  {key === 'preloading' && <Upload className="w-4 h-4" />}
                  {key === 'cdnIntegration' && <Cloud className="w-4 h-4" />}
                  {key === 'serviceWorkerCaching' && <Shield className="w-4 h-4" />}
                  {key === 'imageOptimization' && <Activity className="w-4 h-4" />}
                  {key === 'compression' && <HardDrive className="w-4 h-4" />}
                  <div>
                    <div className="font-medium capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {enabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                </div>
                <Button
                  variant={enabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setConfig(prev => ({ ...prev, [key]: !enabled }))}
                >
                  {enabled ? 'On' : 'Off'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bundle Optimization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Bundle Optimization
          </CardTitle>
          <CardDescription>
            Smart code splitting by category for optimal loading
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(bundleSizes).map(([category, bundle]) => (
              <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold capitalize">{category[0]}</span>
                  </div>
                  <div>
                    <div className="font-medium capitalize">{category} Bundle</div>
                    <div className="text-sm text-muted-foreground">
                      {bundle.dependencies} dependencies
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{bundle.size}</div>
                  <div className="text-sm text-muted-foreground">
                    {category === 'shared' ? 'Shared across all' : 'Category specific'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Regional Optimization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Regional Optimization
          </CardTitle>
          <CardDescription>
            Optimize performance for specific geographic regions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['US', 'EU', 'Asia', 'Global'].map(region => (
              <Button
                key={region}
                variant="outline"
                onClick={() => optimizeForRegion(region)}
                disabled={isOptimizing}
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <Wifi className="w-5 h-5" />
                <div className="text-center">
                  <div className="font-medium">{region}</div>
                  <div className="text-xs text-muted-foreground">
                    {region === 'US' && 'Americas'}
                    {region === 'EU' && 'Europe'}
                    {region === 'Asia' && 'Asia-Pacific'}
                    {region === 'Global' && 'Worldwide'}
                  </div>
                </div>
              </Button>
            ))}
          </div>
          
          {isOptimizing && (
            <div className="text-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Optimizing for region...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Real-time Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Real-time Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Cache Hit Rate</span>
                <Badge variant="outline">{Math.round(metrics.cacheHitRate)}%</Badge>
              </div>
              <Progress value={metrics.cacheHitRate} />
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Image Optimization</span>
                <Badge variant="outline">{Math.round(metrics.imageOptimization)}%</Badge>
              </div>
              <Progress value={metrics.imageOptimization} />
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Error Rate</span>
                <Badge variant={metrics.errorRate > 1 ? "destructive" : "outline"}>
                  {metrics.errorRate.toFixed(2)}%
                </Badge>
              </div>
              <Progress value={100 - (metrics.errorRate * 50)} />
            </div>
          </CardContent>
        </Card>

        {/* System Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              System Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">CPU Usage</span>
                <Badge variant="outline">23%</Badge>
              </div>
              <Progress value={23} />
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Memory Usage</span>
                <Badge variant="outline">45%</Badge>
              </div>
              <Progress value={45} />
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Network Efficiency</span>
                <Badge variant="outline">87%</Badge>
              </div>
              <Progress value={87} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Optimization Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getOptimizationScore() < 100 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800 dark:text-blue-200">
                    Enable remaining optimizations
                  </span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Turn on disabled optimizations to improve global performance by up to 40%.
                </p>
              </div>
            )}
            
            {metrics.loadTime > 2000 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800 dark:text-yellow-200">
                    High load time detected
                  </span>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Consider enabling lazy loading and bundle splitting to reduce initial load time.
                </p>
              </div>
            )}
            
            {metrics.globalLatency > 200 && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-red-600" />
                  <span className="font-medium text-red-800 dark:text-red-200">
                    High global latency
                  </span>
                </div>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Enable CDN integration and regional optimization for better worldwide performance.
                </p>
              </div>
            )}
            
            {metrics.cacheHitRate < 85 && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="w-4 h-4 text-orange-600" />
                  <span className="font-medium text-orange-800 dark:text-orange-200">
                    Low cache hit rate
                  </span>
                </div>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Enable service worker caching to improve repeat visit performance.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}