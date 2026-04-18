# 💼 Growth Ledger v8.0

> Your complete personal finance OS — Salary tracker, SIP investments, Debt planner, AI advisor.

## 🚀 Quick Start

```bash
npm install
npx expo start --android
```

## 📁 Structure (Flat — like StakeLog)

```
├── App.js              ← Root: fonts, navigation, providers
├── index.js            ← registerRootComponent entry
├── AppContext.js        ← Global state (salary, sips, debts, goals)
├── ThemeContext.js      ← Dark / AMOLED / Light theme system
├── helpers.js          ← Financial calculations (fmt, deriveState, calcScore)
├── storage.js          ← AsyncStorage wrapper
├── theme.js            ← Design tokens (colors, spacing, radius)
├── UI.js               ← All UI components (Card, Btn, Toggle, FAB...)
├── Charts.js           ← ScoreRing, DonutChart, BarChart
├── HomeScreen.js       ← Dashboard
├── MoneyScreen.js      ← Salary / Expenses / SIP / Debt
├── InsightsScreen.js   ← Analytics + Smart insights (crash-proof)
├── ProfileScreen.js    ← Settings, achievements, theme switcher
├── assets/             ← icon.png, splash.png, adaptive-icon.png
├── app.json            ← Expo config
├── eas.json            ← EAS Build config
└── package.json        ← Dependencies
```

## 🔧 EAS Build

```bash
npx eas-cli login
npx eas build --platform android --profile preview
```
