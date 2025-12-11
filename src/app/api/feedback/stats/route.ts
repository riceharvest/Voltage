import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface FeedbackFilter {
  category?: string;
  rating?: number;
  page?: string;
  dateFrom?: string;
  dateTo?: string;
  priority?: string;
  status?: 'new' | 'reviewed' | 'resolved' | 'archived';
}

interface FeedbackStats {
  total: number;
  averageRating: number;
  categoryBreakdown: Record<string, number>;
  ratingDistribution: Record<number, number>;
  recentTrend: { date: string; count: number }[];
  priorityBreakdown: Record<string, number>;
  spamRate: number;
  gdprComplianceRate: number;
}

/**
 * Feedback Statistics API
 * Provides analytics and reporting for feedback data
 */

// POST /api/feedback/stats - Get feedback statistics
export async function POST(request: NextRequest) {
  try {
    const { filter } = await request.json();

    const feedbackDir = path.join(process.cwd(), 'data', 'feedback');
    
    if (!fs.existsSync(feedbackDir)) {
      return NextResponse.json({
        success: true,
        data: getEmptyStats()
      });
    }

    const files = fs.readdirSync(feedbackDir).filter(file => file.endsWith('.json'));
    const feedback = files.map(file => {
      try {
        const filePath = path.join(feedbackDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      } catch (error) {
        console.error(`Error reading feedback file ${file}:`, error);
        return null;
      }
    }).filter(Boolean);

    // Apply filters
    let filteredFeedback = feedback;
    if (filter) {
      filteredFeedback = applyFilters(feedback, filter);
    }

    // Calculate statistics
    const stats = calculateFeedbackStats(filteredFeedback);

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error calculating feedback stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to calculate feedback statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Apply filters to feedback data
 */
function applyFilters(feedback: any[], filter: FeedbackFilter): any[] {
  return feedback.filter(item => {
    // Category filter
    if (filter.category && item.category !== filter.category) {
      return false;
    }

    // Rating filter
    if (filter.rating && item.rating !== filter.rating) {
      return false;
    }

    // Page filter
    if (filter.page && item.page !== filter.page) {
      return false;
    }

    // Priority filter
    if (filter.priority && item.priority !== filter.priority) {
      return false;
    }

    // Date range filter
    if (filter.dateFrom) {
      const itemDate = new Date(item.timestamp);
      const fromDate = new Date(filter.dateFrom);
      if (itemDate < fromDate) {
        return false;
      }
    }

    if (filter.dateTo) {
      const itemDate = new Date(item.timestamp);
      const toDate = new Date(filter.dateTo);
      if (itemDate > toDate) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Calculate comprehensive feedback statistics
 */
function calculateFeedbackStats(feedback: any[]): FeedbackStats {
  const total = feedback.length;
  
  if (total === 0) {
    return getEmptyStats();
  }

  // Average rating
  const totalRating = feedback.reduce((sum, item) => sum + (item.rating || 0), 0);
  const averageRating = totalRating / total;

  // Category breakdown
  const categoryBreakdown = feedback.reduce((acc, item) => {
    const category = item.category || 'uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Rating distribution
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  feedback.forEach(item => {
    const rating = item.rating || 0;
    if (rating >= 1 && rating <= 5) {
      ratingDistribution[rating as keyof typeof ratingDistribution]++;
    }
  });

  // Priority breakdown
  const priorityBreakdown = feedback.reduce((acc, item) => {
    const priority = item.priority || 'low';
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Recent trend (last 30 days)
  const recentTrend = calculateRecentTrend(feedback);

  // Spam rate
  const spamCount = feedback.filter(item => item.isSpam).length;
  const spamRate = total > 0 ? (spamCount / total) * 100 : 0;

  // GDPR compliance rate
  const gdprCompliant = feedback.filter(item => item.gdprConsent).length;
  const gdprComplianceRate = total > 0 ? (gdprCompliant / total) * 100 : 0;

  return {
    total,
    averageRating: Math.round(averageRating * 100) / 100,
    categoryBreakdown,
    ratingDistribution,
    recentTrend,
    priorityBreakdown,
    spamRate: Math.round(spamRate * 100) / 100,
    gdprComplianceRate: Math.round(gdprComplianceRate * 100) / 100
  };
}

/**
 * Calculate recent trend (last 30 days)
 */
function calculateRecentTrend(feedback: any[]): { date: string; count: number }[] {
  const trend = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayFeedback = feedback.filter(item => {
      const itemDate = new Date(item.timestamp).toISOString().split('T')[0];
      return itemDate === dateStr;
    });
    
    trend.push({
      date: dateStr,
      count: dayFeedback.length
    });
  }
  
  return trend;
}

/**
 * Get empty statistics structure
 */
function getEmptyStats(): FeedbackStats {
  return {
    total: 0,
    averageRating: 0,
    categoryBreakdown: {},
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    recentTrend: [],
    priorityBreakdown: { low: 0, medium: 0, high: 0, critical: 0 },
    spamRate: 0,
    gdprComplianceRate: 0
  };
}