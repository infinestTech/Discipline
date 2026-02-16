import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // For GitHub Pages deployment, set base to your repo name
  // e.g., base: '/habit-tracker/' if your repo is github.com/username/habit-tracker
  // For custom domain or root deployment, use base: '/'
  base: process.env.VITE_BASE_URL || '/',
  build: {
    // Generate source maps for production debugging
    sourcemap: false,
    // Optimize chunk size
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },
})
