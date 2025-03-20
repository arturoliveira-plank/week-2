import { ChatOpenAI } from "@langchain/openai";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { tools } from "./tools";

import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const checkpointer = new PostgresSaver(pool);

// NOTE: you need to call .setup() the first time you're using your checkpointer

await checkpointer.setup();

export { checkpointer };

// const graph = createReactAgent({
//   tools: tools,
//   llm: new ChatOpenAI({
//     model: "gpt-4o-mini",
//   }),
//   checkpointSaver: checkpointer,
// });
// const config = { configurable: { thread_id: "1" } };

// await graph.invoke({
//   messages: [{
//     role: "user",
//     content: "what's the weather in sf"
//   }],
// }, config);