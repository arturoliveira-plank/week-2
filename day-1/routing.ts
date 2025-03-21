import { StateGraph, Annotation } from "@langchain/langgraph";
import { z } from "zod";
import llm from "./llm-call";

// Schema for structured output to use as routing logic
const routeSchema = z.object({
  step: z.enum(["poem", "story", "joke"]).describe(
    "The next step in the routing process"
  ),
});

// Augment the LLM with schema for structured output
const router = llm.withStructuredOutput(routeSchema);

// Graph state
const StateAnnotation = Annotation.Root({
  input: Annotation<string>,
  decision: Annotation<string>,
  output: Annotation<string>,
});

// Nodes
// Write a story
async function llmCall1(state: typeof StateAnnotation.State) {
  const result = await llm.invoke([{
    role: "system",
    content: "You are an expert storyteller.",
  }, {
    role: "user",
    content: state.input
  }]);
  return { output: result.content };
}

// Write a joke
async function llmCall2(state: typeof StateAnnotation.State) {
  const result = await llm.invoke([{
    role: "system",
    content: "You are an expert comedian.",
  }, {
    role: "user",
    content: state.input
  }]);
  return { output: result.content };
}

// Write a poem
async function llmCall3(state: typeof StateAnnotation.State) {
  const result = await llm.invoke([{
    role: "system",
    content: "You are an expert poet.",
  }, {
    role: "user",
    content: state.input
  }]);
  return { output: result.content };
}

async function llmCallRouter(state: typeof StateAnnotation.State) {
  // Route the input to the appropriate node
  const decision = await router.invoke([
    {
      role: "system",
      content: "Route the input to story, joke, or poem based on the user's request."
    },
    {
      role: "user",
      content: state.input
    },
  ]);

  return { decision: decision.step };
}

// Conditional edge function to route to the appropriate node
function routeDecision(state: typeof StateAnnotation.State): string {
  // Return the node name you want to visit next
  if (state.decision === "story") {
    return "llmCall1";
  } else if (state.decision === "joke") {
    return "llmCall2";
  } else if (state.decision === "poem") {
    return "llmCall3";
  }
  return "__end__";
}

async function main() {
  const routerWorkflow = new StateGraph(StateAnnotation)
    .addNode("llmCall1", llmCall1)
    .addNode("llmCall2", llmCall2)
    .addNode("llmCall3", llmCall3)
    .addNode("llmCallRouter", llmCallRouter)
    .addEdge("__start__", "llmCallRouter")
    .addConditionalEdges("llmCallRouter", routeDecision, [
      "llmCall1",
      "llmCall2",
      "llmCall3"])
    .addEdge("llmCall1", "__end__")
    .addEdge("llmCall2", "__end__")
    .addEdge("llmCall3", "__end__")
    .compile();

  const result = await routerWorkflow.invoke({ input: "dogs" });
  console.log(result);
}

main().catch(console.error);

