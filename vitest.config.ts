import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    pool: 'vmThreads',
    setupFiles: ['./vitest.setup.ts'],
    include: [
      '__tests__/unit/**/*.test.ts',
      '__tests__/unit/**/*.test.tsx',
      '__tests__/api/**/*.test.ts',
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
    ],
    // API tests use @vitest-environment node comment at file level
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
