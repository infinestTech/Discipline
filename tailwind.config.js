/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme backgrounds
        'trader-bg': '#0b0f14',
        'trader-card': '#111820',
        'trader-border': '#1e2a3a',
        'trader-hover': '#182130',
        
        // Neon highlights
        'neon-green': '#00ff88',
        'neon-red': '#ff4757',
        'neon-cyan': '#00d4ff',
        'neon-yellow': '#ffd000',
        'neon-purple': '#a855f7',
        
        // Text colors
        'trader-text': '#e5e7eb',
        'trader-muted': '#6b7280',
      },
      fontFamily: {
        'inter': ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-green': '0 0 20px rgba(0, 255, 136, 0.3)',
        'neon-red': '0 0 20px rgba(255, 71, 87, 0.3)',
        'neon-cyan': '0 0 20px rgba(0, 212, 255, 0.3)',
      },
    },
  },
  plugins: [],
}
