import type { Metadata } from 'next';
// import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/QueryProvider';
import { AuthProvider } from '@/components/AuthProvider';

// const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Voice to Notes',
  description: 'Transform your voice into organized notes with AI-powered transcription and summarization.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}