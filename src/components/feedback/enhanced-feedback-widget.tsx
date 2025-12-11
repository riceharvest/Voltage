'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Star, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { useFeedbackService, type FeedbackSubmission } from '@/lib/feedback-service';
import { useGdpr } from '@/components/gdpr/use-gdpr';

interface EnhancedFeedbackWidgetProps {
  page?: string;
  triggerClassName?: string;
  showEmailField?: boolean;
  autoDetectPriority?: boolean;
}

export function EnhancedFeedbackWidget({ 
  page = 'unknown', 
  triggerClassName,
  showEmailField = true,
  autoDetectPriority = true
}: EnhancedFeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [category, setCategory] = useState('');
  const [email, setEmail] = useState('');
  const [includeEmail, setIncludeEmail] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spamWarning, setSpamWarning] = useState(false);

  const gdpr = useGdpr();
  const feedbackService = useFeedbackService();

  // Auto-detect spam-like content
  React.useEffect(() => {
    if (feedback.length > 0) {
      const suspiciousPatterns = [
        /https?:\/\/[^\s]+/gi, // URLs
        /(.)\1{4,}/gi, // Repeated characters
        /\b(viagra|casino|lottery|winner|prize)\b/gi, // Spam keywords
      ];
      
      const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(feedback));
      setSpamWarning(isSuspicious);
    } else {
      setSpamWarning(false);
    }
  }, [feedback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!feedback.trim()) {
      setError('Please provide your feedback');
      return;
    }

    if (!gdpr.consentGiven) {
      setError('Please accept cookies to submit feedback');
      return;
    }

    if (!gdprConsent) {
      setError('Please accept the privacy policy to submit feedback');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare enhanced submission
      const submission: Omit<FeedbackSubmission, 'id' | 'timestamp'> = {
        rating,
        feedback: feedback.trim(),
        category,
        page,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        email: includeEmail ? email : undefined,
        gdprConsent: true,
        dataProcessingConsent: true,
        marketingConsent: false, // Never for feedback
        priority: autoDetectPriority ? 'medium' : 'low', // Will be recalculated by service
        tags: [category].filter(Boolean),
        metadata: {
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
          referrer: typeof window !== 'undefined' ? document.referrer : undefined,
          viewport: typeof window !== 'undefined' ? {
            width: window.innerWidth,
            height: window.innerHeight
          } : undefined
        }
      };

      const result = await feedbackService.submitFeedback(submission);

      if (result.success) {
        setSubmitted(true);
        trackEvent({
          name: 'feedback_submitted_enhanced',
          properties: {
            rating,
            category,
            page,
            has_email: includeEmail,
            spam_score: result.spamScore,
            priority_detected: autoDetectPriority,
            gdpr_consent: true
          }
        });

        // Reset form after 3 seconds
        setTimeout(() => {
          setIsOpen(false);
          setSubmitted(false);
          setRating(0);
          setFeedback('');
          setCategory('');
          setEmail('');
          setIncludeEmail(false);
          setGdprConsent(false);
          setError(null);
          setSpamWarning(false);
        }, 3000);
      } else {
        setError(result.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityIndicator = () => {
    if (!autoDetectPriority) return null;
    
    const feedbackLower = feedback.toLowerCase();
    const criticalKeywords = ['crash', 'error', 'broken', 'not working', 'urgent', 'critical'];
    const highKeywords = ['bug', 'problem', 'issue', 'slow', 'difficult'];
    
    if (criticalKeywords.some(keyword => feedbackLower.includes(keyword))) {
      return (
        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Critical issue detected - will be prioritized</span>
        </div>
      );
    }
    
    if (highKeywords.some(keyword => feedbackLower.includes(keyword))) {
      return (
        <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded text-orange-700 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>High priority issue detected</span>
        </div>
      );
    }
    
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={triggerClassName}
          onClick={() => trackEvent({ name: 'feedback_widget_opened_enhanced', properties: { page } })}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Share Your Feedback
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Thank you!</h3>
            <p className="text-muted-foreground mb-4">
              Your feedback has been submitted successfully and will help us improve.
            </p>
            {spamWarning && (
              <p className="text-xs text-amber-600">
                Note: Our system detected potentially spammy content and may have filtered your feedback.
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* GDPR Status */}
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                GDPR Compliant - Your data is protected and secure
              </span>
            </div>

            {/* Rating */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                How would you rate your experience? <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                    aria-label={`Rate ${star} ${star === 1 ? 'star' : 'stars'}`}
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {rating === 5 && "Excellent! We're thrilled you love it."}
                  {rating === 4 && "Great! We're glad you're enjoying it."}
                  {rating === 3 && "Good! We'll work on improvements."}
                  {rating === 2 && "We can do better. Please tell us how."}
                  {rating === 1 && "We're sorry. Please help us improve."}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Feedback category"
                required
              >
                <option value="">Select a category</option>
                <option value="bug">🐛 Bug Report</option>
                <option value="feature">💡 Feature Request</option>
                <option value="usability">🎨 Usability</option>
                <option value="performance">⚡ Performance</option>
                <option value="content">📝 Content</option>
                <option value="design">🎨 Design</option>
                <option value="other">🔧 Other</option>
              </select>
            </div>

            {/* Feedback */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Your feedback <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us what you think... The more details you provide, the better we can help."
                rows={4}
                className="resize-none"
                maxLength={2000}
                required
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                  {feedback.length}/2000 characters
                </span>
                {spamWarning && (
                  <span className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Suspicious content detected
                  </span>
                )}
              </div>
            </div>

            {/* Priority Detection */}
            {getPriorityIndicator()}

            {/* Email (Optional) */}
            {showEmailField && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-email"
                    checked={includeEmail}
                    onCheckedChange={setIncludeEmail}
                  />
                  <label htmlFor="include-email" className="text-sm font-medium cursor-pointer">
                    I'd like to be contacted about this feedback
                  </label>
                </div>
                
                {includeEmail && (
                  <div>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full"
                      required={includeEmail}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      We'll only use this to follow up on your feedback
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* GDPR Consent */}
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="gdpr-consent"
                  checked={gdprConsent}
                  onCheckedChange={setGdprConsent}
                  required
                />
                <label htmlFor="gdpr-consent" className="text-sm leading-5 cursor-pointer">
                  I agree to the processing of my feedback data in accordance with the{' '}
                  <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </a>. <span className="text-red-500">*</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                Your feedback helps us improve our service. We collect minimal data and never share it with third parties.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !feedback.trim() || !category || !gdprConsent}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  'Submit Feedback'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}