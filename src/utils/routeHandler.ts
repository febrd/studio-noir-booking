
import { InvoiceAPIHandler } from '@/api/invoiceHandler';
import { WebhookHandler } from '@/api/webhookHandler';

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
      case '/webhook/xendit':
      case '/api/webhook/xendit':
        console.log('🔔 Routing to webhook callback handler');
        return await WebhookHandler.handleXenditWebhook(request);
        
      default:
        console.log('❓ No handler found for route:', pathname);
        return null;
    }
  }
}
