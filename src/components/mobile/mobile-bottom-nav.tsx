/**
 * Mobile Bottom Navigation Component
 * Provides thumb-friendly navigation optimized for mobile devices
 */

'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Calculator, 
  BookOpen, 
  User, 
  Settings,
  Plus,
  Zap,
  Menu
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
  isAction?: boolean;
  color?: string;
}

interface MobileBottomNavProps {
  className?: string;
  showFab?: boolean;
  onFabClick?: () => void;
}

const navItems: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    href: '/',
    color: 'text-blue-600'
  },
  {
    id: 'calculator',
    label: 'Calculator',
    icon: Calculator,
    href: '/calculator',
    color: 'text-green-600'
  },
  {
    id: 'recipes',
    label: 'Recipes',
    icon: BookOpen,
    href: '/flavors',
    color: 'text-purple-600'
  },
  {
    id: 'community',
    label: 'Community',
    icon: User,
    href: '/community',
    badge: 3,
    color: 'text-orange-600'
  },
  {
    id: 'more',
    label: 'More',
    icon: Menu,
    href: '/more',
    color: 'text-gray-600'
  }
];

const actionItems: NavItem[] = [
  {
    id: 'quick-calc',
    label: 'Quick Calc',
    icon: Zap,
    href: '/calculator?quick=true',
    isAction: true,
    color: 'text-yellow-600'
  }
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  className,
  showFab = true,
  onFabClick
}) => {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide/show navigation based on scroll direction
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY <= lastScrollY || currentScrollY < 100);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Check if current route matches nav item
  const isActiveRoute = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  // Get icon with active state
  const getIcon = (item: NavItem, isActive: boolean) => {
    const Icon = item.icon;
    const color = isActive ? 'text-primary' : item.color || 'text-muted-foreground';
    
    return (
      <Icon 
        className={cn(
          'h-5 w-5 transition-all duration-200',
          color,
          isActive && 'scale-110'
        )} 
      />
    );
  };

  return (
    <>
      {/* Bottom Navigation */}
      <nav 
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border transition-transform duration-300 ease-in-out',
          isVisible ? 'translate-y-0' : 'translate-y-full',
          className
        )}
      >
        <div className="flex items-center justify-around px-2 py-1 max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = isActiveRoute(item.href);
            
            return (
              <a
                key={item.id}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center px-2 py-2 min-w-0 flex-1 transition-all duration-200',
                  'hover:bg-accent/50 rounded-lg',
                  'active:scale-95'
                )}
                aria-label={item.label}
              >
                <div className="relative">
                  {getIcon(item, isActive)}
                  {item.badge && item.badge > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs"
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  )}
                </div>
                <span 
                  className={cn(
                    'text-xs mt-1 font-medium transition-colors',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                </span>
              </a>
            );
          })}
        </div>
      </nav>

      {/* Floating Action Button */}
      {showFab && (
        <button
          onClick={onFabClick}
          className={cn(
            'fixed bottom-20 right-4 z-40',
            'w-14 h-14 rounded-full bg-primary text-primary-foreground',
            'flex items-center justify-center shadow-lg',
            'transition-all duration-300 ease-in-out',
            'hover:scale-110 active:scale-95',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
          )}
          aria-label="Quick actions"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Quick Action Sheet */}
      <MobileQuickActionsSheet onFabClick={onFabClick} />
    </>
  );
};

/**
 * Mobile Quick Actions Bottom Sheet
 */
interface MobileQuickActionsSheetProps {
  onFabClick?: () => void;
}

const MobileQuickActionsSheet: React.FC<MobileQuickActionsSheetProps> = ({
  onFabClick
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleFabClick = () => {
    setIsOpen(!isOpen);
    onFabClick?.();
  };

  // Close sheet when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isOpen && !target.closest('.quick-actions-sheet')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Action Sheet */}
      <div className="quick-actions-sheet fixed bottom-20 left-4 right-4 z-40">
        <div className="bg-background rounded-t-xl border border-border shadow-lg">
          {/* Handle */}
          <div className="flex justify-center py-2">
            <div className="w-8 h-1 bg-muted rounded-full" />
          </div>
          
          {/* Actions */}
          <div className="px-4 pb-4 space-y-3">
            <h3 className="text-lg font-semibold text-center mb-4">Quick Actions</h3>
            
            {actionItems.map((item) => {
              const Icon = item.icon;
              
              return (
                <a
                  key={item.id}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 p-3 rounded-lg',
                    'hover:bg-accent transition-colors',
                    'active:scale-98'
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <div className={cn('p-2 rounded-lg bg-accent', item.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">
                      Fast access to {item.label.toLowerCase()}
                    </p>
                  </div>
                </a>
              );
            })}
            
            {/* Additional quick actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href="/recipes/create"
                className="flex flex-col items-center p-3 rounded-lg bg-accent hover:bg-accent/80 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Plus className="h-5 w-5 mb-1 text-primary" />
                <span className="text-sm font-medium">New Recipe</span>
              </a>
              
              <a
                href="/safety"
                className="flex flex-col items-center p-3 rounded-lg bg-accent hover:bg-accent/80 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Zap className="h-5 w-5 mb-1 text-orange-500" />
                <span className="text-sm font-medium">Safety Check</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileBottomNav;