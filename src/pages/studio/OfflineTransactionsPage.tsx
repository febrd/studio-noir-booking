
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Search, Filter, Calendar, User, FileText } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

const OfflineTransactionsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState('all');
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch offline transactions with related data
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['offline-transactions', debouncedSearchQuery, dateFilter, amountFilter],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          bookings!inner(
            id,
            user_id,
            studio_id,
            users!inner(name, email),
            studios!inner(name)
          ),
          performed_by_user:users!performed_by(name, email)
        `)
        .eq('type', 'offline')
        .order('created_at', { ascending: false });

      // Apply date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Filter by search query (customer name or booking ID)
      let filteredData = data || [];
      if (debouncedSearchQuery.trim()) {
        const searchLower = debouncedSearchQuery.toLowerCase();
        filteredData = filteredData.filter(transaction => 
          transaction.bookings?.users?.name?.toLowerCase().includes(searchLower) ||
          transaction.bookings?.users?.email?.toLowerCase().includes(searchLower) ||
          transaction.booking_id?.toLowerCase().includes(searchLower) ||
          transaction.description?.toLowerCase().includes(searchLower)
        );
      }

      // Filter by amount range
      if (amountFilter !== 'all') {
        filteredData = filteredData.filter(transaction => {
          const amount = Number(transaction.amount);
          switch (amountFilter) {
            case 'small': return amount < 100000;
            case 'medium': return amount >= 100000 && amount < 500000;
            case 'large': return amount >= 500000;
            default: return true;
          }
        });
      }

      return filteredData;
    }
  });

  // Calculate summary statistics
  const summary = transactions?.reduce((acc, transaction) => {
    acc.totalAmount += Number(transaction.amount);
    acc.totalTransactions += 1;
    if (transaction.payment_type === 'installment') {
      acc.installmentCount += 1;
    }
    return acc;
  }, {
    totalAmount: 0,
    totalTransactions: 0,
    installmentCount: 0
  }) || { totalAmount: 0, totalTransactions: 0, installmentCount: 0 };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setAmountFilter('all');
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading transactions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transaksi Offline</h1>
        <p className="text-gray-600">Kelola dan pantau semua transaksi offline</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              {summary.installmentCount} cicilan
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nominal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(summary.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Semua transaksi offline
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.totalTransactions > 0 ? formatPrice(summary.totalAmount / summary.totalTransactions) : formatPrice(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per transaksi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cari Transaksi</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nama customer, booking ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Periode</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua waktu</SelectItem>
                  <SelectItem value="today">Hari ini</SelectItem>
                  <SelectItem value="week">7 hari terakhir</SelectItem>
                  <SelectItem value="month">Bulan ini</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Nominal</label>
              <Select value={amountFilter} onValueChange={setAmountFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih rentang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua nominal</SelectItem>
                  <SelectItem value="small">< Rp 100,000</SelectItem>
                  <SelectItem value="medium">Rp 100,000 - 500,000</SelectItem>
                  <SelectItem value="large">> Rp 500,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Aksi</label>
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Reset Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Transaksi ({transactions?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Studio</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dicatat Oleh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-sm">
                      {formatDateTime(transaction.created_at)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{transaction.bookings?.users?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{transaction.bookings?.users?.email || 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {transaction.bookings?.studios?.name || 'N/A'}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={transaction.description || ''}>
                        {transaction.description || 'Tidak ada deskripsi'}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatPrice(Number(transaction.amount))}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {transaction.performed_by_user?.name || 'System'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada transaksi</h3>
              <p className="text-gray-600">
                {searchQuery || dateFilter !== 'all' || amountFilter !== 'all'
                  ? "Tidak ada transaksi yang sesuai dengan filter"
                  : "Belum ada transaksi offline"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflineTransactionsPage;
