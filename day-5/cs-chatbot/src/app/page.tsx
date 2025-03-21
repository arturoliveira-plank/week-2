import Chat from '@/components/Chat';

export default function Home() {
  return (
    <main className="h-[calc(100vh-16rem)] overflow-hidden bg-gray-50">
      <div className="h-full flex items-center justify-center p-4">
        <div className="w-full h-full max-w-1xl">
          <Chat />
        </div>
      </div>
    </main>
  );
}
