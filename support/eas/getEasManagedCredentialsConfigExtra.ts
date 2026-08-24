import { ExpoConfig } from "@expo/config-types";
import { getNseTargetName, getCeTargetName } from "../iosConstants";
import { WebEngagePluginProps } from "../../types/types";

export default function getEasManagedCredentialsConfigExtra(
  config: ExpoConfig,
  props?: WebEngagePluginProps
): { [k: string]: any } {
  const nseTargetName = getNseTargetName(props?.iosNSETargetName);
  const ceTargetName = getCeTargetName(props?.iosCETargetName);
  const appGroupName = props?.appGroupName ?? `group.${config?.ios?.bundleIdentifier}.WEGNotificationGroup`;

  const appExtensions: any[] = [
    ...(config.extra?.eas?.build?.experimental?.ios?.appExtensions ?? []),
  ];

  // Add NSE extension entry (unless disabled)
  if (!props?.disableNSE) {
    appExtensions.push({
      targetName: nseTargetName,
      bundleIdentifier: `${config?.ios?.bundleIdentifier}.${nseTargetName}`,
      entitlements: {
        "com.apple.security.application-groups": [appGroupName],
      },
    });
  }

  // Add CE extension entry
  appExtensions.push({
    targetName: ceTargetName,
    bundleIdentifier: `${config?.ios?.bundleIdentifier}.${ceTargetName}`,
    entitlements: {
      "com.apple.security.application-groups": [appGroupName],
    },
  });

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
            appExtensions,
          },
        },
      },
    },
  };
}
