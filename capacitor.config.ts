import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lsagenteia.treinojhow',
  appName: 'Treino Jhow',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      presentationOptions: ['badge', 'sound', 'banner', 'list'],
    },
  },
};

export default config;
