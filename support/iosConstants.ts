// ============================================================================
// iOS Constants for webengage-expo-push
// ============================================================================

// --- Deployment & Device ---
export const IPHONEOS_DEPLOYMENT_TARGET = "15.1";
export const TARGETED_DEVICE_FAMILY = `"1,2"`;
export const SWIFT_VERSION = "5.0";

// --- Default Target Names ---
export const DEFAULT_NSE_TARGET_NAME = "NotificationService";
export const DEFAULT_CE_TARGET_NAME = "NotificationViewController";

// --- Default Source File Names (templates) ---
export const DEFAULT_NSE_SOURCE_FILE = "NotificationService.swift";
export const DEFAULT_CE_SOURCE_FILE = "NotificationViewController.swift";

// --- Default Extension Files (templates) ---
export const DEFAULT_NSE_EXT_FILES = [
  "NotificationService.entitlements",
  "NotificationService-Info.plist",
];
export const DEFAULT_CE_EXT_FILES = [
  "NotificationViewController.entitlements",
  "NotificationViewController-Info.plist",
];

// --- Bundle Version Defaults ---
export const DEFAULT_BUNDLE_VERSION = "1";
export const DEFAULT_BUNDLE_SHORT_VERSION = "1.0";

// --- App Group ---
export const DEFAULT_APP_GROUP_SUFFIX = "WEGNotificationGroup";

export function getDefaultAppGroupName(bundleIdentifier: string): string {
  return `group.${bundleIdentifier}.${DEFAULT_APP_GROUP_SUFFIX}`;
}

// --- CocoaPods ---
export const NSE_POD_NAME = "WEServiceExtension";
export const CE_POD_NAME = "WEContentExtension";

export function getNsePodfileSnippet(nseTargetName: string = DEFAULT_NSE_TARGET_NAME): string {
  return `
target '${nseTargetName}' do
  pod '${NSE_POD_NAME}'
  use_frameworks! :linkage => podfile_properties['ios.useFrameworks'].to_sym if podfile_properties['ios.useFrameworks']
end`;
}

export function getCePodfileSnippet(ceTargetName: string = DEFAULT_CE_TARGET_NAME): string {
  return `
target '${ceTargetName}' do
  pod '${CE_POD_NAME}'
  use_frameworks! :linkage => podfile_properties['ios.useFrameworks'].to_sym if podfile_properties['ios.useFrameworks']
end`;
}

export function getNsePodfileRegex(nseTargetName: string = DEFAULT_NSE_TARGET_NAME): RegExp {
  return new RegExp(`target '${nseTargetName}'`);
}

// --- SPM (Swift Package Manager) ---
export const NSE_SPM_REPO_URL = "https://github.com/WebEngage/WEServiceExtension.git";
export const NSE_SPM_REPO_NAME = "WEServiceExtension";
export const NSE_SPM_PRODUCT_NAME = "WEServiceExtension";
export const NSE_SPM_BRANCH = "master";

export const CE_SPM_REPO_URL = "https://github.com/WebEngage/WEContentExtension.git";
export const CE_SPM_REPO_NAME = "WEContentExtension";
export const CE_SPM_PRODUCT_NAME = "WEContentExtension";
export const CE_SPM_BRANCH = "master";

// --- System Frameworks (Content Extension) ---
export const CE_SYSTEM_FRAMEWORKS = [
  "UserNotifications.framework",
  "UserNotificationsUI.framework",
];

// --- Template Regex Patterns ---
export const GROUP_IDENTIFIER_TEMPLATE_REGEX = /{{GROUP_IDENTIFIER}}/gm;
export const BUNDLE_SHORT_VERSION_TEMPLATE_REGEX = /{{BUNDLE_SHORT_VERSION}}/gm;
export const BUNDLE_VERSION_TEMPLATE_REGEX = /{{BUNDLE_VERSION}}/gm;

// --- APNs ---
export const DEFAULT_APS_ENVIRONMENT = "development";

// ============================================================================
// Helper Functions
// ============================================================================

// Backward-compatible aliases
export const NSE_TARGET_NAME = DEFAULT_NSE_TARGET_NAME;
export const NSE_SOURCE_FILE = DEFAULT_NSE_SOURCE_FILE;
export const NSE_EXT_FILES = DEFAULT_NSE_EXT_FILES;
export const CE_TARGET_NAME = DEFAULT_CE_TARGET_NAME;
export const CE_SOURCE_FILE = DEFAULT_CE_SOURCE_FILE;
export const CE_EXT_FILES = DEFAULT_CE_EXT_FILES;

export function getNseTargetName(customName?: string): string {
  return customName || DEFAULT_NSE_TARGET_NAME;
}

export function getCeTargetName(customName?: string): string {
  return customName || DEFAULT_CE_TARGET_NAME;
}

export function getNseSourceFile(customName?: string): string {
  const targetName = getNseTargetName(customName);
  return `${targetName}.swift`;
}

export function getCeSourceFile(customName?: string): string {
  const targetName = getCeTargetName(customName);
  return `${targetName}.swift`;
}

export function getNseExtFiles(customName?: string): string[] {
  const targetName = getNseTargetName(customName);
  return [
    `${targetName}.entitlements`,
    `${targetName}-Info.plist`,
  ];
}

export function getCeExtFiles(customName?: string): string[] {
  const targetName = getCeTargetName(customName);
  return [
    `${targetName}.entitlements`,
    `${targetName}-Info.plist`,
  ];
}
