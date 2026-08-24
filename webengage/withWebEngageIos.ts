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
  getCeExtFiles,
  getCeSourceFile,
  getCeTargetName,
  getNseExtFiles,
  getNseSourceFile,
  getNseTargetName,
  DEFAULT_BUNDLE_SHORT_VERSION,
  DEFAULT_BUNDLE_VERSION,
  DEFAULT_APS_ENVIRONMENT,
  DEFAULT_NSE_EXT_FILES,
  DEFAULT_CE_EXT_FILES,
  DEFAULT_NSE_SOURCE_FILE,
  DEFAULT_CE_SOURCE_FILE,
  IPHONEOS_DEPLOYMENT_TARGET,
  TARGETED_DEVICE_FAMILY,
  SWIFT_VERSION,
  NSE_SPM_REPO_URL,
  NSE_SPM_REPO_NAME,
  NSE_SPM_PRODUCT_NAME,
  NSE_SPM_BRANCH,
  CE_SPM_REPO_URL,
  CE_SPM_REPO_NAME,
  CE_SPM_PRODUCT_NAME,
  CE_SPM_BRANCH,
  CE_SYSTEM_FRAMEWORKS,
  NSE_POD_NAME,
  getDefaultAppGroupName,
} from "../support/iosConstants";
import NseUpdaterManager from "../support/NseUpdaterManager";
import { updatePodfile } from "../support/updatePodfile";
import { WebEngageLog } from "../support/WebEngageLog";
import { WebEngagePluginProps } from "../types/types";

import { ExpoConfig } from "@expo/config-types";
import getEasManagedCredentialsConfigExtra from "../support/eas/getEasManagedCredentialsConfigExtra";

const withEasManagedCredentials: ConfigPlugin<WebEngagePluginProps> = (
  config,
  props
) => {
  config.extra = getEasManagedCredentialsConfigExtra(config as ExpoConfig, props);
  return config;
};

const withWebEngagePodfile: ConfigPlugin<WebEngagePluginProps> = (config, props) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const iosRoot = path.join(config.modRequest.projectRoot, "ios");
      const nseTargetName = getNseTargetName(props?.iosNSETargetName);
      const ceTargetName = getCeTargetName(props?.iosCETargetName);
      await updatePodfile(iosRoot, nseTargetName, ceTargetName, props?.iosNSEExistingTarget, props?.disableNSE);

      return config;
    },
  ]);
};

const withWebEngageNSE: ConfigPlugin<WebEngagePluginProps> = (
  config,
  props
) => {
  const nseTargetName = getNseTargetName(props?.iosNSETargetName);
  const ceTargetName = getCeTargetName(props?.iosCETargetName);
  const nseSourceFile = getNseSourceFile(props?.iosNSETargetName);
  const ceSourceFile = getCeSourceFile(props?.iosCETargetName);
  const nseExtFiles = getNseExtFiles(props?.iosNSETargetName);
  const ceExtFiles = getCeExtFiles(props?.iosCETargetName);

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

  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const iosPath = path.join(config.modRequest.projectRoot, "ios");

      // Auto-detect if another plugin already created the NSE target folder
      const nseDir = `${iosPath}/${nseTargetName}`;
      const nseAlreadyExists = props?.iosNSEExistingTarget || (
        fs.existsSync(nseDir) &&
        fs.readdirSync(nseDir).some((f) => f.endsWith(".swift") || f.endsWith(".entitlements"))
      );

      if (!nseAlreadyExists) {
        /* COPY OVER NSE EXTENSION FILES */
        fs.mkdirSync(nseDir, { recursive: true });
        // Copy and rename extension files (entitlements, plist) with the custom target name
        const defaultNseExtFiles = DEFAULT_NSE_EXT_FILES;
        for (let i = 0; i < defaultNseExtFiles.length; i++) {
          const sourceFile = defaultNseExtFiles[i];
          const targetExtFile = nseExtFiles[i];
          const targetFile = `${nseDir}/${targetExtFile}`;
          await FileManager.copyFile(`${sourceDir}${sourceFile}`, targetFile);
        }

        // Copy NSE source file either from configuration-provided location, falling back to the default one.
        const sourcePath =
          props.iosNSEFilePath ?? `${sourceDir}${DEFAULT_NSE_SOURCE_FILE}`;
        const targetFile = `${nseDir}/${nseSourceFile}`;
        await FileManager.copyFile(`${sourcePath}`, targetFile);

        // Update NSExtensionPrincipalClass in Info.plist to match the actual Swift class name
        const swiftContent = await FileManager.readFile(targetFile);
        const classMatch = swiftContent.match(/class\s+(\w+)\s*:\s*(?:UNNotificationServiceExtension|WEXPushNotificationService)/);
        if (classMatch) {
          const className = classMatch[1];
          const plistPath = `${nseDir}/${nseTargetName}-Info.plist`;
          let plistContent = await FileManager.readFile(plistPath);
          plistContent = plistContent.replace(
            /\$\(PRODUCT_MODULE_NAME\)\.\w+/,
            `$(PRODUCT_MODULE_NAME).${className}`
          );
          await FileManager.writeFile(plistPath, plistContent);
        }

        /* MODIFY COPIED NSE EXTENSION FILES */
        const nseUpdater = new NseUpdaterManager(iosPath, props?.iosNSETargetName);
        await nseUpdater.updateNSEEntitlements(
          props?.appGroupName ?? getDefaultAppGroupName(config.ios?.bundleIdentifier || "")
        );
        await nseUpdater.updateNSEApsEnvironment(props.mode ?? DEFAULT_APS_ENVIRONMENT);
        await nseUpdater.updateNSEBundleVersion(
          config.ios?.buildNumber ?? DEFAULT_BUNDLE_VERSION
        );
        await nseUpdater.updateNSEBundleShortVersion(
          config?.version ?? DEFAULT_BUNDLE_SHORT_VERSION
        );
      } else {
        // NSE target already exists (created by another plugin or manually flagged)
        WebEngageLog.log(
          `NSE target '${nseTargetName}' already exists. Skipping target creation, injecting app group...`
        );

        const groupIdentifier = props?.appGroupName ?? getDefaultAppGroupName(config.ios?.bundleIdentifier || "");

        if (fs.existsSync(nseDir)) {
          // Find the entitlements file in the existing target directory
          const entitlementsFile = fs.readdirSync(nseDir).find(
            (f) => f.endsWith(".entitlements")
          );

          if (entitlementsFile) {
            const entitlementsPath = `${nseDir}/${entitlementsFile}`;
            let entitlementsContent = await FileManager.readFile(entitlementsPath);

            if (!entitlementsContent.includes(groupIdentifier)) {
              if (entitlementsContent.includes("com.apple.security.application-groups")) {
                // App groups key exists — add our group to the existing array
                entitlementsContent = entitlementsContent.replace(
                  /(<key>com\.apple\.security\.application-groups<\/key>\s*<array>)/,
                  `$1\n\t\t<string>${groupIdentifier}</string>`
                );
              } else {
                // No app groups key — inject one before the closing </dict>
                entitlementsContent = entitlementsContent.replace(
                  /<\/dict>/,
                  `\t<key>com.apple.security.application-groups</key>\n\t<array>\n\t\t<string>${groupIdentifier}</string>\n\t</array>\n</dict>`
                );
              }
              await FileManager.writeFile(entitlementsPath, entitlementsContent);
              WebEngageLog.log(
                `Added app group '${groupIdentifier}' to existing entitlements: ${entitlementsPath}`
              );
            }
          } else {
            WebEngageLog.log(
              `No entitlements file found in ${nseDir}. Skipping app group injection.`
            );
          }

          // Handle NSE Swift file
          if (props.iosNSEFilePath) {
            // Client provided a custom merged file — use it directly
            const targetFile = `${nseDir}/${nseSourceFile}`;
            await FileManager.copyFile(props.iosNSEFilePath, targetFile);
            WebEngageLog.log(
              `Copied custom NSE file to existing target: ${targetFile}`
            );
          } else if (!props?.iosNSEExistingTarget) {
            // Auto-detected conflict and client hasn't acknowledged it — throw error
            const existingSwiftFile = fs.readdirSync(nseDir).find(
              (f) => f.endsWith(".swift")
            );
            throw new Error(
              `[webengage-expo-push] A Notification Service Extension target '${nseTargetName}' already exists ` +
              `(found: ${existingSwiftFile || "files"} in ios/${nseTargetName}/).\n\n` +
              `Another plugin has already created this target. To resolve this, add the following to your ` +
              `webengage-expo-push config in app.json:\n\n` +
              `  1. Set "iosNSEExistingTarget": true\n` +
              `  2. Provide "iosNSEFilePath" pointing to a merged Swift file that handles both providers.\n\n` +
              `Example merged NotificationService.swift:\n\n` +
              `  import UserNotifications\n` +
              `  import WEServiceExtension\n\n` +
              `  class NotificationService: UNNotificationServiceExtension {\n` +
              `      let wegService = WEXPushNotificationService()\n\n` +
              `      override func didReceive(_ request: UNNotificationRequest,\n` +
              `                               withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {\n` +
              `          if let payload = request.content.userInfo as? [String: Any],\n` +
              `             payload["source"] as? String == "webengage" {\n` +
              `              wegService.didReceive(request, withContentHandler: contentHandler)\n` +
              `              return\n` +
              `          }\n` +
              `          // Other provider's code here\n` +
              `      }\n` +
              `  }\n\n` +
              `Then in app.json:\n` +
              `  ["webengage-expo-push", {\n` +
              `    "mode": "development",\n` +
              `    "iosNSEExistingTarget": true,\n` +
              `    "iosNSEFilePath": "./path/to/NotificationService.swift"\n` +
              `  }]`
            );
          }
          // If iosNSEExistingTarget is true but no iosNSEFilePath — client handles it themselves
        }
      }

      return config;
    },
  ]);
};

const withWebEngageCEFiles: ConfigPlugin<WebEngagePluginProps> = (
  config,
  props
) => {
  const ceTargetName = getCeTargetName(props?.iosCETargetName);
  const ceSourceFile = getCeSourceFile(props?.iosCETargetName);
  const ceExtFiles = getCeExtFiles(props?.iosCETargetName);

  const sourceDirCE = path.resolve(
    __dirname,
    "../support/contentExtensionFiles/contentExtensionFiles-swift"
  ) + "/";

  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const iosPath = path.join(config.modRequest.projectRoot, "ios");

      /* COPY OVER CE EXTENSION FILES */
      fs.mkdirSync(`${iosPath}/${ceTargetName}`, { recursive: true });
      const defaultCeExtFiles = DEFAULT_CE_EXT_FILES;
      for (let i = 0; i < defaultCeExtFiles.length; i++) {
        const sourceFile = defaultCeExtFiles[i];
        const targetExtFile = ceExtFiles[i];
        const targetFile = `${iosPath}/${ceTargetName}/${targetExtFile}`;
        await FileManager.copyFile(`${sourceDirCE}${sourceFile}`, targetFile);
      }
      // Copy Base.lproj directory for CE
      const baseLprojSource = path.join(sourceDirCE, "Base.lproj");
      const baseLprojTarget = path.join(iosPath, ceTargetName, "Base.lproj");
      fs.mkdirSync(baseLprojTarget, { recursive: true });
      await FileManager.copyDirectory(baseLprojSource, baseLprojTarget);

      // Copy CE source file
      const sourcePathCE =
        props.iosCEFilePath ?? `${sourceDirCE}${DEFAULT_CE_SOURCE_FILE}`;
      const targetFileCE = `${iosPath}/${ceTargetName}/${ceSourceFile}`;
      await FileManager.copyFile(`${sourcePathCE}`, targetFileCE);

      /* MODIFY COPIED CE EXTENSION FILES */
      const ceUpdater = new CeUpdaterManager(iosPath, props?.iosCETargetName);
      await ceUpdater.updateNSEEntitlements(
        props?.appGroupName ?? getDefaultAppGroupName(config.ios?.bundleIdentifier || "")
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

    const nseTargetName = getNseTargetName(props?.iosNSETargetName);
    const nseSourceFile = getNseSourceFile(props?.iosNSETargetName);
    const nseExtFiles = getNseExtFiles(props?.iosNSETargetName);

    if (!!xcodeProject.pbxTargetByName(nseTargetName)) {
      WebEngageLog.log(
        `${nseTargetName} already exists in project. Skipping...`
      );
      return newConfig;
    }

    // Create new PBXGroup for the extension
    const extGroup = xcodeProject.addPbxGroup(
      [...nseExtFiles, nseSourceFile],
      nseTargetName,
      nseTargetName
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
    const projObjects = xcodeProject.hash.project.objects;
    projObjects["PBXTargetDependency"] =
      projObjects["PBXTargetDependency"] || {};
    projObjects["PBXContainerItemProxy"] =
      projObjects["PBXTargetDependency"] || {};

    // Add the NSE target
    const nseTarget = xcodeProject.addTarget(
      nseTargetName,
      "app_extension",
      nseTargetName,
      `${config.ios?.bundleIdentifier}.${nseTargetName}`
    );

    // Add build phases to the new target
    xcodeProject.addBuildPhase(
      [nseSourceFile],
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

    // Edit the Deployment info of the new Target
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      if (
        typeof configurations[key].buildSettings !== "undefined" &&
        configurations[key].buildSettings.PRODUCT_NAME == `"${nseTargetName}"`
      ) {
        const buildSettingsObj = configurations[key].buildSettings;
        buildSettingsObj.DEVELOPMENT_TEAM = props?.devTeam;
        buildSettingsObj.IPHONEOS_DEPLOYMENT_TARGET =
          props?.iPhoneDeploymentTarget ?? IPHONEOS_DEPLOYMENT_TARGET;
        buildSettingsObj.TARGETED_DEVICE_FAMILY = TARGETED_DEVICE_FAMILY;
        buildSettingsObj.CODE_SIGN_ENTITLEMENTS = `${nseTargetName}/${nseTargetName}.entitlements`;
        buildSettingsObj.CODE_SIGN_STYLE = "Automatic";
        buildSettingsObj.SWIFT_VERSION = SWIFT_VERSION;
      }
    }

    // Add development teams to both your target and the original project
    xcodeProject.addTargetAttribute(
      "DevelopmentTeam",
      props?.devTeam,
      nseTarget
    );
    xcodeProject.addTargetAttribute("DevelopmentTeam", props?.devTeam);

    // Add SPM package if useSPM is enabled
    if (props?.useSPM) {
      addSPMPackageToTarget(
        xcodeProject,
        nseTarget.uuid,
        nseTargetName,
        NSE_SPM_REPO_URL,
        NSE_SPM_REPO_NAME,
        NSE_SPM_PRODUCT_NAME,
        NSE_SPM_BRANCH
      );
      WebEngageLog.log(`✅ Added ${NSE_SPM_PRODUCT_NAME} SPM package to ${nseTargetName} target`);
    }

    return newConfig;
  });
};

const withWebEngageXcodeProjectContentExtension: ConfigPlugin<
  WebEngagePluginProps
> = (config, props) => {
  return withXcodeProject(config, (newConfig) => {
    const xcodeProject = newConfig.modResults;

    const ceTargetName = getCeTargetName(props?.iosCETargetName);
    const ceSourceFile = getCeSourceFile(props?.iosCETargetName);
    const ceExtFiles = getCeExtFiles(props?.iosCETargetName);

    if (!!xcodeProject.pbxTargetByName(ceTargetName)) {
      WebEngageLog.log(
        `${ceTargetName} already exists in project. Skipping...`
      );
      return newConfig;
    }

    // Create new PBXGroup for the extension
    const extGroup = xcodeProject.addPbxGroup(
      [...ceExtFiles, ceSourceFile],
      ceTargetName,
      ceTargetName
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
      ceTargetName,
      "app_extension",
      ceTargetName,
      `${config.ios?.bundleIdentifier}.${ceTargetName}`
    );

    const mainStoryboardPath = `${ceTargetName}/Base.lproj/MainInterface.storyboard`;

    // Add build phases to the new target
    xcodeProject.addBuildPhase(
      [ceSourceFile],
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

    // Add required system frameworks for content extension
    for (const framework of CE_SYSTEM_FRAMEWORKS) {
      xcodeProject.addFramework(framework, {
        target: ceTarget.uuid,
        link: true,
      });
    }

    // Edit the Deployment info
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      if (
        typeof configurations[key].buildSettings !== "undefined" &&
        configurations[key].buildSettings.PRODUCT_NAME == `"${ceTargetName}"`
      ) {
        const buildSettingsObj = configurations[key].buildSettings;
        buildSettingsObj.DEVELOPMENT_TEAM = props?.devTeam;
        buildSettingsObj.IPHONEOS_DEPLOYMENT_TARGET =
          props?.iPhoneDeploymentTarget ?? IPHONEOS_DEPLOYMENT_TARGET;
        buildSettingsObj.TARGETED_DEVICE_FAMILY = TARGETED_DEVICE_FAMILY;
        buildSettingsObj.CODE_SIGN_ENTITLEMENTS = `${ceTargetName}/${ceTargetName}.entitlements`;
        buildSettingsObj.CODE_SIGN_STYLE = "Automatic";
        buildSettingsObj.SWIFT_VERSION = SWIFT_VERSION;
      }
    }

    xcodeProject.addTargetAttribute(
      "DevelopmentTeam",
      props?.devTeam,
      ceTarget
    );
    xcodeProject.addTargetAttribute("DevelopmentTeam", props?.devTeam);

    // Add SPM package if useSPM is enabled
    if (props?.useSPM) {
      addSPMPackageToTarget(
        xcodeProject,
        ceTarget.uuid,
        ceTargetName,
        CE_SPM_REPO_URL,
        CE_SPM_REPO_NAME,
        CE_SPM_PRODUCT_NAME,
        CE_SPM_BRANCH
      );
      WebEngageLog.log(`✅ Added ${CE_SPM_PRODUCT_NAME} SPM package to ${ceTargetName} target`);
    }

    return newConfig;
  });
};

/**
 * Helper: Add an SPM package dependency to a specific target in the Xcode project.
 * Uses targetUUID directly (passed from addTarget().uuid) to avoid lookup issues.
 */
function addSPMPackageToTarget(
  xcodeProject: any,
  targetUUID: string,
  targetName: string,
  repositoryUrl: string,
  repoName: string,
  productName: string,
  branch: string
) {
  // 1. Add XCRemoteSwiftPackageReference
  if (!xcodeProject.hash.project.objects["XCRemoteSwiftPackageReference"]) {
    xcodeProject.hash.project.objects["XCRemoteSwiftPackageReference"] = {};
  }

  const packageReferenceUUID = xcodeProject.generateUuid();
  const packageRefKey = `${packageReferenceUUID} /* XCRemoteSwiftPackageReference "${repoName}" */`;

  xcodeProject.hash.project.objects["XCRemoteSwiftPackageReference"][packageRefKey] = {
    isa: "XCRemoteSwiftPackageReference",
    repositoryURL: repositoryUrl,
    requirement: {
      kind: "branch",
      branch: branch,
    },
  };

  // 2. Add packageReferences to PBXProject
  const projectId = Object.keys(
    xcodeProject.hash.project.objects["PBXProject"]
  ).find((key: string) => !key.includes("_comment"));

  if (projectId) {
    if (!xcodeProject.hash.project.objects["PBXProject"][projectId]["packageReferences"]) {
      xcodeProject.hash.project.objects["PBXProject"][projectId]["packageReferences"] = [];
    }
    xcodeProject.hash.project.objects["PBXProject"][projectId]["packageReferences"].push(packageRefKey);
  }

  // 3. Add XCSwiftPackageProductDependency
  if (!xcodeProject.hash.project.objects["XCSwiftPackageProductDependency"]) {
    xcodeProject.hash.project.objects["XCSwiftPackageProductDependency"] = {};
  }

  const packageUUID = xcodeProject.generateUuid();
  const productKey = `${packageUUID} /* ${productName} */`;

  xcodeProject.hash.project.objects["XCSwiftPackageProductDependency"][productKey] = {
    isa: "XCSwiftPackageProductDependency",
    package: packageRefKey,
    productName: productName,
  };

  // 4. Add packageProductDependencies to the target using UUID directly
  const nativeTargets = xcodeProject.hash.project.objects["PBXNativeTarget"];
  const target = nativeTargets[targetUUID];

  if (target) {
    if (!target["packageProductDependencies"]) {
      target["packageProductDependencies"] = [];
    }
    target["packageProductDependencies"].push(productKey);
  } else {
    WebEngageLog.log(`⚠️ SPM: Could not find target '${targetName}' (UUID: ${targetUUID})`);
  }

  // 5. Add PBXBuildFile referencing the product
  const frameworkUUID = xcodeProject.generateUuid();

  xcodeProject.hash.project.objects["PBXBuildFile"][`${frameworkUUID}_comment`] =
    `${productName} in Frameworks`;
  xcodeProject.hash.project.objects["PBXBuildFile"][frameworkUUID] = {
    isa: "PBXBuildFile",
    productRef: packageUUID,
    productRef_comment: productName,
  };

  // 6. Add to target's PBXFrameworksBuildPhase
  if (target) {
    const allFrameworkPhases = xcodeProject.hash.project.objects["PBXFrameworksBuildPhase"] || {};
    let frameworksBuildPhaseId: string | null = null;

    for (const phaseRef of target.buildPhases || []) {
      const phaseStr = String(typeof phaseRef === "object" && phaseRef.value ? phaseRef.value : phaseRef);
      const phaseId = phaseStr.split(" ")[0];
      if (allFrameworkPhases[phaseId]) {
        frameworksBuildPhaseId = phaseId;
        break;
      }
    }

    if (frameworksBuildPhaseId) {
      const phase = allFrameworkPhases[frameworksBuildPhaseId];
      if (!phase.files) {
        phase.files = [];
      }
      phase.files.push(`${frameworkUUID} /* ${productName} in Frameworks */`);
    } else {
      WebEngageLog.log(`⚠️ SPM: Could not find Frameworks build phase for target '${targetName}'`);
    }
  }
}

export const withWebEngageIos: ConfigPlugin<WebEngagePluginProps> = (
  config,
  props
) => {
  // CocoaPods: update Podfile with pod entries (skip if using SPM)
  if (!props?.useSPM) {
    config = withWebEngagePodfile(config, props);
  }

  if (!props?.disableNSE) {
    config = withWebEngageNSE(config, props);
    config = withWebEngageXcodeProject(config, props);
  }

  // CE files and Xcode target are always created
  config = withWebEngageCEFiles(config, props);
  config = withWebEngageXcodeProjectContentExtension(config, props);
  config = withEasManagedCredentials(config, props);

  return config;
};
