import { WEBENGAGE_PLUGIN_PROPS } from "../types/types";

export function validatePluginProps(props: any): void {
  // check the type of each property
  if (typeof props.mode !== "string") {
    throw new Error("WebEngage Expo Plugin: 'mode' must be a string.");
  }

  if (props.devTeam && typeof props.devTeam !== "string") {
    throw new Error("WebEngage Expo Plugin: 'devTeam' must be a string.");
  }

  if (
    props.iPhoneDeploymentTarget &&
    typeof props.iPhoneDeploymentTarget !== "string"
  ) {
    throw new Error(
      "WebEngage Expo Plugin: 'iPhoneDeploymentTarget' must be a string."
    );
  }

  if (props.iosNSEFilePath && typeof props.iosNSEFilePath !== "string") {
    throw new Error(
      "WebEngage Expo Plugin: 'iosNSEFilePath' must be a string."
    );
  }

  // check for extra properties
  const inputProps = Object.keys(props);

  for (const prop of inputProps) {
    if (!WEBENGAGE_PLUGIN_PROPS.includes(prop)) {
      throw new Error(
        `WebEngage Expo Plugin: You have provided an invalid property "${prop}" to the WebEngage plugin.`
      );
    }
  }
}
