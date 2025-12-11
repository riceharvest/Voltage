/**
 * Mobile-Optimized Modal Component
 * Provides mobile-friendly modal interactions with swipe-to-dismiss,
 * touch-optimized sizing, and accessibility features
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full' | 'bottom-sheet';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  preventClose?: boolean;
}

interface SwipeHandleProps {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  children: React.ReactNode;
}

const SwipeHandle: React.FC<SwipeHandleProps> = ({ 
  onSwipeUp, 
  onSwipeDown, 
  children 
}) => {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentY = e.touches[0].clientY;
    setCurrentY(currentY - startY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const swipeThreshold = 100;
    
    if (currentY < -swipeThreshold) {
      onSwipeUp?.();
    } else if (currentY > swipeThreshold) {
      onSwipeDown?.();
    }
    
    setIsDragging(false);
    setCurrentY(0);
  };

  return (
    <div
      className={cn(
        'transition-transform duration-200 ease-out',
        isDragging && 'scale-[1.02]'
      )}
      style={{
        transform: isDragging ? `translateY(${currentY}px)` : undefined,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
};

export const MobileModal: React.FC<MobileModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  preventClose = false
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !preventClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, preventClose, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsAnimating(true);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick && !preventClose) {
      onClose();
    }
  };

  const handleSwipeDown = () => {
    if (!preventClose) {
      onClose();
    }
  };

  const getModalClasses = () => {
    const baseClasses = 'relative bg-background rounded-t-2xl shadow-2xl border-t border-border';
    
    switch (size) {
      case 'sm':
        return cn(baseClasses, 'w-full max-w-sm mx-auto mt-20');
      case 'md':
        return cn(baseClasses, 'w-full max-w-md mx-auto mt-16');
      case 'lg':
        return cn(baseClasses, 'w-full max-w-lg mx-auto mt-12');
      case 'full':
        return cn(baseClasses, 'w-full h-full rounded-none mt-0');
      case 'bottom-sheet':
        return cn(baseClasses, 'w-full max-w-md mx-auto');
      default:
        return cn(baseClasses, 'w-full max-w-md mx-auto mt-16');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={handleOverlayClick}
        style={{
          animation: isAnimating ? 'fadeIn 0.3s ease-out' : undefined
        }}
      />

      {/* Modal */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 flex items-end justify-center p-4"
        style={{
          animation: isAnimating ? 'slideUp 0.3s ease-out' : undefined
        }}
      >
        <SwipeHandle onSwipeDown={handleSwipeDown}>
          <div
            ref={modalRef}
            className={cn(getModalClasses(), className)}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            aria-describedby={description ? 'modal-description' : undefined}
          >
            {/* Swipe indicator */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between p-4 pb-2">
                <div className="flex-1">
                  {title && (
                    <h2 
                      id="modal-title"
                      className="text-lg font-semibold text-foreground"
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p 
                      id="modal-description"
                      className="text-sm text-muted-foreground mt-1"
                    >
                      {description}
                    </p>
                  )}
                </div>
                
                {showCloseButton && !preventClose && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="ml-2 h-8 w-8 p-0"
                    aria-label="Close modal"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="px-4 pb-6 max-h-[70vh] overflow-y-auto">
              {children}
            </div>
          </div>
        </SwipeHandle>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(100%);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

/**
 * Mobile Action Sheet Component
 */
interface ActionSheetOption {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'secondary';
  disabled?: boolean;
}

interface MobileActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  options: ActionSheetOption[];
  cancelLabel?: string;
  className?: string;
}

export const MobileActionSheet: React.FC<MobileActionSheetProps> = ({
  isOpen,
  onClose,
  title,
  options,
  cancelLabel = 'Cancel',
  className
}) => {
  const handleOptionClick = (option: ActionSheetOption) => {
    option.onClick();
    onClose();
  };

  const getOptionClasses = (variant: ActionSheetOption['variant']) => {
    switch (variant) {
      case 'destructive':
        return 'text-destructive hover:bg-destructive/10';
      case 'secondary':
        return 'text-muted-foreground hover:bg-muted';
      default:
        return 'text-foreground hover:bg-accent';
    }
  };

  if (!isOpen) return null;

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      size="bottom-sheet"
      className={className}
    >
      {title && (
        <h3 className="text-lg font-semibold text-center mb-4 pb-4 border-b border-border">
          {title}
        </h3>
      )}
      
      <div className="space-y-1">
        {options.map((option) => {
          const Icon = option.icon;
          
          return (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option)}
              disabled={option.disabled}
              className={cn(
                'w-full flex items-center space-x-3 px-4 py-3 text-left',
                'rounded-lg transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                getOptionClasses(option.variant)
              )}
            >
              {Icon && (
                <Icon className="h-5 w-5 flex-shrink-0" />
              )}
              <span className="font-medium">{option.label}</span>
            </button>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-border">
        <button
          onClick={onClose}
          className={cn(
            'w-full px-4 py-3 text-center font-medium rounded-lg',
            'text-muted-foreground hover:bg-muted transition-colors'
          )}
        >
          {cancelLabel}
        </button>
      </div>
    </MobileModal>
  );
};

/**
 * Mobile Sheet Component - Bottom drawer style
 */
interface MobileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  height?: string;
  className?: string;
}

export const MobileSheet: React.FC<MobileSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  height = 'auto',
  className
}) => {
  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      size="bottom-sheet"
      showCloseButton={!!title}
      className={cn('mx-auto', className)}
      style={{ height }}
    >
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      )}
      {children}
    </MobileModal>
  );
};

export default MobileModal;