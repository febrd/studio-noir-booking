
import { useEffect } from 'react';
import { setupInvoiceTestUtils } from '@/utils/invoiceTestUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInvoiceAPI } from '@/hooks/useInvoiceAPI';
import { sampleInvoiceData } from '@/utils/invoiceTestUtils';
import { toast } from 'sonner';

export const InvoiceTestPanel = () => {
  const { createInvoice, loading } = useInvoiceAPI();

  useEffect(() => {
    setupInvoiceTestUtils();
  }, []);

  const handleTest = async (testType: 'basic' | 'withCustomer') => {
    try {
      const data = sampleInvoiceData[testType];
      
      const result = await createInvoice(data);
      
      if (result.success) {
        toast.success('Invoice created successfully! Check console for details.');
      } else {
        toast.error(`Failed: ${result.error}`);
      }
    } catch (error) {
      toast.error('Test failed - check console');
      console.error('💥 UI Test Error:', error);
    }
  };

  
};
