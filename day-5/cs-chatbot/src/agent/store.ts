import { TensorFlowEmbeddings } from "@langchain/community/embeddings/tensorflow";
import { InMemoryStore } from "@langchain/langgraph";
import "@tensorflow/tfjs-backend-cpu";

const embeddings = new TensorFlowEmbeddings();

const store = new InMemoryStore({
  index: {
    embeddings,
    dims: 1536,
  },
});

export default store;