import { ToolNode } from "@langchain/langgraph/prebuilt";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { InMemoryStore } from "@langchain/langgraph";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
const searchTool = new TavilySearchResults({
  apiKey: process.env.TAVILY_API_KEY,
});

const upsertMemoryTool = tool(async (
  { content },
  config: LangGraphRunnableConfig
): Promise<string> => {
  const store = config.store as InMemoryStore;
  if (!store) {
    throw new Error("No store provided to tool.");
  }
  await store.put(
    ["user_123", "memories"],
    uuidv4(), // give each memory its own unique ID
    { text: content }
  );
  return "Stored memory.";
}, {
  name: "upsert_memory",
  schema: z.object({
    content: z.string().describe("The content of the memory to store."),
  }),
  description: "Upsert long-term memories.",
});

const tools = [searchTool, upsertMemoryTool];

const toolNode = new ToolNode(tools);

export { tools, toolNode, upsertMemoryTool };
