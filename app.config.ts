import type { ConfigContext, ExpoConfig } from 'expo/config';

type AppEnv = 'development' | 'homolog' | 'production';

const APP_ENV = (process.env.APP_ENV ?? 'development') as AppEnv;

const variants: Record<AppEnv, { name: string; idSuffix: string }> = {
  development: { name: 'Stara Despesas (Dev)', idSuffix: '.dev' },
  homolog: { name: 'Stara Despesas (HML)', idSuffix: '.hml' },
  production: { name: 'Stara Despesas', idSuffix: '' },
};

const variant = variants[APP_ENV] ?? variants.development;
// TODO: confirmar o identificador definitivo antes da primeira publicação nas lojas.
const BASE_ID = 'com.stara.ocrstara';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: variant.name,
  slug: 'ocr-stara',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'ocrstara',
  userInterfaceStyle: 'automatic',
  ios: {
    icon: './assets/expo.icon',
    bundleIdentifier: `${BASE_ID}${variant.idSuffix}`,
    supportsTablet: false,
    config: { usesNonExemptEncryption: false },
  },
  android: {
    package: `${BASE_ID}${variant.idSuffix}`,
    adaptiveIcon: {
      backgroundColor: '#FFF3EA',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    // Evita que o Auto Backup do Android copie banco e comprovantes para fora do aparelho.
    allowBackup: false,
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#E56425',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    'expo-sqlite',
    'expo-secure-store',
    'expo-localization',
    [
      'expo-image-picker',
      {
        cameraPermission: 'Permita o acesso à câmera para fotografar suas notas fiscais.',
        photosPermission: 'Permita o acesso às fotos para anexar notas fiscais já fotografadas.',
        microphonePermission: false,
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission: 'Permita o acesso à câmera para fotografar suas notas fiscais.',
        // Só tiramos fotos: sem microfone nem gravação de áudio.
        microphonePermission: false,
        recordAudioAndroid: false,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    appEnv: APP_ENV,
  },
});
