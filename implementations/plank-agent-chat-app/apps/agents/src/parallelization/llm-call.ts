import { ChatOpenAI } from "@langchain/openai";
import 'dotenv/config';


const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  openAIApiKey: process.env.OPENAI_API_KEY,
});

export default llm;
