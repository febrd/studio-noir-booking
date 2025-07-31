
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
      console.log('🧪 Testing from UI:', testType, data);
      
      const result = await createInvoice(data);
      
      if (result.success) {
        toast.success('Invoice created successfully! Check console for details.');
        console.log('✅ UI Test Success:', result);
      } else {
        toast.error(`Failed: ${result.error}`);
        console.log('❌ UI Test Failed:', result);
      }
    } catch (error) {
      toast.error('Test failed - check console');
      console.error('💥 UI Test Error:', error);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>🧪 Invoice API Tester</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Test invoice creation endpoints. Check browser console for detailed logs.
        </div>
        
        <div className="space-y-2">
          <Button 
            onClick={() => handleTest('basic')}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? 'Testing...' : 'Test Basic Invoice'}
          </Button>
          
          <Button 
            onClick={() => handleTest('withCustomer')}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? 'Testing...' : 'Test Invoice + Customer'}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground border-t pt-3">
          <div>Console commands available:</div>
          <code className="text-xs">testInvoiceAPI.createBasic()</code><br/>
          <code className="text-xs">testInvoiceAPI.createWithCustomer()</code>
        </div>
      </CardContent>
    </Card>
  );
};
