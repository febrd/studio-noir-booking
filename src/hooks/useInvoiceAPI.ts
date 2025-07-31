
import { useState } from 'react';
import { InvoiceRequest, InvoiceResponse, GetInvoiceRequest } from '@/services/invoiceService';

export const useInvoiceAPI = () => {
  const [loading, setLoading] = useState(false);

  const createInvoice = async (invoiceData: InvoiceRequest): Promise<InvoiceResponse> => {
    setLoading(true);
    
    try {
      console.log('🚀 Creating invoice with data:', invoiceData);
      
      // Validate required fields before sending
      if (!invoiceData.performed_by) {
        console.error('❌ Missing performed_by');
        return {
          success: false,
          error: 'Parameter performed_by diperlukan',
          errorCode: 'MISSING_PERFORMED_BY'
        };
      }

      if (!invoiceData.external_id) {
        console.error('❌ Missing external_id');
        return {
          success: false,
          error: 'Parameter external_id diperlukan',
          errorCode: 'MISSING_EXTERNAL_ID'
        };
      }

      if (!invoiceData.amount || invoiceData.amount <= 0) {
        console.error('❌ Invalid amount:', invoiceData.amount);
        return {
          success: false,
          error: 'Amount harus berupa angka positif',
          errorCode: 'INVALID_AMOUNT'
        };
      }

      // Clean the invoice data to ensure proper format
      const cleanInvoiceData = {
        performed_by: invoiceData.performed_by,
        external_id: String(invoiceData.external_id), // Ensure string
        amount: Number(invoiceData.amount), // Ensure number
        description: invoiceData.description || '',
        currency: invoiceData.currency || 'IDR',
        invoice_duration: invoiceData.invoice_duration || 86400,
        ...(invoiceData.customer && {
          customer: {
            given_names: String(invoiceData.customer.given_names || ''),
            surname: String(invoiceData.customer.surname || ''),
            email: String(invoiceData.customer.email || ''),
            mobile_number: String(invoiceData.customer.mobile_number || '')
          }
        })
      };

      console.log('🧹 Cleaned invoice data:', cleanInvoiceData);
      
      // Ensure proper JSON serialization
      const requestBody = JSON.stringify(cleanInvoiceData);
      console.log('📦 Request body to send:', requestBody);
      
      const response = await fetch('/v1/create/invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      const result: InvoiceResponse = await response.json();
      console.log('📥 Invoice API Response:', result);
      
      if (!response.ok) {
        console.error('❌ HTTP Error:', response.status, result);
      }
      
      return result;
    } catch (error) {
      console.error('💥 Error calling invoice API:', error);
      return {
        success: false,
        error: 'Network error or server unavailable: ' + (error instanceof Error ? error.message : 'Unknown error'),
        errorCode: 'NETWORK_ERROR'
      };
    } finally {
      setLoading(false);
    }
  };

  const getInvoice = async (invoiceData: GetInvoiceRequest): Promise<InvoiceResponse> => {
    setLoading(true);
    
    try {
      console.log('Getting invoice with data:', invoiceData);
      
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
        error: 'Network error or server unavailable: ' + (error instanceof Error ? error.message : 'Unknown error'),
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
