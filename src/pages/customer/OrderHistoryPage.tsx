
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, ArrowLeft, Search, Filter, Clock, Camera, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ModernLayout } from '@/components/Layout/ModernLayout';
import { useState } from 'react';
import { formatDateTimeWITA } from '@/utils/timezoneUtils';
import { toast } from 'sonner';
import QRISPaymentDialog from '@/components/QRISPaymentDialog';

const OrderHistoryPage = () => {
  const { userProfile } = useJWTAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<any>(null);

  const { data: bookings = [], isLoading, refetch } = useQuery({
    queryKey: ['customer-bookings', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          studios (name, type),
          studio_packages (title, price, base_time_minutes),
          installments (amount, paid_at, payment_method),
          booking_additional_services(
            quantity,
            additional_services(name)
          )
        `)
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.id
  });

  // Filter bookings based on search and status
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = searchTerm === '' || 
      booking.studios?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.studio_packages?.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success('Pesanan berhasil dibatalkan');
      refetch();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Gagal membatalkan pesanan');
    }
  };

  const handlePayment = (booking: any) => {
    setSelectedBookingForPayment(booking);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-50 text-green-600 border-green-200';
      case 'pending': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'completed': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-200';
      case 'paid': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Dikonfirmasi';
      case 'pending': return 'Menunggu';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      case 'paid': return 'Dibayar';
      default: return status;
    }
  };

  const getTypeText = (type: string) => {
    return type === 'self_photo' ? 'Self Photo' : 'Studio Reguler';
  };

  if (isLoading) {
    return (
      <ModernLayout>
        <div className="min-h-screen bg-white flex justify-center items-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout>
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-8 py-12">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-8">
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-inter font-medium">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali
                </Button>
              </Link>
            </div>
            <h1 className="text-6xl font-peace-sans font-black mb-4 tracking-tight text-black">
              Riwayat Pesanan
            </h1>
            <p className="text-xl font-inter text-gray-500">
              Kelola dan pantau semua booking Anda
            </p>
          </div>

          {/* Filters */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari studio atau paket..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-gray-300"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px] border-gray-200">
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Filter Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">Menunggu</SelectItem>
                  <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                  <SelectItem value="paid">Dibayar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bookings List */}
          {filteredBookings.length > 0 ? (
            <div className="space-y-6">
              {filteredBookings.map((booking) => (
                <Card key={booking.id} className="border border-gray-100 shadow-none hover:border-gray-200 hover:shadow-sm transition-all">
                  <CardContent className="p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-2xl font-peace-sans font-black text-black mb-1">
                              {booking.studios?.name}
                            </h3>
                            <p className="text-gray-500 font-inter mb-2">
                              {booking.studio_packages?.title}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-400 font-inter">
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDateTimeWITA(booking.start_time || booking.created_at)}
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {booking.studio_packages?.base_time_minutes} menit
                                {booking.additional_time_minutes > 0 && ` + ${booking.additional_time_minutes} menit`}
                              </span>
                              <span className="flex items-center">
                                <Camera className="h-4 w-4 mr-1" />
                                {getTypeText(booking.studios?.type)}
                              </span>
                            </div>
                          </div>
                          
                          <Badge className={getStatusColor(booking.status) + ' font-peace-sans font-bold border'}>
                            {getStatusText(booking.status)}
                          </Badge>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-gray-50 p-4 rounded-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-inter text-gray-600">Total Pembayaran</span>
                            <span className="text-lg font-peace-sans font-black text-black">
                              {(booking.total_amount || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                            </span>
                          </div>
                          {booking.installments && booking.installments.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-inter text-gray-500">Sudah Dibayar</span>
                                  <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                                    Cicilan {booking.installments.length}x
                                  </Badge>
                                </div>
                                <span className="text-sm font-inter font-medium text-green-600">
                                  {booking.installments.reduce((sum: number, inst: any) => sum + (inst.amount || 0), 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        {booking.status === 'pending' && (
                          <>
                            <Button
                              onClick={() => handlePayment(booking)}
                              className="bg-green-600 hover:bg-green-700 text-white font-peace-sans font-bold"
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Bayar Sekarang
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleCancelBooking(booking.id)}
                              className="border-red-200 text-red-600 hover:bg-red-50 font-peace-sans font-bold"
                            >
                              Batalkan Pesanan
                            </Button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <Button variant="outline" size="sm" className="border-green-200 text-green-600 hover:bg-green-50 font-peace-sans font-bold">
                            Siap Difoto
                          </Button>
                        )}
                        {booking.status === 'completed' && (
                          <Button variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-50 font-peace-sans font-bold">
                            Selesai
                          </Button>
                        )}
                        {booking.status === 'paid' && (
                          <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-peace-sans font-bold">
                            Dibayar
                          </Button>
                        )}
                        {booking.status === 'cancelled' && (
                          <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 font-peace-sans font-bold" disabled>
                            Dibatalkan
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Calendar className="h-20 w-20 text-gray-200 mx-auto mb-6" />
              <h3 className="text-2xl font-peace-sans font-black mb-2 text-gray-400">Belum Ada Pesanan</h3>
              <p className="text-gray-400 font-inter mb-8">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Tidak ada pesanan yang sesuai dengan filter Anda'
                  : 'Anda belum membuat booking apapun !'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Link to="/customer/booking-selection">
                  <Button className="bg-black text-white font-peace-sans font-bold hover:bg-gray-800">
                    Buat Booking Pertama
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* QRIS Payment Dialog */}
      {selectedBookingForPayment && (
        <QRISPaymentDialog
          isOpen={!!selectedBookingForPayment}
          onClose={() => setSelectedBookingForPayment(null)}
          booking={selectedBookingForPayment}
        />
      )}
    </ModernLayout>
  );
};

export default OrderHistoryPage;
