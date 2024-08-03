const antfu = require('@antfu/eslint-config').default

module.exports = antfu({
  rules: {
    '@typescript-eslint/no-empty-object-type': 0,
    'unused-imports/no-unused-vars': 0,
  },
})
