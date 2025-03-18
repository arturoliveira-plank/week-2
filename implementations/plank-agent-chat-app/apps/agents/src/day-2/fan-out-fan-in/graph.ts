import { END, START, StateGraph, Annotation } from "@langchain/langgraph";

const StateAnnotation = Annotation.Root({
  aggregate: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
  })
});

// Create the graph
const nodeA = (state: typeof StateAnnotation.State) => {
  console.log(`Adding I'm A to ${state.aggregate}`);
  return { aggregate: [`I'm A`] };
};
const nodeB = (state: typeof StateAnnotation.State) => {
  console.log(`Adding I'm B to ${state.aggregate}`);
  return { aggregate: [`I'm B`] };
};
const nodeC = (state: typeof StateAnnotation.State) => {
  console.log(`Adding I'm C to ${state.aggregate}`);
  return { aggregate: [`I'm C`] };
};
const nodeD = (state: typeof StateAnnotation.State) => {
  console.log(`Adding I'm D to ${state.aggregate}`);
  return { aggregate: [`I'm D`] };
};

const builder = new StateGraph(StateAnnotation)
  .addNode("a", nodeA)       // Add node A
  .addEdge(START, "a")       // Start → A
  .addNode("b", nodeB)       // Add node B
  .addNode("c", nodeC)       // Add node C
  .addNode("d", nodeD)       // Add node D
  .addEdge("a", "b")         // A → B
  .addEdge("a", "c")         // A → C (this creates the fan-out)
  .addEdge("b", "d")         // B → D
  .addEdge("c", "d")         // C → D (this is the fan-in)
  .addEdge("d", END);        // D → End

const graph = builder.compile();

export { graph };