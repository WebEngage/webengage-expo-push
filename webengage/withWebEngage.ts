import { ConfigPlugin } from "@expo/config-plugins";
import { WebEngagePluginProps } from "../types/types";

import { withWebEngageIos } from "./withWebEngageIos";
import { validatePluginProps } from "../support/helpers";

const withWebEngage: ConfigPlugin<WebEngagePluginProps> = (config, props) => {
  // default to empty object if no props provided
  const pluginProps = props ?? {};

  validatePluginProps(pluginProps);

  config = withWebEngageIos(config, pluginProps);

  return config;
};

export default withWebEngage;
