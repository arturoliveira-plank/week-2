import Chat from '@/components/Chat';

export default function Home() {
  return (
    <main className="h-screen overflow-hidden bg-gray-50">
      <div className="container mx-auto h-full py-4">
        <Chat />
      </div>
    </main>
  );
}
