# 💼 Growth Ledger

> Your all-in-one personal finance OS — Salary tracker, SIP investments, Debt planner, Career roadmap, AI advisor & more.

[![Expo](https://img.shields.io/badge/Expo-SDK%2052-000020?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.76-61DAFB?logo=react)](https://reactnative.dev)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 📱 Screenshots

> Dark premium UI — inspired by Groww, Zerodha & Apple design.

| Home | Money | Growth | Insights |
|------|-------|--------|----------|
| Dashboard with health score | Salary, SIP, Debt tabs | Career & Simulator | AI-powered analytics |

---

## ✨ Features

### 💰 Financial Tracking
- **Salary Tracker** — Attendance calendar, per-day earnings, loss calculation
- **Expense Splitter** — 50/30/20 rule with custom sliders + manual expense entry
- **SIP Calculator** — XIRR, CAGR, inflation-adjusted returns, step-up simulator
- **Debt Planner** — Avalanche vs Snowball comparison, extra payment optimizer

### 🧠 AI Intelligence
- **Financial Health Score** — 0–100 score across 5 dimensions
- **Money Personality** — Investor / Balanced / Spender / Risky / Growing
- **Smart Alerts** — Real-time contextual warnings
- **AI Decision Engine** — Invest vs repay debt, job switch analysis, insurance gap
- **AI Chat** — Claude-powered personal finance advisor

### 📊 Analytics
- **Cash Flow Screen** — Visual money flow diagram
- **Insights Screen** — YTD charts, spending trends, transaction history
- **Net Worth Tracker** — Assets minus liabilities
- **Behavior History** — 3-month pattern analysis

### 🚀 Career Growth
- **HSE Career Roadmap** — Officer → Senior → Manager → Director
- **Scenario Simulator** — Salary hike, SIP multiplier, step-up calculator
- **Retirement Planner** — Corpus needed, monthly savings required
- **Tax Estimator** — Old vs New regime comparison (India)
- **Certifications Tracker** — NEBOSH, IOSH, ISO, ADIS

### 🎮 Gamification
- **XP System** — Earn XP for daily attendance, SIP, goals
- **Level System** — Lv 1 → Lv ∞
- **9 Achievements** — Saver, Investor, Debt Buster, Elite, etc.
- **Streaks** — Attendance, SIP consistency, budget tracking

### 🔐 Privacy & Settings
- **Mask Amounts** — Hide all numbers in public
- **Biometric Lock** — Face ID / Fingerprint support
- **Smart Reminders** — Salary, SIP, EMI, Weekly AI report
- **JSON Backup** — Export and restore your data

---

## 🛠 Tech Stack

| Technology | Usage |
|-----------|-------|
| **Expo SDK 52** | App framework |
| **React Native 0.76** | UI framework |
| **AsyncStorage** | Local data persistence |
| **React Navigation v6** | Bottom tabs + stack navigation |
| **expo-blur** | Glassmorphism tab bar (iOS) |
| **expo-linear-gradient** | Premium card gradients |
| **react-native-svg** | Score ring + donut charts |
| **react-native-gesture-handler** | Smooth gestures |
| **react-native-reanimated** | Smooth animations |
| **@expo-google-fonts/syne** | Heading font |
| **@expo-google-fonts/dm-sans** | Body font |

---

## 📁 Project Structure

```
growth-ledger/
├── App.js                    # Root — fonts, navigation, providers
├── app.json                  # Expo configuration
├── babel.config.js           # Babel + Reanimated plugin
├── package.json              # Dependencies
└── src/
    ├── constants/
    │   └── theme.js          # Design tokens (colors, spacing, radius, shadows)
    ├── store/
    │   └── AppContext.js     # Global state with useReducer + AsyncStorage
    ├── utils/
    │   ├── calculations.js   # Financial formulas (SIP, CAGR, score engine)
    │   ├── initialState.js   # Default demo data
    │   └── storage.js        # AsyncStorage wrapper
    ├── components/
    │   ├── UIComponents.js   # Card, Chip, Toggle, ProgressBar, Button, Input
    │   ├── ScoreRing.js      # SVG circular health score ring
    │   ├── DonutChart.js     # SVG donut chart for expenses
    │   ├── BarChart.js       # Bar chart for earnings trend
    │   ├── FAB.js            # Floating Action Button with animations
    │   └── MonthPicker.js    # Month navigation component
    └── screens/
        ├── HomeScreen.js     # Dashboard — hero card, score, goals, trends
        ├── MoneyScreen.js    # Salary / Expenses / SIP / Debt (4 tabs)
        ├── CashFlowScreen.js # Money flow diagram
        ├── GrowthScreen.js   # Career / Simulator / Decisions / Tax (4 tabs)
        ├── InsightsScreen.js # AI analytics, risk analysis, charts
        └── ProfileScreen.js  # Achievements, privacy, reminders, settings
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo Go app on your phone (for testing)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/growth-ledger.git
cd growth-ledger

# 2. Install dependencies
npm install

# 3. Start Expo development server
npx expo start
```

### Run on Device

```bash
# Android
npx expo start --android

# iOS
npx expo start --ios

# Web (limited support)
npx expo start --web
```

Then scan the QR code with **Expo Go** app on your phone.

---

## 📦 Build for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure build
eas build:configure

# Build for Android (APK)
eas build --platform android --profile preview

# Build for iOS
eas build --platform ios
```

---

## 🔧 Configuration

### AI Chat (Optional)
The AI Chat feature uses Claude API. To enable live AI responses:

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Create `.env` file:
```
EXPO_PUBLIC_ANTHROPIC_API_KEY=your_key_here
```
3. Update `src/screens/InsightsScreen.js` to use the env key

> Without API key, the app shows smart pre-calculated insights based on your data.

### Customization
Edit `src/constants/theme.js` to change colors, spacing, or typography.

---

## 📊 Financial Formulas Used

| Formula | Usage |
|---------|-------|
| SIP Maturity = `P × ((1+r)^n - 1) / r × (1+r)` | Accurate SIP corpus calculation |
| CAGR = `(FV/PV)^(1/n) - 1` | Annual return rate |
| Inflation Adj = `Value / (1+inflation)^years` | Real purchasing power |
| Retirement Corpus = `Annual Income × 0.7 × 25 × (1.06)^years` | 4% withdrawal rule |
| Health Score = `Savings(25) + Debt(25) + SIP(25) + Expenses(15) + Attendance(10)` | 0–100 score |

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — free to use, modify and distribute.

---

## 🙏 Acknowledgments

- Design inspired by [Groww](https://groww.in), [Zerodha](https://zerodha.com) & Apple Design
- AI powered by [Anthropic Claude](https://anthropic.com)
- Built with [Expo](https://expo.dev) & [React Native](https://reactnative.dev)

---

<div align="center">
  <strong>Built with ❤️ for every Indian professional managing their finances</strong>
</div>
