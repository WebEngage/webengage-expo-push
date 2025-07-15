import { ExpoConfig } from "@expo/config-types";
import { CE_TARGET_NAME, NSE_TARGET_NAME } from "../iosConstants";

export default function getEasManagedCredentialsConfigExtra(
  config: ExpoConfig
): { [k: string]: any } {
  return {
    ...config.extra,
    eas: {
      ...config.extra?.eas,
      build: {
        ...config.extra?.eas?.build,
        experimental: {
          ...config.extra?.eas?.build?.experimental,
          ios: {
            ...config.extra?.eas?.build?.experimental?.ios,
            appExtensions: [
              ...(config.extra?.eas?.build?.experimental?.ios?.appExtensions ??
                []),
              {
                // keep in sync with native changes in NSE
                targetName: NSE_TARGET_NAME,
                bundleIdentifier: `${config?.ios?.bundleIdentifier}.${NSE_TARGET_NAME}`,
                entitlements: {
                  "com.apple.security.application-groups": [
                    `group.${config?.ios?.bundleIdentifier}.WEGNotificationGroup`,
                  ],
                },
              },
              {
                // keep in sync with native changes in CE
                targetName: CE_TARGET_NAME,
                bundleIdentifier: `${config?.ios?.bundleIdentifier}.${CE_TARGET_NAME}`,
                entitlements: {
                  "com.apple.security.application-groups": [
                    `group.${config?.ios?.bundleIdentifier}.WEGNotificationGroup`,
                  ],
                },
              },
            ],
          },
        },
      },
    },
  };
}
