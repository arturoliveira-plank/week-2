export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatState {
  messages: Message[];
  currentMessage: string;
  isLoading: boolean;
  currentThreadId: string | null;
  threads: ChatThread[];
} 