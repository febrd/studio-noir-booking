export interface XenditTestResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface XenditProvider {
  id: string;
  name: string;
  environment: 'sandbox' | 'production';
  api_url?: string;
}

export class XenditAuthClient {
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
  async testConnection(): Promise<XenditTestResult> {
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
  async getBalance(): Promise<XenditTestResult> {
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

  // Create invoice
  async createInvoice(invoiceData: any): Promise<XenditTestResult> {
    try {
      const response = await this.makeRequest('/v2/invoices', {
        method: 'POST',
        body: JSON.stringify(invoiceData)
      });

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

  // Get invoice by ID or external_id
  async getInvoice(invoiceId?: string, externalId?: string): Promise<XenditTestResult> {
    try {
      let endpoint = '/v2/invoices';
      
      if (invoiceId) {
        endpoint = `/v2/invoices/${invoiceId}`;
      } else if (externalId) {
        endpoint = `/v2/invoices?external_id=${encodeURIComponent(externalId)}`;
      } else {
        return {
          success: false,
          error: 'Either invoice_id or external_id must be provided'
        };
      }

      console.log('Getting invoice from endpoint:', endpoint);
      
      const response = await this.makeRequest(endpoint);
      const responseData = await response.json();

      console.log('Xendit Get Invoice Response Status:', response.status);
      console.log('Xendit Get Invoice Response:', responseData);

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
      console.error('Get invoice failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
