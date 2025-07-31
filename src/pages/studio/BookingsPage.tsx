import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Calendar, Clock, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import BookingForm from '@/components/studio/BookingForm';
import { InstallmentManager } from '@/components/studio/InstallmentManager';
import { TimeExtensionManager } from '@/components/studio/TimeExtensionManager';

const BookingsPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showInstallments, setShowInstallments] = useState(false);
  const [showTimeExtensions, setShowTimeExtensions] = useState(false);
  const queryClient = useQueryClient();

  const { data: bookings, isLoading, error } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customer:customer_id (
            id,
            name,
            email,
            phone
          ),
          studio:studio_id (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const invalidateBookings = () => {
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
  };

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    invalidateBookings();
  };

  const handleBookingUpdate = () => {
    setSelectedBooking(null);
    invalidateBookings();
  };

  const handleInstallmentSuccess = () => {
    setShowInstallments(false);
    invalidateBookings();
  };

  const handleTimeExtensionSuccess = () => {
    setShowTimeExtensions(false);
    invalidateBookings();
  };

  const BookingCard = ({ booking }: { booking: any }) => {
    return (
      <Card key={booking.id} className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div>
                <CardTitle className="text-lg">{booking.studio?.name}</CardTitle>
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary">
                    {booking.customer?.name}
                  </Badge>
                  <Badge variant="outline">
                    {new Date(booking.start_time).toLocaleDateString()}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedBooking(booking)}
              >
                <Calendar className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedBooking(booking);
                  setShowInstallments(true);
                }}
              >
                <Clock className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedBooking(booking);
                  setShowTimeExtensions(true);
                }}
              >
                <MapPin className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {booking.location && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Lokasi:</span> {booking.location}
              </p>
            )}
            {booking.notes && (
              <p className="text-sm text-gray-600">{booking.notes}</p>
            )}
            <p className="text-xs text-gray-500">
              Dibuat: {new Date(booking.created_at).toLocaleDateString('id-ID')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-600">Kelola booking dan reservasi studio</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Booking
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tambah Booking Baru</DialogTitle>
            </DialogHeader>
            <BookingForm onSuccess={() => {
              setIsCreateDialogOpen(false);
              queryClient.invalidateQueries({ queryKey: ['bookings'] });
            }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookings?.map((booking) => (
          <BookingCard key={booking.id} booking={booking} />
        ))}
      </div>

      {bookings?.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada booking</h3>
          <p className="text-gray-600 mb-4">Mulai dengan menambahkan booking pertama Anda</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Booking
          </Button>
        </div>
      )}

      {/* Installments Modal */}
      <Dialog open={showInstallments && !!selectedBooking} onOpenChange={() => setShowInstallments(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Installments</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <InstallmentManager
              booking={selectedBooking}
              onSuccess={handleInstallmentSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Time Extensions Modal */}
      <Dialog open={showTimeExtensions && !!selectedBooking} onOpenChange={() => setShowTimeExtensions(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Time Extensions</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <TimeExtensionManager
              booking={selectedBooking}
              onSuccess={handleTimeExtensionSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Booking Modal */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Booking</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <BookingForm
              booking={selectedBooking}
              onSuccess={handleBookingUpdate}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingsPage;
