
import { useInvoiceAPI } from '@/hooks/useInvoiceAPI';

// Test data samples
export const sampleInvoiceData = {
  basic: {
    performed_by: "677bf602-3af9-48a2-9533-ec89cceb623b", // Your user ID from console logs
    external_id: `test-invoice-${Date.now()}`,
    amount: 50000,
    description: "Test Invoice from Console"
  },
  withCustomer: {
    performed_by: "677bf602-3af9-48a2-9533-ec89cceb623b",
    external_id: `test-customer-${Date.now()}`,
    amount: 100000,
    description: "Test Invoice with Customer Data",
    customer: {
      given_names: "John",
      surname: "Doe",
      email: "john.doe@example.com",
      mobile_number: "+628123456789"
    }
  }
};

export const sampleGetInvoiceData = {
  byExternalId: {
    performed_by: "677bf602-3af9-48a2-9533-ec89cceb623b",
    external_id: "test-invoice-123" // Replace with actual external_id
  },
  byInvoiceId: {
    performed_by: "677bf602-3af9-48a2-9533-ec89cceb623b",
    invoice_id: "invoice_id_from_xendit" // Replace with actual invoice_id
  }
};

// Global test function for browser console
declare global {
  interface Window {
    testInvoiceAPI: {
      createBasic: () => Promise<void>;
      createWithCustomer: () => Promise<void>;
      createCustom: (data: any) => Promise<void>;
      getByExternalId: (externalId: string) => Promise<void>;
      getByInvoiceId: (invoiceId: string) => Promise<void>;
      getCustom: (data: any) => Promise<void>;
      samples: typeof sampleInvoiceData;
      getSamples: typeof sampleGetInvoiceData;
    };
  }
}

export const setupInvoiceTestUtils = () => {
  // Test function that can be called from browser console
  const testCreateInvoice = async (invoiceData: any) => {
    try {
      console.log('🚀 Testing Invoice Creation...');
      console.log('📝 Invoice Data:', invoiceData);
      
      const response = await fetch('/v1/create/invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      const result = await response.json();
      
      console.log('📊 Response Status:', response.status);
      console.log('📋 Response Data:', result);
      
      if (result.success) {
        console.log('✅ Invoice created successfully!');
        if (result.data?.invoice?.invoice_url) {
          console.log('🔗 Invoice URL:', result.data.invoice.invoice_url);
        }
      } else {
        console.log('❌ Invoice creation failed:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('💥 Error testing invoice:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const testGetInvoice = async (getInvoiceData: any) => {
    try {
      console.log('🔍 Testing Get Invoice...');
      console.log('📝 Get Invoice Data:', getInvoiceData);
      
      const response = await fetch('/v1/get/invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(getInvoiceData),
      });

      const result = await response.json();
      
      console.log('📊 Response Status:', response.status);
      console.log('📋 Response Data:', result);
      
      if (result.success) {
        console.log('✅ Invoice retrieved successfully!');
        console.log('📄 Invoice Data:', result.data?.invoice);
      } else {
        console.log('❌ Invoice retrieval failed:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('💥 Error testing get invoice:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  // Setup global test functions
  window.testInvoiceAPI = {
    createBasic: () => testCreateInvoice(sampleInvoiceData.basic),
    createWithCustomer: () => testCreateInvoice(sampleInvoiceData.withCustomer),
    createCustom: (data: any) => testCreateInvoice(data),
    getByExternalId: (externalId: string) => testGetInvoice({
      performed_by: "677bf602-3af9-48a2-9533-ec89cceb623b",
      external_id: externalId
    }),
    getByInvoiceId: (invoiceId: string) => testGetInvoice({
      performed_by: "677bf602-3af9-48a2-9533-ec89cceb623b",
      invoice_id: invoiceId
    }),
    getCustom: (data: any) => testGetInvoice(data),
    samples: sampleInvoiceData,
    getSamples: sampleGetInvoiceData
  };

  // Log instructions
  console.log('🧪 Invoice API Test Utils Loaded!');
  console.log('📖 Available commands:');
  console.log('  - testInvoiceAPI.createBasic() // Test basic invoice');
  console.log('  - testInvoiceAPI.createWithCustomer() // Test with customer data');
  console.log('  - testInvoiceAPI.createCustom(data) // Test with custom data');
  console.log('  - testInvoiceAPI.getByExternalId("external_id") // Get by external ID');
  console.log('  - testInvoiceAPI.getByInvoiceId("invoice_id") // Get by invoice ID');
  console.log('  - testInvoiceAPI.getCustom(data) // Test with custom get data');
  console.log('  - testInvoiceAPI.samples // View create samples');
  console.log('  - testInvoiceAPI.getSamples // View get samples');
  console.log('');
  console.log('🎯 Quick test: testInvoiceAPI.createBasic()');
  console.log('🔍 Quick get test: testInvoiceAPI.getByExternalId("your-external-id")');
};
