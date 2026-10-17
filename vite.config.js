import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'pwa-icon.svg', 'manifest.json', 'lessons/**/*.json'],
      manifest: {
        name: 'InterviewPrep — Daily Technical Mastery',
        short_name: 'InterviewPrep',
        description: 'Duolingo-like daily technical interview prep app with structured lessons, interactive recall quizzes, and real-world engineering scenarios.',
        theme_color: '#070a10',
        background_color: '#070a10',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.json'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'curriculum-content-cache-v2',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 24 * 60 * 60, // 1 day; prefer the latest published curriculum when online
              },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
              },
            },
          }
        ]
      }
    })
  ],
})
