const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Default to jsdom for component tests
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Co-located tests: look for .test.ts files next to source files
  testMatch: [
    '**/*.test.[jt]s?(x)',
  ],
  // Use node environment for API route tests
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  // Coverage configuration
  collectCoverageFrom: [
    'lib/**/*.{js,ts}',
    'app/api/**/*.{js,ts}',
    '!**/*.d.ts',
    '!**/*.test.{js,ts}',
  ],
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  coverageDirectory: 'coverage',
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
