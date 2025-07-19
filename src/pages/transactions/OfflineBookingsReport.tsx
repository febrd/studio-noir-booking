import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { ExportButtons } from '@/components/ExportButtons';

const OfflineBookingsReport = () => {
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['offline-bookings', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          users (name, email),
          studios (name, type),
          studio_packages (title, price, category_id),
          package_categories (name),
          installments (amount, paid_at, payment_method)
        `)
        .gte('created_at', startDate + 'T00:00:00')
        .lte('created_at', endDate + 'T23:59:59')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Filter for offline bookings based on payment_method
  const offlineBookings = useMemo(() => {
    if (!bookingsData) return [];
    return bookingsData.filter(booking => {
      const paymentMethod = booking.payment_method;
      return paymentMethod === 'cash' || 
             paymentMethod === 'debit_card' ||
             !paymentMethod; // null/undefined payment methods are considered offline
    });
  }, [bookingsData]);

  const filteredData = useMemo(() => {
    if (!offlineBookings) return [];
    
    return offlineBookings.filter(booking => {
      const searchLower = searchTerm.toLowerCase();
      return (
        booking.users?.name?.toLowerCase().includes(searchLower) ||
        booking.users?.email?.toLowerCase().includes(searchLower) ||
        booking.studios?.name?.toLowerCase().includes(searchLower) ||
        booking.studio_packages?.title?.toLowerCase().includes(searchLower)
      );
    });
  }, [offlineBookings, searchTerm]);

  const exportData = useMemo(() => {
    if (!filteredData) return undefined;

    const headers = [
      'Tanggal',
      'Customer',
      'Email',
      'Studio',
      'Paket',
      'Status',
      'Total Amount',
      'Payment Method'
    ];

    const data = filteredData.map(booking => [
      format(new Date(booking.created_at), 'dd/MM/yyyy HH:mm', { locale: id }),
      booking.users?.name || '-',
      booking.users?.email || '-',
      booking.studios?.name || '-',
      booking.studio_packages?.title || '-',
      booking.status,
      `Rp ${booking.total_amount?.toLocaleString('id-ID') || '0'}`,
      booking.payment_method || '-'
    ]);

    return {
      title: `Laporan Transaksi Offline (${startDate} - ${endDate})`,
      headers,
      data,
      filename: `transaksi-offline-${startDate}-${endDate}`
    };
  }, [filteredData, startDate, endDate]);

  const totalAmount = useMemo(() => {
    return filteredData?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;
  }, [filteredData]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Laporan Transaksi Offline</h1>
          <p className="text-muted-foreground">
            Laporan transaksi booking offline
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
                  placeholder="Cari customer, email, studio..."
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{filteredData?.length || 0}</div>
            <p className="text-muted-foreground">Total Transaksi</p>
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
            <div className="text-2xl font-bold text-blue-600">
              {filteredData?.filter(b => b.status === 'confirmed').length || 0}
            </div>
            <p className="text-muted-foreground">Transaksi Berhasil</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Transaksi</CardTitle>
          <CardDescription>
            Daftar transaksi offline periode {format(new Date(startDate), 'dd MMMM yyyy', { locale: id })} - {format(new Date(endDate), 'dd MMMM yyyy', { locale: id })}
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
                  <th className="border border-gray-200 p-3 text-left">Paket</th>
                  <th className="border border-gray-200 p-3 text-left">Status</th>
                  <th className="border border-gray-200 p-3 text-left">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredData?.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 p-3">
                      {format(new Date(booking.created_at), 'dd/MM/yyyy HH:mm', { locale: id })}
                    </td>
                    <td className="border border-gray-200 p-3">
                      <div>
                        <div className="font-medium">{booking.users?.name}</div>
                        <div className="text-sm text-gray-600">{booking.users?.email}</div>
                      </div>
                    </td>
                    <td className="border border-gray-200 p-3">{booking.studios?.name}</td>
                    <td className="border border-gray-200 p-3">{booking.studio_packages?.title}</td>
                    <td className="border border-gray-200 p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        booking.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : booking.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="border border-gray-200 p-3 font-semibold">
                      Rp {booking.total_amount?.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflineBookingsReport;
