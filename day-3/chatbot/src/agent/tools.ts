import { ToolNode } from "@langchain/langgraph/prebuilt";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";

const searchTool = new TavilySearchResults({
  apiKey: process.env.TAVILY_API_KEY,
});

const tools = [searchTool];

const toolNode = new ToolNode(tools);

export { tools, toolNode };
