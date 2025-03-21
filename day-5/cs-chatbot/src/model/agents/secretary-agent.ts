import { z } from "zod";
import { StateAnnotation } from "../state";
import llm from "../llm-call";
import { CATEGORIZATION_SYSTEM_TEMPLATE, CATEGORIZATION_HUMAN_TEMPLATE, SYSTEM_TEMPLATE } from "../prompts";
import { BaseMessage, AIMessage } from "@langchain/core/messages"; // Import necessary types

export const initialSupport = async (state: typeof StateAnnotation.State) => {
  // Get the latest message (typed as BaseMessage)
  const latestMessage: BaseMessage = state.messages[state.messages.length - 1];
  
  // Safely extract content (handle string or complex content)
  const latestMessageContent: string = typeof latestMessage.content === "string"
    ? latestMessage.content
    : Array.isArray(latestMessage.content)
      ? latestMessage.content.map(item => {
          if (typeof item === "object" && item !== null && "text" in item) {
            return item.text || "";
          }
          return ""; // Fallback for items without text property
        }).join(" ") // Handle complex content
      : String(latestMessage.content); // Fallback for other types

  // Logic to save a memory if the user mentions a preference or fact
  let toolCalls: { name: string; args: { content: string } }[] = [];
  if (latestMessageContent.toLowerCase().includes("remember") || latestMessageContent.toLowerCase().includes("i like")) {
    const memoryContent = `User said: "${latestMessageContent}"`;
    toolCalls = [{
      name: "upsert_memory",
      args: { content: memoryContent },
    }];
  }

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
      ...state.messages,
      { role: "assistant", content: supportResponse.content as string },
      { role: "user", content: CATEGORIZATION_HUMAN_TEMPLATE },
    ],
    {
      response_format: { type: "json_object" },
    }
  );

  console.log("categorizationResponseeee", categorizationResponse);

  // Define the schema for validation
  const schema = z.object({
    nextRepresentative: z.enum(["BILLING", "TECHNICAL", "RESPOND"]),
  });

  // Handle the categorization response
  let categorizationOutput;
  try {
    // Check if the content is a string and not empty
    if (typeof categorizationResponse.content === "string" && categorizationResponse.content.trim() !== "") {
      console.log("categorizationResponse.content", categorizationResponse.content);
      categorizationOutput = schema.parse(JSON.parse(categorizationResponse.content));
    } else {
      console.error("Empty or invalid categorization response content");
      throw new Error("Empty or invalid categorization response content");
    }
  } catch (error) {
    console.error("Failed to parse categorization response:", error);
    throw new Error("Invalid categorization response format");
  }

  // Return the updated state
  return {
    messages: [supportResponse], // Ensure this is a BaseMessage or compatible
    nextRepresentative: categorizationOutput.nextRepresentative,
    ...(toolCalls.length > 0 && { tool_calls: toolCalls }), // Add tool calls if present
  };
};