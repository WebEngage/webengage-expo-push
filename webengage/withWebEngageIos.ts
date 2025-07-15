import {
  ConfigPlugin,
  withDangerousMod,
  withXcodeProject,
} from "@expo/config-plugins";
import * as fs from "fs";
import * as path from "path";
import CeUpdaterManager from "../support/ceUpdaterManager";
import { FileManager } from "../support/FileManager";
import {
  CE_EXT_FILES,
  CE_SOURCE_FILE,
  CE_TARGET_NAME,
  DEFAULT_BUNDLE_SHORT_VERSION,
  DEFAULT_BUNDLE_VERSION,
  IPHONEOS_DEPLOYMENT_TARGET,
  NSE_EXT_FILES,
  NSE_SOURCE_FILE,
  NSE_TARGET_NAME,
  TARGETED_DEVICE_FAMILY,
} from "../support/iosConstants";
import NseUpdaterManager from "../support/NseUpdaterManager";
import { updatePodfile } from "../support/updatePodfile";
import { WebEngageLog } from "../support/WebEngageLog";
import { WebEngagePluginProps } from "../types/types";

import { ExpoConfig } from "@expo/config-types";
import getEasManagedCredentialsConfigExtra from "../support/eas/getEasManagedCredentialsConfigExtra";

const withEasManagedCredentials: ConfigPlugin<WebEngagePluginProps> = (
  config
) => {
  // assert(
  //   config.ios?.bundleIdentifier,
  //   "Missing 'ios.bundleIdentifier' in app config."
  // );
  config.extra = getEasManagedCredentialsConfigExtra(config as ExpoConfig);
  return config;
};

const withWebEngagePodfile: ConfigPlugin<WebEngagePluginProps> = (config) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      // not awaiting in order to not block main thread
      const iosRoot = path.join(config.modRequest.projectRoot, "ios");
      updatePodfile(iosRoot).catch((err) => {
        WebEngageLog.error(err);
      });

      return config;
    },
  ]);
};

const withWebEngageNSE: ConfigPlugin<WebEngagePluginProps> = (
  config,
  props
) => {
  let isSwiftProject = true;

  var pluginDir = path.resolve(
    __dirname,
    "../support/serviceExtensionFiles/serviceExtensionFiles-swift"
  );
  var sourceDir = path.join(pluginDir, "/");

  if (isSwiftProject) {
    var pluginDir = path.resolve(
      __dirname,
      "../support/serviceExtensionFiles/serviceExtensionFiles-swift"
    );
    var sourceDir = path.join(pluginDir, "/");
  }

  var pluginDirCE = path.resolve(
    __dirname,
    "../support/contentExtensionFiles/contentExtensionFiles-swift"
  );
  var sourceDirCE = path.join(pluginDir, "/");

  if (isSwiftProject) {
    var pluginDirCE = path.resolve(
      __dirname,
      "../support/contentExtensionFiles/contentExtensionFiles-swift"
    );
    var sourceDirCE = path.join(pluginDirCE, "/");
  }

  //add conditon here

  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const iosPath = path.join(config.modRequest.projectRoot, "ios");

      /* COPY OVER EXTENSION FILES */
      fs.mkdirSync(`${iosPath}/${NSE_TARGET_NAME}`, { recursive: true });
      for (let i = 0; i < NSE_EXT_FILES.length; i++) {
        const extFile = NSE_EXT_FILES[i];
        const targetFile = `${iosPath}/${NSE_TARGET_NAME}/${extFile}`;
        await FileManager.copyFile(`${sourceDir}${extFile}`, targetFile);
      }

      fs.mkdirSync(`${iosPath}/${CE_TARGET_NAME}`, { recursive: true });
      await FileManager.copyDirectory(
        sourceDirCE,
        `${iosPath}/${CE_TARGET_NAME}`
      );

      // Copy NSE source file either from configuration-provided location, falling back to the default one.
      const sourcePath =
        props.iosNSEFilePath ?? `${sourceDir}${NSE_SOURCE_FILE}`;
      const targetFile = `${iosPath}/${NSE_TARGET_NAME}/${NSE_SOURCE_FILE}`;
      await FileManager.copyFile(`${sourcePath}`, targetFile);

      // Copy CE source file either from configuration-provided location, falling back to the default one.
      const sourcePathCE =
        props.iosCEFilePath ?? `${sourceDirCE}${CE_SOURCE_FILE}`;
      const targetFileCE = `${iosPath}/${CE_TARGET_NAME}/${CE_SOURCE_FILE}`;
      await FileManager.copyFile(`${sourcePathCE}`, targetFileCE);

      /* MODIFY COPIED EXTENSION FILES */
      const nseUpdater = new NseUpdaterManager(iosPath);
      await nseUpdater.updateNSEEntitlements(
        `group.${config.ios?.bundleIdentifier}.WEGNotificationGroup`
      );
      await nseUpdater.updateNSEBundleVersion(
        config.ios?.buildNumber ?? DEFAULT_BUNDLE_VERSION
      );
      await nseUpdater.updateNSEBundleShortVersion(
        config?.version ?? DEFAULT_BUNDLE_SHORT_VERSION
      );

      /* MODIFY COPIED CE EXTENSION FILES */
      const ceUpdater = new CeUpdaterManager(iosPath);
      await ceUpdater.updateNSEEntitlements(
        `group.${config.ios?.bundleIdentifier}.WEGNotificationGroup`
      );
      await ceUpdater.updateNSEBundleVersion(
        config.ios?.buildNumber ?? DEFAULT_BUNDLE_VERSION
      );
      await ceUpdater.updateNSEBundleShortVersion(
        config?.version ?? DEFAULT_BUNDLE_SHORT_VERSION
      );

      return config;
    },
  ]);
};

const withWebEngageXcodeProject: ConfigPlugin<WebEngagePluginProps> = (
  config,
  props
) => {
  return withXcodeProject(config, (newConfig) => {
    const xcodeProject = newConfig.modResults;

    if (!!xcodeProject.pbxTargetByName(NSE_TARGET_NAME)) {
      WebEngageLog.log(
        `${NSE_TARGET_NAME} already exists in project. Skipping...`
      );
      return newConfig;
    }

    // Create new PBXGroup for the extension
    const extGroup = xcodeProject.addPbxGroup(
      [...NSE_EXT_FILES, NSE_SOURCE_FILE],
      NSE_TARGET_NAME,
      NSE_TARGET_NAME
    );

    // Add the new PBXGroup to the top level group. This makes the
    // files / folder appear in the file explorer in Xcode.
    const groups = xcodeProject.hash.project.objects["PBXGroup"];
    Object.keys(groups).forEach(function (key) {
      if (
        typeof groups[key] === "object" &&
        groups[key].name === undefined &&
        groups[key].path === undefined
      ) {
        xcodeProject.addToPbxGroup(extGroup.uuid, key);
      }
    });

    // WORK AROUND for codeProject.addTarget BUG
    // Xcode projects don't contain these if there is only one target
    // An upstream fix should be made to the code referenced in this link:
    //   - https://github.com/apache/cordova-node-xcode/blob/8b98cabc5978359db88dc9ff2d4c015cba40f150/lib/pbxProject.js#L860
    const projObjects = xcodeProject.hash.project.objects;
    projObjects["PBXTargetDependency"] =
      projObjects["PBXTargetDependency"] || {};
    projObjects["PBXContainerItemProxy"] =
      projObjects["PBXTargetDependency"] || {};

    // Add the NSE target
    // This adds PBXTargetDependency and PBXContainerItemProxy for you
    const nseTarget = xcodeProject.addTarget(
      NSE_TARGET_NAME,
      "app_extension",
      NSE_TARGET_NAME,
      `${config.ios?.bundleIdentifier}.${NSE_TARGET_NAME}`
    );

    // Add build phases to the new target
    xcodeProject.addBuildPhase(
      ["NotificationService.swift"],
      "PBXSourcesBuildPhase",
      "Sources",
      nseTarget.uuid
    );
    xcodeProject.addBuildPhase(
      [],
      "PBXResourcesBuildPhase",
      "Resources",
      nseTarget.uuid
    );

    xcodeProject.addBuildPhase(
      [],
      "PBXFrameworksBuildPhase",
      "Frameworks",
      nseTarget.uuid
    );

    // Edit the Deployment info of the new Target, only IphoneOS and Targeted Device Family
    // However, can be more
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      if (
        typeof configurations[key].buildSettings !== "undefined" &&
        configurations[key].buildSettings.PRODUCT_NAME == `"${NSE_TARGET_NAME}"`
      ) {
        const buildSettingsObj = configurations[key].buildSettings;
        buildSettingsObj.DEVELOPMENT_TEAM = props?.devTeam;
        buildSettingsObj.IPHONEOS_DEPLOYMENT_TARGET =
          props?.iPhoneDeploymentTarget ?? IPHONEOS_DEPLOYMENT_TARGET;
        buildSettingsObj.TARGETED_DEVICE_FAMILY = TARGETED_DEVICE_FAMILY;
        buildSettingsObj.CODE_SIGN_ENTITLEMENTS = `${NSE_TARGET_NAME}/${NSE_TARGET_NAME}.entitlements`;
        buildSettingsObj.CODE_SIGN_STYLE = "Automatic";
        buildSettingsObj.SWIFT_VERSION = "5.0";
      }
    }

    // Add development teams to both your target and the original project
    xcodeProject.addTargetAttribute(
      "DevelopmentTeam",
      props?.devTeam,
      nseTarget
    );
    xcodeProject.addTargetAttribute("DevelopmentTeam", props?.devTeam);

    const mainTarget = xcodeProject.getFirstTarget();
    const mainTargetUuid = mainTarget?.uuid;

    // Add Embed App Extension build phase (PBXCopyFilesBuildPhase)
    // xcodeProject.addBuildPhase(
    //   [mainTarget.uuid],
    //   "PBXCopyFilesBuildPhase",
    //   "Embed App Extensions",
    //   mainTargetUuid,
    //   {
    //     destination: '"13"', // 13 = Plugins
    //     name: '"Embed App Extensions"',
    //     runOnlyForDeploymentPostprocessing: "0", // ✅ this enables "Copy only when installing"
    //     settings: {
    //       ATTRIBUTES: ["RemoveHeadersOnCopy", "CodeSignOnCopy"],
    //     },
    //   }
    // );

    return newConfig;
  });
};

const withWebEngageXcodeProjectContentExtension: ConfigPlugin<
  WebEngagePluginProps
> = (config, props) => {
  return withXcodeProject(config, (newConfig) => {
    const xcodeProject = newConfig.modResults;

    if (!!xcodeProject.pbxTargetByName(CE_TARGET_NAME)) {
      WebEngageLog.log(
        `${CE_TARGET_NAME} already exists in project. Skipping...`
      );
      return newConfig;
    }

    // Create new PBXGroup for the extension
    const extGroup = xcodeProject.addPbxGroup(
      [...CE_EXT_FILES, CE_SOURCE_FILE],
      CE_TARGET_NAME,
      CE_TARGET_NAME
    );

    // Add the new PBXGroup to the top level group
    const groups = xcodeProject.hash.project.objects["PBXGroup"];
    Object.keys(groups).forEach(function (key) {
      if (
        typeof groups[key] === "object" &&
        groups[key].name === undefined &&
        groups[key].path === undefined
      ) {
        xcodeProject.addToPbxGroup(extGroup.uuid, key);
      }
    });

    // WORK AROUND for codeProject.addTarget BUG
    const projObjects = xcodeProject.hash.project.objects;
    projObjects["PBXTargetDependency"] =
      projObjects["PBXTargetDependency"] || {};
    projObjects["PBXContainerItemProxy"] =
      projObjects["PBXTargetDependency"] || {};

    // Add the CE target
    const ceTarget = xcodeProject.addTarget(
      CE_TARGET_NAME,
      "app_extension",
      CE_TARGET_NAME,
      `${config.ios?.bundleIdentifier}.${CE_TARGET_NAME}`
    );

    const mainStoryboardPath = `${CE_TARGET_NAME}/Base.lproj/MainInterface.storyboard`;

    // Add build phases to the new target
    xcodeProject.addBuildPhase(
      [CE_SOURCE_FILE],
      "PBXSourcesBuildPhase",
      "Sources",
      ceTarget.uuid
    );
    xcodeProject.addBuildPhase(
      [mainStoryboardPath],
      "PBXResourcesBuildPhase",
      "Resources",
      ceTarget.uuid
    );
    xcodeProject.addBuildPhase(
      [],
      "PBXFrameworksBuildPhase",
      "Frameworks",
      ceTarget.uuid
    );

    // Edit the Deployment info
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      if (
        typeof configurations[key].buildSettings !== "undefined" &&
        configurations[key].buildSettings.PRODUCT_NAME == `"${CE_TARGET_NAME}"`
      ) {
        const buildSettingsObj = configurations[key].buildSettings;
        buildSettingsObj.DEVELOPMENT_TEAM = props?.devTeam;
        buildSettingsObj.IPHONEOS_DEPLOYMENT_TARGET =
          props?.iPhoneDeploymentTarget ?? IPHONEOS_DEPLOYMENT_TARGET;
        buildSettingsObj.TARGETED_DEVICE_FAMILY = TARGETED_DEVICE_FAMILY;
        buildSettingsObj.CODE_SIGN_ENTITLEMENTS = `${CE_TARGET_NAME}/${CE_TARGET_NAME}.entitlements`;
        buildSettingsObj.CODE_SIGN_STYLE = "Automatic";
        buildSettingsObj.SWIFT_VERSION = "5.0";
      }
    }

    xcodeProject.addTargetAttribute(
      "DevelopmentTeam",
      props?.devTeam,
      ceTarget
    );
    xcodeProject.addTargetAttribute("DevelopmentTeam", props?.devTeam);

    return newConfig;
  });
};

export const withWebEngageIos: ConfigPlugin<WebEngagePluginProps> = (
  config,
  props
) => {
  config = withWebEngagePodfile(config, props);
  config = withWebEngageNSE(config, props);
  config = withWebEngageXcodeProject(config, props);
  config = withWebEngageXcodeProjectContentExtension(config, props);
  config = withEasManagedCredentials(config, props);

  return config;
};
