import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.godroll.app",
  appName: "God-Roll",
  webDir: "dist",
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
    allowsLinkPreview: false,
  },
  server: {
    // For development - allows loading from dev server
    // Remove or comment out for production builds
    // url: 'http://localhost:4200',
    cleartext: true,
  },
  plugins: {
    CapacitorHttp: {
      // Enable native HTTP handling to bypass WKWebView CORS restrictions
      enabled: true,
    },
  },
};

export default config;
