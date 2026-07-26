import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// GitHub Pages serves this app from https://<user>.github.io/NASCARTRACKER/,
// so assets must be requested with that path prefix in production builds.
const base = process.env.GITHUB_PAGES === 'true' ? '/NASCARTRACKER/' : '/';

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
