// API Route Interceptor for Invoice Endpoints
import { InvoiceService } from '@/services/invoiceService';
import { WebhookHandler } from '@/api/webhookHandler';

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
    if (pathname === '/v1/create/invoice' || pathname === '/v1/get/invoice' || 
        pathname === '/v1/callback' || pathname === '/webhook/xendit' || pathname === '/api/webhook/xendit') {
      console.log('🎯 Handling API route:', pathname);
      
      try {
        // Handle CORS preflight requests
        if (init?.method === 'OPTIONS') {
          return new Response(null, {
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
          });
        }

        // Handle webhook callback
        if (pathname === '/v1/callback' || pathname === '/webhook/xendit' || pathname === '/api/webhook/xendit') {
          console.log('🔔 Routing to webhook callback handler');
          return await WebhookHandler.handleXenditWebhook(new Request(url, init));
        }

        // Only allow POST method for other endpoints
        if (init?.method !== 'POST') {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Method not allowed. Use POST method.',
              errorCode: 'METHOD_NOT_ALLOWED'
            }),
            {
              status: 405,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
              }
            }
          );
        }

        // Safely parse request body
        let requestData;
        try {
          if (!init?.body) {
            throw new Error('No request body provided');
          }
          
          const bodyString = typeof init.body === 'string' ? init.body : JSON.stringify(init.body);
          console.log('📝 Raw request body:', bodyString);
          
          requestData = JSON.parse(bodyString);
          console.log('📝 Parsed request data:', requestData);
        } catch (parseError) {
          console.error('❌ JSON Parse Error:', parseError);
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Invalid JSON format in request body',
              errorCode: 'INVALID_JSON'
            }),
            {
              status: 400,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Content-Type': 'application/json'
              }
            }
          );
        }

        let result;
        
        // Handle create invoice
        if (pathname === '/v1/create/invoice') {
          console.log('📝 Routing to create invoice handler');
          result = await InvoiceService.createInvoice(requestData);
        } 
        // Handle get invoice
        else if (pathname === '/v1/get/invoice') {
          console.log('📋 Routing to get invoice handler');
          result = await InvoiceService.getInvoice(requestData);
        }

        console.log('✅ API handler result:', result);

        // Return response
        const httpStatus = result?.success ? 200 : 400;
        
        return new Response(
          JSON.stringify(result),
          {
            status: httpStatus,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
              'Content-Type': 'application/json'
            }
          }
        );
        
      } catch (error) {
        console.error('❌ Error handling API route:', error);
        
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Terjadi kesalahan sistem: ' + (error instanceof Error ? error.message : 'Unknown error'),
            errorCode: 'INTERNAL_SERVER_ERROR'
          }),
          {
            status: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
              'Content-Type': 'application/json'
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
