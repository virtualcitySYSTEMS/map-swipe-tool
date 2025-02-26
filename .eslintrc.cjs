module.exports = {
  root: true,
  extends: ['@vcsuite/eslint-config/vue-ts'],
  env: {
    node: true,
  },
  rules: {
    'no-restricted-syntax': 'off',
    curly: 'error',
    'vue/no-v-model-argument': 'off',
  },
  overrides: [
    {
      files: ['*.ts', '*.vue'],
      parserOptions: {
        project: ['./tsconfig.json', './tests/tsconfig.json'],
      },
      rules: {
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
  ],
  ignorePatterns: ['dist/', 'node_modules/'],
};
