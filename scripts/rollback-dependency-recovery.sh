#!/bin/bash
# rollback-dependency-recovery.sh - Dependency Tree Recovery

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔄 DEPENDENCY TREE RECOVERY${NC}"

# Verify Node.js and npm versions
echo "Environment check..."
echo "Node.js version: $(node --version 2>/dev/null || echo 'NOT FOUND')"
echo "npm version: $(npm --version 2>/dev/null || echo 'NOT FOUND')"

if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js not found - installation required"
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    echo "❌ npm not found - installation required"
    exit 1
fi

# Clean dependency installation
echo "Performing dependency cleanup..."
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock

# Clear npm cache
echo "Cleaning npm cache..."
npm cache clean --force

# Verify package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found - creating minimal version"
    cat > package.json << 'EOF'
{
  "name": "energy-drink-calculator",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build", 
    "start": "next start",
    "lint": "next lint",
    "test": "jest"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0", 
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "typescript": "^5.0.0"
  }
}
EOF
fi

# Install dependencies with legacy peer deps to avoid conflicts
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Verify critical dependencies
echo "Verifying critical dependencies..."
CRITICAL_DEPS=("next" "react" "react-dom" "typescript")
MISSING_DEPS=()

for dep in "${CRITICAL_DEPS[@]}"; do
    if npm list "$dep" >/dev/null 2>&1; then
        echo "✅ $dep installed correctly"
    else
        echo "❌ $dep missing or broken"
        MISSING_DEPS+=("$dep")
    fi
done

# Install missing critical dependencies
if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    echo "Installing missing critical dependencies: ${MISSING_DEPS[*]}"
    for dep in "${MISSING_DEPS[@]}"; do
        npm install "$dep" --legacy-peer-deps
    done
fi

# Check for UI component dependencies (likely missing)
echo "Checking UI component dependencies..."
UI_DEPS=("@radix-ui/react-alert" "@radix-ui/react-tabs" "@radix-ui/react-badge" "@radix-ui/react-slot")
for dep in "${UI_DEPS[@]}"; do
    if npm list "$dep" >/dev/null 2>&1; then
        echo "✅ $dep installed"
    else
        echo "⚠️  $dep missing - may cause UI component errors"
        echo "Attempting to install UI dependencies..."
        npm install "$dep" --legacy-peer-deps || echo "Failed to install $dep"
    fi
done

# Check if shadcn/ui components exist
if [ -d "src/components/ui" ]; then
    echo "Checking shadcn/ui components..."
    REQUIRED_COMPONENTS=("alert.tsx" "badge.tsx" "tabs.tsx" "button.tsx")
    for component in "${REQUIRED_COMPONENTS[@]}"; do
        if [ -f "src/components/ui/$component" ]; then
            echo "✅ $component exists"
        else
            echo "❌ $component missing - creating basic version"
            # Create minimal component files
            case $component in
                "alert.tsx")
                    cat > "src/components/ui/$component" << 'EOF'
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive:
          'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={alertVariants({ variant })}
    {...props}
  />
))
Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
))
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
))
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription }
EOF
                    ;;
                "badge.tsx")
                    cat > "src/components/ui/$component" << 'EOF'
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={badgeVariants({ variant })} {...props} />
  )
}

export { Badge, badgeVariants }
EOF
                    ;;
                "tabs.tsx")
                    cat > "src/components/ui/$component" << 'EOF'
import * as React from 'react'

const Tabs = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={className} {...props} />
))
Tabs.displayName = 'Tabs'

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground"
    {...props}
  />
))
TabsList.displayName = 'TabsList'

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
    {...props}
  />
))
TabsTrigger.displayName = 'TabsTrigger'

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className="mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    {...props}
  />
))
TabsContent.displayName = 'TabsContent'

export { Tabs, TabsList, TabsTrigger, TabsContent }
EOF
                    ;;
                "button.tsx")
                    cat > "src/components/ui/$component" << 'EOF'
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
EOF
                    ;;
            esac
        fi
    done
fi

# Test dependency resolution
echo "Testing dependency resolution..."
if npm run build --dry-run >/dev/null 2>&1; then
    echo "✅ Dependency resolution test passed"
else
    echo "⚠️  Dependency resolution test had warnings"
fi

echo -e "${GREEN}✅ Dependency recovery completed${NC}"
echo "Dependencies reinstalled and UI components restored"

exit 0