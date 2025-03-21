import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const checkpointer = new PostgresSaver(pool);

await checkpointer.setup();

export { checkpointer };
