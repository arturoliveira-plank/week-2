import Chat from '@/components/Chat';

export default function Home() {
  return (
    <main className="h-screen overflow-hidden bg-gray-50">
      <div className="container mx-auto h-full py-4">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-4">AI Chatbot</h1>
        <Chat />
      </div>
    </main>
  );
}
