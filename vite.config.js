import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/RailsTrack-web/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.js',
    deps: {
      inline: ['@testing-library/jest-dom'],
    },
  },
})
