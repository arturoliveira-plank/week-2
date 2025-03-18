import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

type ScoredValue = {
  value: string;
  score: number;
};

const reduceFanouts = (left?: ScoredValue[], right?: ScoredValue[]) => {
  if (!left) {
    left = [];
  }
  if (!right || right?.length === 0) {
    // Overwrite. Similar to redux.
    return [];
  }
  return left.concat(right);
};

const StableSortingAnnotation = Annotation.Root({
  aggregate: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
  }),
  which: Annotation<string>({
    reducer: (x: string, y: string) => (y ?? x),
  }),
  fanoutValues: Annotation<ScoredValue[]>({
    reducer: reduceFanouts,
  }),
})


class ParallelReturnNodeValue {
  private _value: string;
  private _score: number;

  constructor(nodeSecret: string, score: number) {
    this._value = nodeSecret;
    this._score = score;
  }

  public call(state: typeof StableSortingAnnotation.State) {
    console.log(`Adding ${this._value} to ${state.aggregate}`);
    return { fanoutValues: [{ value: this._value, score: this._score }] };
  }
}

// Create the graph

const nodeA3 = (state: typeof StableSortingAnnotation.State) => {
  console.log(`Adding I'm A to ${state.aggregate}`);
  return { aggregate: ["I'm A"] };
};

const nodeB3 = new ParallelReturnNodeValue("I'm B", 0.1);
const nodeC3 = new ParallelReturnNodeValue("I'm C", 0.9);
const nodeD3 = new ParallelReturnNodeValue("I'm D", 0.3);

const aggregateFanouts = (state: typeof StableSortingAnnotation.State) => {
  // Sort by score (reversed)
  state.fanoutValues.sort((a, b) => b.score - a.score);
  return {
    aggregate: state.fanoutValues.map((v) => v.value).concat(["I'm E"]),
    fanoutValues: [],
  };
};

// Define the route function
function routeBCOrCD(state: typeof StableSortingAnnotation.State): string[] {
  if (state.which === "cd") {
    return ["c", "d"];
  }
  return ["b", "c"];
}

const builder3 = new StateGraph(StableSortingAnnotation)
  .addNode("a", nodeA3)
  .addEdge(START, "a")
  .addNode("b", nodeB3.call.bind(nodeB3))
  .addNode("c", nodeC3.call.bind(nodeC3))
  .addNode("d", nodeD3.call.bind(nodeD3))
  .addNode("e", aggregateFanouts)
  .addConditionalEdges("a", routeBCOrCD, ["b", "c", "d"])
  .addEdge("b", "e")
  .addEdge("c", "e")
  .addEdge("d", "e")
  .addEdge("e", END);

const graph = builder3.compile();

export { graph };