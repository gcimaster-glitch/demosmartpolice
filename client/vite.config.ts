import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',  // 外部アクセス可能に
    allowedHosts: [
      '5173-i7zs4em7vwxc0cn6ht6gq-2e77fc33.sandbox.novita.ai',
      '.sandbox.novita.ai',  // すべてのsandboxホストを許可
      'localhost'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  base: './', 
})