import { StateAnnotation } from "../state";
import llm from "../llm-call";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema"; // Kept for potential future use
import { CATEGORIZATION_HUMAN_TEMPLATE_BILLING, SYSTEM_TEMPLATE_BILLING  } from "../prompts";

export const billingSupport = async (state: typeof StateAnnotation.State) => {

  // Trim the history to remove the last AI message, if present, to keep focus on the user's question
  let trimmedHistory = state.messages;
  if (trimmedHistory.at(-1)?._getType() === "ai") {
    trimmedHistory = trimmedHistory.slice(0, -1);
  }

  // Get the billing support response
  console.log("using BILLING AGENT", trimmedHistory);
  const billingRepResponse = await llm.invoke([
    {
      role: "system",
      content: SYSTEM_TEMPLATE_BILLING,
    },
    ...trimmedHistory,
  ]);

  // Categorization system prompt
  const CATEGORIZATION_SYSTEM_TEMPLATE = `Your job is to detect whether a billing support representative wants to refund the user.`;

  // Categorization user prompt
  const CATEGORIZATION_HUMAN_TEMPLATE = CATEGORIZATION_HUMAN_TEMPLATE_BILLING(billingRepResponse.content as string);

  // Get the categorization response
  const categorizationResponse = await llm.invoke(
    [
      {
        role: "system",
        content: CATEGORIZATION_SYSTEM_TEMPLATE,
      },
      {
        role: "user",
        content: CATEGORIZATION_HUMAN_TEMPLATE,
      },
    ],
    {
      response_format: { type: "json_object" }, // Simplified for GPT compatibility
    }
  );

  // Define the schema for validation
  const schema = z.object({
    nextRepresentative: z.enum(["REFUND", "RESPOND"]),
  });

  // Parse and validate the categorization response
  let categorizationOutput;
  try {
    // Assuming GPT returns an object with a `content` field as a JSON string
    if (typeof categorizationResponse.content === "string") {
      categorizationOutput = schema.parse(JSON.parse(categorizationResponse.content));
    } else {
      // If the response is already an object
      categorizationOutput = schema.parse(categorizationResponse);
    }
  } catch (error) {
    console.error("Failed to parse categorization response:", error);
    throw new Error("Invalid categorization response format");
  }

  return {
    messages: [billingRepResponse], // Wrap in array assuming state.messages expects an array
    nextRepresentative: categorizationOutput.nextRepresentative,
  };
};