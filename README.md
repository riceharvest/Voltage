# Voltage - The Ultimate DIY Energy Drink Guide

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.1.6-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC)](https://tailwindcss.com/)

> ⚠️ **CRITICAL SAFETY WARNING**: Pure caffeine is potentially lethal. This guide emphasizes EU-compliant, safe mixing practices. Always use precision scales (0.001g) and follow dosage limits strictly.

## 🌟 Overview

Voltage is the central hub for home energy drink enthusiasts worldwide. Our interactive web application empowers users to create their own EU-compliant, safe, and powerful energy drinks at home. Currently focused on our Netherlands MVP, we're expanding globally to become the go-to resource for DIY energy drink recipes.

### 🎯 Mission
To democratize energy drink creation by providing:
- **Precision recipes** for famous brands (Red Bull, Monster, etc.)
- **Safety-first approach** with real-time EU compliance validation
- **Cost-effective alternatives** to commercial drinks
- **Educational resources** for responsible mixing

### 💼 Business Model
We monetize through affiliate partnerships with ingredient suppliers and syrup manufacturers. Users can purchase ingredients directly through our curated links to trusted Dutch retailers like Bol.com, AH, and specialized suppliers. Revenue streams include affiliate commissions from ingredient purchases, potential premium features for advanced recipes, and future expansion into branded merchandise and educational content.

## ✨ Features

### 🧮 Smart Calculator
- **Caffeine Calculator**: Input desired strength, get precise powder ratios
- **Batch Scaler**: Scale recipes for any serving size (250ml to 500ml cans)
- **Cost Estimator**: Real-time pricing from Dutch suppliers
- **Dilution Guide**: Perfect syrup-to-water ratios

### 🧪 Flavor Alchemy
- **40+ Recipes**: From Red Bull clones to tropical chaos blends
- **Base Options**: Classic sugar, Zero sugar-free, Plain for customization
- **Compatibility Matrix**: See which flavors work with which bases
- **Custom Blends**: Mix and match ingredients safely

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

### 🔐 Security & Privacy
- **Age Verification**: Mandatory 18+ verification for calculator access with persistent modal system
- **GDPR Compliance**: Comprehensive data protection with cookie consent banners, data export/deletion APIs, and privacy controls
- **CSRF Protection**: Token-based cross-site request forgery protection for all forms
- **Rate Limiting**: Intelligent API rate limiting (100 requests/15min per IP) with abuse prevention

### 📊 Monitoring & Performance
- **Core Web Vitals Tracking**: Real-time performance monitoring with web-vitals library integration
- **Error Monitoring**: Sentry-powered error tracking and alerting for production issues
- **Caching System**: Redis-based multi-layer caching (data, API responses, static assets) with configurable TTL
- **Health Monitoring**: Dedicated health check endpoints and system status dashboards

### 🌍 Netherlands Focus (MVP)
- **Local Suppliers**: Curated Dutch retailers and specialty shops
- **Metric Units**: All measurements in grams/ml/liters
- **Dutch Interface**: Bilingual (English/Dutch) support
- **Local Regulations**: Netherlands-specific safety guidelines

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

### Phase 1: Netherlands MVP ✅
- Complete Dutch supplier integration
- EU compliance validation
- Bilingual interface

### Phase 2: European Expansion (2025)
- Belgium, Germany, France localization
- Local supplier partnerships
- Multi-language support

### Phase 3: Global Launch (2026)
- Worldwide supplier network
- Advanced customization features
- Mobile app companion
- AI-powered recipe suggestions

### Future Features
- Smart scale integration
- Barcode ingredient scanning
- Social recipe sharing
- Professional brewing tools

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
