import * as fs from "fs";
import { FileManager } from "./FileManager";
import {
  CE_PODFILE_SNIPPET,
  NSE_PODFILE_REGEX,
  NSE_PODFILE_SNIPPET,
} from "./iosConstants";
import { WebEngageLog } from "./WebEngageLog";

export async function updatePodfile(iosPath: string) {
  const podfile = await FileManager.readFile(`${iosPath}/Podfile`);
  const matches = podfile.match(NSE_PODFILE_REGEX);

  if (matches) {
    WebEngageLog.log(
      "NotificationService target already added to Podfile. Skipping..."
    );
  } else {
    fs.appendFile(`${iosPath}/Podfile`, NSE_PODFILE_SNIPPET, (err) => {
      if (err) {
        WebEngageLog.error("Error writing to Podfile");
      }
    });

    fs.appendFile(`${iosPath}/Podfile`, CE_PODFILE_SNIPPET, (err) => {
      if (err) {
        WebEngageLog.error("Error writing to Podfile");
      }
    });
  }
}
