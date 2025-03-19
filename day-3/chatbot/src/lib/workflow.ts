import llm from "@/agent/llm-call";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatPromptTemplate } from "@langchain/core/prompts";

// Define the state interface
interface WorkflowState {
  messages: { role: string; content: string }[];
  currentMessage: string;
}

// Create the prompt template
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful AI assistant. Provide clear and concise responses."],
  ["human", "{input}"],
]);

// Create the chain
const chain = RunnableSequence.from([
  prompt,
  llm,
]);

// Define the processing function
export async function processMessage(state: WorkflowState) {
  const response = await chain.invoke({
    input: state.currentMessage,
  });

  return {
    messages: [
      ...state.messages,
      { role: "user", content: state.currentMessage },
      { role: "assistant", content: response.content },
    ],
    currentMessage: "",
  };
} 