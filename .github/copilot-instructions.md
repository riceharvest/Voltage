# Energy Drink App - AI Agent Instructions

This Next.js application is an interactive guide for safely creating custom energy drinks with strict EU compliance and Netherlands localization. The architecture separates data, validation logic, and UI components.

## Architecture Overview

**Core Pattern**: JSON-based data (recipes, ingredients, suppliers) + validation services + React components
- **Data Layer** (`/src/data`): Modular JSON files for bases, flavors, and ingredients loaded via `import.meta.glob` in `index.ts`
- **Service Layer** (`/src/lib`): Business logic including `safety-validation-service.ts` (EU compliance checks), calculators, and color utilities
- **UI Layer** (`/src/components`): Shadcn/ui-based components with client-side state management
- **Pages** (`/src/app`): Next.js App Router with layouts wrapping pages in ErrorBoundary and Header/Footer

**Critical Data Flow**:
1. User selects base recipe (e.g., "classic") → retrieves base from `/data/bases/*.json`
2. Selects flavor → finds compatible flavor from `/data/flavors/*.json` (filtered by `compatibleBases` array)
3. Inputs caffeine amount → `CaffeineCalculator` calculates syrup needed based on ingredient concentration
4. All ingredients validated through `safety-validation-service`: EU compliance checks, dosage limits, age restrictions
5. Complete recipe assembled as `CompleteRecipe` interface with dilution ratios calculated

## Key Patterns & Conventions

### Data Structure (TypeScript Interfaces in `lib/types.ts`)
- **Ingredient**: Multi-language (`name`, `nameNl`), categories (caffeine/sweetener/acid/etc), safety limits, supplier references
- **BaseRecipe**: Syrup recipes with ingredients array, instructions, built-in safety checks
- **FlavorRecipe**: Flavor combinations with compatible base IDs, color specs (natural/artificial with E-numbers), optional aging requirements
- **CompleteRecipe**: Combines base + flavor + calculated dilution ratio + final caffeine content (mg/serving)

**Important**: All ingredient amounts in recipes are stored as numbers in their specified units (`g`, `ml`, `mg`, `tsp`). Never assume units without checking the ingredient's `unit` field.

### Component Patterns
- **Client-only components** use `"use client"` directive (e.g., `FlavorSelector`)
- **State management**: Local `useState` for form inputs; pass callbacks (`onFlavorSelect`, `onCaffeineChange`) to parents
- **Filtered selections**: Components filter data before rendering (e.g., flavors filtered by `selectedBase` via `compatibleBases` check)
- **UI Building**: Use Shadcn components from `@/components/ui/` (Card, Input, Select, Badge, Dialog)

### Safety Validation Workflow
Location: `lib/safety-validation-service.ts` - the single source of truth for compliance checks.

Functions enforce:
1. **Age validation**: User age >= `limits.ageRestriction` (18+)
2. **Caffeine limits**: `mg <= limits.caffeine.maxPerServingMg` (EU max)
3. **EU compliance**: Filter out banned ingredients (E171, TiO2) + check `ingredient.safety.euCompliant`
4. **Compliance score**: Weighted calculation (30 points for age, 40 for caffeine, 50 for ingredients)

**Pattern**: Never skip validation; call `validateIngredients()` + `validateCaffeine()` before allowing recipe generation. Export and reuse these functions across components.

### Localization Convention
- Fields appear as pairs: `name` (English) + `nameNl` (Dutch)
- Examples: `description` / `descriptionNl`, `warning` / `warningNl`
- Component rendering chooses language (currently English default)
- Suppliers data lives in `/data/suppliers/netherlands.json` (Dutch-focused)

## Build & Development

**Commands**:
- `npm run dev`: Start Next.js dev server (http://localhost:3000)
- `npm run build`: Build production bundle (required before `npm start`)
- `npm run start`: Serve production build
- `npm run lint`: ESLint validation

**TypeScript Setup**: Strict mode enabled, `paths` alias `@/*` → `./src/*`

**CSS**: Tailwind v4 with `@tailwindcss/postcss` + custom globals in `src/app/globals.css`

## Common Tasks

### Adding a New Flavor
1. Create file `src/data/flavors/[flavor-name].json` matching `FlavorRecipe` interface
2. Include required fields: `id`, `name`, `nameNl`, `profile`, `profileNl`, `ingredients` (with `ingredientId` + `amount`), `color`, `compatibleBases`
3. Automatically loaded by glob in `src/data/index.ts` → appears in FlavorSelector
4. Test by filtering in FlavorSelector for compatible bases

### Adding a New Ingredient
1. Create/update entry in `src/data/ingredients/[category].json`
2. Include `id`, `name`, `nameNl`, `category` (one of 8 types), `unit`, `safety` (maxDaily, warningThreshold, euCompliant, banned)
3. Update `supplies` array with supplier IDs if sourced
4. Reference in flavor/base recipes by `ingredientId`

### Modifying Safety Rules
1. Edit `src/lib/safety-validation-service.ts` (service functions) or `src/lib/safety-data-service.ts` (data exports)
2. Update `limits` object for threshold changes (e.g., `limits.caffeine.maxPerServingMg`)
3. Test with `validateCaffeine()` / `validateIngredients()` functions
4. Export updated validation functions for use in components

### Creating a New Calculator Component
1. Mirror structure from `CaffeineCalculator`:
   - Accept props with `onChange` callbacks and required data (e.g., `baseId`)
   - Use `bases` from `@/data/index` for lookups
   - Call validation functions before setting final values
   - Render Shadcn Card + Input/Select components
2. Pass calculation result via callback (e.g., `onCaffeineChange(mg)`)

## Files Not to Break

- `src/lib/types.ts`: All interfaces used across data + components; breaking changes cascade
- `src/data/index.ts`: Exports `bases` and `flavors`; glob pattern must match directory structure
- `src/lib/safety-validation-service.ts`: Referenced by safety components; validate exports before refactoring
- `src/app/layout.tsx`: Wraps ErrorBoundary, Header, Footer—structure depended on by all pages

## Testing Data Integrity

Before committing flavor/ingredient changes:
1. Verify JSON syntax (valid against TypeScript interfaces)
2. Check `compatibleBases` references existing base IDs (`classic`, `zero`, `plain`)
3. Ensure `ingredientId` values exist in ingredient data files
4. Validate supplier IDs are consistent across files
5. Test FlavorSelector filters correctly by base

Use `npm run build` to catch TypeScript errors early.

## Notes on Netherlands Compliance

- All recipes must pass `validateCaffeine()` and `validateIngredients()` before serving
- Banned E-number (E171) auto-detected; flag any `artificial` color using it
- Supplier URLs prioritize Dutch sources (Bol.com, AH.nl, local wholesalers)
- Temperature/metric units only; no imperial conversions
- Age verification modal required before high-caffeine recipes exposed to users
