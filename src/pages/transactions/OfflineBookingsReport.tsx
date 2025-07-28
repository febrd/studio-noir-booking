import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { ExportButtons } from '@/components/ExportButtons';
import { ModernLayout } from '@/components/Layout/ModernLayout';

const OfflineBookingsReport = () => {
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');

  // Query untuk mengambil semua transaksi dengan payment method offline
  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['offline-transactions', startDate, endDate],
    queryFn: async () => {
      console.log('Fetching offline transactions...');
      
      // Ambil semua booking dengan payment method offline
      const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          id,
          created_at,
          payment_method,
          total_amount,
          status,
          type,
          is_walking_session,
          user_id,
          studio_id,
          users!inner(name, email),
          studios!inner(name),
          studio_packages!inner(title)
        `)
        .eq('payment_method', 'offline')
        .gte('created_at', startDate + 'T00:00:00')
        .lte('created_at', endDate + 'T23:59:59')
        .order('created_at', { ascending: false });

      if (bookingError) {
        console.error('Error fetching bookings:', bookingError);
        throw bookingError;
      }
      
      console.log('Fetched offline bookings:', bookings);

      // Ambil semua installments dengan payment method offline
      const { data: installments, error: instError } = await supabase
        .from('installments')
        .select(`
          *,
          bookings!inner(
            id,
            user_id,
            studio_id,
            status,
            total_amount,
            payment_method,
            type,
            is_walking_session,
            users!inner(name, email),
            studios!inner(name),
            studio_packages!inner(title)
          )
        `)
        .eq('payment_method', 'offline')
        .gte('created_at', startDate + 'T00:00:00')
        .lte('created_at', endDate + 'T23:59:59')
        .order('created_at', { ascending: false });

      if (instError) {
        console.error('Error fetching installments:', instError);
        throw instError;
      }
      
      console.log('Fetched offline installments:', installments);

      // Ambil semua custom orders dengan payment method offline
      const { data: customOrders, error: customError } = await supabase
        .from('custom_orders')
        .select(`
          *,
          customer_profiles!fk_custom_orders_customer_id(full_name, email),
          studios!inner(name)
        `)
        .eq('payment_method', 'offline')
        .gte('created_at', startDate + 'T00:00:00')
        .lte('created_at', endDate + 'T23:59:59')
        .order('created_at', { ascending: false });

      if (customError) {
        console.error('Error fetching custom orders:', customError);
        throw customError;
      }
      
      console.log('Fetched offline custom orders:', customOrders);

      const allTransactions = [];

      // Proses semua booking offline
      for (const booking of bookings || []) {
        const hasInstallments = installments?.some(inst => inst.booking_id === booking.id);
        
        console.log(`Processing booking ${booking.id}:`, {
          hasInstallments,
          status: booking.status,
          isWalkingSession: booking.is_walking_session,
          paymentMethod: booking.payment_method,
          type: booking.type
        });
        
        // Jika tidak ada installments dan status confirmed/paid, tampilkan sebagai full payment
        if (!hasInstallments && (booking.status === 'confirmed' || booking.status === 'paid')) {
          const sessionType = booking.is_walking_session ? 'Walk-in Session' : 'Booking Regular';
          const description = `${sessionType} - ${booking.studio_packages?.title || 'Package'}`;
          
          allTransactions.push({
            id: booking.id,
            created_at: booking.created_at,
            amount: booking.total_amount,
            description: description,
            type: 'full_payment',
            payment_method: 'offline',
            status: booking.status,
            is_walking_session: booking.is_walking_session,
            booking_type: booking.type,
            source: 'booking',
            bookings: {
              users: booking.users,
              studios: booking.studios,
              studio_packages: booking.studio_packages
            }
          });
        }
      }

      // Tambahkan semua installment offline
      for (const installment of installments || []) {
        const sessionType = installment.bookings.is_walking_session ? 'Walk-in Session' : 'Booking Regular';
        const description = `Cicilan ke-${installment.installment_number || 'N/A'} - ${sessionType} - ${installment.bookings.studio_packages?.title || 'Package'}`;
        
        allTransactions.push({
          id: installment.id,
          created_at: installment.created_at,
          amount: installment.amount,
          description: description,
          type: 'installment',
          payment_method: 'offline',
          status: 'paid',
          is_walking_session: installment.bookings.is_walking_session,
          booking_type: installment.bookings.type,
          source: 'installment',
          bookings: installment.bookings
        });
      }

      // Tambahkan semua custom orders offline
      for (const order of customOrders || []) {
        const description = `Custom Order - ${order.notes || 'No description'}`;
        
        allTransactions.push({
          id: order.id,
          created_at: order.created_at,
          amount: order.total_amount,
          description: description,
          type: 'custom_order',
          payment_method: 'offline',
          status: order.status,
          is_walking_session: false,
          booking_type: 'custom',
          source: 'custom_order',
          bookings: {
            users: { 
              name: order.customer_profiles?.full_name || 'N/A',
              email: order.customer_profiles?.email || 'N/A'
            },
            studios: order.studios,
            studio_packages: { title: 'Custom Order' }
          }
        });
      }

      console.log('All offline transactions processed:', allTransactions);
      return allTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  });

  const filteredData = useMemo(() => {
    if (!transactionsData) return [];
    
    return transactionsData.filter(transaction => {
      const searchLower = searchTerm.toLowerCase();
      return (
        transaction.bookings?.users?.name?.toLowerCase().includes(searchLower) ||
        transaction.bookings?.users?.email?.toLowerCase().includes(searchLower) ||
        transaction.bookings?.studios?.name?.toLowerCase().includes(searchLower) ||
        transaction.bookings?.studio_packages?.title?.toLowerCase().includes(searchLower) ||
        transaction.description?.toLowerCase().includes(searchLower)
      );
    });
  }, [transactionsData, searchTerm]);

  const exportData = useMemo(() => {
    if (!filteredData) return undefined;

    const headers = [
      'Tanggal',
      'Customer',
      'Email',
      'Studio',
      'Paket',
      'Tipe Transaksi',
      'Jenis',
      'Deskripsi',
      'Status',
      'Total Amount'
    ];

    const data = filteredData.map(transaction => [
      format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm', { locale: id }),
      transaction.bookings?.users?.name || '-',
      transaction.bookings?.users?.email || '-',
      transaction.bookings?.studios?.name || '-',
      transaction.bookings?.studio_packages?.title || '-',
      transaction.type === 'installment' ? 'Cicilan' : transaction.type === 'custom_order' ? 'Custom Order' : 'Full Payment',
      transaction.is_walking_session ? 'Walk-in Session' : transaction.type === 'custom_order' ? 'Custom Order' : 'Booking Regular',
      transaction.description || '-',
      transaction.status || '-',
      `Rp ${transaction.amount?.toLocaleString('id-ID') || '0'}`
    ]);

    return {
      title: `Laporan Transaksi Offline (${startDate} - ${endDate})`,
      headers,
      data,
      filename: `transaksi-offline-${startDate}-${endDate}`
    };
  }, [filteredData, startDate, endDate]);

  const totalAmount = useMemo(() => {
    return filteredData?.reduce((sum, transaction) => sum + (transaction.amount || 0), 0) || 0;
  }, [filteredData]);

  const transactionCount = filteredData?.length || 0;
  const installmentCount = filteredData?.filter(t => t.type === 'installment').length || 0;
  const walkinCount = filteredData?.filter(t => t.is_walking_session).length || 0;
  const customOrderCount = filteredData?.filter(t => t.type === 'custom_order').length || 0;

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Laporan Transaksi Offline</h1>
            <p className="text-muted-foreground">
              Laporan semua transaksi dengan metode pembayaran offline
            </p>
          </div>
          <ExportButtons exportData={exportData} />
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Mulai</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Akhir</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Pencarian</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari customer, studio, deskripsi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{transactionCount}</div>
              <p className="text-muted-foreground">Total Transaksi</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">{installmentCount}</div>
              <p className="text-muted-foreground">Cicilan</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-orange-600">{walkinCount}</div>
              <p className="text-muted-foreground">Walk-in Sessions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-red-600">{customOrderCount}</div>
              <p className="text-muted-foreground">Custom Orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">
                Rp {totalAmount.toLocaleString('id-ID')}
              </div>
              <p className="text-muted-foreground">Total Pendapatan</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-purple-600">
                {transactionCount - installmentCount - customOrderCount}
              </div>
              <p className="text-muted-foreground">Full Payment</p>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Data Transaksi Offline</CardTitle>
            <CardDescription>
              Daftar semua transaksi offline periode {format(new Date(startDate), 'dd MMMM yyyy', { locale: id })} - {format(new Date(endDate), 'dd MMMM yyyy', { locale: id })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 p-3 text-left">Tanggal</th>
                    <th className="border border-gray-200 p-3 text-left">Customer</th>
                    <th className="border border-gray-200 p-3 text-left">Studio</th>
                    <th className="border border-gray-200 p-3 text-left">Jenis</th>
                    <th className="border border-gray-200 p-3 text-left">Tipe</th>
                    <th className="border border-gray-200 p-3 text-left">Deskripsi</th>
                    <th className="border border-gray-200 p-3 text-left">Status</th>
                    <th className="border border-gray-200 p-3 text-left">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData?.map((transaction) => (
                    <tr key={`${transaction.source}-${transaction.id}`} className="hover:bg-gray-50">
                      <td className="border border-gray-200 p-3">
                        {format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm', { locale: id })}
                      </td>
                      <td className="border border-gray-200 p-3">
                        <div>
                          <div className="font-medium">{transaction.bookings?.users?.name}</div>
                          <div className="text-sm text-gray-600">{transaction.bookings?.users?.email}</div>
                        </div>
                      </td>
                      <td className="border border-gray-200 p-3">{transaction.bookings?.studios?.name}</td>
                      <td className="border border-gray-200 p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          transaction.type === 'custom_order'
                            ? 'bg-red-100 text-red-800'
                            : transaction.is_walking_session 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {transaction.type === 'custom_order' ? 'Custom Order' : transaction.is_walking_session ? 'Walk-in' : 'Booking'}
                        </span>
                      </td>
                      <td className="border border-gray-200 p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          transaction.type === 'installment' 
                            ? 'bg-blue-100 text-blue-800' 
                            : transaction.type === 'custom_order'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {transaction.type === 'installment' ? 'Cicilan' : transaction.type === 'custom_order' ? 'Custom Order' : 'Full Payment'}
                        </span>
                      </td>
                      <td className="border border-gray-200 p-3">{transaction.description}</td>
                      <td className="border border-gray-200 p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          transaction.status === 'paid' || transaction.status === 'confirmed' || transaction.status === 'completed'
                            ? 'bg-green-100 text-green-800' 
                            : transaction.status === 'pending' || transaction.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="border border-gray-200 p-3 font-semibold">
                        Rp {transaction.amount?.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModernLayout>
  );
};

export default OfflineBookingsReport;
