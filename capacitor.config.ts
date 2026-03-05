import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kinospolu.app',
  appName: 'KinoSpolu',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
