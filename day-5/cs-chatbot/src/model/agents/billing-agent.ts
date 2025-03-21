import { StateAnnotation } from "../state";
import llm from "../llm-call";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema"; // Kept for potential future use

export const billingSupport = async (state: typeof StateAnnotation.State) => {
  const SYSTEM_TEMPLATE = `You are an expert billing support specialist for LangCorp, a company that sells computers.
Help the user to the best of your ability, but be concise in your responses.
You have the ability to authorize refunds, which you can do by transferring the user to another agent who will collect the required information.
If you do, assume the other agent has all necessary information about the customer and their order.
You do not need to ask the user for more information.

Help the user to the best of your ability, but be concise in your responses.`;

  // Trim the history to remove the last AI message, if present, to keep focus on the user's question
  let trimmedHistory = state.messages;
  if (trimmedHistory.at(-1)?._getType() === "ai") {
    trimmedHistory = trimmedHistory.slice(0, -1);
  }

  // Get the billing support response
  const billingRepResponse = await llm.invoke([
    {
      role: "system",
      content: SYSTEM_TEMPLATE,
    },
    ...trimmedHistory,
  ]);

  // Categorization system prompt
  const CATEGORIZATION_SYSTEM_TEMPLATE = `Your job is to detect whether a billing support representative wants to refund the user.`;

  // Categorization user prompt
  const CATEGORIZATION_HUMAN_TEMPLATE = `The following text is a response from a customer support representative.
Extract whether they want to refund the user or not.
Respond with a JSON object containing a single key called "nextRepresentative" with one of the following values:
- "REFUND" if they want to refund the user
- "RESPOND" if they do not want to refund the user

Here is the text:

<text>
${billingRepResponse.content}
</text>`;

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