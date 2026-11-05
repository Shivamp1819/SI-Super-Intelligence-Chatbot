import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router-dom/')
          ) {
            return 'vendor-react';
          }
          if (
            id.includes('node_modules/@mui/') ||
            id.includes('node_modules/@emotion/')
          ) {
            return 'vendor-mui';
          }
          if (id.includes('node_modules/react-syntax-highlighter/')) {
            return 'vendor-syntax';
          }
          if (id.includes('node_modules/jspdf/')) {
            return 'vendor-pdf';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
})

