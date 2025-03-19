'use client';

import { useState, useRef, useEffect } from 'react';
import { Message, ChatState, ChatThread } from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';

export default function Chat() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    currentMessage: '',
    isLoading: false,
    currentThreadId: null,
    threads: [],
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  const createNewChat = () => {
    const newThread: ChatThread = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      threads: [...prev.threads, newThread],
      currentThreadId: newThread.id,
      messages: [],
      currentMessage: '',
    }));
  };

  const switchThread = (threadId: string) => {
    const thread = state.threads.find(t => t.id === threadId);
    if (thread) {
      setState(prev => ({
        ...prev,
        currentThreadId: threadId,
        messages: thread.messages,
        currentMessage: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.currentMessage.trim() || state.isLoading) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: state.currentMessage,
          threadId: state.currentThreadId,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      const newMessages: Message[] = [
        ...(state.messages || []),
        { role: 'user' as const, content: state.currentMessage },
        { role: 'assistant' as const, content: data.messages[data.messages.length - 1].kwargs.content }
      ];

      // Update the thread in the threads array
      const updatedThreads = state.threads.map(thread => {
        if (thread.id === state.currentThreadId) {
          return {
            ...thread,
            messages: newMessages,
            updatedAt: new Date().toISOString(),
          };
        }
        return thread;
      });

      setState(prev => ({
        ...prev,
        messages: newMessages,
        currentMessage: '',
        isLoading: false,
        threads: updatedThreads,
      }));

      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const currentThread = state.threads.find(t => t.id === state.currentThreadId);

  return (
    <div className="flex h-[calc(100%-4rem)] w-full max-w-4xl mx-auto">
      {/* Sidebar with chat history */}
      <div className="w-64 border-r border-gray-200 p-4">
        <button
          onClick={createNewChat}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mb-4"
        >
          New Chat
        </button>
        <div className="space-y-2">
          {state.threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => switchThread(thread.id)}
              className={`w-full text-left px-4 py-2 rounded-lg ${
                thread.id === state.currentThreadId
                  ? 'bg-blue-100 text-blue-800'
                  : 'hover:bg-gray-100'
              }`}
            >
              {thread.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {currentThread ? currentThread.title : ''}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 p-4">
          {(state.messages || []).map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {state.isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-800 rounded-lg p-4">
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2 p-4">
          <input
            type="text"
            value={state.currentMessage}
            onChange={(e) =>
              setState(prev => ({ ...prev, currentMessage: e.target.value }))
            }
            placeholder="Type your message..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={state.isLoading}
          />
          <button
            type="submit"
            disabled={state.isLoading || !state.currentMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
} 