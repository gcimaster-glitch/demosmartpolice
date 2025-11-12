import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // サーバーのサブディレクトリに配置する場合でもパスがずれないようにbaseを設定
  base: './', 
})