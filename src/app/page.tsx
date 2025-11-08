'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EnhancedSignInButton } from '@/components/EnhancedSignInButton';
import { EnhancedUserMenu } from '@/components/EnhancedUserMenu';
import { useAuth } from '@/components/AuthProvider';
import EnhancedCreateNoteModal from '@/components/EnhancedCreateNoteModal';
import EnhancedNotesList from '@/components/EnhancedNotesList';
import { Plus, Mic, FileText } from 'lucide-react';

export default function HomePage() {
  const { session, isPending, isAuthenticated } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8 sm:mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-6 transform transition-transform duration-300 hover:scale-110">
                <Mic className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Voice to Notes
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Transform your voice into organized notes with AI-powered transcription and summarization.
                <br className="hidden sm:block" />
                Record, transcribe, and organize your thoughts effortlessly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
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

            <EnhancedSignInButton size="lg" fullWidth />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-full flex items-center justify-center">
                <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Voice to Notes</h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <EnhancedUserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Notes</h2>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Manage your voice-recorded notes and transcriptions
              </p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              size="lg"
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Note
            </Button>
          </div>
        </div>

        <EnhancedNotesList />
      </main>

      {/* Create Note Modal */}
      <EnhancedCreateNoteModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
}