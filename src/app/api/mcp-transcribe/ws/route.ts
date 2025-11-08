import { NextRequest } from 'next/server';

// Simple WebSocket status endpoint
export async function GET(request: NextRequest) {
    return new Response(JSON.stringify({
        message: 'WebSocket support is integrated into the main MCP transcription endpoint',
        usage: 'Use the main /api/mcp-transcribe endpoint with real-time progress polling',
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}