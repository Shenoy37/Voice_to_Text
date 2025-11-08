#!/usr/bin/env node

import { spawn } from 'child_process';
import { createReadStream } from 'fs';
import { join } from 'path';

// Test MCP server functionality
async function testMCPServer() {
    console.log('🧪 Testing MCP Transcription Server...\n');

    // Start MCP server
    const serverPath = join(process.cwd());
    const serverProcess = spawn('node', ['index.js'], {
        cwd: serverPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
            ...process.env,
            OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        },
    });

    let serverReady = false;
    let responses = [];

    // Listen for server output
    serverProcess.stderr.on('data', (data) => {
        const output = data.toString();
        console.log('Server:', output.trim());

        if (output.includes('Voice-to-Notes MCP Transcription Server running')) {
            serverReady = true;
        }
    });

    serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('Response:', output.trim());
        responses.push(output.trim());
    });

    serverProcess.on('error', (error) => {
        console.error('❌ Server error:', error);
        process.exit(1);
    });

    serverProcess.on('exit', (code) => {
        console.log(`\n📊 Server exited with code ${code}`);
        process.exit(code);
    });

    // Wait for server to be ready
    await new Promise((resolve) => {
        const checkReady = setInterval(() => {
            if (serverReady) {
                clearInterval(checkReady);
                resolve(true);
            }
        }, 1000);
    });

    console.log('✅ Server is ready!\n');

    // Test 1: List available tools
    console.log('🔧 Test 1: Listing available tools...');
    const listToolsRequest = {
        method: 'tools/list',
        id: 'test-1',
    };

    serverProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Get queue status
    console.log('\n📋 Test 2: Getting queue status...');
    const queueStatusRequest = {
        method: 'tools/call',
        params: {
            name: 'get_queue_status',
            arguments: {},
        },
        id: 'test-2',
    };

    serverProcess.stdin.write(JSON.stringify(queueStatusRequest) + '\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Start real-time transcription
    console.log('\n🎙️ Test 3: Starting real-time transcription...');
    const realtimeRequest = {
        method: 'tools/call',
        params: {
            name: 'start_realtime_transcription',
            arguments: {
                language: 'en',
                enableInterimResults: true,
            },
        },
        id: 'test-3',
    };

    serverProcess.stdin.write(JSON.stringify(realtimeRequest) + '\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 4: Test transcription with mock audio (if we have a test file)
    console.log('\n🎵 Test 4: Testing audio transcription...');

    // Create a simple test audio file path (you would need an actual audio file for this test)
    const testAudioPath = join(serverPath, 'test-audio.wav');

    try {
        const transcriptionRequest = {
            method: 'tools/call',
            params: {
                name: 'transcribe_audio',
                arguments: {
                    audioData: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=', // Minimal WAV header
                    audioFormat: 'wav',
                    language: 'en',
                    temperature: 0.0,
                    generateSummary: false,
                },
            },
            id: 'test-4',
        };

        serverProcess.stdin.write(JSON.stringify(transcriptionRequest) + '\n');
        await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
        console.log('⚠️  Audio transcription test skipped (no test audio file)');
    }

    // Test 5: Check job status
    console.log('\n📊 Test 5: Checking job status...');
    const jobStatusRequest = {
        method: 'tools/call',
        params: {
            name: 'get_transcription_status',
            arguments: {
                jobId: 'test-job-id',
            },
        },
        id: 'test-5',
    };

    serverProcess.stdin.write(JSON.stringify(jobStatusRequest) + '\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n✅ All tests completed!');

    // Wait a bit more for any final responses
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Clean shutdown
    serverProcess.kill();
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
    testMCPServer().catch(console.error);
}

export { testMCPServer };