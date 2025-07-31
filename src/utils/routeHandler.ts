
import { InvoiceAPIHandler } from '@/api/invoiceHandler';

export class RouteHandler {
  static async handleAPIRoute(pathname: string, request: Request): Promise<Response | null> {
    console.log('🔄 Handling API route:', pathname, 'Method:', request.method);
    
    // Handle CORS preflight requests for all routes
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }
    
    switch (pathname) {
      case '/v1/create/invoice':
        console.log('📝 Routing to create invoice handler');
        return await InvoiceAPIHandler.handleCreateInvoice(request);
        
      case '/v1/get/invoice':
        console.log('📋 Routing to get invoice handler');
        return await InvoiceAPIHandler.handleGetInvoice(request);
        
      case '/v1/callback':
        console.log('🔔 Routing to webhook callback handler');
        // For webhook callbacks, we need to call the edge function
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/xendit-webhook/v1/callback`, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: request.method !== 'GET' ? await request.text() : undefined,
        });
        return response;
        
      default:
        console.log('❓ No handler found for route:', pathname);
        return null;
    }
  }
}
