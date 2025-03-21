import { ChatOpenAI } from "@langchain/openai";
import 'dotenv/config';
import { upsertMemoryTool } from "./tools";

const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  openAIApiKey: process.env.OPENAI_API_KEY,
}).bindTools([upsertMemoryTool]);

export default llm;
