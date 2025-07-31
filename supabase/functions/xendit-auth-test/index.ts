
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

  // Test authentication by getting invoices list
  async testConnection(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('Testing Xendit connection...');
      
      const response = await this.makeRequest('/v2/invoices?limit=1');
      const responseData = await response.json();

      console.log('Xendit API Response Status:', response.status);
      console.log('Xendit API Response:', responseData);

      if (response.ok) {
        return {
          success: true,
          data: {
            status: response.status,
            message: 'Koneksi berhasil ke Xendit API',
            invoices: responseData,
            timestamp: new Date().toISOString()
          }
        };
      } else {
        return {
          success: false,
          error: responseData.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      console.error('Xendit connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get balance (alternative test endpoint)
  async getBalance(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.makeRequest('/balance');
      const responseData = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: responseData
        };
      } else {
        return {
          success: false,
          error: responseData.message || `HTTP ${response.status}`
        };
      }
    } catch (error) {
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

  try {
    console.log('Xendit auth test endpoint called');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Gagal mengambil data payment provider: ' + dbError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!paymentProvider) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Tidak ada payment provider aktif dengan environment production'
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

    console.log('Found payment provider:', paymentProvider.name);

    // Initialize Xendit Auth with provider data
    const xenditAuth = new XenditAuth(
      paymentProvider.secret_key,
      paymentProvider.api_url || 'https://api.xendit.co'
    );

    // Test the connection
    const testResult = await xenditAuth.testConnection();

    console.log('Test result:', testResult);

    return new Response(
      JSON.stringify({
        provider: {
          id: paymentProvider.id,
          name: paymentProvider.name,
          environment: paymentProvider.environment,
          api_url: paymentProvider.api_url
        },
        test: testResult
      }),
      {
        status: testResult.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error in xendit-auth-test:', error);
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
