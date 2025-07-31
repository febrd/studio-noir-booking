import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CreditCard, User, Clock } from 'lucide-react';

const OfflineTransactionsPage = () => {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['offlineTransactions', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('payment_status', 'success')
        .eq('payment_method', 'cash');

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Offline Transactions</h1>
        <p className="text-gray-600">Lihat semua transaksi offline dan pembayaran langsung</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {transactions?.map((transaction) => (
          <Card key={transaction.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Transaction #{transaction.id.substring(0, 8)}</CardTitle>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="default">
                        Rp {transaction.amount}
                      </Badge>
                      <Badge variant={transaction.payment_status === 'success' ? 'outline' : 'destructive'}>
                        {transaction.payment_status === 'success' ? 'Success' : 'Failed'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Metode Pembayaran:</span> {transaction.payment_method}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Tanggal:</span> {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                </p>
                <p className="text-xs text-gray-500">
                  Dibuat: {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {transactions?.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada transaksi offline</h3>
          <p className="text-gray-600 mb-4">Tidak ada transaksi offline yang ditemukan</p>
        </div>
      )}
    </div>
  );
};

export default OfflineTransactionsPage;
