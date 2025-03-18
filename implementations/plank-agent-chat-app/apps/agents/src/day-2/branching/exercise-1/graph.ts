import { END, START, StateGraph, Annotation } from "@langchain/langgraph";

const StateAnnotation = Annotation.Root({
  aggregate: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
  })
});


const A = () => {
  console.log("A");
  return {
    aggregate: ["A"],
  }
}

const B = () => {
  console.log("B");
  return {
    aggregate: ["B"],
  }
}

const C = () => {
  console.log("C");
  return {
    aggregate: ["C"],
  }
}

const D = () => {
  console.log("D");
  return {
    aggregate: ["D"],
  }
}

const E = () => {
  console.log("E");
  return {
    aggregate: ["E"],
  }
}

const graph = new StateGraph(StateAnnotation)
  .addNode("a", A)
  .addNode("b", B)
  .addNode("c", C)
  .addNode("d", D)
  .addNode("e", E)
  .addEdge(START, "a")
  .addEdge("a", "b")
  .addEdge("a", "c")
  .addEdge("a", "d")
  .addEdge("b", "e")
  .addEdge("c", "e")
  .addEdge("d", "e")
  .addEdge("e", END) 
  .compile();

export { graph };