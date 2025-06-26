/** @type {import('jest').Config} */
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // ---------------------------
  // Збір і звітність покриття
  // ---------------------------
  collectCoverage: true,
  collectCoverageFrom: [
    'utils/**/*.js',
    'core/**/*.js',
    'middleware/**/*.js',
    'routes/**/*.js',
    'layers/controllers/**/*.js',
    'layers/models/**/*.js',
    'layers/filters/**/*.js',
    'layers/format/**/*.js',
    'layers/serialize/**/*.js',
    'layers/validate/**/*.js'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/utils/__mocks__/',
    '/__tests__/'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'text', 'lcov'],

  // ---------------------------
  // Репортери (HTML з динамічним timestamp)
  // ---------------------------
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: 'reports/html',
      filename: `report-${timestamp}.html`,
      expand: true
    }]
  ],

  // ---------------------------
  // Де шукати вихідники та тести
  // ---------------------------
  roots: [
    '<rootDir>/core',
    '<rootDir>/utils',
    '<rootDir>/middleware',
    '<rootDir>/routes',
    '<rootDir>/layers/controllers',
    '<rootDir>/layers/models',
    '<rootDir>/layers/filters',
    '<rootDir>/layers/format',
    '<rootDir>/layers/serialize',
    '<rootDir>/layers/validate'
  ],

  // ---------------------------
  // Alias-и для імпортів
  // ---------------------------
  moduleNameMapper: {
    '^@core/(.*)$':        '<rootDir>/core/$1.js',
    '^@controllers/(.*)$': '<rootDir>/layers/controllers/$1.js',
    '^@middleware/(.*)$':  '<rootDir>/middleware/$1.js',
    '^@models/(.*)$':      '<rootDir>/layers/models/$1.js',
    '^@filters/(.*)$':     '<rootDir>/layers/filters/$1.js',
    '^@format/(.*)$':      '<rootDir>/layers/format/$1.js',
    '^@serialize/(.*)$':   '<rootDir>/layers/serialize/$1.js',
    '^@filter/(.*)$': '<rootDir>/layers/filters/$1.js',
    '^@validate/(.*)$':    '<rootDir>/layers/validate/$1.js',
    '^@utils/(.*)$':       '<rootDir>/utils/$1.js'
  },

  // ---------------------------
  // Які файли вважати тестами
  // ---------------------------
  testMatch: [
    '**/__tests__/**/*.+(js|ts)',
    '**/?(*.)+(spec|test).+(js|ts)'
  ],

  // ---------------------------
  // Трансформ через ts-jest для TS/TSX, ігноруємо JS
  // ---------------------------
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  transformIgnorePatterns: [
    '/node_modules/',
    '\\.(js)$'
  ],

  // ---------------------------
  // Налаштування ts-jest
  // ---------------------------
  globals: {
    'ts-jest': {
      tsconfig: {
        allowJs: true,
        esModuleInterop: true
      }
    }
  },

  moduleFileExtensions: ['ts', 'js', 'json', 'node']
};
