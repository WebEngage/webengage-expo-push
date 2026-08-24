/**
 * WebEngagePluginProps refer to the properties set by the user in their app config file (e.g: app.json)
 */
export type WebEngagePluginProps = {
  /**
   * (optional) APNs environment entitlement for the NSE target. "development" or "production".
   * Defaults to "development". Note: This only affects local builds — production signing
   * automatically overrides this to "production" during App Store submission.
   */
  mode?: Mode;

  /**
   * (optional) Used to configure Apple Team ID. You can find your Apple Team ID by running expo credentials:manager e.g: "91SW8A37CR"
   */
  devTeam?: string;

  /**
   * (optional) Target IPHONEOS_DEPLOYMENT_TARGET value to be used when adding the iOS NSE. A deployment target is nothing more than
   * the minimum version of the operating system the application can run on. This value should match the value in your Podfile e.g: "12.0".
   */
  iPhoneDeploymentTarget?: string;

  /**
   * (optional) The local path to a custom Notification Service Extension (NSE) Swift file.
   * Use this when another plugin already creates a NotificationService target and you need
   * to provide a merged implementation that handles both WebEngage and other push providers.
   *
   * Example merged file:
   * ```swift
   * import UserNotifications
   * import WEServiceExtension
   *
   * class NotificationService: UNNotificationServiceExtension {
   *     let wegService = WEXPushNotificationService()
   *
   *     override func didReceive(_ request: UNNotificationRequest,
   *                              withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
   *         if let payload = request.content.userInfo as? [String: Any],
   *            payload["source"] as? String == "webengage" {
   *             wegService.didReceive(request, withContentHandler: contentHandler)
   *         } else {
   *             // Other provider's code or default handling
   *             contentHandler(request.content)
   *         }
   *     }
   * }
   * ```
   */
  iosNSEFilePath?: string;
  iosCEFilePath?: string;

  /**
   * (optional) Custom name for the Notification Service Extension target.
   * Defaults to "NotificationService" if not provided.
   * This will be used as the target name, folder name, and source file name in the Xcode project.
   */
  iosNSETargetName?: string;

  /**
   * (optional) Custom name for the Content Extension (NotificationViewController) target.
   * Defaults to "NotificationViewController" if not provided.
   * This will be used as the target name, folder name, and source file name in the Xcode project.
   */
  iosCETargetName?: string;

  /**
   * (optional) Set to true if another plugin already creates the Notification Service Extension target.
   * When true, the plugin will:
   *   - Skip creating the NSE target and its support files (entitlements, plist)
   *   - Skip adding the NSE target to the Xcode project
   *   - Only add the WEServiceExtension pod to the existing target in the Podfile
   *
   * Use this together with `iosNSEFilePath` to provide a merged Swift file that handles
   * both WebEngage and the other provider's push notifications.
   * If `iosNSETargetName` is provided, it will be used for the Podfile target name;
   * otherwise defaults to "NotificationService".
   */
  iosNSEExistingTarget?: boolean;

  /**
   * (optional) Set to true to completely skip NSE (Notification Service Extension) creation.
   * When true, the plugin will not create, modify, or inject anything related to the
   * Notification Service Extension — no target, no files, no Podfile entry.
   * Useful if you don't need rich push notifications or want to handle NSE entirely yourself.
   */
  disableNSE?: boolean;

  /**
   * (optional) Custom iOS App Group name.
   * Defaults to "group.{ios.bundleIdentifier}.WEGNotificationGroup" if omitted.
   * Example: "group.com.example.myapp.WEGNotificationGroup"
   */
  appGroupName?: string;

  /**
   * (optional) Use Swift Package Manager instead of CocoaPods for WEServiceExtension and WEContentExtension.
   * When true, adds SPM packages directly to the NSE and CE Xcode targets instead of Podfile entries.
   * Defaults to false (CocoaPods).
   */
  useSPM?: boolean;

  /**
   * (optional) WebEngage license code. Not required for the push plugin.
   */
  licenseCode?: string;
};

export const WEBENGAGE_PLUGIN_PROPS: string[] = [
  "iPhoneDeploymentTarget",
  "iosNSEFilePath",
  "iosCEFilePath",
  "iosNSETargetName",
  "iosCETargetName",
  "iosNSEExistingTarget",
  "disableNSE",
  "appGroupName",
  "useSPM",
  "licenseCode",
  "devTeam",
  "mode",
];

export enum Mode {
  Dev = "development",
  Prod = "production",
}
