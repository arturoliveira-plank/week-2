import { Annotation } from "@langchain/langgraph";
import { z } from "zod";

export const sectionSchema = z.object({
  name: z.string().describe("Name for this section of the report."),
  description: z.string().describe(
    "Brief overview of the main topics and concepts to be covered in this section."
  ),
});

export const sectionsSchema = z.object({
  sections: z.array(sectionSchema).describe("Sections of the report."),
});

// Node state
export const StateAnnotation = Annotation.Root({
  topic: Annotation<string>,
  sections: Annotation<Array<z.infer<typeof sectionSchema>>>,
  completedSections: Annotation<string[]>({
    default: () => [],
    reducer: (a, b) => a.concat(b),
  }),
  finalReport: Annotation<string>,
});

// Worker state
export const WorkerStateAnnotation = Annotation.Root({
  section: Annotation<z.infer<typeof sectionSchema>>,
  completedSections: Annotation<string[]>({
    default: () => [],
    reducer: (a, b) => a.concat(b),
  }),
});