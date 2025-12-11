/**
 * Community & Social Platform Types
 * Comprehensive type definitions for social features, user-generated content, and community management
 */

// User-Generated Recipe Sharing Types
export interface UserGeneratedRecipe {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: 'classic' | 'energy' | 'hybrid';
  sodaType?: string;
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  prepTime: number;
  totalTime: number;
  servings: number;
  caffeineContent: number;
  safetyWarnings: SafetyWarning[];
  tags: string[];
  images: RecipeImage[];
  variants: RecipeVariant[];
  origin?: {
    userId: string;
    username: string;
    userProfile: UserProfile;
    createdAt: string;
    attribution: string;
  };
  forkHistory: RecipeFork[];
  collaboration: RecipeCollaboration;
  publication: {
    status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived';
    publishedAt?: string;
    reviewedBy?: string;
    reviewNotes?: string;
    safetyValidated: boolean;
    moderatedBy?: string;
    moderationNotes?: string;
  };
  engagement: RecipeEngagement;
  safety: RecipeSafety;
  cultural: CulturalAdaptation[];
  regional: RegionalVariation[];
  versions: RecipeVersion[];
  analytics: RecipeAnalytics;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface RecipeIngredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: string;
  optional: boolean;
  substitutions: IngredientSubstitution[];
  allergenInfo: AllergenInfo;
  nutritionalInfo: NutritionalInfo;
  safetyLevel: 'safe' | 'caution' | 'warning' | 'danger';
  regionalAvailability: RegionalAvailability[];
  culturalNotes?: string;
}

export interface IngredientSubstitution {
  ingredient: string;
  amount: number;
  unit: string;
  reason: string;
  availability: RegionalAvailability[];
  culturalAdaptations: CulturalAdaptation[];
}

export interface RecipeInstruction {
  id: string;
  stepNumber: number;
  instruction: string;
  duration?: number;
  temperature?: number;
  equipment?: string[];
  tips: string[];
  safetyNotes: string[];
  images?: string[];
  videoUrl?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface RecipeImage {
  id: string;
  url: string;
  alt: string;
  caption?: string;
  type: 'primary' | 'step' | 'result' | 'ingredient';
  metadata: {
    width: number;
    height: number;
    size: number;
    format: string;
    dominantColor: string;
  };
  safety: {
    contentValidated: boolean;
    appropriatenessScore: number;
    culturalSensitivity: CulturalSensitivityScore;
  };
  engagement: {
    views: number;
    likes: number;
    shares: number;
  };
}

export interface RecipeVariant {
  id: string;
  name: string;
  description: string;
  modifications: IngredientModification[];
  adjustments: RecipeAdjustment;
  targetAudience: string[];
  culturalContext: CulturalContext;
  difficulty: string;
  estimatedCost: number;
  preparationTime: number;
  popularity: number;
}

export interface IngredientModification {
  ingredientId: string;
  originalAmount: number;
  modifiedAmount: number;
  reason: string;
  impact: 'flavor' | 'nutrition' | 'safety' | 'cost' | 'availability';
}

export interface RecipeAdjustment {
  caffeineAdjustment?: number;
  sugarAdjustment?: number;
  flavorProfile: FlavorProfile;
  servingSize?: number;
  equipment?: string[];
  difficulty?: string;
}

export interface RecipeFork {
  id: string;
  parentRecipeId: string;
  userId: string;
  username: string;
  title: string;
  changes: string[];
  improvement: string;
  createdAt: string;
  attribution: {
    originalAuthor: string;
    originalRecipeTitle: string;
    attributionText: string;
  };
}

export interface RecipeCollaboration {
  isCollaborative: boolean;
  collaborators: Collaborator[];
  permissions: CollaborationPermissions;
  realTime: RealTimeCollaboration;
  comments: CollaborationComment[];
  suggestions: CollaborationSuggestion[];
  voting: CollaborationVoting;
}

export interface Collaborator {
  userId: string;
  username: string;
  role: 'owner' | 'editor' | 'reviewer' | 'commenter';
  permissions: string[];
  joinedAt: string;
  contribution: number;
  expertise: string[];
}

export interface CollaborationPermissions {
  canEdit: string[];
  canComment: string[];
  canSuggest: string[];
  canApprove: string[];
  canPublish: string[];
}

export interface RealTimeCollaboration {
  active: boolean;
  sessions: CollaborationSession[];
  conflicts: ConflictResolution[];
  version: number;
  lastSync: string;
}

export interface CollaborationSession {
  sessionId: string;
  userId: string;
  username: string;
  startTime: string;
  endTime?: string;
  changes: Change[];
  position: {
    section: string;
    field: string;
  };
}

export interface Change {
  id: string;
  type: 'add' | 'modify' | 'delete';
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: string;
  userId: string;
}

export interface ConflictResolution {
  id: string;
  conflictType: 'concurrent_edit' | 'semantic' | 'validation';
  fields: string[];
  resolution: 'auto_merge' | 'user_choice' | 'manual';
  resolvedBy?: string;
  resolvedAt?: string;
  resolution: any;
}

// Social Interaction Types
export interface SocialProfile {
  userId: string;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  banner?: string;
  location: string;
  website?: string;
  socialLinks: SocialLink[];
  isPrivate: boolean;
  isVerified: boolean;
  verifiedBadge?: VerifiedBadge;
  preferences: SocialPreferences;
  activity: SocialActivity;
  reputation: ReputationScore;
  badges: UserBadge[];
  achievements: UserAchievement[];
  followers: FollowRelation[];
  following: FollowRelation[];
  communities: CommunityMembership[];
  interests: UserInterest[];
  createdAt: string;
  updatedAt: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  username?: string;
  isPublic: boolean;
}

export interface VerifiedBadge {
  type: 'official' | 'creator' | 'expert' | 'moderator';
  issuer: string;
  criteria: string[];
  awardedAt: string;
  expiresAt?: string;
}

export interface SocialPreferences {
  privacy: PrivacySettings;
  notifications: NotificationSettings;
  content: ContentSettings;
  interactions: InteractionSettings;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  recipeVisibility: 'public' | 'followers' | 'private';
  activityVisibility: 'public' | 'friends' | 'private';
  searchable: boolean;
  discoverable: boolean;
}

export interface NotificationSettings {
  email: EmailNotifications;
  push: PushNotifications;
  inApp: InAppNotifications;
  frequency: NotificationFrequency;
}

export interface EmailNotifications {
  newFollowers: boolean;
  recipeLikes: boolean;
  comments: boolean;
  mentions: boolean;
  communityUpdates: boolean;
  challenges: boolean;
  collaborations: boolean;
}

export interface PushNotifications {
  enabled: boolean;
  newFollowers: boolean;
  recipeLikes: boolean;
  comments: boolean;
  mentions: boolean;
  challenges: boolean;
}

export interface InAppNotifications {
  enabled: boolean;
  newFollowers: boolean;
  recipeLikes: boolean;
  comments: boolean;
  mentions: boolean;
  communityUpdates: boolean;
  challenges: boolean;
  collaborations: boolean;
}

export interface NotificationFrequency {
  immediate: boolean;
  daily: boolean;
  weekly: boolean;
  monthly: boolean;
}

export interface ContentSettings {
  showAge: boolean;
  showLocation: boolean;
  showActivity: boolean;
  allowRecipeForks: boolean;
  allowRemixes: boolean;
  allowCommercialUse: boolean;
}

export interface InteractionSettings {
  allowDirectMessages: boolean;
  allowRecipeCollaboration: boolean;
  allowChallengeInvites: boolean;
  autoFollowBack: boolean;
  showOnlineStatus: boolean;
}

export interface SocialActivity {
  recipesShared: number;
  recipesLiked: number;
  recipesCommented: number;
  challengesParticipated: number;
  collaborationsJoined: number;
  postsCreated: number;
  postsLiked: number;
  postsShared: number;
  lastActive: string;
  streak: ActivityStreak;
}

export interface ActivityStreak {
  current: number;
  longest: number;
  lastUpdate: string;
  type: 'recipe_sharing' | 'activity' | 'engagement';
}

export interface ReputationScore {
  total: number;
  breakdown: {
    recipe_quality: number;
    community_contribution: number;
    safety_compliance: number;
    creativity: number;
    helpfulness: number;
    consistency: number;
  };
  level: ReputationLevel;
  progress: number;
  nextLevel: string;
}

export interface ReputationLevel {
  name: string;
  minScore: number;
  maxScore: number;
  benefits: string[];
  color: string;
  icon: string;
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  category: 'contribution' | 'achievement' | 'milestone' | 'special';
  requirements: BadgeRequirement[];
  awardedAt: string;
  expiresAt?: string;
}

export interface BadgeRequirement {
  type: 'recipes_shared' | 'likes_received' | 'comments_made' | 'challenges_won' | 'streak';
  target: number;
  timeframe?: string;
}

export interface UserAchievement {
  id: string;
  title: string;
  description: string;
  category: string;
  progress: number;
  target: number;
  completed: boolean;
  completedAt?: string;
  rewards: AchievementReward[];
  icon: string;
  rarity: string;
}

export interface AchievementReward {
  type: 'badge' | 'privilege' | 'feature' | 'recognition';
  value: any;
  description: string;
}

export interface FollowRelation {
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  isVerified: boolean;
  followedAt: string;
  relationship: 'following' | 'follower' | 'mutual';
  isMutual: boolean;
}

export interface CommunityMembership {
  communityId: string;
  communityName: string;
  role: 'member' | 'moderator' | 'admin';
  joinedAt: string;
  contributions: number;
  reputation: number;
}

export interface UserInterest {
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  topics: string[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'rarely';
}

// Social Engagement Types
export interface SocialInteraction {
  id: string;
  userId: string;
  targetType: 'recipe' | 'user' | 'comment' | 'post' | 'challenge';
  targetId: string;
  action: InteractionAction;
  metadata: InteractionMetadata;
  createdAt: string;
  updatedAt?: string;
}

export type InteractionAction = 
  | 'like' | 'unlike'
  | 'favorite' | 'unfavorite'
  | 'comment' | 'reply'
  | 'share' | 'reshare'
  | 'fork' | 'remix'
  | 'follow' | 'unfollow'
  | 'mention' | 'tag'
  | 'vote' | 'rate'
  | 'bookmark' | 'save'
  | 'report' | 'flag'
  | 'collaborate' | 'invite';

export interface InteractionMetadata {
  rating?: number;
  comment?: string;
  mention?: string[];
  tags?: string[];
  context?: string;
  location?: string;
  device?: string;
}

export interface Comment {
  id: string;
  userId: string;
  targetType: string;
  targetId: string;
  content: string;
  parentId?: string;
  replies: Comment[];
  mentions: string[];
  tags: string[];
  reactions: CommentReaction[];
  moderation: CommentModeration;
  engagement: CommentEngagement;
  createdAt: string;
  updatedAt?: string;
  editedAt?: string;
}

export interface CommentReaction {
  userId: string;
  type: 'like' | 'love' | 'laugh' | 'support' | 'insightful';
  createdAt: string;
}

export interface CommentModeration {
  status: 'pending' | 'approved' | 'rejected' | 'hidden';
  moderatedBy?: string;
  moderatedAt?: string;
  reason?: string;
  confidence: number;
}

export interface CommentEngagement {
  likes: number;
  replies: number;
  shares: number;
  reports: number;
  helpfulVotes: number;
}

// Community Challenges and Contests Types
export interface CommunityChallenge {
  id: string;
  title: string;
  description: string;
  category: 'recipe_creation' | 'innovation' | 'seasonal' | 'cultural' | 'collaboration' | 'safety';
  type: 'individual' | 'team' | 'community';
  status: 'upcoming' | 'active' | 'voting' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  votingEndDate?: string;
  announcementDate?: string;
  prize?: ChallengePrize;
  rules: ChallengeRule[];
  requirements: ChallengeRequirement[];
  judging: ChallengeJudging;
  participants: ChallengeParticipant[];
  submissions: ChallengeSubmission[];
  voting: ChallengeVoting;
  analytics: ChallengeAnalytics;
  tags: string[];
  featured: boolean;
  sponsor?: ChallengeSponsor;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChallengePrize {
  type: 'recognition' | 'badge' | 'feature' | 'physical' | 'cash' | 'experience';
  title: string;
  description: string;
  value?: number;
  currency?: string;
  items: PrizeItem[];
  winnerCount: number;
  category: 'grand_prize' | 'runner_up' | 'participant' | 'special';
}

export interface PrizeItem {
  name: string;
  description: string;
  quantity: number;
  value?: number;
  currency?: string;
  supplier?: string;
  deliveryMethod: 'digital' | 'physical' | 'experience';
}

export interface ChallengeRule {
  id: string;
  category: 'eligibility' | 'submission' | 'content' | 'technical' | 'legal';
  title: string;
  description: string;
  mandatory: boolean;
  enforcement: 'automatic' | 'manual' | 'both';
}

export interface ChallengeRequirement {
  type: 'recipe_count' | 'difficulty_level' | 'category' | 'ingredient' | 'safety' | 'cultural';
  description: string;
  parameters: Record<string, any>;
  mandatory: boolean;
  validation: ValidationRule[];
}

export interface ValidationRule {
  type: 'format' | 'range' | 'pattern' | 'custom';
  parameters: Record<string, any>;
  errorMessage: string;
}

export interface ChallengeJudging {
  criteria: JudgingCriteria[];
  judges: Judge[];
  method: 'peer_voting' | 'expert_judging' | 'hybrid' | 'automated';
  scoring: JudgingScoring;
  timeline: JudgingTimeline;
}

export interface JudgingCriteria {
  id: string;
  name: string;
  description: string;
  weight: number;
  maxScore: number;
  rubric: ScoringRubric[];
  automated: boolean;
  metrics?: string[];
}

export interface ScoringRubric {
  score: number;
  description: string;
  examples: string[];
}

export interface Judge {
  userId: string;
  role: 'lead_judge' | 'judge' | 'technical_judge' | 'guest_judge';
  expertise: string[];
  assignments: string[];
  status: 'confirmed' | 'pending' | 'declined';
}

export interface JudgingScoring {
  method: 'numeric' | 'rubric' | 'ranking' | 'binary';
  scale: {
    min: number;
    max: number;
    step: number;
  };
  weighting: Record<string, number>;
  tieBreakers: string[];
}

export interface JudgingTimeline {
  phase: string;
  startDate: string;
  endDate: string;
  duration: number;
  activities: string[];
}

export interface ChallengeParticipant {
  userId: string;
  username: string;
  displayName: string;
  teamId?: string;
  registrationDate: string;
  status: 'registered' | 'active' | 'withdrawn' | 'disqualified';
  submissions: number;
  votes: number;
  engagement: ParticipantEngagement;
  team?: TeamInfo;
}

export interface ParticipantEngagement {
  recipeViews: number;
  recipeLikes: number;
  comments: number;
  shares: number;
  challengeActivity: number;
}

export interface TeamInfo {
  teamId: string;
  name: string;
  description: string;
  members: TeamMember[];
  leader: string;
  createdAt: string;
}

export interface TeamMember {
  userId: string;
  role: 'leader' | 'member' | 'collaborator';
  contribution: number;
  joinedAt: string;
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  participantId: string;
  title: string;
  description: string;
  recipe: UserGeneratedRecipe;
  additionalContent: SubmissionContent[];
  tags: string[];
  submittedAt: string;
  status: 'draft' | 'submitted' | 'under_review' | 'qualified' | 'disqualified';
  scores: SubmissionScore[];
  votes: number;
  rankings: SubmissionRanking[];
  feedback: JudgeFeedback[];
  analytics: SubmissionAnalytics;
}

export interface SubmissionContent {
  type: 'image' | 'video' | 'document' | 'presentation' | 'recipe_card';
  title: string;
  url: string;
  description?: string;
  metadata: Record<string, any>;
}

export interface SubmissionScore {
  judgeId: string;
  criteriaId: string;
  score: number;
  feedback?: string;
  rubric?: string;
  submittedAt: string;
}

export interface SubmissionRanking {
  category: string;
  rank: number;
  score: number;
  criteria: string;
}

export interface JudgeFeedback {
  judgeId: string;
  feedback: string;
  rating: number;
  category: string;
  isPublic: boolean;
  submittedAt: string;
}

export interface SubmissionAnalytics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  votes: number;
  engagement: number;
}

export interface ChallengeVoting {
  enabled: boolean;
  method: 'public' | 'expert' | 'peer' | 'hybrid';
  startDate: string;
  endDate: string;
  voters: ChallengeVoter[];
  votes: ChallengeVote[];
  results: ChallengeResults;
}

export interface ChallengeVoter {
  userId: string;
  username: string;
  eligibility: 'automatic' | 'qualified' | 'invited';
  votesRemaining: number;
  votedSubmissions: string[];
  votingHistory: VoterHistory[];
}

export interface VoterHistory {
  submissionId: string;
  criteriaId?: string;
  score?: number;
  ranking?: number;
  timestamp: string;
}

export interface ChallengeVote {
  id: string;
  voterId: string;
  submissionId: string;
  criteriaId?: string;
  score?: number;
  ranking?: number;
  comment?: string;
  timestamp: string;
}

export interface ChallengeResults {
  winners: ChallengeWinner[];
  rankings: ChallengeRanking[];
  statistics: ChallengeStatistics;
  announcement: ResultsAnnouncement;
}

export interface ChallengeWinner {
  rank: number;
  participantId: string;
  submissionId: string;
  score: number;
  prize: ChallengePrize;
  category?: string;
}

export interface ChallengeRanking {
  rank: number;
  participantId: string;
  submissionId: string;
  score: number;
  category: string;
  criteria: Record<string, number>;
}

export interface ChallengeStatistics {
  totalParticipants: number;
  totalSubmissions: number;
  totalVotes: number;
  completionRate: number;
  averageScore: number;
  scoreDistribution: Record<string, number>;
  engagement: ChallengeEngagement;
}

export interface ChallengeEngagement {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  discussionThreads: number;
}

export interface ResultsAnnouncement {
  scheduled: string;
  method: 'live' | 'recorded' | 'blog' | 'email';
  presenter?: string;
  platform?: string;
  content: AnnouncementContent;
}

export interface AnnouncementContent {
  title: string;
  description: string;
  highlights: string[];
  nextSteps: string[];
  media: string[];
}

export interface ChallengeSponsor {
  name: string;
  logo: string;
  website?: string;
  description: string;
  contribution: SponsorContribution;
}

export interface SponsorContribution {
  type: 'prize' | 'funding' | 'promotion' | 'hosting';
  value: number;
  currency?: string;
  description: string;
}

export interface ChallengeAnalytics {
  participation: ParticipationMetrics;
  engagement: EngagementMetrics;
  quality: QualityMetrics;
  growth: GrowthMetrics;
}

export interface ParticipationMetrics {
  registrations: number[];
  activeParticipants: number;
  completionRate: number;
  demographics: Record<string, number>;
}

export interface EngagementMetrics {
  views: number;
  interactions: number;
  shares: number;
  comments: number;
  timeSpent: number;
}

export interface QualityMetrics {
  averageScore: number;
  scoreDistribution: Record<string, number>;
  improvementRate: number;
  innovationIndex: number;
}

export interface GrowthMetrics {
  newUsers: number;
  returningUsers: number;
  conversionRate: number;
  retentionRate: number;
}

// Recipe Collaboration Types
export interface RecipeCollaborationRequest {
  id: string;
  recipeId: string;
  requesterId: string;
  targetUserId?: string;
  type: 'invitation' | 'request' | 'suggestion';
  message: string;
  permissions: CollaborationPermission[];
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: string;
  createdAt: string;
  respondedAt?: string;
  response?: CollaborationResponse;
}

export interface CollaborationPermission {
  type: 'view' | 'comment' | 'edit' | 'publish' | 'fork' | 'remix';
  granted: boolean;
  conditions?: string[];
}

export interface CollaborationResponse {
  status: 'accepted' | 'declined';
  message?: string;
  modifications?: CollaborationPermission[];
}

export interface CollaborativeEdit {
  id: string;
  recipeId: string;
  editorId: string;
  editorName: string;
  editType: 'ingredient' | 'instruction' | 'metadata' | 'style';
  field: string;
  oldValue: any;
  newValue: any;
  reason: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  comments: EditComment[];
}

export interface EditComment {
  id: string;
  userId: string;
  content: string;
  timestamp: string;
  resolved: boolean;
}

export interface CollaborationSession {
  id: string;
  recipeId: string;
  participants: SessionParticipant[];
  startTime: string;
  endTime?: string;
  activity: SessionActivity[];
  conflicts: ConflictResolution[];
  version: number;
}

export interface SessionParticipant {
  userId: string;
  username: string;
  role: 'owner' | 'collaborator' | 'viewer';
  joinedAt: string;
  lastActivity: string;
  changes: number;
}

export interface SessionActivity {
  id: string;
  participantId: string;
  action: string;
  target: string;
  details: any;
  timestamp: string;
}

// Community Moderation and Safety Types
export interface CommunityModeration {
  id: string;
  targetType: 'recipe' | 'comment' | 'user' | 'image' | 'challenge';
  targetId: string;
  reporterId?: string;
  reportedBy: ReportSource[];
  reason: ModerationReason;
  category: ModerationCategory;
  severity: ModerationSeverity;
  status: ModerationStatus;
  assignedTo?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  resolution?: ModerationResolution;
  appeals: ModerationAppeal[];
  evidence: ModerationEvidence[];
  communityVotes: CommunityVote[];
  automated: AutomatedModeration;
  createdAt: string;
  updatedAt: string;
}

export interface ReportSource {
  userId?: string;
  system?: string;
  automated?: boolean;
  confidence: number;
  timestamp: string;
}

export interface ModerationReason {
  primary: string;
  secondary?: string;
  description: string;
  evidence: string[];
}

export interface ModerationCategory {
  type: 'content' | 'safety' | 'harassment' | 'spam' | 'inappropriate' | 'copyright' | 'fake';
  subcategories: string[];
}

export interface ModerationSeverity {
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  factors: string[];
}

export interface ModerationStatus {
  state: 'pending' | 'investigating' | 'resolved' | 'escalated' | 'dismissed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  workflow: ModerationWorkflow;
}

export interface ModerationWorkflow {
  currentStep: string;
  steps: WorkflowStep[];
  assignments: WorkflowAssignment[];
  history: WorkflowHistory[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'review' | 'investigate' | 'decide' | 'appeal' | 'resolve';
  assignee?: string;
  deadline?: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: string;
  notes?: string;
}

export interface WorkflowAssignment {
  stepId: string;
  assignee: string;
  assignedBy: string;
  assignedAt: string;
  dueDate?: string;
  priority: string;
}

export interface WorkflowHistory {
  stepId: string;
  action: string;
  performedBy: string;
  timestamp: string;
  details: any;
}

export interface ModerationResolution {
  action: ModerationAction;
  reason: string;
  duration?: number;
  conditions?: string[];
  notifyUsers: boolean;
  appealable: boolean;
  evidence: string[];
}

export type ModerationAction = 
  | 'approved'
  | 'rejected'
  | 'edited'
  | 'hidden'
  | 'removed'
  | 'suspended'
  | 'banned'
  | 'warned'
  | 'restricted'
  | 'escalated';

export interface ModerationAppeal {
  id: string;
  appellantId: string;
  reason: string;
  evidence: string[];
  status: 'pending' | 'under_review' | 'upheld' | 'overturned' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  decision?: AppealDecision;
  createdAt: string;
}

export interface AppealDecision {
  outcome: 'upheld' | 'overturned' | 'rejected';
  reasoning: string;
  modifications?: ModerationResolution;
  notifyUser: boolean;
}

export interface ModerationEvidence {
  type: 'screenshot' | 'log' | 'report' | 'analysis' | 'user_testimony';
  description: string;
  url: string;
  metadata: Record<string, any>;
  collectedBy: string;
  collectedAt: string;
}

export interface CommunityVote {
  userId: string;
  vote: 'approve' | 'reject' | 'neutral';
  reason?: string;
  confidence: number;
  timestamp: string;
  expertise?: string[];
}

export interface AutomatedModeration {
  enabled: boolean;
  systems: AutomatedSystem[];
  confidence: number;
  actions: AutomatedAction[];
  humanReview: boolean;
}

export interface AutomatedSystem {
  name: string;
  type: 'content_filter' | 'ml_classifier' | 'behavior_analysis' | 'reputation';
  version: string;
  confidence: number;
  result: any;
}

export interface AutomatedAction {
  system: string;
  action: string;
  confidence: number;
  reason: string;
  timestamp: string;
}

// Content Safety and Validation Types
export interface ContentSafety {
  id: string;
  targetType: string;
  targetId: string;
  validation: SafetyValidation;
  warnings: SafetyWarning[];
  restrictions: SafetyRestriction[];
  compliance: SafetyCompliance;
  cultural: CulturalSensitivity;
  automated: AutomatedSafety;
  humanReview?: HumanSafetyReview;
  createdAt: string;
}

export interface SafetyValidation {
  passed: boolean;
  score: number;
  checks: SafetyCheck[];
  level: SafetyLevel;
  timestamp: string;
}

export interface SafetyCheck {
  id: string;
  name: string;
  type: 'ingredient' | 'allergen' | 'caffeine' | 'interaction' | 'regulation';
  status: 'pass' | 'fail' | 'warning' | 'manual_review';
  score: number;
  details: string;
  recommendations: string[];
}

export interface SafetyLevel {
  category: 'safe' | 'caution' | 'warning' | 'danger';
  score: number;
  color: string;
  icon: string;
}

export interface SafetyWarning {
  id: string;
  type: 'caffeine' | 'allergen' | 'interaction' | 'regulation' | 'cultural';
  severity: 'info' | 'warning' | 'danger';
  title: string;
  message: string;
  instructions: string[];
  emergency?: EmergencyInfo;
  regional: RegionalWarning[];
  userSpecific: UserSpecificWarning[];
}

export interface EmergencyInfo {
  contacts: EmergencyContact[];
  procedures: string[];
  symptoms: string[];
  whenToSeekHelp: string;
}

export interface EmergencyContact {
  type: 'poison_control' | 'emergency' | 'medical' | 'hotline';
  number: string;
  region: string;
  available24x7: boolean;
}

export interface RegionalWarning {
  region: string;
  regulation: string;
  requirement: string;
  penalty?: string;
  contacts: string[];
}

export interface UserSpecificWarning {
  condition: string;
  risk: string;
  recommendation: string;
  severity: 'low' | 'medium' | 'high';
}

export interface SafetyRestriction {
  type: 'age' | 'medical' | 'dietary' | 'regional' | 'regulatory';
  description: string;
  enforcement: 'soft' | 'hard';
  exceptions?: string[];
  appealable: boolean;
}

export interface SafetyCompliance {
  jurisdictions: ComplianceStatus[];
  standards: ComplianceStandard[];
  certifications: SafetyCertification[];
  lastReview: string;
  nextReview: string;
}

export interface ComplianceStatus {
  jurisdiction: string;
  standard: string;
  status: 'compliant' | 'non_compliant' | 'pending' | 'exempt';
  score: number;
  issues: ComplianceIssue[];
  lastChecked: string;
}

export interface ComplianceIssue {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  deadline?: string;
}

export interface ComplianceStandard {
  id: string;
  name: string;
  version: string;
  region: string;
  requirements: string[];
  mandatory: boolean;
}

export interface SafetyCertification {
  id: string;
  name: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  scope: string[];
  status: 'active' | 'expired' | 'suspended';
}

export interface CulturalSensitivity {
  score: number;
  assessment: CulturalAssessment;
  adaptations: CulturalAdaptation[];
  concerns: CulturalConcern[];
  recommendations: string[];
}

export interface CulturalAssessment {
  overall: number;
  breakdown: {
    representation: number;
    appropriation: number;
    sensitivity: number;
    accuracy: number;
  };
  feedback: CulturalFeedback[];
}

export interface CulturalFeedback {
  culture: string;
  perspective: string;
  feedback: string;
  severity: 'low' | 'medium' | 'high';
  actionable: boolean;
}

export interface CulturalAdaptation {
  culture: string;
  change: string;
  reason: string;
  impact: 'positive' | 'neutral' | 'negative';
  approved: boolean;
}

export interface CulturalConcern {
  issue: string;
  cultures: string[];
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface AutomatedSafety {
  systems: SafetySystem[];
  confidence: number;
  flags: SafetyFlag[];
  humanReview: boolean;
}

export interface SafetySystem {
  name: string;
  type: 'allergen' | 'caffeine' | 'interaction' | 'cultural' | 'content';
  version: string;
  confidence: number;
  result: any;
}

export interface SafetyFlag {
  system: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number;
  actionable: boolean;
}

export interface HumanSafetyReview {
  reviewerId: string;
  reviewerRole: 'safety_expert' | 'moderator' | 'cultural_advisor' | 'medical_professional';
  assessment: HumanAssessment;
  recommendations: string[];
  decision: SafetyDecision;
  timestamp: string;
}

export interface HumanAssessment {
  overall: number;
  safety: number;
  appropriateness: number;
  accuracy: number;
  cultural: number;
  concerns: string[];
  strengths: string[];
}

export interface SafetyDecision {
  approve: boolean;
  conditions?: string[];
  modifications?: string[];
  restrictions?: string[];
  followUp?: string[];
  notifyUsers: boolean;
}

// Analytics and Insights Types
export interface CommunityAnalytics {
  id: string;
  timeframe: AnalyticsTimeframe;
  metrics: CommunityMetrics;
  trends: TrendAnalysis;
  segments: UserSegment[];
  predictions: PredictiveInsights;
  recommendations: AnalyticsRecommendation[];
  generatedAt: string;
}

export interface AnalyticsTimeframe {
  start: string;
  end: string;
  granularity: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface CommunityMetrics {
  users: UserMetrics;
  content: ContentMetrics;
  engagement: EngagementMetrics;
  growth: GrowthMetrics;
  retention: RetentionMetrics;
  satisfaction: SatisfactionMetrics;
}

export interface UserMetrics {
  total: number;
  active: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  new: number;
  returning: number;
  churned: number;
  demographics: UserDemographics;
  segments: UserSegmentMetrics;
}

export interface UserDemographics {
  age: Record<string, number>;
  gender: Record<string, number>;
  location: Record<string, number>;
  language: Record<string, number>;
  device: Record<string, number>;
}

export interface UserSegment {
  id: string;
  name: string;
  description: string;
  criteria: SegmentCriteria[];
  size: number;
  percentage: number;
  characteristics: Record<string, any>;
}

export interface SegmentCriteria {
  field: string;
  operator: string;
  value: any;
  weight: number;
}

export interface UserSegmentMetrics {
  engagement: Record<string, number>;
  retention: Record<string, number>;
  satisfaction: Record<string, number>;
  monetization: Record<string, number>;
}

export interface ContentMetrics {
  recipes: RecipeMetrics;
  comments: CommentMetrics;
  shares: ShareMetrics;
  forks: ForkMetrics;
  moderation: ModerationMetrics;
}

export interface RecipeMetrics {
  total: number;
  published: number;
  drafts: number;
  trending: number;
  categories: Record<string, number>;
  difficulty: Record<string, number>;
  avgRating: number;
  avgEngagement: number;
}

export interface CommentMetrics {
  total: number;
  daily: number[];
  average: number;
  sentiment: SentimentAnalysis;
  engagement: number;
}

export interface SentimentAnalysis {
  positive: number;
  neutral: number;
  negative: number;
  average: number;
  trends: Record<string, number>;
}

export interface ShareMetrics {
  total: number;
  platforms: Record<string, number>;
  virality: number;
  reach: number;
  conversion: number;
}

export interface ForkMetrics {
  total: number;
  forks: number;
  remixes: number;
  derivatives: number;
  attribution: number;
}

export interface ModerationMetrics {
  reports: number;
  actions: number;
  accuracy: number;
  responseTime: number;
  userSatisfaction: number;
}

export interface EngagementMetrics {
  likes: number;
  comments: number;
  shares: number;
  timeSpent: number;
  sessions: number;
  sessionDuration: number;
  bounceRate: number;
  conversionRate: number;
}

export interface GrowthMetrics {
  users: GrowthTrend;
  content: GrowthTrend;
  engagement: GrowthTrend;
  revenue: GrowthTrend;
  market: GrowthTrend;
}

export interface GrowthTrend {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  forecast: ForecastData[];
}

export interface ForecastData {
  period: string;
  predicted: number;
  confidence: number;
  range: {
    min: number;
    max: number;
  };
}

export interface RetentionMetrics {
  day1: number;
  day7: number;
  day30: number;
  day90: number;
  cohorts: CohortAnalysis[];
  factors: RetentionFactor[];
}

export interface CohortAnalysis {
  cohort: string;
  size: number;
  retention: Record<string, number>;
  revenue: Record<string, number>;
  engagement: Record<string, number>;
}

export interface RetentionFactor {
  factor: string;
  impact: number;
  confidence: number;
  actionable: boolean;
}

export interface SatisfactionMetrics {
  overall: number;
  netPromoterScore: number;
  customerSatisfaction: number;
  customerEffort: number;
  feedback: FeedbackAnalysis;
}

export interface FeedbackAnalysis {
  positive: number;
  negative: number;
  neutral: number;
  themes: FeedbackTheme[];
  sentiment: SentimentAnalysis;
}

export interface FeedbackTheme {
  theme: string;
  mentions: number;
  sentiment: number;
  priority: number;
}

export interface TrendAnalysis {
  emerging: EmergingTrend[];
  declining: DecliningTrend[];
  seasonal: SeasonalTrend[];
  viral: ViralTrend[];
}

export interface EmergingTrend {
  topic: string;
  growth: number;
  momentum: number;
  category: string;
  predicted: boolean;
  confidence: number;
}

export interface DecliningTrend {
  topic: string;
  decline: number;
  impact: number;
  category: string;
  recoverable: boolean;
}

export interface SeasonalTrend {
  pattern: string;
  strength: number;
  predictability: number;
  category: string;
  nextPeak: string;
}

export interface ViralTrend {
  contentId: string;
  virality: number;
  reach: number;
  engagement: number;
  duration: number;
  peakTime: string;
}

export interface PredictiveInsights {
  userBehavior: UserBehaviorPrediction[];
  contentPerformance: ContentPerformancePrediction[];
  marketTrends: MarketTrendPrediction[];
  riskFactors: RiskFactorPrediction[];
}

export interface UserBehaviorPrediction {
  behavior: string;
  probability: number;
  timeframe: string;
  factors: string[];
  confidence: number;
}

export interface ContentPerformancePrediction {
  contentId: string;
  predictedViews: number;
  predictedEngagement: number;
  predictedVirality: number;
  factors: string[];
  confidence: number;
}

export interface MarketTrendPrediction {
  trend: string;
  probability: number;
  timeframe: string;
  impact: 'low' | 'medium' | 'high';
  opportunity: string;
  confidence: number;
}

export interface RiskFactorPrediction {
  risk: string;
  probability: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string[];
  confidence: number;
}

export interface AnalyticsRecommendation {
  id: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: string;
  success: number;
  timeline: string;
  owner: string;
  status: 'proposed' | 'approved' | 'in_progress' | 'completed' | 'rejected';
}

// Discovery and Trends Types
export interface DiscoveryEngine {
  id: string;
  userId: string;
  preferences: DiscoveryPreferences;
  recommendations: DiscoveryRecommendation[];
  trending: TrendingContent[];
  seasonal: SeasonalContent[];
  personalized: PersonalizedContent[];
  collaborative: CollaborativeContent[];
  generatedAt: string;
}

export interface DiscoveryPreferences {
  categories: string[];
  difficulty: string[];
  timeCommitment: string[];
  ingredients: string[];
  avoidIngredients: string[];
  dietary: string[];
  cultural: string[];
  novelty: number;
  popularity: number;
  safety: number;
}

export interface DiscoveryRecommendation {
  id: string;
  type: 'recipe' | 'user' | 'challenge' | 'community' | 'technique';
  targetId: string;
  score: number;
  reason: string[];
  confidence: number;
  personalized: boolean;
  metadata: Record<string, any>;
}

export interface TrendingContent {
  id: string;
  type: 'recipe' | 'challenge' | 'user' | 'technique';
  title: string;
  trendScore: number;
  growth: number;
  momentum: number;
  category: string;
  tags: string[];
  engagement: number;
  timeToPeak?: string;
  predicted: boolean;
}

export interface SeasonalContent {
  id: string;
  type: 'recipe' | 'challenge' | 'ingredient';
  title: string;
  season: string;
  relevance: number;
  cultural: string[];
  availability: string[];
  priceImpact: number;
  suggestions: string[];
}

export interface PersonalizedContent {
  id: string;
  type: 'recipe' | 'user' | 'challenge';
  title: string;
  matchScore: number;
  factors: MatchFactor[];
  novelty: number;
  serendipity: number;
  explanation: string;
}

export interface MatchFactor {
  factor: string;
  weight: number;
  description: string;
}

export interface CollaborativeContent {
  id: string;
  type: 'recipe' | 'challenge';
  title: string;
  collaborationPotential: number;
  skillMatch: number;
  interestOverlap: number;
  suggestedCollaborators: string[];
  matchingFactors: string[];
}

// Privacy and Consent Management Types
export interface PrivacyConsent {
  id: string;
  userId: string;
  consentType: ConsentType;
  granted: boolean;
  scope: ConsentScope[];
  conditions: ConsentCondition[];
  timestamp: string;
  expiry?: string;
  withdrawal?: ConsentWithdrawal;
  proof: ConsentProof;
}

export type ConsentType = 
  | 'data_processing'
  | 'marketing_communication'
  | 'social_sharing'
  | 'analytics'
  | 'personalization'
  | 'third_party_sharing'
  | 'location_tracking'
  | 'recipe_sharing'
  | 'community_participation'
  | 'challenge_participation';

export interface ConsentScope {
  category: string;
  purpose: string;
  retention: string;
  processing: string[];
  sharing: string[];
  rights: string[];
}

export interface ConsentCondition {
  type: 'age_restriction' | 'location_restriction' | 'opt_in' | 'opt_out';
  value: any;
  description: string;
  enforcement: 'automatic' | 'manual';
}

export interface ConsentWithdrawal {
  timestamp: string;
  reason: string;
  scope: string[];
  impact: string[];
  alternative: string[];
}

export interface ConsentProof {
  method: 'click' | 'form' | 'api' | 'implied' | 'parental';
  timestamp: string;
  ip: string;
  userAgent: string;
  sessionId: string;
  witness?: string;
}

export interface DataSubjectRights {
  userId: string;
  rights: DataRight[];
  requests: RightRequest[];
  status: RightsStatus;
  compliance: ComplianceStatus;
}

export interface DataRight {
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection' | 'withdraw_consent';
  granted: boolean;
  scope: string[];
  restrictions: string[];
  timeframe: number;
  cost: number;
  verification: VerificationRequirement[];
}

export interface RightRequest {
  id: string;
  rightType: string;
  requestedData: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'partial';
  submittedAt: string;
  completedAt?: string;
  rejectionReason?: string;
  fulfillment: FulfillmentDetails;
  verification: VerificationRecord[];
  communication: CommunicationRecord[];
}

export interface FulfillmentDetails {
  method: 'export' | 'deletion' | 'correction' | 'restriction' | 'portability';
  dataProvided?: any;
  recordsModified?: number;
  recordsDeleted?: number;
  recordsRestricted?: number;
  exportedFormat?: string;
  deliveryMethod: string[];
  backupRetention: number;
}

export interface VerificationRecord {
  method: 'identity' | 'ownership' | 'authorization';
  status: 'pending' | 'verified' | 'failed' | 'expired';
  details: string;
  timestamp: string;
  verifier: string;
}

export interface CommunicationRecord {
  type: 'request' | 'acknowledgment' | 'verification' | 'completion' | 'rejection';
  channel: string;
  content: string;
  timestamp: string;
  recipient: string;
}

export interface RightsStatus {
  overall: 'compliant' | 'partial' | 'non_compliant';
  pendingRequests: number;
  overdueRequests: number;
  averageResponseTime: number;
  satisfaction: number;
}

export interface VerificationRequirement {
  type: 'identity' | 'ownership' | 'authorization' | 'capacity';
  method: string[];
  level: 'basic' | 'enhanced' | 'high';
  description: string;
  cost: number;
  timeframe: number;
}

export interface ComplianceStatus {
  jurisdiction: string;
  standard: string;
  status: 'compliant' | 'partial' | 'non_compliant';
  lastAssessment: string;
  nextAssessment: string;
  issues: ComplianceIssue[];
  score: number;
}

// Supporting Types
export interface CulturalSensitivityScore {
  overall: number;
  breakdown: {
    representation: number;
    appropriation: number;
    sensitivity: number;
    accuracy: number;
  };
  concerns: string[];
  recommendations: string[];
}

export interface RegionalAvailability {
  region: string;
  available: boolean;
  alternatives: string[];
  price?: number;
  quality?: string;
  seasonality?: string;
}

export interface AllergenInfo {
  allergens: string[];
  riskLevel: 'low' | 'medium' | 'high';
  warnings: string[];
  crossContamination: boolean;
  severity: 'mild' | 'moderate' | 'severe';
}

export interface NutritionalInfo {
  calories: number;
  sugar: number;
  caffeine: number;
  sodium: number;
  fat: number;
  protein: number;
  carbs: number;
  fiber: number;
}

export interface CulturalContext {
  culture: string;
  significance: string;
  alternatives: string[];
  adaptations: string[];
  sensitivity: string;
}

export interface CulturalAdaptation {
  culture: string;
  original: any;
  adapted: any;
  reason: string;
  approved: boolean;
  feedback: string[];
}

export interface RegionalVariation {
  region: string;
  ingredients: IngredientVariation[];
  modifications: string[];
  availability: AvailabilityInfo;
  cultural: CulturalInfo;
}

export interface IngredientVariation {
  original: string;
  substitute: string;
  reason: string;
  availability: number;
  cost: number;
  quality: string;
}

export interface AvailabilityInfo {
  status: 'available' | 'seasonal' | 'limited' | 'unavailable';
  alternatives: string[];
  quality: string;
  price: number;
  reliability: number;
}

export interface CulturalInfo {
  appropriateness: number;
  significance: string;
  alternatives: string[];
  adaptations: string[];
  concerns: string[];
}

export interface RecipeEngagement {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  forks: number;
  saves: number;
  reports: number;
  rating: number;
  ratingCount: number;
}

export interface RecipeSafety {
  warnings: SafetyWarning[];
  validations: SafetyValidation[];
  restrictions: SafetyRestriction[];
  compliance: SafetyCompliance[];
  lastReview: string;
  nextReview: string;
}

export interface RecipeVersion {
  version: number;
  changes: string[];
  author: string;
  timestamp: string;
  description: string;
  rollback?: RollbackInfo;
}

export interface RollbackInfo {
  available: boolean;
  reason: string;
  impact: string;
  timestamp: string;
}

export interface RecipeAnalytics {
  views: ViewAnalytics;
  engagement: EngagementAnalytics;
  sharing: SharingAnalytics;
  performance: PerformanceAnalytics;
}

export interface ViewAnalytics {
  total: number;
  unique: number;
  daily: number[];
  sources: Record<string, number>;
  demographics: Record<string, number>;
}

export interface EngagementAnalytics {
  likes: number;
  comments: number;
  shares: number;
  timeSpent: number;
  completionRate: number;
  dropoffPoints: number[];
}

export interface SharingAnalytics {
  total: number;
  platforms: Record<string, number>;
  virality: number;
  reach: number;
  conversion: number;
}

export interface PerformanceAnalytics {
  loadTime: number;
  errorRate: number;
  accessibility: number;
  mobile: number;
  searchRanking: number;
}

export interface UserProfile {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  location: string;
  website?: string;
  socialLinks: SocialLink[];
  preferences: UserPreferences;
  safety: SafetyProfile;
  privacy: PrivacyProfile;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  language: string;
  region: string;
  currency: string;
  measurements: string;
  dietary: string[];
  allergies: string[];
  skillLevel: string;
  interests: string[];
  notifications: NotificationSettings;
}

export interface SafetyProfile {
  age: number;
  medicalConditions: string[];
  medications: string[];
  allergies: string[];
  sensitivity: string[];
  tolerance: string;
  emergency: EmergencyContact[];
}

export interface PrivacyProfile {
  dataSharing: boolean;
  analytics: boolean;
  personalization: boolean;
  marketing: boolean;
  location: boolean;
  visibility: 'public' | 'friends' | 'private';
}

export interface CollaborationComment {
  id: string;
  userId: string;
  content: string;
  timestamp: string;
  resolved: boolean;
  mentions: string[];
}

export interface CollaborationSuggestion {
  id: string;
  userId: string;
  type: string;
  suggestion: string;
  rationale: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
}

export interface CollaborationVoting {
  enabled: boolean;
  method: 'consensus' | 'majority' | 'expert' | 'weighted';
  participants: string[];
  votes: Vote[];
  result?: VotingResult;
}

export interface Vote {
  userId: string;
  choice: string;
  weight: number;
  timestamp: string;
}

export interface VotingResult {
  winner: string;
  score: number;
  confidence: number;
  participants: number;
  method: string;
}