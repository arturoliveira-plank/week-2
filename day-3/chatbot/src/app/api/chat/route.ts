import { NextResponse } from 'next/server';
import { processMessage } from '@/agent/graph';

export const POST = async (req: Request) => {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    const result = await processMessage([message]);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}; 