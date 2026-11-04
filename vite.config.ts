import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-maid.jpg', 'favicon.svg'],
      manifest: {
        name: 'Apollo 3000 – Haushalts-Management',
        short_name: 'Apollo 3000',
        description: 'Smartes Haushalts-Management für 2 Personen (Spülmaschine, Wäsche, Müll & Wochenplan)',
        theme_color: '#f7e6bb',
        background_color: '#f7e6bb',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon-maid.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
