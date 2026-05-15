import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

// W0 spike — Vite + React 19 + TanStack Router file-based routing
// 注意：本檔在 nginx 反代下跑（host: 0.0.0.0:5173 → nginx:80 → http://localhost:8080），
// AR9 同網域反代約束：禁直連 5173，前端開發須走 http://localhost:8080。
// HMR via nginx /ws location。
export default defineConfig({
  plugins: [
    TanStackRouterVite({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      // 透過 nginx 反代 /ws
      protocol: 'ws',
      host: 'localhost',
      port: 8080,
      path: '/ws',
    },
    watch: {
      // Windows + Docker volume：偶爾需要 polling 才能 HMR
      usePolling: false,
    },
  },
})
