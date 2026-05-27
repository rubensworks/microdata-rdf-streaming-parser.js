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
      'array-callback-return': 'off',
      'import/extensions': 'off',
      'no-implicit-coercion': 'off',
      'style/arrow-parens': 'off',
      'style/lines-between-class-members': 'off',
      'style/no-mixed-operators': 'off',
      'ts/naming-convention': 'off',
      'ts/no-unsafe-argument': 'off',
      'ts/prefer-nullish-coalescing': 'off',
      'unicorn/no-useless-spread': 'off',
    },
  },
  {
    files: [ 'perf/**/*.ts' ],
    rules: {
      'import/no-nodejs-modules': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/prefer-node-protocol': 'off',
    },
  },
  {
    files: [ 'test/**/*.ts' ],
    rules: {
      'antfu/consistent-list-newline': 'off',
      'import/no-nodejs-modules': 'off',
      'jest/prefer-expect-resolves': 'off',
      'jest/prefer-to-be': 'off',
      'unicorn/prefer-node-protocol': 'off',
    },
  },
]);
