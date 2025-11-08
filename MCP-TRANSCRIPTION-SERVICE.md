# MCP Transcription Service Documentation

## Overview

The MCP (Model Context Protocol) Transcription Service provides a robust, scalable solution for live audio transcription using OpenAI Whisper. This service integrates seamlessly with the Voice-to-Notes application, offering real-time transcription capabilities, progress tracking, and queue management.

## Architecture

### Components

1. **MCP Server** (`mcp-server/index.js`)
   - Standalone Node.js process implementing MCP protocol
   - Handles transcription requests using OpenAI Whisper
   - Manages job queue with concurrent processing
   - Provides real-time progress updates

2. **API Integration** (`src/app/api/mcp-transcribe/route.ts`)
   - Next.js API route that interfaces with MCP server
   - Manages MCP server lifecycle
   - Handles HTTP to MCP protocol translation

3. **Frontend Component** (`src/components/VoiceRecorderMCP.tsx`)
   - Enhanced voice recorder with MCP integration
   - Real-time progress tracking
   - Audio level visualization
   - Playback controls

## Features

### Core Transcription
- **OpenAI Whisper Integration**: High-quality speech-to-text conversion
- **Multiple Audio Formats**: Support for WAV, MP3, WebM, M4A, FLAC, AAC, OGG
- **Language Support**: Configurable language detection (default: English)
- **Temperature Control**: Adjustable transcription accuracy vs creativity

### Queue Management
- **Concurrent Processing**: Up to 3 simultaneous transcription jobs
- **Job Tracking**: Unique job IDs for status monitoring
- **Priority Queue**: FIFO processing with configurable priorities
- **Error Recovery**: Automatic retry mechanism for failed jobs

### Real-time Features
- **Progress Tracking**: Live transcription progress updates
- **Status Monitoring**: Real-time job status (queued, processing, summarizing, completed, failed)
- **WebSocket Support**: For future real-time streaming capabilities
- **Audio Visualization**: Live audio level monitoring during recording

### AI Summarization
- **GPT-4 Integration**: Automatic content summarization
- **Configurable Length**: 2-4 sentence summaries by default
- **Context Awareness**: Maintains context from transcription

## Installation & Setup

### Prerequisites
- Node.js 18+
- OpenAI API key
- Existing Voice-to-Notes application

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install @modelcontextprotocol/sdk ws uuid @types/ws @types/uuid @radix-ui/react-progress
   ```

2. **Environment Variables**
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **MCP Server Setup**
   ```bash
   cd mcp-server
   npm install
   ```

## Usage

### Starting the MCP Server

The MCP server can be started in two ways:

1. **Manual Start**
   ```bash
   cd mcp-server
   node index.js
   ```

2. **Automatic Start** (via API)
   The API route will automatically start the MCP server when needed.

### API Endpoints

#### Transcribe Audio
```http
POST /api/mcp-transcribe
Content-Type: multipart/form-data

audioFile: [audio file]
language: en (optional)
temperature: 0.0 (optional)
generateSummary: true (optional)
```

#### Get Job Status
```http
GET /api/mcp-transcribe?jobId={jobId}
```

#### Get Queue Status
```http
GET /api/mcp-transcribe?queueStatus=true
```

#### Stop MCP Server
```http
DELETE /api/mcp-transcribe
```

### Frontend Integration

Use the `VoiceRecorderMCP` component in your React components:

```tsx
import VoiceRecorderMCP from '@/components/VoiceRecorderMCP';

function MyComponent() {
  const handleTranscriptionComplete = (transcription, summary, audioUrl) => {
    console.log('Transcription:', transcription);
    console.log('Summary:', summary);
    console.log('Audio URL:', audioUrl);
  };

  const handleTranscriptionProgress = (progress, status) => {
    console.log(`Progress: ${progress}% - ${status}`);
  };

  return (
    <VoiceRecorderMCP
      onTranscriptionComplete={handleTranscriptionComplete}
      onTranscriptionProgress={handleTranscriptionProgress}
    />
  );
}
```

## MCP Tools

The MCP server exposes the following tools:

### 1. transcribe_audio
Transcribes audio file using OpenAI Whisper.

**Parameters:**
- `audioData` (string, required): Base64 encoded audio data
- `audioFormat` (string, required): Audio format (wav, mp3, webm, etc.)
- `language` (string, optional): Language code (default: en)
- `temperature` (number, optional): Temperature (0.0-1.0, default: 0.0)
- `generateSummary` (boolean, optional): Generate AI summary (default: false)

**Returns:**
```json
{
  "jobId": "uuid",
  "message": "Audio transcription queued successfully",
  "queueStatus": {
    "queued": 0,
    "processing": 1,
    "maxConcurrent": 3
  }
}
```

### 2. get_transcription_status
Gets status of a transcription job.

**Parameters:**
- `jobId` (string, required): Job ID returned from transcribe_audio

**Returns:**
```json
{
  "id": "uuid",
  "status": "completed",
  "progress": 100,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "startedAt": "2024-01-01T00:00:01.000Z",
  "completedAt": "2024-01-01T00:00:10.000Z",
  "result": {
    "transcription": "Transcribed text",
    "summary": "AI-generated summary",
    "duration": 30,
    "language": "en"
  }
}
```

### 3. get_queue_status
Gets current queue status.

**Returns:**
```json
{
  "queued": 0,
  "processing": 1,
  "maxConcurrent": 3
}
```

### 4. start_realtime_transcription
Starts real-time transcription session.

**Parameters:**
- `language` (string, optional): Language code (default: en)
- `enableInterimResults` (boolean, optional): Enable interim results (default: true)

**Returns:**
```json
{
  "websocketPort": 3010,
  "language": "en",
  "enableInterimResults": true,
  "message": "Real-time transcription server started"
}
```

## Configuration

### Server Configuration (`mcp-server/config.json`)

```json
{
  "server": {
    "name": "voice-to-notes-transcription",
    "version": "1.0.0"
  },
  "transcription": {
    "maxConcurrentJobs": 3,
    "defaultLanguage": "en",
    "defaultTemperature": 0.0,
    "supportedFormats": ["wav", "mp3", "webm", "m4a", "flac", "aac", "ogg"],
    "maxFileSize": "25MB"
  },
  "realtime": {
    "websocketPortRange": {
      "min": 3010,
      "max": 3100
    },
    "chunkSize": 1024,
    "sampleRate": 16000
  }
}
```

## Testing

### Running Tests

```bash
cd mcp-server
npm test
```

### Test Coverage

The test suite covers:
- MCP server startup
- Tool listing
- Queue status checking
- Real-time transcription setup
- Audio transcription processing
- Job status monitoring
- Error handling

## Performance Considerations

### Optimization Strategies

1. **Audio Compression**: Compress audio before transmission
2. **Batch Processing**: Process multiple audio chunks together
3. **Caching**: Cache transcriptions for repeated content
4. **Connection Pooling**: Reuse OpenAI API connections
5. **Queue Management**: Prioritize important jobs

### Monitoring

- **Job Completion Rate**: Track successful vs failed transcriptions
- **Processing Time**: Monitor average transcription duration
- **Queue Depth**: Watch for bottlenecks
- **Error Rates**: Track API failures and retries

## Security

### Authentication
- OpenAI API key secured via environment variables
- Request validation and sanitization
- File type and size restrictions

### Data Privacy
- Temporary file cleanup after processing
- No long-term storage of audio data
- Secure transmission protocols

## Troubleshooting

### Common Issues

1. **MCP Server Won't Start**
   - Check OpenAI API key is set
   - Verify Node.js version compatibility
   - Check port availability

2. **Transcription Failures**
   - Verify audio file format is supported
   - Check file size limits (25MB max)
   - Monitor OpenAI API quota

3. **Performance Issues**
   - Reduce concurrent job limit
   - Optimize audio compression
   - Check network connectivity

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=mcp:*
```

## Future Enhancements

### Planned Features

1. **Streaming Transcription**: Real-time audio processing
2. **Speaker Diarization**: Multiple speaker identification
3. **Language Detection**: Automatic language identification
4. **Custom Models**: Support for fine-tuned Whisper models
5. **Batch Processing**: Bulk transcription capabilities
6. **Webhook Support**: Async completion notifications
7. **Analytics Dashboard**: Usage and performance metrics

### Integration Opportunities

1. **Cloud Storage**: Direct integration with S3, GCS
2. **CDN Distribution**: Global audio processing
3. **Database Integration**: Direct transcription storage
4. **API Gateway**: Centralized service management

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review test results
3. Examine server logs
4. Verify configuration settings
5. Contact development team

---

This MCP Transcription Service provides a comprehensive solution for integrating high-quality audio transcription into your applications with robust error handling, progress tracking, and scalable architecture.