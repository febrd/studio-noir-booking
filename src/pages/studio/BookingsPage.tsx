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

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'paid' | 'expired' | 'failed' | 'installment';

const BookingsPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [deletingBooking, setDeletingBooking] = useState<any>(null);
  const [installmentBooking, setInstallmentBooking] = useState<any>(null);
  const [extendTimeBooking, setExtendTimeBooking] = useState<any>(null);
  
  // Add search and filter states with proper typing
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [studioFilter, setStudioFilter] = useState('');
  
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

  // Enhanced query with search and filters - using separate queries to avoid relationship issues
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', searchQuery, statusFilter, studioFilter],
    queryFn: async () => {
      console.log('Fetching bookings with filters:', { searchQuery, statusFilter, studioFilter });
      
      // First, get the basic booking data
      let bookingsQuery = supabase
        .from('bookings')
        .select(`
          *,
          users!inner (
            id,
            name,
            email
          ),
          studios!inner (
            id,
            name,
            type
          )
        `)
        .order('created_at', { ascending: false });

      // Apply search filter for user name/email
      if (searchQuery.trim()) {
        bookingsQuery = bookingsQuery.or(`users.name.ilike.%${searchQuery}%,users.email.ilike.%${searchQuery}%`);
      }

      // Apply status filter with proper typing
      if (statusFilter) {
        bookingsQuery = bookingsQuery.eq('status', statusFilter);
      }

      // Apply studio filter
      if (studioFilter) {
        bookingsQuery = bookingsQuery.eq('studio_id', studioFilter);
      }
      
      const { data: bookingsData, error: bookingsError } = await bookingsQuery;
      
      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        throw bookingsError;
      }

      // Then get studio packages and package categories separately
      const packageIds = [...new Set(bookingsData?.map(b => b.studio_package_id).filter(Boolean))];
      const categoryIds = [...new Set(bookingsData?.map(b => b.package_category_id).filter(Boolean))];

      let studioPackages: any[] = [];
      let packageCategories: any[] = [];

      if (packageIds.length > 0) {
        const { data: packagesData, error: packagesError } = await supabase
          .from('studio_packages')
          .select('*')
          .in('id', packageIds);
        
        if (!packagesError) {
          studioPackages = packagesData || [];
        }
      }

      if (categoryIds.length > 0) {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('package_categories')
          .select('*')
          .in('id', categoryIds);
        
        if (!categoriesError) {
          packageCategories = categoriesData || [];
        }
      }

      // Merge the data
      const enrichedBookings = bookingsData?.map(booking => {
        const studioPackage = studioPackages.find(pkg => pkg.id === booking.studio_package_id);
        const packageCategory = packageCategories.find(cat => cat.id === booking.package_category_id);
        
        return {
          ...booking,
          studio_packages: studioPackage,
          package_categories: packageCategory
        };
      });

      console.log('Fetched bookings:', enrichedBookings);
      return enrichedBookings;
    }
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

  const handleInstallmentSuccess = () => {
    setInstallmentBooking(null);
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
  };

  const handleTimeExtensionSuccess = () => {
    setExtendTimeBooking(null);
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
    setStatusFilter('');
    setStudioFilter('');
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
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-600">Kelola booking studio</p>
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

      {/* Enhanced search and filter section */}
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
              <label className="text-sm font-medium">Cari Customer</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nama atau email customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={(value: BookingStatus | '') => setStatusFilter(value)}>
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
              <Select value={studioFilter} onValueChange={setStudioFilter}>
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
        {bookings?.map((booking) => (
          <Card key={booking.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {booking.studio_packages?.title || 'Package tidak ditemukan'}
                    </CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {booking.studios?.name}
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
                  <p className="font-medium">{booking.users?.name}</p>
                  <p className="text-gray-500">{booking.users?.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <p>Mulai: {formatDateTime(booking.start_time)}</p>
                  <p>Selesai: {formatDateTime(booking.end_time)}</p>
                  {booking.additional_time_minutes > 0 && (
                    <p className="text-blue-600">+ {booking.additional_time_minutes} menit tambahan</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="font-bold text-green-600">
                    {formatPrice(booking.total_amount || 0)}
                  </span>
                </div>
                <Badge className={getStatusColor(booking.status)}>
                  {booking.status}
                </Badge>
              </div>
              
              <div className="flex gap-2 pt-2">
                {(booking.status === 'pending' || booking.status === 'installment') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setInstallmentBooking(booking)}
                    className="flex-1 text-xs"
                  >
                    Kelola Cicilan
                  </Button>
                )}
                
                {(booking.status === 'confirmed' || booking.status === 'paid') && (
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
                {booking.package_categories && (
                  <p>Kategori: {booking.package_categories.name}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {bookings?.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada booking</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || statusFilter || studioFilter 
              ? "Tidak ada booking yang sesuai dengan filter yang dipilih"
              : "Mulai dengan menambahkan booking pertama Anda"
            }
          </p>
          <div className="space-y-2">
            {(searchQuery || statusFilter || studioFilter) && (
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
              studioType={extendTimeBooking.studios?.type || 'regular'}
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
              Apakah Anda yakin ingin menghapus booking untuk "{deletingBooking?.users?.name}"? 
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
