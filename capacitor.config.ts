import type { CapacitorConfig } from '@capacitor/cli';

const liveServerUrl = process.env.CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: 'com.kinospolu.app',
  appName: 'PopcornLobby',
  webDir: 'dist',
  server: liveServerUrl
    ? {
        url: liveServerUrl,
        cleartext: liveServerUrl.startsWith('http://')
      }
    : {
        androidScheme: 'https'
      }
};

export default config;
