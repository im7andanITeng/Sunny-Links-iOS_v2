import type { CapacitorConfig } from "@capacitor/cli";

/**
 * iOS/Android wrapper config. `bun run cap:sync` rebuilds the game into
 * cap-dist/ and copies it into the native project.
 */
const config: CapacitorConfig = {
  appId: "com.sunnylinks.minigolf",
  appName: "Sunny Links",
  webDir: "cap-dist",
  ios: {
    contentInset: "never",
    preferredContentMode: "mobile",
    scheme: "SunnyLinks",
  },
};

export default config;
