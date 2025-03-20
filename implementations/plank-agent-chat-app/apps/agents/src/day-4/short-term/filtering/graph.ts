import llm from "./llm-call.js";
import { toolNode, tools } from "./tools.js";
import { END, START, StateGraph, MemorySaver } from "@langchain/langgraph";
import { AIMessage, BaseMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { GraphState } from "./state.js";

const boundModel = llm.bindTools(tools);

const memory = new MemorySaver();

const routeMessage = (state: typeof GraphState.State) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1] as AIMessage;
  // If no tools are called, we can finish (respond to the user)
  if (!lastMessage.tool_calls?.length) {
    return END;
  }
  // Otherwise if there is, we continue and call the tools
  return "tools";
};

const filterMessages = (messages: BaseMessage[]): BaseMessage[] => {
  // This is very simple helper function which only ever uses the last 5 messages
  return messages.slice(-5);
}

const callModel = async (
  state: typeof GraphState.State,
  config?: RunnableConfig,
) => {
  const { messages } = state;
  const response = await boundModel.invoke(filterMessages(messages), config);
  return { messages: [response] };
};

const workflow = new StateGraph(GraphState)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", routeMessage)
  .addEdge("tools", "agent");

const graph = workflow.compile({ checkpointer: memory });

export { graph };
