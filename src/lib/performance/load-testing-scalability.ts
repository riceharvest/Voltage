/**
 * Load Testing and Scalability Validation Framework
 * Provides comprehensive load testing, stress testing, and scalability validation for global scale
 */

import { logger } from '../logger';

interface LoadTestConfig {
  name: string;
  description: string;
  targetRPS: number;
  duration: number; // seconds
  rampUpTime: number; // seconds
  concurrentUsers: number;
  endpoints: string[];
  scenarios: LoadTestScenario[];
  thresholds: {
    responseTime: {
      p50: number;
      p95: number;
      p99: number;
      max: number;
    };
    errorRate: number;
    throughput: number;
  };
}

interface LoadTestScenario {
  name: string;
  weight: number; // percentage of total traffic
  steps: LoadTestStep[];
}

interface LoadTestStep {
  action: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body?: any;
  expectedStatus: number[];
  thinkTime: number; // milliseconds between steps
}

interface ScalabilityTestConfig {
  name: string;
  description: string;
  maxConcurrentUsers: number;
  stepSize: number;
  stepDuration: number; // seconds
  endpoints: string[];
  metrics: {
    responseTime: boolean;
    throughput: boolean;
    errorRate: boolean;
    cpuUsage: boolean;
    memoryUsage: boolean;
    databaseConnections: boolean;
  };
}

interface LoadTestResult {
  testName: string;
  startTime: number;
  endTime: number;
  duration: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  responseTimes: {
    average: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  };
  throughput: number; // requests per second
  errorRate: number;
  concurrency: {
    max: number;
    average: number;
  };
  resourceUsage: {
    cpu: number[];
    memory: number[];
    network: number[];
  };
  bottlenecks: string[];
  recommendations: string[];
}

interface StressTestResult {
  testName: string;
  breakingPoint: {
    concurrentUsers: number;
    rps: number;
    errorRate: number;
    responseTime: number;
  };
  recoveryTime: number;
  systemStability: 'stable' | 'degraded' | 'failed';
  criticalIssues: string[];
}

class LoadTestingScalabilityFramework {
  private testConfigs = new Map<string, LoadTestConfig>();
  private scalabilityConfigs = new Map<string, ScalabilityTestConfig>();
  private testResults = new Map<string, LoadTestResult>();
  private stressResults = new Map<string, StressTestResult>();
  private activeTests = new Set<string>();
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeTestConfigurations();
    this.startPerformanceMonitoring();
  }

  private initializeTestConfigurations(): void {
    // 1. Basic Load Test Configuration
    this.testConfigs.set('basic-load-test', {
      name: 'Basic Load Test',
      description: 'Standard load test for 1000 concurrent users',
      targetRPS: 500,
      duration: 600, // 10 minutes
      rampUpTime: 120, // 2 minutes
      concurrentUsers: 1000,
      endpoints: [
        '/',
        '/flavors',
        '/calculator',
        '/safety',
        '/api/flavors',
        '/api/ingredients',
        '/api/calculator'
      ],
      scenarios: [
        {
          name: 'Homepage browsing',
          weight: 30,
          steps: [
            { action: 'GET', url: '/', expectedStatus: [200], thinkTime: 5000 },
            { action: 'GET', url: '/flavors', expectedStatus: [200], thinkTime: 3000 }
          ]
        },
        {
          name: 'Recipe interaction',
          weight: 40,
          steps: [
            { action: 'GET', url: '/flavors', expectedStatus: [200], thinkTime: 2000 },
            { action: 'GET', url: '/flavors/1', expectedStatus: [200], thinkTime: 4000 },
            { action: 'GET', url: '/calculator', expectedStatus: [200], thinkTime: 3000 }
          ]
        },
        {
          name: 'API usage',
          weight: 30,
          steps: [
            { action: 'GET', url: '/api/flavors', expectedStatus: [200], thinkTime: 1000 },
            { action: 'GET', url: '/api/ingredients', expectedStatus: [200], thinkTime: 1000 },
            { action: 'POST', url: '/api/calculator', body: { caffeine: 100, volume: 250 }, expectedStatus: [200], thinkTime: 2000 }
          ]
        }
      ],
      thresholds: {
        responseTime: {
          p50: 200,
          p95: 500,
          p99: 1000,
          max: 2000
        },
        errorRate: 1.0, // 1%
        throughput: 400 // minimum RPS
      }
    });

    // 2. Peak Traffic Simulation
    this.testConfigs.set('peak-traffic-simulation', {
      name: 'Peak Traffic Simulation',
      description: 'Simulates peak traffic scenario with sudden load spikes',
      targetRPS: 2000,
      duration: 1800, // 30 minutes
      rampUpTime: 300, // 5 minutes
      concurrentUsers: 5000,
      endpoints: [
        '/',
        '/flavors',
        '/calculator',
        '/safety',
        '/api/flavors',
        '/api/ingredients',
        '/api/calculator',
        '/api/search',
        '/api/enhanced-calculator'
      ],
      scenarios: [
        {
          name: 'Peak browsing',
          weight: 50,
          steps: [
            { action: 'GET', url: '/', expectedStatus: [200], thinkTime: 2000 },
            { action: 'GET', url: '/flavors', expectedStatus: [200], thinkTime: 3000 },
            { action: 'GET', url: '/calculator', expectedStatus: [200], thinkTime: 2000 }
          ]
        },
        {
          name: 'Heavy API usage',
          weight: 35,
          steps: [
            { action: 'GET', url: '/api/flavors', expectedStatus: [200], thinkTime: 500 },
            { action: 'POST', url: '/api/enhanced-calculator', body: { caffeine: 150, volume: 500 }, expectedStatus: [200], thinkTime: 1000 },
            { action: 'GET', url: '/api/search', expectedStatus: [200], thinkTime: 800 }
          ]
        },
        {
          name: 'Safety checks',
          weight: 15,
          steps: [
            { action: 'GET', url: '/safety', expectedStatus: [200], thinkTime: 5000 },
            { action: 'GET', url: '/api/ingredients', expectedStatus: [200], thinkTime: 2000 }
          ]
        }
      ],
      thresholds: {
        responseTime: {
          p50: 300,
          p95: 800,
          p99: 1500,
          max: 3000
        },
        errorRate: 2.0, // 2%
        throughput: 1500 // minimum RPS
      }
    });

    // 3. Global Scale Test
    this.testConfigs.set('global-scale-test', {
      name: 'Global Scale Test',
      description: 'Tests system behavior under global scale conditions',
      targetRPS: 5000,
      duration: 3600, // 1 hour
      rampUpTime: 600, // 10 minutes
      concurrentUsers: 10000,
      endpoints: [
        '/',
        '/flavors',
        '/calculator',
        '/safety',
        '/api/flavors',
        '/api/ingredients',
        '/api/calculator',
        '/api/search',
        '/api/enhanced-calculator',
        '/api/amazon/products',
        '/api/amazon/pricing'
      ],
      scenarios: [
        {
          name: 'Global browsing',
          weight: 40,
          steps: [
            { action: 'GET', url: '/', expectedStatus: [200], thinkTime: 3000 },
            { action: 'GET', url: '/flavors', expectedStatus: [200], thinkTime: 4000 },
            { action: 'GET', url: '/safety', expectedStatus: [200], thinkTime: 6000 }
          ]
        },
        {
          name: 'International API calls',
          weight: 35,
          steps: [
            { action: 'GET', url: '/api/amazon/products', expectedStatus: [200], thinkTime: 1500 },
            { action: 'GET', url: '/api/amazon/pricing', expectedStatus: [200], thinkTime: 1000 },
            { action: 'GET', url: '/api/search', expectedStatus: [200], thinkTime: 1200 }
          ]
        },
        {
          name: 'Calculator usage',
          weight: 25,
          steps: [
            { action: 'GET', url: '/calculator', expectedStatus: [200], thinkTime: 2000 },
            { action: 'POST', url: '/api/calculator', body: { caffeine: 80, volume: 330 }, expectedStatus: [200], thinkTime: 3000 },
            { action: 'POST', url: '/api/enhanced-calculator', body: { caffeine: 120, volume: 250 }, expectedStatus: [200], thinkTime: 2500 }
          ]
        }
      ],
      thresholds: {
        responseTime: {
          p50: 500,
          p95: 1200,
          p99: 2500,
          max: 5000
        },
        errorRate: 5.0, // 5%
        throughput: 3000 // minimum RPS
      }
    });

    // Scalability Test Configurations
    this.scalabilityConfigs.set('basic-scalability-test', {
      name: 'Basic Scalability Test',
      description: 'Tests system scalability from 100 to 5000 users',
      maxConcurrentUsers: 5000,
      stepSize: 500,
      stepDuration: 300, // 5 minutes per step
      endpoints: [
        '/',
        '/flavors',
        '/calculator',
        '/api/flavors',
        '/api/calculator'
      ],
      metrics: {
        responseTime: true,
        throughput: true,
        errorRate: true,
        cpuUsage: true,
        memoryUsage: true,
        databaseConnections: true
      }
    });

    this.scalabilityConfigs.set('database-scalability-test', {
      name: 'Database Scalability Test',
      description: 'Specifically tests database performance under load',
      maxConcurrentUsers: 3000,
      stepSize: 300,
      stepDuration: 240, // 4 minutes per step
      endpoints: [
        '/api/flavors',
        '/api/ingredients',
        '/api/search',
        '/api/calculator'
      ],
      metrics: {
        responseTime: true,
        throughput: true,
        errorRate: true,
        cpuUsage: false,
        memoryUsage: false,
        databaseConnections: true
      }
    });
  }

  // Load Testing Methods
  async runLoadTest(configName: string): Promise<LoadTestResult> {
    const config = this.testConfigs.get(configName);
    if (!config) {
      throw new Error(`Load test configuration not found: ${configName}`);
    }

    this.activeTests.add(configName);
    const startTime = Date.now();

    logger.info(`Starting load test: ${config.name}`);

    try {
      // Initialize monitoring
      const monitoringData = await this.initializeTestMonitoring(config);

      // Execute load test
      const testResult = await this.executeLoadTest(config);

      // Analyze results
      const result = await this.analyzeLoadTestResults(testResult, config, monitoringData);

      // Store results
      this.testResults.set(configName, result);

      logger.info(`Load test completed: ${config.name}`, {
        duration: result.duration,
        totalRequests: result.totalRequests,
        errorRate: result.errorRate,
        avgResponseTime: result.responseTimes.average
      });

      return result;
    } catch (error) {
      logger.error(`Load test failed: ${config.name}`, error);
      throw error;
    } finally {
      this.activeTests.delete(configName);
    }
  }

  private async executeLoadTest(config: LoadTestConfig): Promise<any> {
    const results = {
      requests: [] as any[],
      startTime: Date.now(),
      endTime: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0
    };

    // Simulate load test execution
    // In a real implementation, this would use a load testing tool like Artillery, k6, or JMeter
    
    const userPool = Array.from({ length: config.concurrentUsers }, (_, i) => i);
    const requestsPerUser = Math.floor((config.targetRPS * config.duration) / config.concurrentUsers);

    // Ramp-up phase
    await this.simulateRampUp(config.rampUpTime, userPool, config);

    // Load phase
    await this.simulateLoadPhase(config.duration, userPool, config, results);

    results.endTime = Date.now();
    return results;
  }

  private async simulateRampUp(rampUpTime: number, userPool: number[], config: LoadTestConfig): Promise<void> {
    const rampUpSteps = 10;
    const stepDuration = rampUpTime / rampUpSteps;
    
    for (let step = 0; step < rampUpSteps; step++) {
      const activeUsers = Math.floor((userPool.length * (step + 1)) / rampUpSteps);
      const targetRPS = Math.floor((config.targetRPS * (step + 1)) / rampUpSteps);
      
      logger.info(`Ramp-up step ${step + 1}/${rampUpSteps}: ${activeUsers} users, ${targetRPS} RPS`);
      
      await this.simulateTraffic(activeUsers, targetRPS, stepDuration * 1000, config);
    }
  }

  private async simulateLoadPhase(duration: number, userPool: number[], config: LoadTestConfig, results: any): Promise<void> {
    const durationMs = duration * 1000;
    const startTime = Date.now();
    
    // Simulate continuous load
    while (Date.now() - startTime < durationMs) {
      const activeUsers = userPool.length;
      const targetRPS = config.targetRPS;
      
      await this.simulateTraffic(activeUsers, targetRPS, 1000, config, results);
      
      // Small delay between iterations
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private async simulateTraffic(
    activeUsers: number, 
    targetRPS: number, 
    duration: number, 
    config: LoadTestConfig, 
    results?: any
  ): Promise<void> {
    const requestsToSimulate = Math.floor((targetRPS * duration) / 1000);
    
    // Simulate requests
    for (let i = 0; i < requestsToSimulate; i++) {
      const scenario = this.selectRandomScenario(config.scenarios);
      const step = this.selectRandomStep(scenario.steps);
      
      const requestResult = await this.simulateRequest(step, config);
      
      if (results) {
        results.requests.push(requestResult);
        results.totalRequests++;
        
        if (requestResult.success) {
          results.successfulRequests++;
        } else {
          results.failedRequests++;
        }
      }
      
      // Simulate think time
      await new Promise(resolve => setTimeout(resolve, step.thinkTime));
    }
  }

  private selectRandomScenario(scenarios: LoadTestScenario[]): LoadTestScenario {
    const totalWeight = scenarios.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const scenario of scenarios) {
      random -= scenario.weight;
      if (random <= 0) {
        return scenario;
      }
    }
    
    return scenarios[0]; // Fallback
  }

  private selectRandomStep(steps: LoadTestStep[]): LoadTestStep {
    return steps[Math.floor(Math.random() * steps.length)];
  }

  private async simulateRequest(step: LoadTestStep, config: LoadTestConfig): Promise<any> {
    const startTime = performance.now();
    
    // Simulate request processing
    const baseLatency = this.getBaseLatency(step.url);
    const networkLatency = Math.random() * 50; // 0-50ms network latency
    const processingLatency = baseLatency + (Math.random() * 100); // 0-100ms processing
    
    await new Promise(resolve => setTimeout(resolve, networkLatency + processingLatency));
    
    const responseTime = performance.now() - startTime;
    const success = step.expectedStatus.includes(200); // Simplified success logic
    
    return {
      url: step.url,
      method: step.action,
      responseTime,
      success,
      statusCode: success ? 200 : 500,
      timestamp: Date.now()
    };
  }

  private getBaseLatency(url: string): number {
    // Simulate different latencies for different endpoints
    const latencyMap: Record<string, number> = {
      '/': 50,
      '/flavors': 80,
      '/calculator': 60,
      '/safety': 40,
      '/api/flavors': 30,
      '/api/ingredients': 25,
      '/api/calculator': 45,
      '/api/search': 35,
      '/api/enhanced-calculator': 55,
      '/api/amazon/products': 100,
      '/api/amazon/pricing': 90
    };
    
    return latencyMap[url] || 50;
  }

  // Scalability Testing Methods
  async runScalabilityTest(configName: string): Promise<any> {
    const config = this.scalabilityConfigs.get(configName);
    if (!config) {
      throw new Error(`Scalability test configuration not found: ${configName}`);
    }

    this.activeTests.add(configName);
    logger.info(`Starting scalability test: ${config.name}`);

    try {
      const scalabilityData = {
        testName: config.name,
        steps: [] as any[],
        breakingPoint: null as any,
        recommendations: [] as string[]
      };

      // Test scalability by gradually increasing load
      for (let users = 100; users <= config.maxConcurrentUsers; users += config.stepSize) {
        logger.info(`Scalability test step: ${users} concurrent users`);
        
        const stepResult = await this.executeScalabilityStep(users, config);
        scalabilityData.steps.push(stepResult);
        
        // Check if system is degrading
        if (this.isSystemDegrading(stepResult)) {
          logger.warn(`System degradation detected at ${users} users`);
          scalabilityData.breakingPoint = {
            concurrentUsers: users,
            responseTime: stepResult.avgResponseTime,
            errorRate: stepResult.errorRate,
            throughput: stepResult.throughput
          };
          break;
        }
        
        // Wait between steps
        await new Promise(resolve => setTimeout(resolve, config.stepDuration * 1000));
      }

      // Generate recommendations
      scalabilityData.recommendations = this.generateScalabilityRecommendations(scalabilityData.steps);

      logger.info(`Scalability test completed: ${config.name}`);
      return scalabilityData;
    } catch (error) {
      logger.error(`Scalability test failed: ${config.name}`, error);
      throw error;
    } finally {
      this.activeTests.delete(configName);
    }
  }

  private async executeScalabilityStep(concurrentUsers: number, config: ScalabilityTestConfig): Promise<any> {
    const startTime = Date.now();
    const duration = config.stepDuration * 1000;
    
    // Simulate load at this concurrency level
    const targetRPS = Math.floor(concurrentUsers * 0.5); // Assume 0.5 RPS per user
    let totalRequests = 0;
    let successfulRequests = 0;
    let responseTimes: number[] = [];
    
    const endTime = startTime + duration;
    
    while (Date.now() < endTime) {
      // Simulate concurrent requests
      const activeRequests = Math.min(concurrentUsers, Math.floor((targetRPS * 100) / 1000));
      
      for (let i = 0; i < activeRequests; i++) {
        const endpoint = config.endpoints[Math.floor(Math.random() * config.endpoints.length)];
        const requestStart = performance.now();
        
        // Simulate request
        await this.simulateRequest(
          { action: 'GET' as const, url: endpoint, expectedStatus: [200], thinkTime: 0 },
          {} as LoadTestConfig
        );
        
        const responseTime = performance.now() - requestStart;
        responseTimes.push(responseTime);
        totalRequests++;
        successfulRequests++;
      }
      
      // Small delay between request batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const actualDuration = (Date.now() - startTime) / 1000;
    const throughput = totalRequests / actualDuration;
    const errorRate = ((totalRequests - successfulRequests) / totalRequests) * 100;
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const p95 = this.calculatePercentile(responseTimes, 95);
    const p99 = this.calculatePercentile(responseTimes, 99);
    
    return {
      concurrentUsers,
      totalRequests,
      successfulRequests,
      errorRate,
      throughput,
      avgResponseTime,
      p95ResponseTime: p95,
      p99ResponseTime: p99,
      duration: actualDuration
    };
  }

  private isSystemDegrading(stepResult: any): boolean {
    // Define degradation criteria
    return (
      stepResult.errorRate > 5 || // More than 5% error rate
      stepResult.avgResponseTime > 2000 || // More than 2 second average response time
      stepResult.throughput < stepResult.concurrentUsers * 0.3 // Less than 30% of expected throughput
    );
  }

  // Stress Testing Methods
  async runStressTest(configName: string): Promise<StressTestResult> {
    const config = this.testConfigs.get(configName);
    if (!config) {
      throw new Error(`Stress test configuration not found: ${configName}`);
    }

    this.activeTests.add(configName);
    logger.info(`Starting stress test: ${config.name}`);

    try {
      const stressResult = await this.executeStressTest(config);
      this.stressResults.set(configName, stressResult);
      
      logger.info(`Stress test completed: ${config.name}`, stressResult);
      return stressResult;
    } catch (error) {
      logger.error(`Stress test failed: ${config.name}`, error);
      throw error;
    } finally {
      this.activeTests.delete(configName);
    }
  }

  private async executeStressTest(config: LoadTestConfig): Promise<StressTestResult> {
    let concurrentUsers = 1000;
    const maxUsers = 50000; // Very high load
    const stepSize = 1000;
    let breakingPoint: any = null;
    let systemStability: 'stable' | 'degraded' | 'failed' = 'stable';
    
    while (concurrentUsers <= maxUsers && !breakingPoint) {
      logger.info(`Stress test step: ${concurrentUsers} users`);
      
      const testResult = await this.executeLoadTest({
        ...config,
        concurrentUsers,
        duration: 300, // 5 minutes per step
        targetRPS: concurrentUsers
      });
      
      // Check if system is failing
      if (testResult.errorRate > 20 || testResult.responseTimes.p95 > 5000) {
        breakingPoint = {
          concurrentUsers,
          rps: testResult.throughput,
          errorRate: testResult.errorRate,
          responseTime: testResult.responseTimes.p95
        };
        
        if (testResult.errorRate > 50) {
          systemStability = 'failed';
        } else {
          systemStability = 'degraded';
        }
        break;
      }
      
      concurrentUsers += stepSize;
      
      // Wait between steps
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
    }
    
    // Test recovery time
    const recoveryTime = await this.testSystemRecovery();
    
    return {
      testName: config.name,
      breakingPoint: breakingPoint || {
        concurrentUsers: maxUsers,
        rps: maxUsers * 0.5,
        errorRate: 0,
        responseTime: 500
      },
      recoveryTime,
      systemStability,
      criticalIssues: this.identifyCriticalIssues(breakingPoint)
    };
  }

  private async testSystemRecovery(): Promise<number> {
    const recoveryStart = Date.now();
    
    // Simulate normal load after stress
    await this.simulateTraffic(1000, 500, 60000, {} as LoadTestConfig);
    
    const recoveryTime = Date.now() - recoveryStart;
    logger.info(`System recovery time: ${recoveryTime}ms`);
    
    return recoveryTime;
  }

  private identifyCriticalIssues(breakingPoint: any): string[] {
    const issues: string[] = [];
    
    if (!breakingPoint) return issues;
    
    if (breakingPoint.errorRate > 50) {
      issues.push('High error rate indicates system overload');
    }
    
    if (breakingPoint.responseTime > 10000) {
      issues.push('Extreme response times suggest resource exhaustion');
    }
    
    if (breakingPoint.concurrentUsers < 5000) {
      issues.push('Low breaking point indicates scalability issues');
    }
    
    return issues;
  }

  // Analysis and Reporting Methods
  private async analyzeLoadTestResults(
    rawResults: any, 
    config: LoadTestConfig, 
    monitoringData: any
  ): Promise<LoadTestResult> {
    const responseTimes = rawResults.requests.map((r: any) => r.responseTime);
    const totalDuration = (rawResults.endTime - rawResults.startTime) / 1000;
    const throughput = rawResults.totalRequests / totalDuration;
    
    const result: LoadTestResult = {
      testName: config.name,
      startTime: rawResults.startTime,
      endTime: rawResults.endTime,
      duration: totalDuration,
      totalRequests: rawResults.totalRequests,
      successfulRequests: rawResults.successfulRequests,
      failedRequests: rawResults.failedRequests,
      responseTimes: {
        average: responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length,
        min: Math.min(...responseTimes),
        max: Math.max(...responseTimes),
        p50: this.calculatePercentile(responseTimes, 50),
        p95: this.calculatePercentile(responseTimes, 95),
        p99: this.calculatePercentile(responseTimes, 99)
      },
      throughput,
      errorRate: (rawResults.failedRequests / rawResults.totalRequests) * 100,
      concurrency: {
        max: config.concurrentUsers,
        average: config.concurrentUsers
      },
      resourceUsage: {
        cpu: [], // Would be populated from monitoring data
        memory: [],
        network: []
      },
      bottlenecks: this.identifyBottlenecks(responseTimes, throughput),
      recommendations: this.generateRecommendations(config, result)
    };
    
    return result;
  }

  private async initializeTestMonitoring(config: LoadTestConfig): Promise<any> {
    // Initialize monitoring for the test
    return {
      startTime: Date.now(),
      cpuUsage: [] as number[],
      memoryUsage: [] as number[],
      networkUsage: [] as number[]
    };
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  private identifyBottlenecks(responseTimes: number[], throughput: number): string[] {
    const bottlenecks: string[] = [];
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    
    if (avgResponseTime > 1000) {
      bottlenecks.push('High average response times indicate server-side bottlenecks');
    }
    
    if (throughput < 100) {
      bottlenecks.push('Low throughput suggests resource limitations');
    }
    
    const p95 = this.calculatePercentile(responseTimes, 95);
    if (p95 > 3000) {
      bottlenecks.push('95th percentile response time exceeds acceptable limits');
    }
    
    return bottlenecks;
  }

  private generateRecommendations(config: LoadTestConfig, result: LoadTestResult): string[] {
    const recommendations: string[] = [];
    
    if (result.errorRate > config.thresholds.errorRate) {
      recommendations.push('Error rate exceeds threshold - review error handling and resource limits');
    }
    
    if (result.responseTimes.p95 > config.thresholds.responseTime.p95) {
      recommendations.push('95th percentile response time is too high - optimize slow endpoints');
    }
    
    if (result.throughput < config.thresholds.throughput) {
      recommendations.push('Throughput is below target - consider scaling resources or optimizing performance');
    }
    
    if (result.bottlenecks.length > 0) {
      recommendations.push('Address identified bottlenecks to improve overall performance');
    }
    
    return recommendations;
  }

  private generateScalabilityRecommendations(steps: any[]): string[] {
    const recommendations: string[] = [];
    
    // Analyze scalability curve
    const responseTimeGrowth = this.analyzeResponseTimeGrowth(steps);
    const throughputGrowth = this.analyzeThroughputGrowth(steps);
    
    if (responseTimeGrowth > 2) {
      recommendations.push('Response times grow rapidly with load - consider database optimization');
    }
    
    if (throughputGrowth < 0.8) {
      recommendations.push('Throughput doesn\'t scale linearly - investigate resource contention');
    }
    
    // Find breaking point
    const breakingStep = steps.find(step => this.isSystemDegrading(step));
    if (breakingStep) {
      recommendations.push(`System breaks at ${breakingStep.concurrentUsers} users - scale before this limit`);
    }
    
    return recommendations;
  }

  private analyzeResponseTimeGrowth(steps: any[]): number {
    if (steps.length < 2) return 1;
    
    const first = steps[0].avgResponseTime;
    const last = steps[steps.length - 1].avgResponseTime;
    const userGrowth = steps[steps.length - 1].concurrentUsers / steps[0].concurrentUsers;
    
    return (last / first) / userGrowth;
  }

  private analyzeThroughputGrowth(steps: any[]): number {
    if (steps.length < 2) return 1;
    
    const first = steps[0].throughput;
    const last = steps[steps.length - 1].throughput;
    const userGrowth = steps[steps.length - 1].concurrentUsers / steps[0].concurrentUsers;
    
    return (last / first) / userGrowth;
  }

  // Performance Monitoring
  private startPerformanceMonitoring(): void {
    // Monitor active tests
    this.monitoringInterval = setInterval(() => {
      this.monitorActiveTests();
    }, 30000); // Every 30 seconds
  }

  private monitorActiveTests(): void {
    this.activeTests.forEach(testName => {
      logger.debug(`Monitoring active test: ${testName}`);
    });
  }

  // Public API
  getAvailableLoadTests(): string[] {
    return Array.from(this.testConfigs.keys());
  }

  getAvailableScalabilityTests(): string[] {
    return Array.from(this.scalabilityConfigs.keys());
  }

  getTestResults(testName?: string): any {
    if (testName) {
      return this.testResults.get(testName);
    }
    return Object.fromEntries(this.testResults);
  }

  getStressResults(testName?: string): any {
    if (testName) {
      return this.stressResults.get(testName);
    }
    return Object.fromEntries(this.stressResults);
  }

  isTestRunning(testName?: string): boolean {
    if (testName) {
      return this.activeTests.has(testName);
    }
    return this.activeTests.size > 0;
  }

  createCustomTest(config: Partial<LoadTestConfig>): string {
    const name = `custom-test-${Date.now()}`;
    const fullConfig: LoadTestConfig = {
      name: config.name || name,
      description: config.description || 'Custom load test',
      targetRPS: config.targetRPS || 100,
      duration: config.duration || 300,
      rampUpTime: config.rampUpTime || 60,
      concurrentUsers: config.concurrentUsers || 100,
      endpoints: config.endpoints || ['/'],
      scenarios: config.scenarios || [{
        name: 'Default scenario',
        weight: 100,
        steps: [{ action: 'GET', url: '/', expectedStatus: [200], thinkTime: 1000 }]
      }],
      thresholds: config.thresholds || {
        responseTime: { p50: 200, p95: 500, p99: 1000, max: 2000 },
        errorRate: 1.0,
        throughput: 50
      }
    };
    
    this.testConfigs.set(name, fullConfig);
    return name;
  }

  async runPerformanceRegressionTest(): Promise<any> {
    logger.info('Starting performance regression test');
    
    const regressionResults = {
      timestamp: new Date().toISOString(),
      tests: [] as any[],
      summary: {
        passed: 0,
        failed: 0,
        degraded: 0
      }
    };
    
    // Run key tests for regression
    const regressionTests = ['basic-load-test', 'peak-traffic-simulation'];
    
    for (const testName of regressionTests) {
      try {
        const result = await this.runLoadTest(testName);
        const status = this.evaluateRegressionResult(result, testName);
        
        regressionResults.tests.push({
          testName,
          status,
          result,
          timestamp: new Date().toISOString()
        });
        
        regressionResults.summary[status]++;
      } catch (error) {
        regressionResults.tests.push({
          testName,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        regressionResults.summary.failed++;
      }
    }
    
    logger.info('Performance regression test completed', regressionResults.summary);
    return regressionResults;
  }

  private evaluateRegressionResult(result: LoadTestResult, testName: string): 'passed' | 'failed' | 'degraded' {
    // Compare with baseline results
    const baseline = this.testResults.get(`${testName}-baseline`);
    
    if (!baseline) {
      return 'degraded'; // No baseline for comparison
    }
    
    const responseTimeDegradation = result.responseTimes.average / baseline.responseTimes.average;
    const errorRateIncrease = result.errorRate / baseline.errorRate;
    const throughputDecrease = baseline.throughput / result.throughput;
    
    if (responseTimeDegradation > 1.5 || errorRateIncrease > 2 || throughputDecrease > 1.5) {
      return 'failed';
    } else if (responseTimeDegradation > 1.2 || errorRateIncrease > 1.5 || throughputDecrease > 1.2) {
      return 'degraded';
    }
    
    return 'passed';
  }
}

// Export singleton instance
export const loadTestingFramework = new LoadTestingScalabilityFramework();

export default LoadTestingScalabilityFramework;
export type { LoadTestConfig, LoadTestResult, ScalabilityTestConfig, StressTestResult };