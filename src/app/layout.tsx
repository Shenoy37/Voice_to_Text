import type { Metadata } from 'next';
import localFont from "next/font/local";
import './globals.css';
import { QueryProvider } from '@/components/QueryProvider';
import { AuthProvider } from '@/components/AuthProvider';

const inter = localFont({
  src: [
    {
      path: "../Inter-VariableFont_opszwght.ttf",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../Inter-Italic-VariableFont_opszwght.ttf",
      weight: "100 900",
      style: "italic",
    },
  ],
  variable: "--font-inter",
  display: "swap",
});

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
    <html lang="en" >
      <body className={`${inter.variable}`}>
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}