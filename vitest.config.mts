import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'int',
          environment: 'node',
          include: ['tests/int/**/*.int.spec.ts'],
          setupFiles: ['./vitest.setup.ts'],
          fileParallelism: false,
          testTimeout: 60_000,
          hookTimeout: 120_000,
          env: {
            DATABASE_URI: 'postgresql://claveria:claveria@127.0.0.1:5433/claveria_test',
            PAYLOAD_SECRET: 'test-secret',
            MEDIA_DIR: './.pg/test-media',
          },
        },
      },
    ],
  },
})
