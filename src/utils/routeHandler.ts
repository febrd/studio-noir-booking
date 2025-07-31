
import { InvoiceAPIHandler } from '@/api/invoiceHandler';

export class RouteHandler {
  static async handleAPIRoute(pathname: string, request: Request): Promise<Response | null> {
    console.log('Handling API route:', pathname);
    
    switch (pathname) {
      case '/v1/create/invoice':
        return await InvoiceAPIHandler.handleCreateInvoice(request);
      case '/v1/get/invoice':
        return await InvoiceAPIHandler.handleGetInvoice(request);
      default:
        return null;
    }
  }
}
