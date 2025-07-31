
// API Route Interceptor for Invoice Endpoints
import { RouteHandler } from './routeHandler';

export const setupAPIInterceptor = () => {
  // Only run in development/browser environment
  if (typeof window === 'undefined') return;

  // Store original fetch
  const originalFetch = window.fetch;

  // Override fetch to intercept our API routes
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const pathname = new URL(url, window.location.origin).pathname;

    console.log('🔍 Intercepting request:', pathname);

    // Check if this is one of our API routes
    if (pathname === '/v1/create/invoice' || pathname === '/v1/get/invoice') {
      console.log('🎯 Handling API route:', pathname);
      
      try {
        // Create a Request object from the input
        const request = new Request(url, init);
        
        // Handle the route using static import
        const response = await RouteHandler.handleAPIRoute(pathname, request);
        
        if (response) {
          console.log('✅ API route handled successfully');
          return response;
        }
      } catch (error) {
        console.error('❌ Error handling API route:', error);
        
        // Return error response
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
            errorCode: 'INTERNAL_SERVER_ERROR'
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
          }
        );
      }
    }

    // For all other requests, use original fetch
    return originalFetch(input, init);
  };

  console.log('🚀 API Interceptor setup complete');
};
