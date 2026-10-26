import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          reactVendor: ['react', 'react-dom', 'react-router-dom'],
          firebaseVendor: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          leafletVendor: ['leaflet'],
        },
      },
    },
  },
});
