module.exports = {
  root: true,
  extends: ['@vcsuite/eslint-config/vue'],
  env: {
    node: true,
  },
  rules: {
    'no-restricted-syntax': 'off',
    curly: 'error',
    'vue/no-v-model-argument': 'off',
  },
  ignorePatterns: ['dist/', 'node_modules/'],
};
