'use client';

import { useState, useRef, useEffect } from 'react';
import { Message, ChatState, ChatThread } from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';
import { saveThread, getThreads, getThread, supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const LOCAL_STORAGE_KEY = 'chat_threads';

export default function Chat() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<ChatState>({
    messages: [],
    currentMessage: '',
    isLoading: false,
    currentThreadId: null,
    threads: [],
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load threads from Supabase on component mount
  useEffect(() => {
    const loadThreads = async () => {
      try {
        const threads = await getThreads();
        if (threads && threads.length > 0) {
          setState(prev => ({
            ...prev,
            threads: threads.map(thread => ({
              id: thread.id,
              title: thread.title,
              messages: thread.messages,
              createdAt: thread.created_at,
              updatedAt: thread.updated_at,
            })),
          }));
        } else {
          createNewChat();
        }
      } catch (error) {
        console.error('Error loading threads:', error);
        createNewChat();
      }
    };
    if (user) {
      loadThreads();
    }
  }, [user]);

  // Save threads to local storage whenever they change
  useEffect(() => {
    if (user) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state.threads));
    }
  }, [state.threads, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (user) {
      scrollToBottom();
    }
  }, [state.messages, user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!user) {
    return null;
  }

  const createNewChat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No user logged in');
      return;
    }

    const newThread: ChatThread = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveThread({
        id: newThread.id,
        user_id: user.id,
        title: newThread.title,
        messages: newThread.messages,
        created_at: newThread.createdAt,
        updated_at: newThread.updatedAt,
      });

      setState(prev => ({
        ...prev,
        threads: [...prev.threads, newThread],
        currentThreadId: newThread.id,
        messages: [],
        currentMessage: '',
      }));
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const switchThread = async (threadId: string) => {
    try {
      const thread = await getThread(threadId);
      if (thread) {
        setState(prev => ({
          ...prev,
          currentThreadId: threadId,
          messages: thread.messages,
          currentMessage: '',
        }));
      }
    } catch (error) {
      console.error('Error switching thread:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.currentMessage.trim() || state.isLoading) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': session.access_token,
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

      // Save the updated thread to Supabase
      const currentThread = updatedThreads.find(t => t.id === state.currentThreadId);
      if (currentThread) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('No user logged in');
        }

        await saveThread({
          id: currentThread.id,
          user_id: user.id,
          title: currentThread.title,
          messages: currentThread.messages,
          created_at: currentThread.createdAt,
          updated_at: currentThread.updatedAt,
        });
      }

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

  const deleteCurrentChat = async () => {
    if (!currentThread) return;
    
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('threads')
        .delete()
        .eq('id', currentThread.id);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        threads: prev.threads.filter(t => t.id !== currentThread.id),
        currentThreadId: null,
        messages: [],
        currentMessage: '',
      }));
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  return (
    <div className="flex h-full w-full bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-lg overflow-hidden">
      {/* Sidebar with chat history */}
      <div className="w-72 border-r border-gray-100 bg-white/50 backdrop-blur-sm flex flex-col">
        <div className="p-6">
          <button
            onClick={createNewChat}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg mb-6 font-medium flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-2">
            {state.threads.map((thread) => (
              <div
                key={thread.id}
                className="group relative"
              >
                <button
                  onClick={() => switchThread(thread.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                    thread.id === state.currentThreadId
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  {thread.title}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (thread.id === state.currentThreadId) {
                      deleteCurrentChat();
                    } else {
                      setState(prev => ({
                        ...prev,
                        threads: prev.threads.filter(t => t.id !== thread.id)
                      }));
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat header */}
        <div className="border-b border-gray-100 p-6 bg-gradient-to-r from-white to-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              {currentThread ? currentThread.title : 'Welcome to Chat'}
            </h2>
            {currentThread && (
              <button
                onClick={deleteCurrentChat}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Delete Chat
              </button>
            )}
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-white to-gray-50">
          <div className="space-y-6">
            {(state.messages || []).map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                } animate-fade-in`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-100'
                  }`}
                >
                  <div className="prose prose-sm max-w-none">
                    {message.content}
                  </div>
                  <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {state.isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-white text-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <form onSubmit={handleSubmit} className="flex gap-3 p-6 bg-white border-t border-gray-100">
          <input
            type="text"
            value={state.currentMessage}
            onChange={(e) => setState(prev => ({ ...prev, currentMessage: e.target.value }))}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-400"
            disabled={state.isLoading}
          />
          <button
            type="submit"
            disabled={state.isLoading || !state.currentMessage.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
} 