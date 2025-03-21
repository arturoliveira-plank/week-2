import { InMemoryStore } from "@langchain/langgraph";
import { OpenAIEmbeddings } from "@langchain/openai";
import "@tensorflow/tfjs-backend-cpu";

const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-small" });

const store = new InMemoryStore({
  index: {
    embeddings,
    dims: 1536,
  },
});

export default store;