'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorMessage({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try Again",
  className = ""
}: ErrorMessageProps) {
  return (
    <div className={`p-4 border border-destructive/50 rounded-lg bg-destructive/10 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          {title && <h4 className="font-medium text-destructive mb-1">{title}</h4>}
          <p className="text-sm text-destructive/90">{message}</p>
        </div>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground flex-shrink-0"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            {retryLabel}
          </Button>
        )}
      </div>
    </div>
  );
}