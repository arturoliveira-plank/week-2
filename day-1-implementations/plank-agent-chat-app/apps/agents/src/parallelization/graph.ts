import { StateAnnotation } from "./state.js";
import llm from "./llm-call.js";
import { StateGraph } from "@langchain/langgraph";

async function generateJoke(state: typeof StateAnnotation.State) {
  const msg = await llm.invoke(`Write a short joke about ${state.topic}`);
  return { joke: msg.content };
}

async function generateStory(state: typeof StateAnnotation.State) {
  const msg = await llm.invoke(`Write a short story about ${state.topic}`);
  return { story: msg.content };
}

async function generatePoem(state: typeof StateAnnotation.State) {
  const msg = await llm.invoke(`Write a short poem about ${state.topic}`);
  return { poem: msg.content };
}

async function aggregateOutput(state: typeof StateAnnotation.State) {
  const combined = `Here's a story, joke, and poem about ${state.topic}!\n\n` +
    `STORY:\n${state.story}\n\n` +
    `JOKE:\n${state.joke}\n\n` +
    `POEM:\n${state.poem}`;
  return { combinedOutput: combined };
}

const workflow = new StateGraph(StateAnnotation)
  .addNode("generateJoke", generateJoke)
  .addNode("generateStory", generateStory)
  .addNode("generatePoem", generatePoem)
  .addNode("aggregateOutput", aggregateOutput)
  .addEdge("__start__", "generateJoke")
  .addEdge("__start__", "generateStory")
  .addEdge("__start__", "generatePoem")
  .addEdge("generateJoke", "aggregateOutput")
  .addEdge("generateStory", "aggregateOutput")
  .addEdge("generatePoem", "aggregateOutput")
  .addEdge("aggregateOutput", "__end__");
// Finally, we compile it!
// This compiles it into a graph you can invoke and deploy.
export const graph = workflow.compile({
  interruptBefore: [], // if you want to update the state before calling the tools
  interruptAfter: [],
});