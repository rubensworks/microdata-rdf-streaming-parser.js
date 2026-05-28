const config = require('@rubensworks/eslint-config');

module.exports = config([
  {
    ignores: [
      '**/*.js',
      '**/*.d.ts',
      '**/*.js.map',
      '**/*.json',
      '**/*.md',
      'coverage/**',
      'node_modules/**',
    ],
  },
  {
    files: [ '**/*.ts' ],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: [ './tsconfig.eslint.json' ],
      },
    },
  },
  {
    rules: {
      'no-implicit-coercion': 'off',
    },
  },
  {
    files: [ 'perf/**/*.ts' ],
    rules: {
      'unicorn/filename-case': 'off',
    },
  },
]);
