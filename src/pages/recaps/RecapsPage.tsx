import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Calendar, TrendingUp, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MonthlyRevenueDetails } from '@/components/MonthlyRevenueDetails';
import { ExportButtons } from '@/components/ExportButtons';

const RecapsPage = () => {
  const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(new Date());

  const { data: recapData, isLoading, error } = useQuery({
    queryKey: ['monthlyRecap', selectedMonth?.toISOString()],
    queryFn: async () => {
      if (!selectedMonth) return null;

      const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).toISOString();
      const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).toISOString();

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth);

      if (error) throw error;
      return data;
    },
  });

  const handleMonthChange = (date: Date | undefined) => {
    setSelectedMonth(date);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading recaps...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">Error loading recaps.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monthly Recaps</h1>
          <p className="text-gray-600">Rekap bulanan pendapatan dan transaksi</p>
        </div>
        <ExportButtons data={recapData} filename="monthly-recaps" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pilih Bulan</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyRevenueDetails onMonthChange={handleMonthChange} />
        </CardContent>
      </Card>

      {recapData && recapData.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Detail Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              {recapData.map((transaction) => (
                <li key={transaction.id} className="py-2 border-b border-gray-200">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Transaction ID: {transaction.id}
                      </p>
                      <p className="text-xs text-gray-500">
                        Date: {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">
                        Amount: ${transaction.amount}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <p>No transactions found for the selected month.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecapsPage;
