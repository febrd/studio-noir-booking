
import { InvoiceAPIHandler } from '@/api/invoiceHandler';
import { WebhookHandler } from '@/api/webhookHandler';

export class RouteHandler {
  static async handleAPIRoute(pathname: string, request: Request): Promise<Response | null> {
    
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
        return await InvoiceAPIHandler.handleCreateInvoice(request);
        
      case '/v1/get/invoice':
        return await InvoiceAPIHandler.handleGetInvoice(request);
        
      case '/v1/callback':
      case '/webhook/xendit':
      case '/api/webhook/xendit':
        return await WebhookHandler.handleXenditWebhook(request);
        
      default:
        return null;
    }
  }
}
