import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const apiTarget = process.env.VITE_API_TARGET || 'http://localhost:5056';
  return {
    plugins: [react()],
    server: { proxy: { '/api': apiTarget } }
  };
});
