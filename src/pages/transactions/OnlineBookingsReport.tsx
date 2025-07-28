import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Search, Filter, FileText, Download, Calendar } from 'lucide-react';
import { ExportButtons } from '@/components/ExportButtons';
import { supabase } from '@/integrations/supabase/client';
import { ModernLayout } from '@/components/Layout/ModernLayout';
import { useDebounce } from '@/hooks/useDebounce';

const OnlineBookingsReport = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState('all');
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const { data: bookings, isLoading, error } = useQuery({
    queryKey: ['online-bookings', debouncedSearchQuery, dateFilter, statusFilter, amountFilter],
    queryFn: async () => {
      console.log('Fetching online bookings with filters:', {
        searchQuery: debouncedSearchQuery,
        dateFilter,
        statusFilter,
        amountFilter
      });

      // First, fetch bookings with payment method 'online'
      let bookingQuery = supabase
        .from('bookings')
        .select(`
          *,
          users!bookings_user_id_fkey(name, email),
          studios!bookings_studio_id_fkey(name),
          transactions!transactions_booking_id_fkey(
            id,
            amount,
            status,
            payment_type,
            created_at
          )
        `)
        .eq('payment_method', 'online')
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
        
        bookingQuery = bookingQuery.gte('created_at', startDate.toISOString());
      }

      const { data: bookingData, error: bookingError } = await bookingQuery;
      
      if (bookingError) {
        console.error('Error fetching bookings:', bookingError);
        throw bookingError;
      }
      
      console.log('Fetched online bookings:', bookingData);

      // Fetch installments for these bookings
      const bookingIds = bookingData?.map(booking => booking.id) || [];
      const { data: installments, error: installmentsError } = await supabase
        .from('installments')
        .select('*')
        .in('booking_id', bookingIds);

      if (installmentsError) {
        console.error('Error fetching installments:', installmentsError);
      }
      
      console.log('Fetched online installments:', installments);

      // Fetch custom orders with online payment
      const { data: customOrders, error: customOrdersError } = await supabase
        .from('custom_orders')
        .select(`
          *,
          customer_profiles!custom_orders_customer_id_fkey(
            id,
            full_name,
            email
          )
        `)
        .eq('payment_method', 'online')
        .order('created_at', { ascending: false });

      if (customOrdersError) {
        console.error('Error fetching custom orders:', customOrdersError);
      }

      console.log('Fetched online custom orders:', customOrders);

      // Process bookings data
      const processedBookings = bookingData?.map(booking => {
        const transaction = booking.transactions?.[0];
        const bookingInstallments = installments?.filter(inst => inst.booking_id === booking.id) || [];
        
        return {
          id: booking.id,
          created_at: booking.created_at,
          customer_name: booking.users?.name || 'N/A',
          customer_email: booking.users?.email || 'N/A',
          studio_name: booking.studios?.name || 'N/A',
          jenis: booking.status === 'installment' ? 'Installment' : 'Booking',
          tipe: booking.status === 'installment' ? 'installment' : 'full_payment',
          description: booking.notes || 'Tidak ada deskripsi',
          status: transaction?.status || 'pending',
          amount: transaction?.amount || booking.total_amount || 0,
          payment_type: transaction?.payment_type || 'unknown',
          installments: bookingInstallments,
          source: 'booking'
        };
      }) || [];

      // Process custom orders data
      const processedCustomOrders = customOrders?.map(order => ({
        id: order.id,
        created_at: order.created_at,
        customer_name: order.customer_profiles?.full_name || 'N/A',
        customer_email: order.customer_profiles?.email || 'N/A',
        studio_name: 'N/A',
        jenis: 'Custom',
        tipe: 'full_payment',
        description: order.notes || 'Tidak ada deskripsi',
        status: 'paid',
        amount: order.total_amount || 0,
        payment_type: 'online',
        installments: [],
        source: 'custom_order'
      })) || [];

      // Combine all data
      const allData = [...processedBookings, ...processedCustomOrders];

      // Sort by created_at
      allData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Apply filters
      let filteredData = allData;

      // Search filter
      if (debouncedSearchQuery.trim()) {
        const searchLower = debouncedSearchQuery.toLowerCase();
        filteredData = filteredData.filter(booking => 
          booking.customer_name?.toLowerCase().includes(searchLower) ||
          booking.customer_email?.toLowerCase().includes(searchLower) ||
          booking.studio_name?.toLowerCase().includes(searchLower) ||
          booking.description?.toLowerCase().includes(searchLower)
        );
      }

      // Status filter
      if (statusFilter !== 'all') {
        filteredData = filteredData.filter(booking => booking.status === statusFilter);
      }

      // Amount filter
      if (amountFilter !== 'all') {
        filteredData = filteredData.filter(booking => {
          const amount = Number(booking.amount);
          switch (amountFilter) {
            case 'small': return amount < 100000;
            case 'medium': return amount >= 100000 && amount < 500000;
            case 'large': return amount >= 500000;
            default: return true;
          }
        });
      }

      console.log('Final filtered data:', filteredData);
      return filteredData;
    }
  });

  const summary = bookings?.reduce((acc, booking) => {
    acc.totalAmount += Number(booking.amount);
    acc.totalBookings += 1;
    if (booking.status === 'paid') {
      acc.paidBookings += 1;
    }
    if (booking.installments && booking.installments.length > 0) {
      acc.installmentBookings += 1;
    }
    return acc;
  }, {
    totalAmount: 0,
    totalBookings: 0,
    paidBookings: 0,
    installmentBookings: 0
  }) || { totalAmount: 0, totalBookings: 0, paidBookings: 0, installmentBookings: 0 };

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
    setStatusFilter('all');
    setAmountFilter('all');
  };

  if (isLoading) {
    return (
      <ModernLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading online bookings...</p>
          </div>
        </div>
      </ModernLayout>
    );
  }

  if (error) {
    return (
      <ModernLayout>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">Error loading bookings: {error.message}</div>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Laporan Transaksi Online</h1>
            <p className="text-gray-600">Pantau semua transaksi online dan pembayaran digital</p>
          </div>
          <ExportButtons
            data={bookings || []}
            filename="online-bookings-report"
            title="Laporan Transaksi Online"
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalBookings}</div>
              <p className="text-xs text-muted-foreground">
                {summary.paidBookings} lunas
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(summary.totalAmount)}</div>
              <p className="text-xs text-muted-foreground">
                Dari transaksi online
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rata-rata Transaksi</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.totalBookings > 0 ? formatPrice(summary.totalAmount / summary.totalBookings) : formatPrice(0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Per transaksi
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cicilan</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.installmentBookings}</div>
              <p className="text-xs text-muted-foreground">
                Transaksi cicilan
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cari Transaksi</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Nama, email, studio..."
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
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua status</SelectItem>
                    <SelectItem value="paid">Lunas</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Gagal</SelectItem>
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
                    <SelectItem value="small">Kurang dari Rp 100,000</SelectItem>
                    <SelectItem value="medium">Rp 100,000 - 500,000</SelectItem>
                    <SelectItem value="large">Lebih dari Rp 500,000</SelectItem>
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

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Transaksi Online ({bookings?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {bookings && bookings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Studio</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="text-sm">
                        {formatDateTime(booking.created_at)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.customer_name}</div>
                          <div className="text-sm text-gray-500">{booking.customer_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.studio_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{booking.jenis}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{booking.tipe}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={booking.description || ''}>
                          {booking.description || 'Tidak ada deskripsi'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatPrice(Number(booking.amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada transaksi online</h3>
                <p className="text-gray-600">
                  {searchQuery || dateFilter !== 'all' || statusFilter !== 'all' || amountFilter !== 'all'
                    ? "Tidak ada transaksi yang sesuai dengan filter"
                    : "Belum ada transaksi online"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ModernLayout>
  );
};

export default OnlineBookingsReport;
