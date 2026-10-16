const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'src/infra/database/migrations/*'],
  },
  {
    // Regra da clean architecture: o domínio não conhece infraestrutura nem UI.
    files: ['src/domain/**/*.ts', 'src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/infra/*', '@/presentation/*', '@/app/*', '@/di/*'], message: 'O domínio não pode depender de camadas externas.' },
            { group: ['react', 'react-native', 'expo-*', 'expo'], message: 'O domínio deve ser TypeScript puro.' },
          ],
        },
      ],
    },
  },
]);
