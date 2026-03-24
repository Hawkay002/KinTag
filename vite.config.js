import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Tells it to use the manual Update Toast
      includeAssets: ['kintag-logo.png', 'apple-touch-icon.png', 'favicon.ico'],
      manifest: {
        name: 'KinTag Digital Safety',
        short_name: 'KinTag',
        description: 'The ultimate digital safety net for your family.',
        theme_color: '#18181b', // brandDark
        background_color: '#fafafa', // zinc-50
        display: 'standalone', // Hides the browser URL bar
        orientation: 'portrait',
        icons: [
          {
            src: '/kintag-logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/kintag-logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallbackDenylist: [/^\/api/], // Don't cache your serverless backend
        
        // 🌟 FIXED 1: This absorbs Firebase so the two service workers don't fight
        importScripts: ['/firebase-messaging-sw.js'], 
        
        // 🌟 FIXED 2: This explicitly stops the app from auto-refreshing, allowing the toast to stay on screen!
        skipWaiting: false,
        clientsClaim: false
      }
    })
  ]
})
