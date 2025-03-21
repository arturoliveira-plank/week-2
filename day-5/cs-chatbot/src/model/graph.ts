import { StateGraph } from "@langchain/langgraph";
import { StateAnnotation } from "./state";
import { handleRefund } from "./agents/refund-agent";
import { billingSupport } from "./agents/billing-agent";
import { initialSupport } from "./agents/secretary-agent";
import { technicalSupport } from "./agents/technical-agent";
import { MemorySaver } from "@langchain/langgraph";
import store from "./store";
import { toolNode } from "./tools";
import { BaseMessage } from "@langchain/core/messages"; // Import for type safety

const checkpointer = new MemorySaver();

const addMemories = async (state: typeof StateAnnotation.State, config: any) => {
  const store = config.store;
  if (!store) {
    throw new Error("No store provided to addMemories.");
  }

  // Search based on the latest message (assuming messages is an array in your state)
  const latestMessage = state.messages[state.messages.length - 1].content;
  const items = await store.search(
    ["user_123", "memories"], // Adjust namespace as needed
    { query: latestMessage, limit: 4 }
  );

  const memories = items.length
    ? `## Retrieved Memories\n${items.map((item: any) => `${item.value.text} (similarity: ${item.score})`).join("\n")}`
    : "";
    items.length

    ? console.log("veio coisa", memories)    : console.log("num deu nada", memories);
    

  // Update the state with the memories (assuming messages is your state key)
  return {
    messages: [
      { role: "system", content: memories.length > 0 ? "Your memories are: " + memories : "" },
      ...state.messages
    ]
  };
};

// Build the graph
let builder = new StateGraph(StateAnnotation)
  .addNode("add_memories", addMemories)
  .addNode("initial_support", initialSupport)
  .addNode("billing_support", billingSupport)
  .addNode("technical_support", technicalSupport)
  .addNode("handle_refund", handleRefund)
  .addNode("tools", toolNode)
  .addEdge("__start__", "add_memories") // Start with memory retrieval
  .addEdge("add_memories", "initial_support");

// Conditional edges for initial_support, including tool calls
builder = builder.addConditionalEdges("initial_support", async (state: typeof StateAnnotation.State) => {
  if (state.tool_calls && state.tool_calls.length > 0) {
    return "tools"; // Route to tools if there are tool calls
  }
  if (state.nextRepresentative.includes("BILLING")) {
    return "billing";
  } else if (state.nextRepresentative.includes("TECHNICAL")) {
    return "technical";
  } else {
    return "conversational";
  }
}, {
  tools: "tools",
  billing: "billing_support",
  technical: "technical_support",
  conversational: "__end__",
});

// Route back from tools to initial_support to continue the flow
builder = builder.addEdge("tools", "initial_support");

// Rest of the graph
builder = builder
  .addEdge("technical_support", "__end__")
  .addConditionalEdges("billing_support", async (state) => {
    if (state.nextRepresentative.includes("REFUND")) {
      return "refund";
    } else {
      return "__end__";
    }
  }, {
    refund: "handle_refund",
    __end__: "__end__",
  })
  .addEdge("handle_refund", "__end__");

export const graph = builder.compile({ checkpointer, store });