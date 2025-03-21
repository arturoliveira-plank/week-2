import { NextResponse } from 'next/server';
import { graph } from '../../../model/graph';
import { StateAnnotation } from '../../../model/state';
import { HumanMessage } from '@langchain/core/messages';
import { v4 as uuidv4 } from 'uuid';

export const POST = async (req: Request) => {
  try {
    const { message, threadId } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Use the provided threadId or generate a new one
    const currentThreadId = threadId || uuidv4();
    console.log('currentThreadId', currentThreadId);
    const result = await graph.invoke({
      messages: [new HumanMessage(message)],
    }, {
      configurable: {
        thread_id: currentThreadId,
      },
    });

    const aiMessage = result;
    return NextResponse.json({
      ...aiMessage,
      threadId: currentThreadId,
    });
  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}; 