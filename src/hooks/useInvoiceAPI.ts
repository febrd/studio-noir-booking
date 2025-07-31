
import { useState } from 'react';
import { InvoiceRequest, InvoiceResponse, GetInvoiceRequest } from '@/services/invoiceService';

export const useInvoiceAPI = () => {
  const [loading, setLoading] = useState(false);

  const createInvoice = async (invoiceData: InvoiceRequest): Promise<InvoiceResponse> => {
    setLoading(true);
    
    try {
      const response = await fetch('/v1/create/invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      const result: InvoiceResponse = await response.json();
      console.log('Invoice API Response:', result);
      
      return result;
    } catch (error) {
      console.error('Error calling invoice API:', error);
      return {
        success: false,
        error: 'Network error or server unavailable',
        errorCode: 'NETWORK_ERROR'
      };
    } finally {
      setLoading(false);
    }
  };

  const getInvoice = async (invoiceData: GetInvoiceRequest): Promise<InvoiceResponse> => {
    setLoading(true);
    
    try {
      const response = await fetch('/v1/get/invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      const result: InvoiceResponse = await response.json();
      console.log('Get Invoice API Response:', result);
      
      return result;
    } catch (error) {
      console.error('Error calling get invoice API:', error);
      return {
        success: false,
        error: 'Network error or server unavailable',
        errorCode: 'NETWORK_ERROR'
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    createInvoice,
    getInvoice,
    loading
  };
};
