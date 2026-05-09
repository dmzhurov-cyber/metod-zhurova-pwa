import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/** Корень приложения на хостинге: `/` (Git Netlify) или `/pwa-appfinal/` (Netlify Drop из for-netlify-drop). */
function appBase(command: string) {
  if (command !== 'build') return '/'
  const raw = (process.env.VITE_BASE ?? '/pwa-appfinal/').trim()
  const withSlash = raw.endsWith('/') ? raw : `${raw}/`
  return withSlash === '//' ? '/' : withSlash
}

export default defineConfig(({ command }) => {
  const base = appBase(command)
  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt', // 'prompt' вместо 'autoUpdate' — чтобы показывать баннер обновления
        includeAssets: ['favicon.svg'],
        manifest: {
          name: 'Метод Журова',
          short_name: 'Метод Журова',
          description: '30-дневный курс. Метод Журова — управление через расслабление.',
          theme_color: '#0a0f14',
          background_color: '#0a0f14',
          display: 'standalone',
          orientation: 'portrait',
          lang: 'ru',
          scope: base,
          start_url: base,
          icons: [
            {
              src: 'favicon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,svg,png,woff2}'],
          // РФ / нестабильная доставка: не отдавать из SW полустаб документ или обрыв —
          // сначала сеть, кэш как запасной вариант (меньше «Failed to fetch» в консоли).
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'pages-network-first',
                networkTimeoutSeconds: 25,
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: ({ request }) => request.destination === 'font',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'fonts-network-first',
                networkTimeoutSeconds: 25,
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
    ],
  }
})
