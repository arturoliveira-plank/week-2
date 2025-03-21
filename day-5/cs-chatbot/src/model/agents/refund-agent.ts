import { NodeInterrupt } from "@langchain/langgraph";
import { StateAnnotation } from "../state";

export const handleRefund = async (state: typeof StateAnnotation.State) => {
  console.log("refund authorized", state.refundAuthorized);
  if (!state.refundAuthorized) {
    console.log("--- HUMAN AUTHORIZATION REQUIRED FOR REFUND ---");
    throw new NodeInterrupt("Human authorization required.")
  }
  return {
    messages: {
      role: "assistant",
      content: "Refund processed!",
    },
  };
};