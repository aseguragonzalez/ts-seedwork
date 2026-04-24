export default {
  // Keep tests in TypeScript but transpile with a fast transformer (@swc/jest).
  // Full type-checking is handled separately via the `type:check` script.
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@seedwork/(.*)$': '<rootDir>/src/$1',
    '^@seedwork$': '<rootDir>/src/index',
  },
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: false,
            decorators: false,
          },
          target: 'es2022',
        },
        module: {
          type: 'commonjs',
        },
      },
    ],
  },
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).ts'],
};
