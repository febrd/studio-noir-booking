
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Calendar, Clock, User, DollarSign, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import BookingForm from '@/components/studio/BookingForm';
import InstallmentManager from '@/components/studio/InstallmentManager';
import TimeExtensionManager from '@/components/studio/TimeExtensionManager';
import { useDebounce } from '@/hooks/useDebounce';

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'paid' | 'expired' | 'failed' | 'installment';

interface BookingWithDetails {
  id: string;
  user_id: string;
  studio_id: string;
  studio_package_id: string;
  package_category_id?: string;
  start_time?: string;
  end_time?: string;
  additional_time_minutes?: number;
  total_amount?: number;
  status: BookingStatus;
  payment_method: string;
  type: string;
  created_at: string;
  updated_at: string;
  customer_name: string;
  customer_email: string;
  package_title?: string;
  package_price?: number;
  studio_name: string;
  studio_type: string;
  category_name?: string;
  total_paid?: number;
  remaining_amount?: number;
  installment_count?: number;
  payment_status?: BookingStatus;
}

const BookingsPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [deletingBooking, setDeletingBooking] = useState<any>(null);
  const [installmentBooking, setInstallmentBooking] = useState<any>(null);
  const [extendTimeBooking, setExtendTimeBooking] = useState<any>(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [studioFilter, setStudioFilter] = useState<string | 'all'>('all');
  
  // Debounced search for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  const queryClient = useQueryClient();

  // Fetch studios for filter dropdown
  const { data: studios } = useQuery({
    queryKey: ['studios-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('studios')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Enhanced query with explicit joins
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings-enhanced', debouncedSearchQuery, statusFilter, studioFilter],
    queryFn: async () => {
      console.log('Fetching bookings with filters:', { 
        searchQuery: debouncedSearchQuery, 
        statusFilter, 
        studioFilter 
      });
      
      let query = supabase
        .from('bookings')
        .select(`
          id,
          user_id,
          studio_id,
          studio_package_id,
          package_category_id,
          start_time,
          end_time,
          additional_time_minutes,
          total_amount,
          status,
          payment_method,
          type,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      // Apply status filter (exclude 'all' option)
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Apply studio filter (exclude 'all' option)
      if (studioFilter && studioFilter !== 'all') {
        query = query.eq('studio_id', studioFilter);
      }
      
      const { data: bookingsData, error: bookingsError } = await query;
      
      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        throw bookingsError;
      }

      if (!bookingsData || bookingsData.length === 0) {
        return [];
      }

      // Get unique user IDs, studio IDs, and package IDs for batch fetching
      const userIds = [...new Set(bookingsData.map(b => b.user_id))];
      const studioIds = [...new Set(bookingsData.map(b => b.studio_id))];
      const packageIds = [...new Set(bookingsData.map(b => b.studio_package_id))];
      const categoryIds = [...new Set(bookingsData.map(b => b.package_category_id).filter(Boolean))];

      // Fetch users
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds);

      // Fetch studios
      const { data: studiosData } = await supabase
        .from('studios')
        .select('id, name, type')
        .in('id', studioIds);

      // Fetch packages
      const { data: packagesData } = await supabase
        .from('studio_packages')
        .select('id, title, price')
        .in('id', packageIds);

      // Fetch categories
      const { data: categoriesData } = categoryIds.length > 0 ? await supabase
        .from('package_categories')
        .select('id, name')
        .in('id', categoryIds) : { data: [] };

      // Create lookup maps with proper typing
      const usersMap = new Map<string, any>();
      usersData?.forEach(u => usersMap.set(u.id, u));
      
      const studiosMap = new Map<string, any>();
      studiosData?.forEach(s => studiosMap.set(s.id, s));
      
      const packagesMap = new Map<string, any>();
      packagesData?.forEach(p => packagesMap.set(p.id, p));
      
      const categoriesMap = new Map<string, any>();
      categoriesData?.forEach(c => categoriesMap.set(c.id, c));

      // Transform and filter the data
      let transformedBookings = bookingsData.map(booking => {
        const user = usersMap.get(booking.user_id);
        const studio = studiosMap.get(booking.studio_id);
        const packageInfo = packagesMap.get(booking.studio_package_id);
        const category = booking.package_category_id ? categoriesMap.get(booking.package_category_id) : null;

        return {
          ...booking,
          customer_name: user?.name || 'Unknown',
          customer_email: user?.email || 'Unknown',
          package_title: packageInfo?.title || 'Package tidak ditemukan',
          package_price: packageInfo?.price || 0,
          studio_name: studio?.name || 'Unknown Studio',
          studio_type: studio?.type || 'regular',
          category_name: category?.name || undefined
        };
      });

      // Apply search filter on the client side
      if (debouncedSearchQuery.trim()) {
        const searchLower = debouncedSearchQuery.toLowerCase();
        transformedBookings = transformedBookings.filter(booking => 
          booking.customer_name.toLowerCase().includes(searchLower) ||
          booking.customer_email.toLowerCase().includes(searchLower)
        );
      }

      console.log('Transformed bookings:', transformedBookings);
      return transformedBookings as BookingWithDetails[];
    }
  });

  // Get installment summary for each booking
  const { data: installmentSummary } = useQuery({
    queryKey: ['installment-summary', bookings?.map(b => b.id)],
    queryFn: async () => {
      if (!bookings?.length) return {};
      
      const bookingIds = bookings.map(b => b.id);
      
      // Get installments for all bookings
      const { data: installments, error } = await supabase
        .from('installments')
        .select('booking_id, amount')
        .in('booking_id', bookingIds);
      
      if (error) throw error;
      
      // Calculate totals for each booking
      const summary: Record<string, any> = {};
      
      bookings.forEach(booking => {
        const bookingInstallments = installments?.filter(i => i.booking_id === booking.id) || [];
        const totalPaid = bookingInstallments.reduce((sum, inst) => sum + (inst.amount || 0), 0);
        const remainingAmount = (booking.total_amount || 0) - totalPaid;
        const installmentCount = bookingInstallments.length;
        
        let paymentStatus: BookingStatus = booking.status;
        if (totalPaid >= (booking.total_amount || 0)) {
          paymentStatus = 'paid';
        } else if (totalPaid > 0) {
          paymentStatus = 'installment';
        }
        
        summary[booking.id] = {
          id: booking.id,
          total_paid: totalPaid,
          remaining_amount: remainingAmount,
          installment_count: installmentCount,
          payment_status: paymentStatus
        };
      });
      
      return summary;
    },
    enabled: !!bookings?.length
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      // Delete additional services first
      await supabase
        .from('booking_additional_services')
        .delete()
        .eq('booking_id', bookingId);
      
      // Delete installments
      await supabase
        .from('installments')
        .delete()
        .eq('booking_id', bookingId);
      
      // Delete booking
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings-enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['installment-summary'] });
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
    queryClient.invalidateQueries({ queryKey: ['bookings-enhanced'] });
    queryClient.invalidateQueries({ queryKey: ['installment-summary'] });
  };

  const handleEditSuccess = () => {
    setEditingBooking(null);
    queryClient.invalidateQueries({ queryKey: ['bookings-enhanced'] });
    queryClient.invalidateQueries({ queryKey: ['installment-summary'] });
  };

  const handleInstallmentSuccess = () => {
    setInstallmentBooking(null);
    queryClient.invalidateQueries({ queryKey: ['bookings-enhanced'] });
    queryClient.invalidateQueries({ queryKey: ['installment-summary'] });
  };

  const handleTimeExtensionSuccess = () => {
    setExtendTimeBooking(null);
    queryClient.invalidateQueries({ queryKey: ['bookings-enhanced'] });
    queryClient.invalidateQueries({ queryKey: ['installment-summary'] });
  };

  const handleDelete = (booking: BookingWithDetails) => {
    setDeletingBooking(booking);
  };

  const confirmDelete = () => {
    if (deletingBooking) {
      deleteBookingMutation.mutate(deletingBooking.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'installment': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price);
  };

  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return '';
    return new Date(dateTimeString).toLocaleString('id-ID');
  };

  // Clear filters function
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setStudioFilter('all');
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings - Transaction</h1>
          <p className="text-gray-600">Kelola booking studio dengan sistem cicilan</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Booking
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Tambah Booking Baru</DialogTitle>
            </DialogHeader>
            <BookingForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Enhanced search and filter section with realtime search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Pencarian Realtime
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cari Customer (Realtime)</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nama atau email customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchQuery && (
                <p className="text-xs text-gray-500">
                  Mencari: "{debouncedSearchQuery}" {debouncedSearchQuery !== searchQuery && "(mengetik...)"}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value as BookingStatus | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="installment">Installment</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Studio</label>
              <Select value={studioFilter || 'all'} onValueChange={setStudioFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua studio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua studio</SelectItem>
                  {studios?.map((studio) => (
                    <SelectItem key={studio.id} value={studio.id}>
                      {studio.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Aksi</label>
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="w-full"
              >
                Reset Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {bookings?.map((booking) => {
          const installmentInfo = installmentSummary?.[booking.id];
          const actualStatus = installmentInfo?.payment_status || booking.status;
          const totalPaid = installmentInfo?.total_paid || 0;
          const remainingAmount = installmentInfo?.remaining_amount || booking.total_amount || 0;
          
          return (
            <Card key={booking.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {booking.package_title || 'Package tidak ditemukan'}
                      </CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {booking.studio_name}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingBooking(booking)}
                      title="Edit booking"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(booking)}
                      title="Hapus booking"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium">{booking.customer_name}</p>
                    <p className="text-gray-500">{booking.customer_email}</p>
                  </div>
                </div>
                
                {booking.start_time && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p>Mulai: {formatDateTime(booking.start_time)}</p>
                      {booking.end_time && <p>Selesai: {formatDateTime(booking.end_time)}</p>}
                      {booking.additional_time_minutes && booking.additional_time_minutes > 0 && (
                        <p className="text-blue-600">+ {booking.additional_time_minutes} menit tambahan</p>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <div className="text-sm">
                      <p className="font-bold text-green-600">
                        Total: {formatPrice(booking.total_amount || 0)}
                      </p>
                      {totalPaid > 0 && (
                        <>
                          <p className="text-blue-600">
                            Dibayar: {formatPrice(totalPaid)}
                          </p>

                          {remainingAmount > 0 ? (
                            <p className="text-orange-600">
                              Sisa: {formatPrice(remainingAmount)}
                            </p>
                          ) : (
                            <p className="text-green-600">
                              Sisa tagihan: -
                            </p>
                          )}
                        </>
                      )}

                    </div>
                  </div>
                  <Badge className={getStatusColor(actualStatus)}>
                    {actualStatus}
                  </Badge>
                </div>
                
                <div className="flex gap-2 pt-2">
                  {(actualStatus === 'pending' || actualStatus === 'installment') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setInstallmentBooking(booking)}
                      className="flex-1 text-xs"
                    >
                      Kelola Cicilan
                    </Button>
                  )}
                  
                  {(actualStatus === 'confirmed' || actualStatus === 'paid') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setExtendTimeBooking(booking)}
                      className="flex-1 text-xs"
                    >
                      Tambah Waktu
                    </Button>
                  )}
                </div>
                
                <div className="text-xs text-gray-500 border-t pt-2">
                  <p>Dibuat: {formatDateTime(booking.created_at)}</p>
                  <p>Payment: {booking.payment_method}</p>
                  {booking.category_name && (
                    <p>Kategori: {booking.category_name}</p>
                  )}
                  {installmentInfo?.installment_count > 0 && (
                    <p className="text-purple-600">
                      Cicilan: {installmentInfo.installment_count}x pembayaran
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {bookings?.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada booking</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || statusFilter !== 'all' || studioFilter !== 'all'
              ? "Tidak ada booking yang sesuai dengan filter yang dipilih"
              : "Mulai dengan menambahkan booking pertama Anda"
            }
          </p>
          <div className="space-y-2">
            {(searchQuery || statusFilter !== 'all' || studioFilter !== 'all') && (
              <Button variant="outline" onClick={clearFilters}>
                Reset Filter
              </Button>
            )}
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Booking
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingBooking} onOpenChange={() => setEditingBooking(null)}>
        <DialogContent className="max-w-4xl">
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

      {/* Installment Dialog */}
      <Dialog open={!!installmentBooking} onOpenChange={() => setInstallmentBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kelola Cicilan</DialogTitle>
          </DialogHeader>
          {installmentBooking && (
            <InstallmentManager 
              bookingId={installmentBooking.id}
              totalAmount={installmentBooking.total_amount || 0}
              currentStatus={installmentBooking.status}
              onSuccess={handleInstallmentSuccess} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Time Extension Dialog */}
      <Dialog open={!!extendTimeBooking} onOpenChange={() => setExtendTimeBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Waktu Sesi</DialogTitle>
          </DialogHeader>
          {extendTimeBooking && (
            <TimeExtensionManager 
              bookingId={extendTimeBooking.id}
              currentEndTime={extendTimeBooking.end_time}
              studioType={extendTimeBooking.studio_type || 'regular'}
              currentAdditionalTime={extendTimeBooking.additional_time_minutes || 0}
              onSuccess={handleTimeExtensionSuccess} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingBooking} onOpenChange={() => setDeletingBooking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus booking untuk "{deletingBooking?.customer_name}"? 
              Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait termasuk cicilan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BookingsPage;
