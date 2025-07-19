import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ModernLayout } from '@/components/Layout/ModernLayout';

interface Transaction {
  id: string;
  created_at: string;
  amount: number;
  payment_method: string;
  status: string;
  user_id: string;
}

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*');

      if (error) {
        throw new Error(error.message);
      }

      return data as Transaction[];
    },
  });

  useEffect(() => {
    if (data) {
      setTransactions(data);
    }
  }, [data]);

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => format(new Date(row.getValue('created_at')), 'PPP'),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('amount'));
        const formatted = new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
        }).format(amount);

        return formatted;
      },
    },
    {
      accessorKey: 'payment_method',
      header: 'Payment Method',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;

        return (
          <Badge
            variant={status === 'success' ? 'outline' : 'destructive'}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'user_id',
      header: 'User ID',
    },
  ];

  if (isLoading) {
    return <div>Loading transactions...</div>;
  }

  if (isError) {
    return <div>Error fetching transactions</div>;
  }

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Here are all your transactions.
          </p>
        </div>
        <DataTable columns={columns} data={transactions} />
      </div>
    </ModernLayout>
  );
};

export default TransactionsPage;
