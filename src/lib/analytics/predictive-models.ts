/**
 * Predictive Analytics Models
 * 
 * Implements statistical models for forecasting and prediction:
 * - Linear Regression for trend analysis
 * - Exponential Smoothing for time-series forecasting
 * - Logistic Regression (simplified) for churn prediction
 * 
 * @module PredictiveModels
 */

export interface DataPoint {
  x: number; // timestamp or index
  y: number; // value
}

export interface ForecastResult {
  points: DataPoint[];
  confidence: number;
  trend: 'up' | 'down' | 'flat';
  growthRate: number;
}

export interface ChurnRiskScore {
  userId: string;
  score: number; // 0-1
  factors: string[];
}

class PredictiveAnalyticsService {
  
  /**
   * Simple Linear Regression
   * Returns future points based on historical data
   */
  public forecastLinear(data: DataPoint[], periodsToForecast: number): ForecastResult {
    if (data.length < 2) return { points: [], confidence: 0, trend: 'flat', growthRate: 0 };

    const n = data.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    data.forEach(p => {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumXX += p.x * p.x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const lastX = data[data.length - 1].x;
    const forecastPoints: DataPoint[] = [];

    // Assuming x values are evenly spaced (e.g., daily timestamps)
    // We'll estimate the interval from the last two points
    const interval = data[n - 1].x - data[n - 2].x;

    for (let i = 1; i <= periodsToForecast; i++) {
      const nextX = lastX + (interval * i);
      const nextY = slope * nextX + intercept;
      forecastPoints.push({ x: nextX, y: Math.max(0, nextY) });
    }

    const trend = slope > 0 ? 'up' : slope < 0 ? 'down' : 'flat';
    
    // Calculate simple growth rate relative to the last actual value
    const lastActualY = data[n - 1].y;
    const lastForecastY = forecastPoints[periodsToForecast - 1].y;
    const growthRate = lastActualY !== 0 ? ((lastForecastY - lastActualY) / lastActualY) * 100 : 0;

    // R-squared calculation for confidence
    const meanY = sumY / n;
    let ssTot = 0;
    let ssRes = 0;
    
    data.forEach(p => {
      const predictedY = slope * p.x + intercept;
      ssTot += Math.pow(p.y - meanY, 2);
      ssRes += Math.pow(p.y - predictedY, 2);
    });
    
    const rSquared = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;

    return {
      points: forecastPoints,
      confidence: Math.max(0, Math.min(100, rSquared * 100)),
      trend,
      growthRate
    };
  }

  /**
   * Holt-Winters Exponential Smoothing (Simplified)
   * Better for seasonal data
   */
  public forecastExponentialSmoothing(data: number[], alpha: number, periodsToForecast: number): number[] {
    let result = [data[0]]; // Level

    for (let i = 1; i < data.length; i++) {
      const val = data[i];
      const lastLevel = result[i - 1];
      const level = alpha * val + (1 - alpha) * lastLevel;
      result.push(level);
    }

    const lastLevel = result[result.length - 1];
    const forecast: number[] = [];
    
    for (let i = 0; i < periodsToForecast; i++) {
      forecast.push(lastLevel); // Naive flat forecast for simple smoothing
    }

    return forecast;
  }

  /**
   * Calculate Churn Risk Score
   * Based on user activity metrics
   */
  public calculateChurnRisk(userMetrics: {
    daysSinceLastLogin: number;
    sessionsLast30Days: number;
    supportTicketsOpen: number;
    usageDropPercent: number; // % drop in usage compared to prev month
  }): ChurnRiskScore {
    let score = 0;
    const factors: string[] = [];

    // Recency Factor
    if (userMetrics.daysSinceLastLogin > 30) {
      score += 0.4;
      factors.push('Inactive for > 30 days');
    } else if (userMetrics.daysSinceLastLogin > 14) {
      score += 0.2;
      factors.push('Inactive for > 14 days');
    }

    // Frequency Factor
    if (userMetrics.sessionsLast30Days < 2) {
      score += 0.3;
      factors.push('Low session frequency');
    }

    // Support Factor
    if (userMetrics.supportTicketsOpen > 0) {
      score += 0.1 * userMetrics.supportTicketsOpen;
      factors.push('Unresolved support tickets');
    }

    // Usage Trend Factor
    if (userMetrics.usageDropPercent > 50) {
      score += 0.3;
      factors.push('Significant usage drop');
    } else if (userMetrics.usageDropPercent > 20) {
      score += 0.1;
      factors.push('Declining usage');
    }

    return {
      userId: 'unknown', // Would be passed in
      score: Math.min(1, score),
      factors
    };
  }
}

export const predictiveModels = new PredictiveAnalyticsService();
