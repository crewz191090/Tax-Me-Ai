import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.taxmeai.app",
  appName: "Tax Me AI",
  // No local web assets are bundled — this points the native WebView
  // straight at the deployed Next.js app on Cloudflare Workers, so all
  // server-rendered pages, API routes, sessions, and cookies work exactly
  // like they do in a mobile browser tab. Swap this to your own custom
  // domain once you have one.
  webDir: "public",
  server: {
    url: "https://tax-me-ai.pelaporan-manpower-fms.workers.dev",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
