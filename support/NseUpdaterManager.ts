import { FileManager } from "./FileManager";
import {
  BUNDLE_SHORT_VERSION_TEMPLATE_REGEX,
  BUNDLE_VERSION_TEMPLATE_REGEX,
  GROUP_IDENTIFIER_TEMPLATE_REGEX,
  getNseTargetName,
} from "./iosConstants";

export default class NseUpdaterManager {
  private nsePath = "";
  private targetName = "";

  constructor(iosPath: string, customTargetName?: string) {
    this.targetName = getNseTargetName(customTargetName);
    this.nsePath = `${iosPath}/${this.targetName}`;
  }

  async updateNSEEntitlements(groupIdentifier: string): Promise<void> {
    const entitlementsFilePath = `${this.nsePath}/${this.targetName}.entitlements`;
    let entitlementsFile = await FileManager.readFile(entitlementsFilePath);

    entitlementsFile = entitlementsFile.replace(
      GROUP_IDENTIFIER_TEMPLATE_REGEX,
      groupIdentifier
    );
    await FileManager.writeFile(entitlementsFilePath, entitlementsFile);
  }

  async updateNSEApsEnvironment(mode: string): Promise<void> {
    const entitlementsFilePath = `${this.nsePath}/${this.targetName}.entitlements`;
    let entitlementsFile = await FileManager.readFile(entitlementsFilePath);

    entitlementsFile = entitlementsFile.replace(
      /<key>aps-environment<\/key>\s*<string>[^<]*<\/string>/,
      `<key>aps-environment</key>\n\t<string>${mode}</string>`
    );
    await FileManager.writeFile(entitlementsFilePath, entitlementsFile);
  }

  async updateNSEBundleVersion(version: string): Promise<void> {
    const plistFilePath = `${this.nsePath}/${this.targetName}-Info.plist`;
    let plistFile = await FileManager.readFile(plistFilePath);
    plistFile = plistFile.replace(BUNDLE_VERSION_TEMPLATE_REGEX, version);
    await FileManager.writeFile(plistFilePath, plistFile);
  }

  async updateNSEBundleShortVersion(version: string): Promise<void> {
    const plistFilePath = `${this.nsePath}/${this.targetName}-Info.plist`;
    let plistFile = await FileManager.readFile(plistFilePath);
    plistFile = plistFile.replace(BUNDLE_SHORT_VERSION_TEMPLATE_REGEX, version);
    await FileManager.writeFile(plistFilePath, plistFile);
  }
}
