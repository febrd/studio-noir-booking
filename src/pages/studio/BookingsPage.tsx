import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Calendar, Clock, Users, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import BookingForm from '@/components/studio/BookingForm';
import { InstallmentManager } from '@/components/studio/InstallmentManager';
import { TimeExtensionManager } from '@/components/studio/TimeExtensionManager';

const BookingsPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [extendingTimeBooking, setExtendingTimeBooking] = useState<any>(null);
  const [managingInstallmentsBooking, setManagingInstallmentsBooking] = useState<any>(null);
  const [deletingBooking, setDeletingBooking] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customer:customer_id (
            id,
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking berhasil dihapus');
      setDeletingBooking(null);
    },
    onError: (error) => {
      console.error('Error deleting booking:', error);
      toast.error('Gagal menghapus booking');
    }
  });

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
  };

  const handleEditSuccess = () => {
    setEditingBooking(null);
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
  };

  const handleDelete = (booking: any) => {
    setDeletingBooking(booking);
  };

  const confirmDelete = () => {
    if (deletingBooking) {
      deleteBookingMutation.mutate(deletingBooking.id);
    }
  };

  const totalBookings = bookings?.length || 0;
  const paidBookings = bookings?.filter(booking => booking.is_paid).length || 0;
  const unpaidBookings = totalBookings - paidBookings;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-600">Kelola booking dan jadwal studio</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Booking
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Booking Baru</DialogTitle>
            </DialogHeader>
            <BookingForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Paid Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Unpaid Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unpaidBookings}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Bookings</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Customer</TableHead>
                <TableHead>Tanggal Booking</TableHead>
                <TableHead>Jam Mulai</TableHead>
                <TableHead>Durasi</TableHead>
                <TableHead>Total Harga</TableHead>
                <TableHead>Status Pembayaran</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings?.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>{booking.customer?.name}</TableCell>
                  <TableCell>{new Date(booking.booking_date).toLocaleDateString()}</TableCell>
                  <TableCell>{booking.start_time}</TableCell>
                  <TableCell>{booking.duration} Jam</TableCell>
                  <TableCell>{booking.total_price}</TableCell>
                  <TableCell>
                    {booking.is_paid ? (
                      <Badge variant="outline">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Lunas
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-4 w-4 mr-2" />
                        Belum Lunas
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingBooking(booking)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExtendingTimeBooking(booking)}
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setManagingInstallmentsBooking(booking)}
                      >
                        <DollarSign className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(booking)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingBooking} onOpenChange={() => setEditingBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Booking</DialogTitle>
          </DialogHeader>
          {editingBooking && (
            <BookingForm 
              booking={editingBooking} 
              onSuccess={handleEditSuccess} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Time Extension Dialog */}
      <Dialog open={!!extendingTimeBooking} onOpenChange={() => setExtendingTimeBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Perpanjang Waktu Booking</DialogTitle>
          </DialogHeader>
          {extendingTimeBooking && (
            <TimeExtensionManager booking={extendingTimeBooking} />
          )}
        </DialogContent>
      </Dialog>

      {/* Installment Management Dialog */}
      <Dialog open={!!managingInstallmentsBooking} onOpenChange={() => setManagingInstallmentsBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kelola Cicilan</DialogTitle>
          </DialogHeader>
          {managingInstallmentsBooking && (
            <InstallmentManager booking={managingInstallmentsBooking} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingBooking} onOpenChange={() => setDeletingBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Booking</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus booking ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setDeletingBooking(null)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" onClick={confirmDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingsPage;
