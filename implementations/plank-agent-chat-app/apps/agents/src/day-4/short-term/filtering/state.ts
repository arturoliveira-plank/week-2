import { Annotation } from "@langchain/langgraph";

const GraphState = Annotation.Root({
  messages: Annotation<any[]>({
    reducer: (
      existing: string[],
      updates: string[] | { type: string; from: number; to?: number }
    ) => {
      if (Array.isArray(updates)) {
        // Normal case, add to the history
        return [...existing, ...updates];
      } else if (typeof updates === "object" && updates.type === "keep") {
        // You get to decide what this looks like.
        // For example, you could simplify and just accept a string "DELETE"
        // and clear the entire list.
        return existing.slice(updates.from, updates.to);
      }
      // etc. We define how to interpret updates
      return existing;
    },
    default: () => [],
  }),
});

export { GraphState };
