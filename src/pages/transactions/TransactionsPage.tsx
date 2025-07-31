import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Calendar, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExportButtons } from '@/components/ExportButtons';

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error);
        toast.error(`Failed to fetch transactions: ${error.message}`);
        throw error;
      }

      setTransactions(data || []);
      setLoading(false);

      return data;
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-red-500">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Transactions</h1>
          <p className="text-gray-600">Lihat semua transaksi online dan offline</p>
        </div>
        <ExportButtons data={transactions} filename="all-transactions" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {transactions.map((transaction) => (
          <Card key={transaction.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Transaction ID: {transaction.id}</CardTitle>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary">
                        {transaction.payment_method || 'Unknown'}
                      </Badge>
                      <Badge variant={transaction.status === 'success' ? 'outline' : 'destructive'}>
                        {transaction.status || 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Amount:</span> {transaction.amount}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">User ID:</span> {transaction.user_id}
                </p>
                <p className="text-xs text-gray-500">
                  Created: {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
          <p className="text-gray-600 mb-4">There are currently no transactions to display.</p>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
