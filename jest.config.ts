import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest/presets/default-esm',

  testEnvironment: 'node',

  setupFiles: ['<rootDir>/src/tests/setup.env.ts'],

  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],

  extensionsToTreatAsEsm: ['.ts'],

  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true
      }
    ]
  },

  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },

  testTimeout: 30000,

  detectOpenHandles: true,

  forceExit: true
}

export default config