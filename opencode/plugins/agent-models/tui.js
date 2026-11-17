import { Plugin } from "@opencode/plugin/tui";
import { registerAgentModelsCommand } from "./routing.mjs";

export default Plugin.define({
  id: "openspec-multiagent.agent-models",
  setup(context) {
    registerAgentModelsCommand(context);
  },
});
