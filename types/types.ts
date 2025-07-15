/**
 * WebEngagePluginProps refer to the properties set by the user in their app config file (e.g: app.json)
 */
export type WebEngagePluginProps = {
  /**
   * (required) Used to configure APNs environment entitlement. "development" or "production"
   */
  mode: Mode;

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
   * (optional) The local path to a custom Notification Service Extension (NSE), written in Objective-C. The NSE will typically start as a copy
   * of the default NSE found at (support/serviceExtensionFiles/NotificationService.m, then altered to support any custom
   * logic required.
   */
  iosNSEFilePath?: string;
  iosCEFilePath?: string;

  licenseCode: string;
};

export const WEBENGAGE_PLUGIN_PROPS: string[] = [
  "mode",
  "iPhoneDeploymentTarget",
  "iosNSEFilePath",
  "licenseCode",
];

export enum Mode {
  Dev = "development",
  Prod = "production",
}
