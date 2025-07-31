import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Globe, User, Clock } from 'lucide-react';
import { ExportButtons } from '@/components/ExportButtons';

const OnlineBookingsReport = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useQuery({
    queryKey: ['onlineBookings'],
    queryFn: async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('payment_status', 'paid')
          .eq('payment_method', 'online')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setBookings(data || []);
      } catch (err: any) {
        setError(err);
        console.error('Error fetching online bookings:', err);
      } finally {
        setIsLoading(false);
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading online bookings...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Online Bookings Report</h1>
          <p className="text-gray-600">Laporan booking online dan reservasi digital</p>
        </div>
        <ExportButtons data={bookings} filename="online-bookings" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookings.map((booking: any) => (
          <Card key={booking.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Globe className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{booking.customer_name}</CardTitle>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="default">
                        Online Booking
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Tanggal:</span> {new Date(booking.booking_date).toLocaleDateString('id-ID')}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Jam:</span> {booking.booking_time}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Status:</span> {booking.payment_status}
                </p>
                <p className="text-xs text-gray-500">
                  Dibuat: {new Date(booking.created_at).toLocaleDateString('id-ID')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {bookings.length === 0 && (
        <div className="text-center py-12">
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada booking online</h3>
          <p className="text-gray-600 mb-4">Tidak ada booking yang dilakukan secara online.</p>
        </div>
      )}
    </div>
  );
};

export default OnlineBookingsReport;
