import llm from "./llm-call";
import { tools } from "./tools";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

const boundModel = llm.bindTools(tools);

export async function processMessage(message: string) {
  const response = await boundModel.invoke([
    new HumanMessage(message)
  ]);

  return {
    messages: [response]
  };
}
