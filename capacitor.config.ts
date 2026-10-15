import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.niflheim.app',
  appName: 'NIFLHEIM',
  webDir: '.vercel/output/static',
  server: {
    url: 'https://niflheimapk-amber.vercel.app',
    cleartext: true,
    androidScheme: 'https',
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_name',
      iconColor: '#FFD600',
      sound: 'beep.wav',
    },
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#0B0B0B',
  },
};

export default config;
