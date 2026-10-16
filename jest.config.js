// Fuso fixo: agrupamentos por dia nos testes não dependem da máquina/CI.
process.env.TZ = 'America/Sao_Paulo';

module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: ['src/domain/**/*.ts', 'src/core/**/*.ts', '!**/*.d.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|expo-.*|react-navigation|@react-navigation/.*|@tanstack/.*|zustand|drizzle-orm)',
  ],
};
