import llm from "./llm-call.js";
import { toolNode, tools } from "./tools.js";
import { END, START, StateGraph, MemorySaver } from "@langchain/langgraph";
import { AIMessage, BaseMessage, HumanMessage, RemoveMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { MyGraphAnnotation } from "./state.js";

const boundModel = llm.bindTools(tools);

const memory = new MemorySaver();

async function summarizeConversation(state: typeof MyGraphAnnotation.State) {
  // First, we get any existing summary
  const summary = state.summary || "";

  // Create our summarization prompt
  let summaryMessage: string;
  if (summary) {
    // A summary already exists
    summaryMessage =
      `This is a summary of the conversation to date: ${summary}\n\n` +
      "Extend the summary by taking into account the new messages above:";
  } else {
    summaryMessage = "Create a summary of the conversation above:";
  }

  // Add prompt to our history
  const messages = [
    ...state.messages,
    new HumanMessage({ content: summaryMessage }),
  ];

  // Assuming you have a ChatOpenAI model instance
  const response = await boundModel.invoke(messages);

  console.log("SUMMARY", response.content);

  // Delete all but the 2 most recent messages
  const deleteMessages = state.messages
    .slice(0, -2)
    .map((m) => new RemoveMessage({ id: m.id || "" }));

  return {
    summary: response.content,
    messages: deleteMessages,
  };
}

const router = (state: typeof MyGraphAnnotation.State) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1] as AIMessage;

  console.log("MESSAGES", messages.length);
  
  // First check if we need to summarize
  if (messages.length > 5) {
    console.log("SUMMARIZING");
    return "summarize";
  }
  
  // Then check if we need to route to tools
  if (lastMessage.tool_calls?.length) {
    return "tools";
  }
  
  // If neither condition is met, we can finish
  return END;
};

const filterMessages = (messages: BaseMessage[]): BaseMessage[] => {
  // This is very simple helper function which only ever uses the last 5 messages
  return messages.slice(-5);
}

const callModel = async (
  state: typeof MyGraphAnnotation.State,
  config?: RunnableConfig,
) => {
  const { messages } = state;
  const response = await boundModel.invoke(filterMessages(messages), config);
  return { messages: [response] };
};

const workflow = new StateGraph(MyGraphAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addNode("summarize", summarizeConversation)
  // Start with the agent
  .addEdge(START, "agent")
  // Agent can go to tools, summarize, or end
  .addConditionalEdges("agent", router)
  // Tools always go back to agent
  .addEdge("tools", "agent")
  // Summarize always goes back to agent
  .addEdge("summarize", "agent");

const graph = workflow.compile({ checkpointer: memory });

export { graph };
