import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema"; // Unused here, but kept for completeness
import { StateAnnotation } from "../state";
import llm from "../llm-call";

export const initialSupport = async (state: typeof StateAnnotation.State) => {
  // System prompt for the frontline support staff
  const SYSTEM_TEMPLATE = `You are frontline support staff for LangCorp, a company that sells computers.
Be concise in your responses.
You can chat with customers and help them with basic questions, but if the customer is having a billing or technical problem,
do not try to answer the question directly or gather information.
Instead, immediately transfer them to the billing or technical team by asking the user to hold for a moment.
Otherwise, just respond conversationally.`;

  // Get the support response
  const supportResponse = await llm.invoke([
    { role: "system", content: SYSTEM_TEMPLATE },
    ...state.messages,
  ]);

  // System prompt for categorization
  const CATEGORIZATION_SYSTEM_TEMPLATE = `You are an expert customer support routing system.
Your job is to detect whether a customer support representative is routing a user to a billing team or a technical team, or if they are just responding conversationally.`;

  // User prompt for categorization
  const CATEGORIZATION_HUMAN_TEMPLATE = `The previous conversation is an interaction between a customer support representative and a user.
Extract whether the representative is routing the user to a billing or technical team, or whether they are just responding conversationally.
Respond with a JSON object containing a single key called "nextRepresentative" with one of the following values:
- "BILLING" if they want to route the user to the billing team
- "TECHNICAL" if they want to route the user to the technical team
- "RESPOND" if they are responding conversationally`;

  // Get the categorization response
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