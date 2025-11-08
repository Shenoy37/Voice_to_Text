import { auth } from "@/lib/auth";

// Add debugging to see if the handler is being called
console.log('Auth route handler loaded');

export async function GET(request: Request) {
    console.log('GET request to auth handler:', request.url);
    try {
        const response = await auth.handler(request);
        console.log('Auth handler response status:', response.status);
        return response;
    } catch (error) {
        console.error('Auth handler error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

export function POST(request: Request) {
    console.log('POST request to auth handler:', request.url);
    return auth.handler(request);
}

export function PUT(request: Request) {
    console.log('PUT request to auth handler:', request.url);
    return auth.handler(request);
}

export function DELETE(request: Request) {
    console.log('DELETE request to auth handler:', request.url);
    return auth.handler(request);
}

export function PATCH(request: Request) {
    console.log('PATCH request to auth handler:', request.url);
    return auth.handler(request);
}

export function OPTIONS(request: Request) {
    console.log('OPTIONS request to auth handler:', request.url);
    return auth.handler(request);
}

export function HEAD(request: Request) {
    console.log('HEAD request to auth handler:', request.url);
    return auth.handler(request);
}