import { MemorySaver, StateGraph } from "@langchain/langgraph";
import { StateAnnotation } from "./state";
import { handleRefund } from "./agents/refund-agent";
import { billingSupport } from "./agents/billing-agent";
import { technicalSupport } from "./agents/technical-agent";
import { initialSupport } from "./agents/secretary-agent";
import { checkpointer } from "./postgres";

let builder = new StateGraph(StateAnnotation)
  .addNode("initial_support", initialSupport)
  .addNode("billing_support", billingSupport)
  .addNode("technical_support", technicalSupport)
  .addNode("handle_refund", handleRefund)
  .addEdge("__start__", "initial_support"); 

  builder = builder.addConditionalEdges("initial_support", async (state: typeof StateAnnotation.State) => {
    if (state.nextRepresentative.includes("BILLING")) {
      return "billing";
    } else if (state.nextRepresentative.includes("TECHNICAL")) {
      return "technical";
    } else {
      return "conversational";
    }
  }, {
    billing: "billing_support",
    technical: "technical_support",
    conversational: "__end__",
  });
  
  builder = builder
  .addEdge("technical_support", "__end__")
  .addConditionalEdges("billing_support", async (state) => {
    if (state.nextRepresentative.includes("REFUND")) {
      console.log("refund authorized2", state.refundAuthorized);
      return "refund";
    } else {
      return "__end__";
    }
  }, {
    refund: "handle_refund",
    __end__: "__end__",
  })
  .addEdge("handle_refund", "__end__");

  export const graph = builder.compile({checkpointer});
