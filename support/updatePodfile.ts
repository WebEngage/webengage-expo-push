import * as fs from "fs";
import { FileManager } from "./FileManager";
import {
  getCePodfileSnippet,
  getNsePodfileRegex,
  getNsePodfileSnippet,
  NSE_POD_NAME,
} from "./iosConstants";
import { WebEngageLog } from "./WebEngageLog";

export async function updatePodfile(
  iosPath: string,
  nseTargetName?: string,
  ceTargetName?: string,
  nseExistingTarget?: boolean,
  disableNSE?: boolean
) {
  const podfile = await FileManager.readFile(`${iosPath}/Podfile`);
  const targetName = nseTargetName || "NotificationService";

  // Handle NSE Podfile entry (skip if disabled)
  if (!disableNSE) {
    const regex = getNsePodfileRegex(nseTargetName);
    const matches = podfile.match(regex);

    if (matches) {
      // Target exists in Podfile
      if (podfile.includes(`pod '${NSE_POD_NAME}'`)) {
        WebEngageLog.log(
          `${NSE_POD_NAME} pod already in Podfile for target '${targetName}'. Skipping...`
        );
      } else if (nseExistingTarget) {
        // Inject WEServiceExtension pod into the existing target block
        const targetRegex = new RegExp(
          `(target '${targetName}'[^\\n]*do\\n)`
        );
        const updatedPodfile = podfile.replace(targetRegex, `$1  pod '${NSE_POD_NAME}'\n`);
        if (updatedPodfile !== podfile) {
          await FileManager.writeFile(`${iosPath}/Podfile`, updatedPodfile);
          WebEngageLog.log(
            `Added ${NSE_POD_NAME} pod to existing '${targetName}' target in Podfile.`
          );
        } else {
          fs.appendFileSync(
            `${iosPath}/Podfile`,
            getNsePodfileSnippet(nseTargetName)
          );
        }
      } else {
        WebEngageLog.log(
          `${targetName} target already in Podfile. Skipping...`
        );
      }
    } else if (nseExistingTarget) {
      // Target doesn't exist in Podfile yet. This usually means webengage-expo-push
      // is listed AFTER the other plugin in app.json. Due to Expo's withDangerousMod
      // reverse execution order, it must be listed BEFORE the other plugin.
      throw new Error(
        `[webengage-expo-push] "iosNSEExistingTarget" is true but target '${targetName}' was not found in the Podfile.\n\n` +
        `This happens when "webengage-expo-push" is listed AFTER the other plugin in app.json.\n` +
        `Move "webengage-expo-push" BEFORE the plugin that creates the NSE target.`
      );
    } else {
      // No existing target — create new one
      fs.appendFileSync(
        `${iosPath}/Podfile`,
        getNsePodfileSnippet(nseTargetName)
      );
    }
  }

  // Handle CE Podfile entry (always added)
  const ceTarget = ceTargetName || "NotificationViewController";
  const rePodfile = await FileManager.readFile(`${iosPath}/Podfile`);
  if (!rePodfile.includes(`target '${ceTarget}'`)) {
    fs.appendFileSync(
      `${iosPath}/Podfile`,
      getCePodfileSnippet(ceTargetName)
    );
  }
}
