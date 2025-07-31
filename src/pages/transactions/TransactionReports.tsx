import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Calendar, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExportButtons } from '@/components/ExportButtons';

const TransactionReports = () => {
  const [reportData, setReportData] = useState([]);

  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['transactionReports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      setReportData(data);
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">Error loading reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaction Reports</h1>
          <p className="text-gray-600">Laporan dan analisis transaksi lengkap</p>
        </div>
        <ExportButtons data={reportData} filename="transaction-reports" />
      </div>

      <div>
        {reportData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportData.map((report, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>Transaction #{index + 1}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Amount: {report.amount}</p>
                  <p>Type: {report.type}</p>
                  <p>Status: {report.status}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports available</h3>
            <p className="text-gray-600 mb-4">Check back later for updated reports.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionReports;
