'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Star } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

interface FeedbackWidgetProps {
  page?: string;
  triggerClassName?: string;
}

export function FeedbackWidget({ page = 'unknown', triggerClassName }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!feedback.trim()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          feedback: feedback.trim(),
          category,
          page,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        trackEvent({
          name: 'feedback_submitted',
          properties: {
            rating,
            category,
            page,
            has_feedback: feedback.length > 0
          }
        });

        // Reset form after 2 seconds
        setTimeout(() => {
          setIsOpen(false);
          setSubmitted(false);
          setRating(0);
          setFeedback('');
          setCategory('');
        }, 2000);
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // In a real app, you might show an error message
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={triggerClassName}
          onClick={() => trackEvent({ name: 'feedback_widget_opened', properties: { page } })}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Feedback</DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="text-center py-8">
            <div className="text-green-500 text-4xl mb-4">✓</div>
            <h3 className="text-lg font-semibold mb-2">Thank you!</h3>
            <p className="text-muted-foreground">Your feedback has been submitted successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rating */}
            <div>
              <label className="text-sm font-medium mb-2 block">How would you rate your experience?</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                    aria-label={`Rate ${star} ${star === 1 ? 'star' : 'stars'}`}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Feedback category"
              >
                <option value="">Select a category</option>
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="usability">Usability</option>
                <option value="performance">Performance</option>
                <option value="content">Content</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Feedback */}
            <div>
              <label className="text-sm font-medium mb-2 block">Your feedback</label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us what you think..."
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
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
                disabled={isSubmitting || !feedback.trim()}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}