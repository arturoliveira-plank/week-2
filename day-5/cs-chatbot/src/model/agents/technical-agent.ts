import llm from "../llm-call";
import { SYSTEM_TEMPLATE_TECHNICAL } from "../prompts";
import { StateAnnotation } from "../state";

export const technicalSupport = async (state: typeof StateAnnotation.State) => {

  
    let trimmedHistory = state.messages;
    // Make the user's question the most recent message in the history.
    // This helps small models stay focused.
    if (trimmedHistory.at(-1)?._getType() === "ai") {
      trimmedHistory = trimmedHistory.slice(0, -1);
    }

    console.log("using TECHNICAL AGENT", trimmedHistory);
  
    const response = await llm.invoke([
      {
        role: "system",
        content: SYSTEM_TEMPLATE_TECHNICAL,
      },
      ...trimmedHistory,
    ]);
  
    return {
      messages: response,
    };
  };