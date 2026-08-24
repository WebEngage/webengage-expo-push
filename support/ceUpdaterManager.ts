import { FileManager } from "./FileManager";
import {
  BUNDLE_SHORT_VERSION_TEMPLATE_REGEX,
  BUNDLE_VERSION_TEMPLATE_REGEX,
  getCeTargetName,
  GROUP_IDENTIFIER_TEMPLATE_REGEX,
} from "./iosConstants";

export default class CeUpdaterManager {
  private cePath = "";
  private targetName = "";

  constructor(iosPath: string, customTargetName?: string) {
    this.targetName = getCeTargetName(customTargetName);
    this.cePath = `${iosPath}/${this.targetName}`;
  }

  async updateNSEEntitlements(groupIdentifier: string): Promise<void> {
    const entitlementsFilePath = `${this.cePath}/${this.targetName}.entitlements`;
    let entitlementsFile = await FileManager.readFile(entitlementsFilePath);

    entitlementsFile = entitlementsFile.replace(
      GROUP_IDENTIFIER_TEMPLATE_REGEX,
      groupIdentifier
    );
    await FileManager.writeFile(entitlementsFilePath, entitlementsFile);
  }

  async updateNSEBundleVersion(version: string): Promise<void> {
    const plistFilePath = `${this.cePath}/${this.targetName}-Info.plist`;
    let plistFile = await FileManager.readFile(plistFilePath);
    plistFile = plistFile.replace(BUNDLE_VERSION_TEMPLATE_REGEX, version);
    await FileManager.writeFile(plistFilePath, plistFile);
  }

  async updateNSEBundleShortVersion(version: string): Promise<void> {
    const plistFilePath = `${this.cePath}/${this.targetName}-Info.plist`;
    let plistFile = await FileManager.readFile(plistFilePath);
    plistFile = plistFile.replace(BUNDLE_SHORT_VERSION_TEMPLATE_REGEX, version);
    await FileManager.writeFile(plistFilePath, plistFile);
  }
}
