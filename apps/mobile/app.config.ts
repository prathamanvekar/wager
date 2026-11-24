import type { ExpoConfig, ConfigContext } from "expo/config";
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Wager",
  slug: "wager-mobile",
  plugins: (config.plugins || []).map((plugin) =>
    Array.isArray(plugin) && plugin[0] === "expo-build-properties"
      ? [
          "expo-build-properties",
          {
            android: {
              usesCleartextTraffic:
                process.env.EAS_BUILD_PROFILE !== "production",
            },
          },
        ]
      : plugin,
  ),
});
