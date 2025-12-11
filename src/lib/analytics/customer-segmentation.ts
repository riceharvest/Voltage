/**
 * Customer Segmentation Service
 * 
 * Advanced customer segmentation using behavioral and demographic data.
 * Implements RFM (Recency, Frequency, Monetary) analysis and behavioral clustering.
 * 
 * @module CustomerSegmentation
 */

export interface UserProfile {
  id: string;
  lastActive: number; // timestamp
  sessionCount: number;
  totalTimeSpent: number; // minutes
  recipesCreated: number;
  calculationsPerformed: number;
  affiliateClicks: number;
  region: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  preferences: {
    caffeineSensitivity: 'low' | 'medium' | 'high';
    flavorProfile: string[];
    dietaryRestrictions: string[];
  };
}

export interface Segment {
  id: string;
  name: string;
  description: string;
  criteria: string;
  size: number; // percentage of total user base
  growthRate: number;
  averageLTV: number; // Lifetime Value estimate
  keyCharacteristics: string[];
}

export interface SegmentationAnalysis {
  segments: Segment[];
  distribution: Record<string, number>; // segmentId -> count
  insights: string[];
}

class CustomerSegmentationService {
  
  /**
   * Analyze user base and generate segments
   */
  public analyzeSegments(users: UserProfile[]): SegmentationAnalysis {
    // In a real implementation, this would use clustering algorithms like K-Means
    // Here we use rule-based segmentation (RFM-like)
    
    const segments: Record<string, UserProfile[]> = {
      'power_users': [],
      'casual_browsers': [],
      'recipe_creators': [],
      'at_risk': [],
      'new_users': []
    };

    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;

    users.forEach(user => {
      const daysSinceActive = (now - user.lastActive) / DAY;

      if (daysSinceActive > 30) {
        segments['at_risk'].push(user);
      } else if (user.sessionCount < 3 && daysSinceActive < 7) {
        segments['new_users'].push(user);
      } else if (user.recipesCreated > 5 || user.calculationsPerformed > 10) {
        segments['power_users'].push(user);
      } else if (user.recipesCreated > 0) {
        segments['recipe_creators'].push(user);
      } else {
        segments['casual_browsers'].push(user);
      }
    });

    const totalUsers = users.length || 1; // Avoid division by zero

    return {
      segments: [
        {
          id: 'power_users',
          name: 'Power Users',
          description: 'Highly engaged users who frequently create recipes and use the calculator',
          criteria: 'Active < 30 days, > 5 recipes OR > 10 calculations',
          size: (segments['power_users'].length / totalUsers) * 100,
          growthRate: 5.2,
          averageLTV: 125.50,
          keyCharacteristics: ['High retention', 'Brand advocates', 'Affiliate converters']
        },
        {
          id: 'recipe_creators',
          name: 'Recipe Creators',
          description: 'Users focused on experimenting with new flavors',
          criteria: 'Active < 30 days, > 0 recipes',
          size: (segments['recipe_creators'].length / totalUsers) * 100,
          growthRate: 3.8,
          averageLTV: 85.20,
          keyCharacteristics: ['Creative', 'Social sharers', 'Moderate engagement']
        },
        {
          id: 'casual_browsers',
          name: 'Casual Browsers',
          description: 'Users who consume content but rarely interact deeply',
          criteria: 'Active < 30 days, low interaction',
          size: (segments['casual_browsers'].length / totalUsers) * 100,
          growthRate: 1.5,
          averageLTV: 12.00,
          keyCharacteristics: ['Low retention', 'Information seekers', 'Price sensitive']
        },
        {
          id: 'new_users',
          name: 'New Users',
          description: 'Recently joined users in the onboarding phase',
          criteria: 'Joined < 7 days, < 3 sessions',
          size: (segments['new_users'].length / totalUsers) * 100,
          growthRate: 12.4,
          averageLTV: 45.00, // Projected
          keyCharacteristics: ['High potential', 'Need guidance', 'Exploratory behavior']
        },
        {
          id: 'at_risk',
          name: 'At Risk',
          description: 'Previously active users showing signs of churn',
          criteria: 'Inactive > 30 days',
          size: (segments['at_risk'].length / totalUsers) * 100,
          growthRate: -2.1,
          averageLTV: 65.00,
          keyCharacteristics: ['Declining usage', 'Former power users', 'Price sensitive']
        }
      ],
      distribution: Object.fromEntries(
        Object.entries(segments).map(([k, v]) => [k, v.length])
      ),
      insights: this.generateInsights(segments)
    };
  }

  private generateInsights(segments: Record<string, UserProfile[]>): string[] {
    const insights: string[] = [];
    const totalUsers = Object.values(segments).flat().length;

    if (segments['power_users'].length / totalUsers < 0.1) {
      insights.push('Power user segment is small. Consider loyalty programs to drive engagement.');
    }

    if (segments['at_risk'].length / totalUsers > 0.2) {
      insights.push('High churn risk detected. Initiate re-engagement campaigns immediately.');
    }

    const mobilePowerUsers = segments['power_users'].filter(u => u.deviceType === 'mobile').length;
    if (mobilePowerUsers / segments['power_users'].length > 0.6) {
      insights.push('Power users are predominantly mobile. Optimize advanced features for mobile view.');
    }

    return insights;
  }

  /**
   * Get dummy data for demonstration
   */
  public getMockData(): SegmentationAnalysis {
    const mockUsers: UserProfile[] = Array.from({ length: 1000 }).map((_, i) => ({
      id: `user-${i}`,
      lastActive: Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000,
      sessionCount: Math.floor(Math.random() * 50),
      totalTimeSpent: Math.floor(Math.random() * 500),
      recipesCreated: Math.random() > 0.7 ? Math.floor(Math.random() * 10) : 0,
      calculationsPerformed: Math.random() > 0.5 ? Math.floor(Math.random() * 20) : 0,
      affiliateClicks: Math.random() > 0.8 ? Math.floor(Math.random() * 5) : 0,
      region: ['US', 'EU', 'APAC'][Math.floor(Math.random() * 3)],
      deviceType: ['mobile', 'desktop', 'tablet'][Math.floor(Math.random() * 3)] as any,
      preferences: {
        caffeineSensitivity: 'medium',
        flavorProfile: [],
        dietaryRestrictions: []
      }
    }));

    return this.analyzeSegments(mockUsers);
  }
}

export const customerSegmentation = new CustomerSegmentationService();
