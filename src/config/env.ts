import Constants from 'expo-constants';
import { z } from 'zod';

/**
 * Configuração validada na inicialização. Variáveis EXPO_PUBLIC_* são embutidas no
 * bundle: servem para URLs e flags, nunca para segredos.
 */
const envSchema = z.object({
  appEnv: z.enum(['development', 'homolog', 'production']),
  apiUrl: z.url().refine((url) => url.startsWith('https://'), 'A API deve usar HTTPS'),
  useMocks: z.boolean(),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse({
  appEnv: Constants.expoConfig?.extra?.appEnv ?? 'development',
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://api.example.com',
  useMocks: (process.env.EXPO_PUBLIC_USE_MOCKS ?? 'true') !== 'false',
});
