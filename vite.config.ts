import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 키오스크 단독 실행을 위해 상대경로(base: './') 빌드.
export default defineConfig({
  base: './',
  plugins: [react()],
})
