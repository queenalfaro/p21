import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // listen on 0.0.0.0 so the host browser can reach the dev server
    // running inside the dev container.
    host: true,
    port: 5173,
    strictPort: true,
  },
});
