
import { InvoiceService, InvoiceRequest, InvoiceResponse, GetInvoiceRequest } from '@/services/invoiceService';
import { WebhookHandler } from './webhookHandler';

export class InvoiceAPIHandler {
  static async handleCreateInvoice(request: Request): Promise<Response> {
    // Handle CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    // Only allow POST method
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Method not allowed. Use POST method.',
          errorCode: 'METHOD_NOT_ALLOWED'
        }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    try {
      // Parse JSON body
      const requestData: InvoiceRequest = await request.json();

      // Create invoice using service
      const result: InvoiceResponse = await InvoiceService.createInvoice(requestData);

      // Determine HTTP status based on result
      const httpStatus = result.success ? 200 : 400;

      return new Response(
        JSON.stringify(result),
        {
          status: httpStatus,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );

    } catch (error) {
      console.error('Error parsing request or processing invoice:', error);
      
      // Handle JSON parsing errors
      const isJsonError = error instanceof SyntaxError && error.message.includes('JSON');
      
      return new Response(
        JSON.stringify({
          success: false,
          error: isJsonError 
            ? 'Invalid JSON format in request body' 
            : 'Terjadi kesalahan sistem: ' + (error instanceof Error ? error.message : 'Unknown error'),
          errorCode: isJsonError ? 'INVALID_JSON' : 'INTERNAL_SERVER_ERROR'
        }),
        {
          status: isJsonError ? 400 : 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  }

  static async handleGetInvoice(request: Request): Promise<Response> {
    // Handle CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    // Only allow POST method
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Method not allowed. Use POST method.',
          errorCode: 'METHOD_NOT_ALLOWED'
        }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    try {
      // Parse JSON body
      const requestData: GetInvoiceRequest = await request.json();

      // Get invoice using service
      const result: InvoiceResponse = await InvoiceService.getInvoice(requestData);

      // Determine HTTP status based on result
      const httpStatus = result.success ? 200 : 400;

      return new Response(
        JSON.stringify(result),
        {
          status: httpStatus,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );

    } catch (error) {
      console.error('Error parsing request or processing get invoice:', error);
      
      // Handle JSON parsing errors
      const isJsonError = error instanceof SyntaxError && error.message.includes('JSON');
      
      return new Response(
        JSON.stringify({
          success: false,
          error: isJsonError 
            ? 'Invalid JSON format in request body' 
            : 'Terjadi kesalahan sistem: ' + (error instanceof Error ? error.message : 'Unknown error'),
          errorCode: isJsonError ? 'INVALID_JSON' : 'INTERNAL_SERVER_ERROR'
        }),
        {
          status: isJsonError ? 400 : 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  }

  static async handleWebhookCallback(request: Request): Promise<Response> {
    return await WebhookHandler.handleXenditWebhook(request);
  }
}
