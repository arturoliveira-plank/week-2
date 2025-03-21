import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema"; // Unused here, but kept for completeness
import { StateAnnotation } from "../state";
import llm from "../llm-call";
import { CATEGORIZATION_SYSTEM_TEMPLATE, CATEGORIZATION_HUMAN_TEMPLATE, SYSTEM_TEMPLATE } from "../prompts";
export const initialSupport = async (state: typeof StateAnnotation.State) => {

  // Get the support response   
  console.log("using SUPPORT AGENT", state.messages);
  const supportResponse = await llm.invoke([
    { role: "system", content: SYSTEM_TEMPLATE },
    ...state.messages,
  ]);


  // Get the categorization response
  console.log("using SECRETARY AGENT", state.messages);
  const categorizationResponse = await llm.invoke(
    [
      { role: "system", content: CATEGORIZATION_SYSTEM_TEMPLATE },
      // Include the support response in the conversation history
      ...state.messages,
      { role: "assistant", content: supportResponse.content as string }, // Assuming supportResponse has a content field
      { role: "user", content: CATEGORIZATION_HUMAN_TEMPLATE },
    ],
    {
      response_format: { type: "json_object" },
    }
  );

  // Define the schema for validation
  const schema = z.object({
    nextRepresentative: z.enum(["BILLING", "TECHNICAL", "RESPOND"]),
  });

  // Handle the categorization response
  let categorizationOutput;
  try {
    // Assuming categorizationResponse is an object with a `content` field that’s a JSON string
    if (typeof categorizationResponse.content === "string") {
      console.log("categorizationResponse.content", categorizationResponse.content);
      categorizationOutput = schema.parse(JSON.parse(categorizationResponse.content));
    } else {
      // If the response is already an object, parse it directly
      categorizationOutput = schema.parse(categorizationResponse);
    }
  } catch (error) {
    console.error("Failed to parse categorization response:", error);
    throw new Error("Invalid categorization response format");
  }

  // Return the updated state
  return {
    messages: [supportResponse], // Assuming supportResponse is a message object
    nextRepresentative: categorizationOutput.nextRepresentative,
  };
};