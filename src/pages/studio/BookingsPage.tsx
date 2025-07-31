
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Calendar, Users, Clock } from 'lucide-react';
import { toast } from 'sonner';
import BookingForm from '@/components/studio/BookingForm';
import InstallmentManager from '@/components/studio/InstallmentManager';
import TimeExtensionManager from '@/components/studio/TimeExtensionManager';
import { format } from 'date-fns';

const BookingsPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showInstallments, setShowInstallments] = useState(false);
  const [showTimeExtension, setShowTimeExtension] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [studioFilter, setStudioFilter] = useState('all');
  const [dateRange, setDateRange] = useState<any>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  console.log('Fetching bookings with filters:', { searchQuery, statusFilter, studioFilter, dateRange });

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', searchQuery, statusFilter, studioFilter, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          studio_packages (
            title,
            price,
            category:package_categories(name)
          ),
          studios (
            name,
            type
          ),
          users (
            name,
            email
          ),
          additional_services:booking_additional_services (
            quantity,
            total_price,
            service:additional_services (
              name,
              price
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`users.name.ilike.%${searchQuery}%,users.email.ilike.%${searchQuery}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (studioFilter !== 'all') {
        query = query.eq('studio_id', studioFilter);
      }

      if (dateRange?.from) {
        query = query.gte('start_time', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte('start_time', dateRange.to.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Transform the data to match expected format
      const transformedData = data.map(booking => ({
        ...booking,
        customer_name: booking.users?.name || 'Unknown',
        customer_email: booking.users?.email || '',
        package_title: booking.studio_packages?.title || '',
        package_price: booking.studio_packages?.price || 0,
        studio_name: booking.studios?.name || '',
        studio_type: booking.studios?.type || '',
        category_name: booking.studio_packages?.category?.name || '',
        additional_services: booking.additional_services || []
      }));

      console.log('Transformed bookings:', transformedData);
      return transformedData;
    },
  });

  const { data: studios } = useQuery({
    queryKey: ['studios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('studios')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const handleInstallmentClick = (booking: any) => {
    setSelectedBooking(booking);
    setShowInstallments(true);
  };

  const handleTimeExtensionClick = (booking: any) => {
    setSelectedBooking(booking);
    setShowTimeExtension(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings Management</h1>
          <p className="text-gray-600">Kelola booking dan reservasi</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Booking
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Tambah Booking Baru</DialogTitle>
            </DialogHeader>
            <BookingForm onSuccess={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search customer name or email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Studio</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={studioFilter}
                onChange={(e) => setStudioFilter(e.target.value)}
              >
                <option value="all">All Studios</option>
                {studios?.map((studio) => (
                  <option key={studio.id} value={studio.id}>
                    {studio.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Bookings ({bookings?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Customer</th>
                  <th className="text-left py-3 px-4 font-medium">Package</th>
                  <th className="text-left py-3 px-4 font-medium">Studio</th>
                  <th className="text-left py-3 px-4 font-medium">Schedule</th>
                  <th className="text-left py-3 px-4 font-medium">Amount</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings?.map((booking) => (
                  <tr key={booking.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{booking.customer_name}</p>
                        <p className="text-sm text-gray-600">{booking.customer_email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{booking.package_title}</p>
                        <p className="text-sm text-gray-600">{booking.category_name}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{booking.studio_name}</p>
                        <p className="text-sm text-gray-600 capitalize">{booking.studio_type}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        {booking.start_time && (
                          <>
                            <p className="font-medium text-gray-900">
                              {format(new Date(booking.start_time), 'dd MMM yyyy')}
                            </p>
                            <p className="text-sm text-gray-600">
                              {format(new Date(booking.start_time), 'HH:mm')} - 
                              {booking.end_time && format(new Date(booking.end_time), 'HH:mm')}
                            </p>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{formatCurrency(booking.total_amount)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleInstallmentClick(booking)}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTimeExtensionClick(booking)}
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bookings?.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                <p className="text-gray-600">Start by creating your first booking</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Installment Manager Modal */}
      {showInstallments && selectedBooking && (
        <Dialog open={showInstallments} onOpenChange={setShowInstallments}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Manage Installments</DialogTitle>
            </DialogHeader>
            <InstallmentManager
              bookingId={selectedBooking.id}
              onClose={() => setShowInstallments(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Time Extension Manager Modal */}
      {showTimeExtension && selectedBooking && (
        <Dialog open={showTimeExtension} onOpenChange={setShowTimeExtension}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Manage Time Extension</DialogTitle>
            </DialogHeader>
            <TimeExtensionManager
              bookingId={selectedBooking.id}
              onClose={() => setShowTimeExtension(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default BookingsPage;
