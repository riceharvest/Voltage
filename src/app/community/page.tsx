'use client';

/**
 * Community & Social Features Page
 * Main page for community interactions, recipe sharing, and social features
 */

import React, { useState, useEffect } from 'react';
import { communitySocialPlatform } from '@/lib/community-social-platform';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Recipe, 
  Trophy, 
  TrendingUp, 
  Heart, 
  MessageCircle, 
  Share2, 
  Star,
  Plus,
  Search,
  Filter,
  Calendar,
  Award,
  Zap,
  Globe,
  Shield
} from 'lucide-react';

interface CommunityStats {
  totalUsers: number;
  totalRecipes: number;
  activeChallenges: number;
  communityEngagement: number;
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [communityStats, setCommunityStats] = useState<CommunityStats>({
    totalUsers: 0,
    totalRecipes: 0,
    activeChallenges: 0,
    communityEngagement: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCommunityData();
  }, []);

  const loadCommunityData = async () => {
    try {
      setIsLoading(true);
      
      // Load community analytics
      const analytics = await communitySocialPlatform.getCommunityAnalytics('7d');
      const trendingRecipes = await communitySocialPlatform.getTrendingRecipes(6);
      const activeChallenges = await communitySocialPlatform.getActiveChallenges();
      
      setCommunityStats({
        totalUsers: analytics.metrics.users.total || 1250,
        totalRecipes: analytics.metrics.content.recipes.total || 856,
        activeChallenges: activeChallenges.length || 3,
        communityEngagement: analytics.metrics.engagement.conversionRate || 68
      });
      
    } catch (error) {
      console.error('Failed to load community data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRecipe = () => {
    // Navigate to recipe creation
    window.location.href = '/community/recipe/create';
  };

  const handleJoinChallenge = (challengeId: string) => {
    // Join challenge logic
    console.log('Joining challenge:', challengeId);
  };

  const handleLikeRecipe = (recipeId: string) => {
    // Like recipe logic
    console.log('Liking recipe:', recipeId);
  };

  const handleShareRecipe = (recipeId: string) => {
    // Share recipe logic
    console.log('Sharing recipe:', recipeId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Community & Social Hub
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Connect with fellow soda enthusiasts, share your creations, participate in challenges, 
          and discover amazing recipes from our global community.
        </p>
      </div>

      {/* Community Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Community Members</p>
                <p className="text-3xl font-bold">{communityStats.totalUsers.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Shared Recipes</p>
                <p className="text-3xl font-bold">{communityStats.totalRecipes.toLocaleString()}</p>
              </div>
              <Recipe className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Challenges</p>
                <p className="text-3xl font-bold">{communityStats.activeChallenges}</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Engagement Rate</p>
                <p className="text-3xl font-bold">{communityStats.communityEngagement}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button onClick={handleCreateRecipe} size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Share Your Recipe
        </Button>
        <Button variant="outline" size="lg" className="gap-2">
          <Search className="h-5 w-5" />
          Explore Community
        </Button>
        <Button variant="outline" size="lg" className="gap-2">
          <Trophy className="h-5 w-5" />
          Join Challenge
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="feed" className="gap-2">
            <Globe className="h-4 w-4" />
            Community Feed
          </TabsTrigger>
          <TabsTrigger value="challenges" className="gap-2">
            <Trophy className="h-4 w-4" />
            Challenges
          </TabsTrigger>
          <TabsTrigger value="trending" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="safety" className="gap-2">
            <Shield className="h-4 w-4" />
            Safety & Guidelines
          </TabsTrigger>
        </TabsList>

        {/* Community Feed */}
        <TabsContent value="feed" className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search recipes, users, or challenges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Featured Recipe */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Featured Community Recipe</CardTitle>
                    <CardDescription>
                      Discover this week's most popular creation from our community
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Star className="h-3 w-3" />
                    Featured
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      AR
                    </div>
                    <div>
                      <p className="font-semibold">Alex Rodriguez</p>
                      <p className="text-sm text-muted-foreground">Recipe Creator • 2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Tropical Fusion Energy Drink</h3>
                    <p className="text-muted-foreground">
                      A refreshing blend of tropical fruits with a caffeine boost. Perfect for summer energy!
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Zap className="h-4 w-4" />
                      120mg Caffeine
                    </span>
                    <span>45 min prep</span>
                    <span>4 servings</span>
                    <Badge variant="outline">Intermediate</Badge>
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Heart className="h-4 w-4" />
                      234
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <MessageCircle className="h-4 w-4" />
                      45
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Community Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Heart className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">Sarah Chen</span> liked your 
                      <span className="font-medium"> Citrus Energy Blast</span>
                    </p>
                    <p className="text-xs text-muted-foreground">5 minutes ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">Mike Johnson</span> submitted to 
                      <span className="font-medium"> Summer Fusion Challenge</span>
                    </p>
                    <p className="text-xs text-muted-foreground">12 minutes ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">Emma Wilson</span> started following you
                    </p>
                    <p className="text-xs text-muted-foreground">1 hour ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Contributors */}
            <Card>
              <CardHeader>
                <CardTitle>Top Contributors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Alex Rodriguez</p>
                    <p className="text-sm text-muted-foreground">45 recipes shared</p>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Award className="h-3 w-3" />
                    Expert
                  </Badge>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Sarah Chen</p>
                    <p className="text-sm text-muted-foreground">38 recipes shared</p>
                  </div>
                  <Badge variant="outline">Creator</Badge>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Mike Johnson</p>
                    <p className="text-sm text-muted-foreground">32 recipes shared</p>
                  </div>
                  <Badge variant="outline">Rising Star</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Challenges */}
        <TabsContent value="challenges" className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Community Challenges</h2>
            <p className="text-muted-foreground">
              Join exciting challenges, showcase your skills, and win amazing prizes!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Active Challenge 1 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    Active
                  </Badge>
                  <Badge variant="outline">7 days left</Badge>
                </div>
                <CardTitle className="text-lg">Summer Fusion Challenge</CardTitle>
                <CardDescription>
                  Create the most refreshing summer-themed energy drink using tropical ingredients.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Participants</span>
                    <span className="font-medium">23</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Prize Pool</span>
                    <span className="font-medium">$500 + Badge</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Difficulty</span>
                    <Badge variant="outline">Intermediate</Badge>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => handleJoinChallenge('challenge-1')}
                >
                  Join Challenge
                </Button>
              </CardContent>
            </Card>

            {/* Active Challenge 2 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    Active
                  </Badge>
                  <Badge variant="outline">14 days left</Badge>
                </div>
                <CardTitle className="text-lg">Cultural Innovation Contest</CardTitle>
                <CardDescription>
                  Blend traditional flavors from your culture with modern energy drink concepts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Participants</span>
                    <span className="font-medium">17</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Prize Pool</span>
                    <span className="font-medium">Featured + Badge</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Difficulty</span>
                    <Badge variant="outline">Advanced</Badge>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => handleJoinChallenge('challenge-2')}
                >
                  Join Challenge
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Challenge */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    Upcoming
                  </Badge>
                  <Badge variant="outline">Starts in 3 days</Badge>
                </div>
                <CardTitle className="text-lg">Safety First Challenge</CardTitle>
                <CardDescription>
                  Showcase the safest and most responsible energy drink recipes with proper warnings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Expected Participants</span>
                    <span className="font-medium">50+</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Prize Pool</span>
                    <span className="font-medium">Safety Expert Badge</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Difficulty</span>
                    <Badge variant="outline">All Levels</Badge>
                  </div>
                </div>
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trending */}
        <TabsContent value="trending" className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Trending Recipes</h2>
            <p className="text-muted-foreground">
              Discover what's popular in the community right now
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Card key={item} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      #{item}
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {item === 1 ? 'Tropical Energy Blast' :
                         item === 2 ? 'Berry Power Surge' :
                         item === 3 ? 'Citrus Morning Kick' :
                         item === 4 ? 'Midnight Focus Fuel' :
                         item === 5 ? 'Peach Paradise Boost' :
                         'Ginger Wellness Shot'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        by {item === 1 ? 'Alex R.' : item === 2 ? 'Sarah C.' : 'Mike J.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {250 - item * 10}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {45 - item * 3}
                    </span>
                    <Badge variant="outline">{['Intermediate', 'Advanced', 'Beginner', 'Intermediate', 'Advanced', 'Beginner'][item - 1]}</Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => handleLikeRecipe(`recipe-${item}`)}>
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      View Recipe
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Safety & Guidelines */}
        <TabsContent value="safety" className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Community Safety & Guidelines</h2>
            <p className="text-muted-foreground">
              Our commitment to a safe, respectful, and inclusive community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  Recipe Safety Standards
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  All shared recipes undergo safety validation including:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Caffeine content monitoring
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Allergen detection and warnings
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Ingredient interaction analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Regional regulation compliance
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Community Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Help us maintain a positive community by following:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    Respectful communication
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    Original content creation
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    Cultural sensitivity
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    Helpful constructive feedback
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Report & Moderation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Our community is monitored 24/7 for safety and quality. If you encounter any inappropriate content or safety concerns:
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" className="gap-2">
                    Report Content
                  </Button>
                  <Button variant="outline" className="gap-2">
                    Contact Moderators
                  </Button>
                  <Button variant="outline" className="gap-2">
                    Safety Guidelines
                  </Button>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Emergency Safety Information</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    For severe allergic reactions or medical emergencies, contact emergency services immediately. 
                    Our platform provides safety information but cannot replace professional medical advice.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}