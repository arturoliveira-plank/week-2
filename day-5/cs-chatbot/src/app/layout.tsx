import { AuthProvider } from '@/contexts/AuthContext';
import Header from '@/app/header';
import './globals.css';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="relative min-h-screen">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-[40rem] -left-[40rem] w-[120rem] h-[120rem] bg-gradient-to-br from-purple-50/30 to-indigo-50/30 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-[40rem] -right-[40rem] w-[120rem] h-[120rem] bg-gradient-to-br from-blue-50/30 to-cyan-50/30 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-full blur-3xl" />
          </div>

          {/* Main content */}
          <div className="relative z-10">
            <AuthProvider>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-8">
                  <div className="relative backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-2xl shadow-xl ring-1 ring-gray-900/5 dark:ring-white/10">
                    <div className="p-6">
                      {children}
                    </div>
                  </div>
                </main>

                {/* Footer */}
                <footer className="mt-auto py-6">
                  <div className="container mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
                    © {new Date().getFullYear()}
                  </div>
                </footer>
              </div>
            </AuthProvider>
          </div>
        </div>
      </body>
    </html>
  );
}