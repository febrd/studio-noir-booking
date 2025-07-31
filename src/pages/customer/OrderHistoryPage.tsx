
import React, { useState } from 'react';
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CalendarDays, Package, MapPin, Search, Users, Camera, Clock, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import DynamicPaymentButton from '@/components/DynamicPaymentButton';
import { formatDateTimeWITA } from '@/utils/timezoneUtils';

const OrderHistoryPage = () => {
  const { userProfile } = useJWTAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // You can customize this QRIS image URL
  const qrisImageUrl = "https://i.imgur.com/6U2GMax.jpeg";

  // Fetch user's bookings with enhanced data
  const { data: bookings = [], isLoading, refetch: refetchBookings } = useQuery({
    queryKey: ['user-order-history', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          start_time,
          end_time,
          status,
          total_amount,
          type,
          payment_method,
          payment_link,
          created_at,
          studio_packages!inner(title, description, price),
          studios!inner(name, type),
          installments(amount, paid_at, installment_number),
          booking_additional_services(
            quantity,
            additional_services(name, price)
          ),
          transactions(amount, type, status, created_at)
        `)
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userProfile?.id
  });

  // Filter bookings based on search and status
  const filteredBookings = React.useMemo(() => {
    let filtered = bookings;

    if (searchQuery) {
      filtered = filtered.filter(booking => 
        booking.studio_packages?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.studios?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    return filtered;
  }, [bookings, searchQuery, statusFilter]);

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'installment':
        return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'completed':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'cancelled':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'paid':
        return 'bg-emerald-900 text-emerald-100 border-emerald-700';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Dikonfirmasi';
      case 'pending': return 'Menunggu Pembayaran';
      case 'installment': return 'Cicilan';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      case 'paid': return 'Dibayar';
      default: return status;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'self_photo' ? <Camera className="w-4 h-4" /> : <Users className="w-4 h-4" />;
  };

  const getTypeText = (type: string) => {
    return type === 'self_photo' ? 'Self Photo' : 'Regular Studio';
  };

  const handlePaymentUpdate = () => {
    // Refresh bookings after payment update
    refetchBookings();
  };

  const calculateAdditionalServicesTotal = (services: any[]) => {
    return services?.reduce((total, service) => {
      return total + (service.quantity * service.additional_services.price);
    }, 0) || 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-xl p-6">
        <h1 className="text-2xl md:text-3xl font-peace-sans font-black text-gray-900 mb-2">
          Riwayat Pesanan 📋
        </h1>
        <p className="text-gray-600 font-inter">
          Lihat semua booking dan status pembayaran Anda di Studio Noir.
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="border border-gray-100 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari paket atau studio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu Pembayaran</option>
              <option value="installment">Cicilan</option>
              <option value="confirmed">Dikonfirmasi</option>
              <option value="paid">Dibayar</option>
              <option value="completed">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {filteredBookings.length > 0 ? (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const additionalServicesTotal = calculateAdditionalServicesTotal(booking.booking_additional_services);
            
            return (
              <Card key={booking.id} className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left Side - Booking Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          {getTypeIcon(booking.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-peace-sans font-bold text-lg text-gray-900 truncate">
                            {booking.studio_packages?.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="bg-gray-100 px-2 py-1 rounded-full text-xs font-medium">
                              {getTypeText(booking.type)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{booking.studios?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 flex-shrink-0" />
                          <span>{formatDateTimeWITA(booking.start_time || booking.created_at)}</span>
                        </div>
                      </div>

                      {/* Additional Services */}
                      {booking.booking_additional_services && booking.booking_additional_services.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Layanan Tambahan:</p>
                          <div className="flex flex-wrap gap-1">
                            {booking.booking_additional_services.map((service, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {service.additional_services.name} ({service.quantity}x)
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Installments Info */}
                      {booking.installments && booking.installments.length > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            <span className="text-sm font-medium text-gray-700">
                              Cicilan: {booking.installments.filter(i => i.paid_at).length}/{booking.installments.length} terbayar
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Side - Status, Amount, Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 lg:min-w-0">
                      <div className="flex items-center gap-3">
                        <Badge className={`${getStatusBadgeStyle(booking.status)} border font-peace-sans font-bold whitespace-nowrap`}>
                          {getStatusText(booking.status)}
                        </Badge>
                        <div className="text-right">
                          <p className="text-lg font-peace-sans font-bold text-gray-900">
                            {(booking.total_amount || 0).toLocaleString('id-ID', { 
                              style: 'currency', 
                              currency: 'IDR', 
                              minimumFractionDigits: 0 
                            })}
                          </p>
                          {additionalServicesTotal > 0 && (
                            <p className="text-xs text-gray-500">
                              Termasuk layanan tambahan
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Payment Button - Updated to use DynamicPaymentButton */}
                      {(booking.status === 'pending' || booking.status === 'installment') && (
                        <DynamicPaymentButton 
                          booking={booking}
                          qrisImageUrl={qrisImageUrl}
                          onPaymentUpdate={handlePaymentUpdate}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-8 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-peace-sans font-black text-gray-900 mb-2">
              {searchQuery || statusFilter !== 'all' ? 'Tidak Ada Hasil' : 'Belum Ada Pesanan'}
            </h3>
            <p className="text-gray-500 font-inter mb-6">
              {searchQuery || statusFilter !== 'all' 
                ? 'Coba ubah filter pencarian Anda.' 
                : 'Mulai booking session foto pertama Anda di Studio Noir!'
              }
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button 
                onClick={() => window.location.href = '/customer/booking-selection'}
                className="bg-black text-white hover:bg-gray-800 font-peace-sans font-bold"
              >
                <Camera className="w-5 h-5 mr-2" />
                Booking Sekarang
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderHistoryPage;
