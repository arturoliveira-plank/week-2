import { StateGraph, Annotation } from "@langchain/langgraph";

// Define the state with a reducer
const StateAnnotation = Annotation.Root({
  aggregate: Annotation<string[]>({
    reducer: (a, b) => a.concat(b),
    default: () => [],
  }),
});

// Define nodes
const a = async function (state: typeof StateAnnotation.State) {
  console.log(`Node A sees ${state.aggregate}`);
  return { aggregate: ["A"] };
}

const b = async function (state: typeof StateAnnotation.State) {
  console.log(`Node B sees ${state.aggregate}`);
  return { aggregate: ["B"] };
}

// Define edges
const route = async function (state: typeof StateAnnotation.State) {
  if (state.aggregate.length < 7) {
    return "b";
  } else {
    return "__end__";
  }
}


// Define the graph
const graph = new StateGraph(StateAnnotation)
  .addNode("a", a)
  .addNode("b", b)
  .addEdge("__start__", "a")
  .addConditionalEdges("a", route)
  .addEdge("b", "a")
  .compile();

export { graph };