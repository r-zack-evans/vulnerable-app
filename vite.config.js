import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  root: 'src/client',
  build: {
    // Output directly to dist/public
    outDir: '../../dist/public',
    emptyOutDir: false, // Don't empty the dist folder
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/client/index.html')
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/client')
    }
  }
})