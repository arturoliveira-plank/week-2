import { NextResponse } from 'next/server';
import { processMessage } from '@/lib/workflow';

export async function POST(req: Request) {
  try {
    const { messages, currentMessage } = await req.json();

    const result = await processMessage({
      messages,
      currentMessage,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
} 