# MCP Transcription Server

A Model Context Protocol (MCP) server for live audio transcription using OpenAI Whisper.

## Features

- 🎙️ **Audio Transcription**: High-quality speech-to-text using OpenAI Whisper
- 🔄 **Queue Management**: Concurrent processing with job tracking
- 📊 **Progress Reporting**: Real-time transcription progress updates
- 🤖 **AI Summarization**: Automatic content summarization with GPT-4
- 🌐 **Real-time Support**: WebSocket-based streaming transcription
- 🔧 **Configurable**: Flexible settings for language, temperature, and formats

## Quick Start

### Prerequisites

- Node.js 18+
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd voice-to-notes/mcp-server

# Install dependencies
npm install

# Set environment variables
export OPENAI_API_KEY=your_openai_api_key_here

# Start the server
npm start
```

### Usage

The MCP server communicates via stdio using the Model Context Protocol. It exposes the following tools:

1. **transcribe_audio** - Transcribe audio files
2. **get_transcription_status** - Check job status
3. **get_queue_status** - Get queue information
4. **start_realtime_transcription** - Start real-time session

## Configuration

Edit `config.json` to customize:

- Maximum concurrent jobs
- Default language and temperature
- Supported audio formats
- WebSocket port ranges
- File size limits

## Testing

Run the test suite:

```bash
npm test
```

This will test:
- Server startup
- Tool availability
- Queue operations
- Transcription processing
- Error handling

## API Reference

### transcribe_audio

Transcribes audio data using OpenAI Whisper.

```json
{
  "method": "tools/call",
  "params": {
    "name": "transcribe_audio",
    "arguments": {
      "audioData": "data:audio/wav;base64,...",
      "audioFormat": "wav",
      "language": "en",
      "temperature": 0.0,
      "generateSummary": true
    }
  }
}
```

### Response

```json
{
  "jobId": "uuid-string",
  "message": "Audio transcription queued successfully",
  "queueStatus": {
    "queued": 0,
    "processing": 1,
    "maxConcurrent": 3
  }
}
```

## Integration

### With Voice-to-Notes Application

The MCP server integrates seamlessly with the main application via the `/api/mcp-transcribe` endpoint. This route:

1. Manages MCP server lifecycle
2. Handles HTTP to MCP protocol translation
3. Provides RESTful interface for transcription
4. Manages job status polling

### Standalone Usage

You can also use the MCP server directly:

```javascript
import { spawn } from 'child_process';

const server = spawn('node', ['index.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { OPENAI_API_KEY: 'your-key' }
});

// Send requests
server.stdin.write(JSON.stringify(request) + '\n');

// Receive responses
server.stdout.on('data', (data) => {
  const response = JSON.parse(data.toString());
  console.log(response);
});
```

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend     │───▶│   API Route     │───▶│  MCP Server     │
│  (React App)   │    │ (/api/mcp-      │    │  (Node.js)      │
│                │    │ transcribe)      │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   OpenAI API   │
                                              │   (Whisper)    │
                                              └─────────────────┘
```

## Error Handling

The server implements comprehensive error handling:

- **Connection Errors**: Automatic reconnection with exponential backoff
- **API Failures**: Retry logic with configurable limits
- **Validation**: Input sanitization and format checking
- **Resource Management**: Automatic cleanup of temporary files

## Performance

### Optimization Features

- **Concurrent Processing**: Up to 3 simultaneous jobs
- **Memory Management**: Efficient audio buffer handling
- **Connection Pooling**: Reused OpenAI API connections
- **Queue Prioritization**: FIFO with configurable priorities

### Monitoring

Monitor performance via:

- Job completion rates
- Average processing time
- Queue depth and wait times
- Error rates and types

## Security

- **API Key Protection**: Environment variable storage
- **Input Validation**: File type and size restrictions
- **Temporary Files**: Automatic cleanup after processing
- **Rate Limiting**: Configurable request limits

## Troubleshooting

### Common Issues

1. **Server Won't Start**
   - Check OPENAI_API_KEY environment variable
   - Verify Node.js version (18+)
   - Check port availability

2. **Transcription Failures**
   - Verify audio format is supported
   - Check file size limits (25MB max)
   - Monitor OpenAI API quota

3. **Performance Issues**
   - Reduce concurrent job limit
   - Optimize audio compression
   - Check network connectivity

### Debug Mode

Enable detailed logging:

```bash
DEBUG=mcp:* npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review test results
3. Examine server logs
4. Create an issue with detailed information

---

This MCP server provides a robust, scalable foundation for audio transcription services with comprehensive error handling, progress tracking, and flexible configuration options.