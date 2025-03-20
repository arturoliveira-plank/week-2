import { MessagesAnnotation, Annotation } from "@langchain/langgraph";

const MyGraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  summary: Annotation<string>,
});

export { MyGraphAnnotation };