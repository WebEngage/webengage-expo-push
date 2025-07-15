export const IPHONEOS_DEPLOYMENT_TARGET = "15.1";
export const TARGETED_DEVICE_FAMILY = `"1,2"`;

export const NSE_PODFILE_SNIPPET = `
target 'NotificationService' do
  pod 'WEServiceExtension'
  use_frameworks! :linkage => podfile_properties['ios.useFrameworks'].to_sym if podfile_properties['ios.useFrameworks']
end`;

export const CE_PODFILE_SNIPPET = `
target 'NotificationViewController' do
  pod 'WEContentExtension'
  use_frameworks! :linkage => podfile_properties['ios.useFrameworks'].to_sym if podfile_properties['ios.useFrameworks']
end`;

export const NSE_PODFILE_REGEX = /target 'NotificationService'/;

export const GROUP_IDENTIFIER_TEMPLATE_REGEX = /{{GROUP_IDENTIFIER}}/gm;
export const BUNDLE_SHORT_VERSION_TEMPLATE_REGEX = /{{BUNDLE_SHORT_VERSION}}/gm;
export const BUNDLE_VERSION_TEMPLATE_REGEX = /{{BUNDLE_VERSION}}/gm;

export const DEFAULT_BUNDLE_VERSION = "1";
export const DEFAULT_BUNDLE_SHORT_VERSION = "1.0";

export const NSE_TARGET_NAME = "NotificationService";
export const NSE_SOURCE_FILE = "NotificationService.swift";
export const NSE_EXT_FILES = [
  `${NSE_TARGET_NAME}.entitlements`,
  `${NSE_TARGET_NAME}-Info.plist`,
];

export const CE_TARGET_NAME = "NotificationViewController";
export const CE_SOURCE_FILE = "NotificationViewController.swift";
export const CE_EXT_FILES = [
  `NotificationViewController.entitlements`,
  `NotificationViewController-Info.plist`,
];
