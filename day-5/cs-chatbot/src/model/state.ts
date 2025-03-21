import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  nextRepresentative: Annotation<string>,
  refundAuthorized: Annotation<boolean>,
  memories: Annotation<string[]>,
  tool_calls: Annotation<string[]>,
});

export { StateAnnotation };
