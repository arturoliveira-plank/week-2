export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatState {
  messages: Message[];
  currentMessage: string;
  isLoading: boolean;
} 