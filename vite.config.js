import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss(),], // Remove tailwindcss() from plugins
  server: {
    host: '0.0.0.0',        // Allow connections from any IP
    port: 5173,
    strictPort: true,        // Don't try other ports if 5173 is taken
    hmr: {
      clientPort: 443        // Use the HTTPS port for HMR
    },
    allowedHosts: [
      'localhost',
      '*.ngrok-free.app',    // Allow any ngrok-free.app subdomain
      '*.ngrok.io',          // For older ngrok domains
      '0c3f-203-211-105-190.ngrok-free.app' // Add your specific ngrok URL
    ],
    proxy: {
      '/firebase-storage': {
        target: 'https://firebasestorage.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/firebase-storage/, '')
      }
    }
  }
})