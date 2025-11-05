'use client';

import { useState, useEffect } from 'react';
// import { AuthProvider, useAuth } from 'better-auth/react';
import { } from 'better-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CreateNoteModal from '@/components/CreateNoteModal';
import NotesList from '@/components/NotesList';
import { Plus, LogIn, LogOut, Mic, FileText } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

export default function HomePage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { data: session, isPending } = authClient.useSession();

  const handleLogin = async () => {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/',
    });
  };

  const handleLogout = async () => {
    await authClient.signOut();
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-6">
                <Mic className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Voice to Notes
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Transform your voice into organized notes with AI-powered transcription and summarization.
                Record, transcribe, and organize your thoughts effortlessly.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="w-5 h-5" />
                    Voice Recording
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Record your voice using our intuitive interface.
                    Supports multiple audio formats for maximum flexibility.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    AI Transcription
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Powered by OpenAI Whisper for accurate transcription
                    and intelligent summarization of your recordings.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Organize & Edit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Edit and organize your notes with our beautiful interface.
                    Search, paginate, and manage your thoughts efficiently.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Button
              onClick={handleLogin}
              size="lg"
              className="px-8"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign in with Google
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Mic className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Voice to Notes</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img
                  src={session.user.image || ''}
                  alt={session.user.name || ''}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium text-gray-700">
                  {session.user.name}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Your Notes</h2>
              <p className="text-gray-600 mt-1">
                Manage your voice-recorded notes and transcriptions
              </p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              size="lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Note
            </Button>
          </div>
        </div>

        <NotesList />
      </main>

      {/* Create Note Modal */}
      <CreateNoteModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
}