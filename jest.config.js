/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/'],
  collectCoverageFrom: [
    '<rootDir>/nodes/**/*.ts',
    '<rootDir>/credentials/**/*.ts',
    '!<rootDir>/nodes/**/index.ts'
  ],
  setupFilesAfterEnv: []
};
