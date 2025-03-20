import llm from "./llm-call";
import { tools, upsertMemoryTool } from "./tools";
import  store  from "./store";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { END, START, StateGraph } from "@langchain/langgraph";
import { RunnableConfig } from "@langchain/core/runnables";
import { GraphState } from "./state";
import { createReactAgent, ToolNode } from "@langchain/langgraph/prebuilt";
import { checkpointer } from "./postgres";
import { MessagesAnnotation } from "@langchain/langgraph";
import { InMemoryStore } from "@langchain/langgraph";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
export const boundModel = llm.bindTools(tools);

const addMemories = async (
  state: typeof MessagesAnnotation.State,
  config: LangGraphRunnableConfig
) => {
  const store = config.store as InMemoryStore;

  if (!store) {
    throw new Error("No store provided to state modifier.");
  }

  // Search based on user's last message
  const items = await store.search(
    ["user_123", "memories"], 
    { 
      query: state.messages[state.messages.length - 1].content as string,
      limit: 4 
    }
  );

  const memories = items.length 
    ? `## Memories of user\n${
      items.map(item => `${item.value.text} (similarity: ${item.score})`).join("\n")
    }`
    : "";

  // Return array of messages directly
  return [
    { role: "system", content: `You are a helpful assistant.\n${memories}` },
    ...state.messages
  ];
};

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

const callModel = async (
  state: typeof GraphState.State,
  config?: RunnableConfig,
) => {
  const { messages } = state;
  const response = await boundModel.invoke(messages, config);
  return { messages: [response] };
};

const workflow = createReactAgent({
  llm: new ChatOpenAI({ model: "gpt-4o-mini" }),
  tools: [upsertMemoryTool],
  prompt: (state, config) => addMemories(state, config),
  store: store
}); 

// Use the store when compiling the graph
// export const graph = workflow.compile({ checkpointer: checkpointer, configFactory: () => ({ store }) });
export const graph = workflow;
