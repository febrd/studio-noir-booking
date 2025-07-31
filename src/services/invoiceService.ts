
import { XenditAuthClient, XenditTestResult } from '@/utils/xenditAuth';
import { supabase } from '@/integrations/supabase/client';

export interface InvoiceRequest {
  performed_by: string;
  external_id: string;
  amount: number;
  description?: string;
  customer?: {
    given_names: string;
    surname: string;
    email: string;
    mobile_number: string;
  };
  currency?: string;
  invoice_duration?: number;
}

export interface InvoiceResponse {
  success: boolean;
  data?: any;
  error?: string;
  errorCode?: string;
}

export class InvoiceService {
  static async createInvoice(requestData: InvoiceRequest): Promise<InvoiceResponse> {
    try {
      console.log('Creating invoice with data:', requestData);

      // Validate required parameter
      if (!requestData.performed_by) {
        return {
          success: false,
          error: 'Parameter performed_by diperlukan',
          errorCode: 'MISSING_PERFORMED_BY'
        };
      }

      // Check if performed_by exists in users table
      console.log('Validating user:', requestData.performed_by);
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('id', requestData.performed_by)
        .single();

      if (userError || !user) {
        console.error('User validation error:', userError);
        return {
          success: false,
          error: 'User tidak ditemukan atau tidak valid',
          errorCode: 'USER_NOT_FOUND'
        };
      }

      console.log('User validated:', user.name);

      // Get active production payment provider
      console.log('Fetching active Xendit payment provider...');
      const { data: paymentProvider, error: dbError } = await supabase
        .from('payment_providers')
        .select('*')
        .eq('environment', 'production')
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (dbError || !paymentProvider) {
        console.error('Payment provider error:', dbError);
        return {
          success: false,
          error: 'Payment provider tidak ditemukan atau tidak aktif',
          errorCode: 'PAYMENT_PROVIDER_NOT_FOUND'
        };
      }

      if (!paymentProvider.secret_key) {
        return {
          success: false,
          error: 'Secret key tidak ditemukan pada payment provider',
          errorCode: 'MISSING_SECRET_KEY'
        };
      }

      console.log('Using payment provider:', paymentProvider.name);

      // Validate required invoice fields
      if (!requestData.external_id || !requestData.amount) {
        return {
          success: false,
          error: 'Parameter external_id dan amount diperlukan',
          errorCode: 'MISSING_REQUIRED_FIELDS'
        };
      }

      // Validate amount is a positive number
      if (typeof requestData.amount !== 'number' || requestData.amount <= 0) {
        return {
          success: false,
          error: 'Amount harus berupa angka positif',
          errorCode: 'INVALID_AMOUNT'
        };
      }

      // Set default values for invoice
      const finalInvoiceData = {
        currency: 'IDR',
        invoice_duration: 86400, // 24 hours
        ...requestData,
      };

      // Initialize Xendit Auth with provider data
      const xenditAuth = new XenditAuthClient(
        paymentProvider.secret_key,
        paymentProvider.api_url || 'https://api.xendit.co'
      );

      // Create the invoice
      const invoiceResult = await xenditAuth.createInvoice(finalInvoiceData);

      if (invoiceResult.success) {
        console.log('Invoice created successfully');
        
        return {
          success: true,
          data: {
            invoice: invoiceResult.data,
            performed_by: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            },
            provider: {
              id: paymentProvider.id,
              name: paymentProvider.name,
              environment: paymentProvider.environment
            }
          }
        };
      } else {
        console.error('Invoice creation failed:', invoiceResult.error);
        
        return {
          success: false,
          error: 'Gagal membuat invoice: ' + (invoiceResult.error || 'Unknown error'),
          errorCode: invoiceResult.error || 'XENDIT_ERROR'
        };
      }

    } catch (error) {
      console.error('Unexpected error in invoice creation:', error);
      
      return {
        success: false,
        error: 'Terjadi kesalahan sistem: ' + (error instanceof Error ? error.message : 'Unknown error'),
        errorCode: 'INTERNAL_SERVER_ERROR'
      };
    }
  }
}
