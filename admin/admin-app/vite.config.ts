import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'laya-server-m-env.eba-qw4gep8b.ap-south-1.elasticbeanstalk.com'
    ]
  }
})