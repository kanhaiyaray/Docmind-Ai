import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          const normalized = id.replace(/\\/g, '/');
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(normalized)) {
            return 'vendor';
          }
          if (/node_modules\/(lucide-react|react-markdown|react-hot-toast|remark-|rehype-|micromark|mdast-|hast-|unist-|vfile|bail|trough|unified|devlop|property-information|space-separated-tokens|comma-separated-tokens|decode-named-character-reference|character-entities|is-plain-obj|ccount|longest-streak|zwitch|goober|style-to-)\//.test(normalized)) {
            return 'ui';
          }
          return 'vendor';
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
});
