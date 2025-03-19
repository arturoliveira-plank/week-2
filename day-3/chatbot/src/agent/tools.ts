import { ToolNode } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const searchTool = tool(async ({}: { query: string }) => {
  // This is a placeholder for the actual implementation
  return "Cold, with a low of 13 ℃";
}, {
  name: "search",
  description:
    "Use to surf the web, fetch current information, check the weather, and retrieve other information.",
  schema: z.object({
    query: z.string().describe("The query to use in your search."),
  }),
});

await searchTool.invoke({ query: "What's the weather like?" });

const tools = [searchTool];

const toolNode = new ToolNode(tools);

export { tools, toolNode };
