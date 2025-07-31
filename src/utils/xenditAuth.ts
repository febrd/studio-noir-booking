
export interface XenditTestResult {
  success: boolean;
  data?: any;
  error?: string;
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

  // Test connection to Xendit API
  async testConnection(): Promise<XenditTestResult> {
    try {
      console.log('Testing Xendit connection to:', this.apiUrl);
      
      const response = await this.makeRequest('invoices?limit=1', {
        method: 'GET',
      });
      
      const responseData = await response.json();

      console.log('Xendit API Response Status:', response.status);
      console.log('Xendit API Response:', responseData);

      if (response.ok) {
        return {
          success: true,
          data: {
            status: response.status,
            message: 'Connection successful to Xendit API',
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

  // Create invoice
  async createInvoice(invoiceData: any): Promise<XenditTestResult> {
    try {
      console.log('Creating invoice with data:', invoiceData);
      
      const response = await this.makeRequest('invoices', {
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
        // Handle different error types from Xendit
        let errorMessage = responseData.message || `HTTP ${response.status}: ${response.statusText}`;
        
        // Handle specific Xendit error responses
        if (response.status === 400) {
          errorMessage = `Bad Request: ${responseData.message || 'Invalid request parameters'}`;
        } else if (response.status === 401) {
          errorMessage = 'Authentication failed: Invalid API key or credentials';
        } else if (response.status === 403) {
          errorMessage = 'Forbidden: Access denied or insufficient permissions';
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded: Too many requests';
        } else if (response.status >= 500) {
          errorMessage = 'Xendit server error: Please try again later';
        }

        return {
          success: false,
          error: errorMessage
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

  // Get invoice by ID or external_id
  async getInvoice(invoiceId?: string, externalId?: string): Promise<XenditTestResult> {
    try {
      let endpoint: string;
      
      if (invoiceId) {
        endpoint = `/v2/invoices/${invoiceId}`;
        console.log('Getting invoice by ID:', invoiceId);
      } else if (externalId) {
        endpoint = `/v2/invoices?external_id=${encodeURIComponent(externalId)}`;
        console.log('Getting invoice by external_id:', externalId);
      } else {
        return {
          success: false,
          error: 'Either invoice_id or external_id must be provided'
        };
      }
      
      const response = await this.makeRequest(endpoint, {
        method: 'GET'
      });

      const responseData = await response.json();
      console.log('Xendit Get Invoice Response Status:', response.status);
      console.log('Xendit Get Invoice Response:', responseData);

      if (response.ok) {
        // Handle array response when querying by external_id
        let invoiceData = responseData;
        if (externalId && Array.isArray(responseData) && responseData.length > 0) {
          invoiceData = responseData[0]; // Get first matching invoice
        } else if (externalId && Array.isArray(responseData) && responseData.length === 0) {
          return {
            success: false,
            error: 'No invoice found with the specified external_id'
          };
        }

        return {
          success: true,
          data: invoiceData
        };
      } else {
        let errorMessage = responseData.message || `HTTP ${response.status}: ${response.statusText}`;
        
        if (response.status === 404) {
          errorMessage = 'Invoice not found';
        } else if (response.status === 401) {
          errorMessage = 'Authentication failed: Invalid API key or credentials';
        } else if (response.status === 403) {
          errorMessage = 'Forbidden: Access denied or insufficient permissions';
        }

        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      console.error('Xendit get invoice failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
