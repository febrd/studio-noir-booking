
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Xendit Authentication Module
class XenditAuth {
  private secretKey: string;
  private apiUrl: string;

  constructor(secretKey: string, apiUrl: string = 'https://api.xendit.co') {
    this.secretKey = secretKey;
    this.apiUrl = apiUrl;
  }

  // Create Basic Auth header
  getAuthHeader(): string {
    const credentials = `${this.secretKey}:`;
    const base64Credentials = btoa(credentials);
    return `Basic ${base64Credentials}`;
  }

  // Generic method to make authenticated requests to Xendit
  async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.apiUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Authorization': this.getAuthHeader(),
      'Content-Type': 'application/json',
    };

    return fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });
  }

  // Create invoice
  async createInvoice(invoiceData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('Creating invoice with data:', invoiceData);
      
      const response = await this.makeRequest('/v2/invoices', {
        method: 'POST',
        body: JSON.stringify(invoiceData)
      });

      const responseData = await response.json();
      console.log('Xendit API Response Status:', response.status);
      console.log('Xendit API Response:', responseData);

      if (response.ok) {
        return {
          success: true,
          data: responseData
        };
      } else {
        return {
          success: false,
          error: responseData.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      console.error('Xendit invoice creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Only POST is supported.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const requestData = await req.json();
    const { performed_by, ...invoiceData } = requestData;

    // Validate required parameter
    if (!performed_by) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Parameter performed_by diperlukan'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if performed_by exists in users table
    console.log('Validating user:', performed_by);
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', performed_by)
      .single();

    if (userError || !user) {
      console.error('User validation error:', userError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'User tidak ditemukan atau tidak valid'
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
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
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Payment provider tidak ditemukan atau tidak aktif'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!paymentProvider.secret_key) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Secret key tidak ditemukan pada payment provider'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Using payment provider:', paymentProvider.name);

    // Validate required invoice fields
    if (!invoiceData.external_id || !invoiceData.amount) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Parameter external_id dan amount diperlukan'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Set default values for invoice
    const finalInvoiceData = {
      currency: 'IDR',
      invoice_duration: 86400, // 24 hours
      ...invoiceData,
    };

    // Initialize Xendit Auth with provider data
    const xenditAuth = new XenditAuth(
      paymentProvider.secret_key,
      paymentProvider.api_url || 'https://api.xendit.co'
    );

    // Create the invoice
    const invoiceResult = await xenditAuth.createInvoice(finalInvoiceData);

    if (invoiceResult.success) {
      console.log('Invoice created successfully');
      
      return new Response(
        JSON.stringify({
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
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      console.error('Invoice creation failed:', invoiceResult.error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Gagal membuat invoice: ' + (invoiceResult.error || 'Unknown error')
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Unexpected error in xendit-create-invoice:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Terjadi kesalahan sistem: ' + (error instanceof Error ? error.message : 'Unknown error')
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
