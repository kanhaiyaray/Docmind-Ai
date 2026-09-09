import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
      timeout: 60000,
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        // ✅ Changed manualChunks to a function
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Group React and React Router into 'vendor'
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router-dom')
            ) {
              return 'vendor'
            }
            // Group UI libraries into 'ui'
            if (
              id.includes('lucide-react') ||
              id.includes('react-markdown')
            ) {
              return 'ui'
            }
            // Everything else from node_modules goes to 'vendor'
            return 'vendor'
          }
        },
      },
    },
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
  },
  esbuild: {
    jsx: 'automatic',
  },
})