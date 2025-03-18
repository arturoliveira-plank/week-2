import { Annotation, Command, START, StateGraph } from "@langchain/langgraph";

// Define graph state
const StateAnnotation = Annotation.Root({
  foo: Annotation<string>,
});

// Define the nodes
const nodeA = async (_state: typeof StateAnnotation.State) => {
  console.log("Called A");
  // this is a replacement for a real conditional edge function
  const goto = Math.random() > .5 ? "nodeB" : "nodeC";
  // note how Command allows you to BOTH update the graph state AND route to the next node
  return new Command({
    // this is the state update
    update: {
      foo: "a",
    },
    // this is a replacement for an edge
    goto,
  });
};

// Nodes B and C are unchanged
const nodeB = async (state: typeof StateAnnotation.State) => {
  console.log("Called B");
  return {
    foo: state.foo + "|b",
  };
}

const nodeC = async (state: typeof StateAnnotation.State) => {
  console.log("Called C");
  return {
    foo: state.foo + "|c",
  };
}

const graph = new StateGraph(StateAnnotation)
  .addNode("nodeA", nodeA, {
    ends: ["nodeB", "nodeC"],
  })
  .addNode("nodeB", nodeB)
  .addNode("nodeC", nodeC)
  .addEdge(START, "nodeA")
  .compile();

export { graph };