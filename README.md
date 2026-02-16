# 📈 Habit Tracker Dashboard

A **Forex Trader-themed** habit tracker with real-time cloud sync, performance analytics, and trading-style visualizations. Built with React, TypeScript, Firebase, and Tailwind CSS.

![Trader Dashboard](https://img.shields.io/badge/theme-Trader%20Dashboard-0b0f14?style=flat-square&logo=chartdotjs&logoColor=00ff88)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?style=flat-square&logo=firebase)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=flat-square&logo=tailwindcss)

## ✨ Features

### Core Functionality
- 📊 **Weekly habit tracking** with checkbox + hours input
- 🔄 **Real-time cloud sync** via Firebase Firestore
- 🔐 **Google authentication** for secure access
- 📅 **Week navigation** with past/future week views
- 💾 **Offline support** with local caching

### Trader-Style Visualizations
- 📈 **Candle chart** showing daily performance
- 🗓️ **Heatmap grid** for habit completion patterns
- 📊 **P/L bar** showing ahead/behind status
- 📉 **KPI cards** with trading-style metrics

### Smart Insights (Trader Coach)
- 🎯 Per-habit discipline alerts
- 📈 Recovery plans to hit targets
- 🏆 Best/worst performer identification
- 📊 Monthly projection estimates

### Export & Sharing
- 📄 Export week data as **JSON** or **CSV**
- 📋 Copy **shareable summary** to clipboard

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- A Firebase project

### 1. Clone & Install

```bash
git clone https://github.com/your-username/habit-tracker.git
cd habit-tracker
npm install
```

### 2. Configure Firebase

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)

2. Enable **Authentication** → Sign-in method → **Google**

3. Create a **Firestore Database** in production mode

4. Copy Firebase config from Project Settings → General → Your apps

5. Create `.env` file:
```bash
cp .env.example .env
```

6. Fill in your Firebase config values in `.env`:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 3. Set Up Firestore Security Rules

Copy the rules from `firestore.rules` to:
**Firebase Console → Firestore → Rules**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    match /users/{userId} {
      allow read, write: if isOwner(userId);
      
      match /habits/{habitId} {
        allow read, write: if isOwner(userId);
      }
      
      match /weekLogs/{weekLogId} {
        allow read, write: if isOwner(userId);
      }
    }
  }
}
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## 📦 Building for Production

```bash
npm run build
npm run preview  # Test production build locally
```

## 🌐 Deploy to GitHub Pages

### Automatic Deployment (GitHub Actions)

1. Push your code to GitHub

2. Add Firebase secrets to your repo:
   - Go to **Settings → Secrets → Actions**
   - Add each `VITE_FIREBASE_*` variable from your `.env`

3. Enable GitHub Pages:
   - Go to **Settings → Pages**
   - Set Source to **GitHub Actions**

4. Push to `main` branch — deployment is automatic!

### Manual Deployment

```bash
# Set base URL for GitHub Pages
export VITE_BASE_URL=/your-repo-name/

# Build
npm run build

# Deploy dist folder to gh-pages branch
npx gh-pages -d dist
```

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/           # Login page
│   ├── dashboard/      # Main dashboard, charts, tables
│   ├── habits/         # Habit modal/forms
│   └── layout/         # AppLayout, Sidebar, TopBar
├── contexts/           # Auth, Toast providers
├── hooks/              # useHabits, useNetworkStatus
├── lib/                # Firebase config
├── types/              # TypeScript interfaces
└── utils/              # Date, progress, export utilities
```

## 🎨 Trader Theme Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Background | `#0b0f14` | Main dark background |
| Card | `#111827` | Panel backgrounds |
| Neon Green | `#00ff88` | Success, profit |
| Neon Red | `#ff4757` | Error, loss |
| Neon Cyan | `#00ffff` | Primary accent |
| Neon Yellow | `#ffcc00` | Warning |
| Neon Purple | `#a855f7` | Special |

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS + custom trader theme
- **Backend**: Firebase (Auth + Firestore)
- **Charts**: Custom SVG components
- **Icons**: Heroicons

## 📄 License

MIT License - feel free to use for personal or commercial projects.

---

Built with 💚 for disciplined habit tracking
# Deployed
Redeploy Mon, Feb 16, 2026  2:31:07 PM
