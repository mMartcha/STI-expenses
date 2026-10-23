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
  {
    // Telas usam os componentes pelo barrel e nunca texto cru: fonte e cor vêm do AppText/TextField.
    files: ['src/app/**/*.tsx', 'src/presentation/screens/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/presentation/components/*'], message: "Importe de '@/presentation/components' (barrel)." },
          ],
          paths: [
            { name: 'react-native', importNames: ['Text', 'TextInput'], message: 'Use AppText / TextField de @/presentation/components.' },
          ],
        },
      ],
    },
  },
]);
