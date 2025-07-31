
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

// Global test function for browser console
declare global {
  interface Window {
    testInvoiceAPI: {
      createBasic: () => Promise<void>;
      createWithCustomer: () => Promise<void>;
      createCustom: (data: any) => Promise<void>;
      samples: typeof sampleInvoiceData;
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

  // Setup global test functions
  window.testInvoiceAPI = {
    createBasic: () => testCreateInvoice(sampleInvoiceData.basic),
    createWithCustomer: () => testCreateInvoice(sampleInvoiceData.withCustomer),
    createCustom: (data: any) => testCreateInvoice(data),
    samples: sampleInvoiceData
  };

  // Log instructions
  console.log('🧪 Invoice API Test Utils Loaded!');
  console.log('📖 Available commands:');
  console.log('  - testInvoiceAPI.createBasic() // Test basic invoice');
  console.log('  - testInvoiceAPI.createWithCustomer() // Test with customer data');
  console.log('  - testInvoiceAPI.createCustom(data) // Test with custom data');
  console.log('  - testInvoiceAPI.samples // View sample data');
  console.log('');
  console.log('🎯 Quick test: testInvoiceAPI.createBasic()');
};
