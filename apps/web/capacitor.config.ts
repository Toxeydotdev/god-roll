import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.godroll.app',
  appName: 'God Roll',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    allowsLinkPreview: false,
  },
  server: {
    // For development - allows loading from dev server
    // Remove or comment out for production builds
    // url: 'http://localhost:4200',
    cleartext: true,
  },
};

export default config;
