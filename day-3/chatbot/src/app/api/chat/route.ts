import { NextResponse } from 'next/server';
import { graph } from '@/agent/graph';
import { GraphState } from '@/agent/state';
import { HumanMessage } from '@langchain/core/messages';
import { v4 as uuidv4 } from 'uuid';
export const POST = async (req: Request) => {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    const result = await graph.invoke({
      messages: [new HumanMessage(message)],
    }, {
      configurable: {
        thread_id: "123",
      },
    });
    const aiMessage = result;
    return NextResponse.json(aiMessage);
  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}; 