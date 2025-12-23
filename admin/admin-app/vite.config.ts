import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'laya-shared': path.resolve(__dirname, '../../packages/shared/src')
    }
  },
  server: {
    allowedHosts: [
      'laya-server-m-env.eba-qw4gep8b.ap-south-1.elasticbeanstalk.com'
    ]
  }
})