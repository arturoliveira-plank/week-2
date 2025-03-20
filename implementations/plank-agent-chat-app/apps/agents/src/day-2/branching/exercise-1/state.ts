import { Annotation } from "@langchain/langgraph";

// Node state
export const StateAnnotation = Annotation.Root({
  joke: Annotation<string>,
  topic: Annotation<string>,
  feedback: Annotation<string>,
  funnyOrNot: Annotation<string>,
});

