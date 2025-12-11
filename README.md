# Voltage - The Ultimate DIY Soda Platform

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.1.6-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC)](https://tailwindcss.com/)

> ⚠️ **SAFETY WARNING**: Creating beverages involves handling various ingredients including caffeine and food additives. This platform emphasizes safety-first practices with real-time EU compliance validation. Always use precision scales and follow safety protocols strictly.

## 🌟 Overview

Voltage is transforming from an energy drink calculator into the central hub for all DIY soda creation, expanding from 40+ energy drink flavors to a comprehensive library of 100+ soda recipes across classic and energy-enhanced categories. Currently in our Netherlands MVP phase, we're building toward becoming the global go-to resource for DIY soda creation worldwide.

### 🎯 Vision
**Current State**: Energy drink enthusiasts creating EU-compliant, safe, and powerful energy drinks at home
**Target State**: The ultimate DIY soda creation platform - from homemade cola to energy-infused citrus blends

### 💼 Business Model Evolution
**Current**: Monetize through affiliate partnerships with Dutch ingredient suppliers
**Target**: Amazon affiliate revenue from syrup sales, equipment, and ingredients across global regions
**Revenue Streams**: Ingredient purchases, premium features, branded merchandise, and educational content

### 📈 Expansion Roadmap
- **Current**: 40+ energy drink recipes with Netherlands focus
- **Phase 1**: Classic sodas (cola, citrus, fruit, cream soda, root beer, ginger ale)
- **Phase 2**: Energy-enhanced sodas with differentiated safety protocols
- **Phase 3**: Global Amazon integration with multi-region support
- **Target**: 100+ recipes across all soda categories with worldwide reach

## ✨ Features

### 🧮 Smart Calculator
- **Caffeine Calculator**: Input desired strength, get precise powder ratios
- **Batch Scaler**: Scale recipes for any serving size (250ml to 500ml cans)
- **Cost Estimator**: Real-time pricing from Dutch suppliers
- **Dilution Guide**: Perfect syrup-to-water ratios
- **Multi-Mode Support**: Separate logic for DIY recipes vs premade syrups (planned)

### 🧪 Flavor Alchemy
- **40+ Energy Drink Recipes**: From Red Bull clones to tropical chaos blends
- **Base Options**: Classic sugar, Zero sugar-free, Plain for customization
- **Compatibility Matrix**: See which flavors work with which bases
- **Custom Blends**: Mix and match ingredients safely
- **Expansion Target**: 100+ recipes across classic sodas, energy-enhanced, and specialty categories

### 📚 Master Guide
- **Phase-by-Phase Workflow**: Step-by-step mixing instructions
- **Safety Validators**: Real-time compliance checks against EU limits
- **Equipment Lists**: Precision scales, beakers, pipettes
- **Troubleshooting**: Common issues and solutions

### 🛡️ Safety & Compliance
- **EU Regulatory Compliance**: Automatic flagging of banned ingredients (E171)
- **Dosage Validation**: Caffeine limits, preservative thresholds
- **Age Verification**: 18+ restrictions for high-caffeine recipes
- **Emergency Contacts**: Quick access to Dutch poison control
- **Differentiated Safety**: Separate protocols for classic sodas vs energy drinks (planned)
- **Global Compliance**: Region-specific safety guidelines and ingredient restrictions (planned)

### 💰 Affiliate Integration
- **Dutch Suppliers**: Curated links to Bol.com, AH, and specialized suppliers
- **Conversion Tracking**: Advanced affiliate analytics and attribution
- **Amazon Integration**: Global affiliate network with regional variants (planned)
- **Cost Comparison**: DIY vs premade options analysis (planned)

### 📊 Analytics & Monitoring
- **Core Web Vitals Tracking**: Real-time performance monitoring
- **Error Monitoring**: Sentry-powered error tracking and alerting
- **Caching System**: Redis-based multi-layer caching
- **Health Monitoring**: Dedicated health check endpoints
- **Global Analytics**: User segmentation and conversion tracking across regions (planned)

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/energy-drink-app.git
   cd energy-drink-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production
```bash
npm run build
npm start
```

### Testing
```bash
npm run lint
npx playwright test  # End-to-end tests
```

## 📖 Usage

### Quick Start Guide

1. **Visit the Home Page**: Get an overview of features and safety warnings
2. **Start the Calculator**: Choose your desired caffeine strength and volume
3. **Select Base Recipe**: Classic (sugar), Zero (sugar-free), or Plain
4. **Pick Your Flavor**: Browse 40+ recipes or create custom blends
5. **Validate Safety**: Automatic EU compliance and dosage checks
6. **Follow the Phases**: Step-by-step mixing workflow with timers
7. **Shop Ingredients**: Affiliate links to Dutch suppliers

### Example: Making a Red Bull Clone

```bash
# 1. Select Classic Base (550g sugar, 1.6g caffeine)
# 2. Choose Red Bull Flavor (ethyl butyrate, vanillin, etc.)
# 3. Calculate for 330ml serving (105mg caffeine)
# 4. Follow 3-phase mixing process
# 5. Carbonate with SodaStream
```

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15.1.6 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + Radix UI components
- **Testing**: Playwright for E2E, Jest for unit tests
- **Data**: JSON-based recipe storage for modularity

### Project Structure
```
energy-drink-app/
├── src/
│   ├── app/           # Next.js app router pages
│   ├── components/    # Reusable UI components
│   ├── data/          # Recipes, ingredients, suppliers
│   ├── lib/           # Utilities and business logic
│   └── types/         # TypeScript definitions
├── docs/              # Design docs and guides
├── scripts/           # Data management scripts
└── public/            # Static assets
```

### Data Models
- **Ingredients**: 50+ meticulously curated items with safety limits, supplier links, nutritional data, and EU compliance flags
- **Bases**: Three recipe types (Classic sugar, Zero sugar-free, Plain customizable) with detailed ingredient compositions and scaling formulas
- **Flavors**: 40+ authentic recipes with lazy loading optimization, compatibility matrices, and caffeine content calculations
- **Suppliers**: 20+ Dutch retailers integrated with affiliate programs, real-time pricing, and product availability tracking

### 🔌 API Endpoints
- **Authentication**: Age verification and session management (`/api/auth/*`)
- **Data Services**: Ingredient, flavor, and supplier data with caching (`/api/ingredients`, `/api/flavors`, `/api/suppliers`)
- **GDPR**: Data export, deletion, and consent management (`/api/gdpr/*`)
- **Health**: System monitoring and diagnostics (`/api/health`)
- **Feedback**: User feedback collection and analytics (`/api/feedback`)
- **Feature Flags**: Dynamic feature toggling (`/api/feature-flags`)

## 🌐 Expansion Plans

### Phase 1: Netherlands Energy Drink MVP ✅
- Complete Dutch supplier integration
- EU compliance validation
- Bilingual interface
- 40+ energy drink recipes

### Phase 2: Classic Soda Platform (2025 Q1)
- Classic Sodas: Cola, citrus, fruit, cream soda, root beer, ginger ale
- Amazon affiliate integration with regional variants
- Safety protocol differentiation (caffeinated vs non-caffeinated)
- Global localization support

### Phase 3: Energy-Enhanced Sodas (2025 Q2)
- Hybrid recipes combining classic sodas with energy ingredients
- Enhanced age verification for mixed-caffeine products
- Advanced safety validation for energy-enhanced categories
- Premade syrup integration marketplace

### Phase 4: Global Launch (2025 Q3)
- Worldwide supplier network with Amazon integration
- Advanced customization features
- Mobile app companion
- AI-powered recipe suggestions
- Social features and community sharing

### Target State: Complete DIY Soda Ecosystem (2026)
- **100+ Recipes**: Comprehensive library across all soda categories
- **Global Reach**: Multi-region Amazon integration with automatic localization
- **Business Model**: Amazon affiliate revenue across international markets
- **Platform Features**: Recipe sharing, user-generated content, premium tools

### Future Innovation Pipeline
- Smart scale integration with real-time measurements
- Barcode ingredient scanning for automatic recipe matching
- Social recipe sharing and community challenges
- Professional brewing tools and commercial applications
- AI-powered flavor combination suggestions
- IoT integration with smart appliances

## 📊 Current Data Models

### Ingredients (Current: 50+ items)
- **Safety Limits**: Meticulously curated with EU compliance flags
- **Supplier Integration**: Real-time pricing and availability tracking
- **Expansion Target**: 200+ ingredients covering all soda categories

### Bases (Current: 3 types)
- **Classic**: Traditional sugar-based energy drink foundation
- **Zero**: Sugar-free alternatives with artificial sweeteners
- **Plain**: Customizable base for advanced users
- **Expansion Target**: 10+ base types for different soda categories

### Flavors (Current: 40+ recipes)
- **Energy Focus**: Caffeine-heavy recipes with safety validation
- **Compatibility Matrix**: Intelligent flavor-base matching
- **Expansion Target**: 100+ recipes across classic sodas, energy-enhanced, and specialty

### Suppliers (Current: Netherlands focus)
- **Local Integration**: 25+ Dutch retailers and specialty shops
- **Affiliate Tracking**: Advanced conversion analytics
- **Expansion Target**: Global Amazon network across 8+ regions

## 🤝 Contributing

We welcome contributions from the community! Here's how to get involved:

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `npm run lint && npx playwright test`
5. Submit a pull request

### Adding New Recipes
1. Create JSON file in `src/data/flavors/`
2. Follow the FlavorRecipe interface
3. Test safety validation
4. Update `src/data/index.ts`

### Reporting Issues
- Use GitHub Issues for bugs and feature requests
- Include detailed steps to reproduce
- Mention your environment (Node version, browser, etc.)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

**This application is for educational purposes only.** Creating energy drinks involves handling potent chemicals including pure caffeine, which can be fatal if misused. Always:

- Use precision scales (0.001g minimum)
- Follow EU safety limits strictly
- Consult healthcare professionals before consumption
- Store ingredients safely away from children/pets

The creators are not responsible for misuse or health consequences.

## 🙏 Acknowledgments

- EU Food Safety Authority for regulatory guidance
- Dutch suppliers for affiliate partnerships
- Open source community for amazing tools

---

**Made with ⚡ in the Netherlands** | [Visit Voltage](https://voltage-app.com) | [Contribute](https://github.com/yourusername/energy-drink-app)
