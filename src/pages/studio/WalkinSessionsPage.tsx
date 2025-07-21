import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Calendar, Clock, User, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, startOfDay, endOfDay } from 'date-fns';
import WalkinBookingForm from '@/components/studio/WalkinBookingForm';
import { ModernLayout } from '@/components/Layout/ModernLayout';
import { formatTimeWITA, formatDateTimeWITA } from '@/utils/timezoneUtils';
import { useJWTAuth } from '@/hooks/useJWTAuth';

const WalkinSessionsPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const queryClient = useQueryClient();
  const { userProfile } = useJWTAuth();
  
  const today = new Date();
  const startOfDayUtc = startOfDay(today).toISOString();
  const endOfDayUtc = endOfDay(today).toISOString();

  // Check if user is owner
  const isOwner = userProfile?.role === 'owner';

  // Fetch today's walking sessions with UTC consistency
  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['walkin-sessions', format(today, 'yyyy-MM-dd')],
    queryFn: async () => {
      console.log('Fetching walk-in sessions for UTC range:', {
        start: startOfDayUtc,
        end: endOfDayUtc
      });

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          users:user_id (name, email),
          studios:studio_id (name, type),
          studio_packages:studio_package_id (title, price, base_time_minutes),
          package_categories:package_category_id (name),
          booking_additional_services (
            quantity,
            additional_services:additional_service_id (name, price)
          )
        `)
        .eq('is_walking_session', true)
        .gte('created_at', startOfDayUtc)  // Changed from start_time to created_at for better filtering
        .lte('created_at', endOfDayUtc)    // Changed from start_time to created_at for better filtering
        .order('start_time', { ascending: true });

      console.log('Walk-in sessions query result:', { data, error });

      if (error) {
        console.error('Error fetching walk-in sessions:', error);
        throw error;
      }
      
      return data || [];
    }
  });

  // Delete mutation with proper cleanup and owner-only access
  const deleteMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      // Check if user is owner
      if (!isOwner) {
        throw new Error('Hanya owner yang dapat menghapus walk-in session');
      }

      console.log('Deleting walk-in session:', sessionId);

      // Delete related records in order to maintain referential integrity
      
      // 1. Delete transactions first
      const { error: transactionError } = await supabase
        .from('transactions')
        .delete()
        .eq('booking_id', sessionId);
      
      if (transactionError) {
        console.error('Error deleting transactions:', transactionError);
        // Continue even if there are no transactions to delete
      }

      // 2. Delete booking logs (ignoring constraint errors)
      const { error: logsError } = await supabase
        .from('booking_logs')
        .delete()
        .eq('booking_id', sessionId);
      
      if (logsError) {
        console.error('Error deleting booking logs:', logsError);
        // Continue even if there are no logs to delete
      }

      // 3. Delete installments
      const { error: installmentsError } = await supabase
        .from('installments')
        .delete()
        .eq('booking_id', sessionId);
      
      if (installmentsError) {
        console.error('Error deleting installments:', installmentsError);
        // Continue even if there are no installments to delete
      }

      // 4. Delete additional services
      const { error: servicesError } = await supabase
        .from('booking_additional_services')
        .delete()
        .eq('booking_id', sessionId);
      
      if (servicesError) {
        console.error('Error deleting additional services:', servicesError);
        // Continue even if there are no additional services to delete
      }

      // 5. Delete booking sessions
      const { error: sessionsError } = await supabase
        .from('booking_sessions')
        .delete()
        .eq('booking_id', sessionId);
      
      if (sessionsError) {
        console.error('Error deleting booking sessions:', sessionsError);
        // Continue even if there are no booking sessions to delete
      }
      
      // 6. Finally delete the main booking record
      const { error: bookingError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', sessionId);
      
      if (bookingError) {
        console.error('Error deleting booking:', bookingError);
        throw bookingError;
      }

      console.log('Walk-in session deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walkin-sessions'] });
      toast.success('Walk-in session berhasil dihapus');
    },
    onError: (error: any) => {
      console.error('Error deleting session:', error);
      toast.error(error.message || 'Gagal menghapus walk-in session');
    }
  });

  const handleEdit = (session: any) => {
    setEditingSession(session);
    setIsDialogOpen(true);
  };

  const handleDelete = async (sessionId: string) => {
    if (!isOwner) {
      toast.error('Hanya owner yang dapat menghapus walk-in session');
      return;
    }

    if (confirm('Apakah Anda yakin ingin menghapus walk-in session ini? Data akan terhapus permanen dari database.')) {
      await deleteMutation.mutateAsync(sessionId);
    }
  };

  const handleSuccess = async (bookingData?: any) => {
    // Create offline transaction for walk-in sessions
    if (bookingData && bookingData.payment_method === 'offline') {
      try {
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            booking_id: bookingData.id,
            amount: bookingData.total_amount,
            type: 'offline',
            status: 'paid',
            payment_type: 'offline',
            description: `Walk-in session offline - ${bookingData.studio_packages?.title || 'Package'}`,
            performed_by: null // Will be handled by database function
          });

        if (transactionError) {
          console.error('Error creating offline transaction for walk-in:', transactionError);
        }
      } catch (error) {
        console.error('Error creating offline transaction for walk-in:', error);
      }
    }

    setIsDialogOpen(false);
    setEditingSession(null);
    // Invalidate both queries to ensure fresh data
    queryClient.invalidateQueries({ queryKey: ['walkin-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['bookings-enhanced'] });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      confirmed: 'default',
      completed: 'outline',
      cancelled: 'destructive'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  if (error) {
    console.error('Query error:', error);
    return (
      <ModernLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Walk-in Sessions</h1>
              <p className="text-muted-foreground">{format(today, 'dd MMMM yyyy')}</p>
            </div>
          </div>
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-red-600">Error loading data: {error.message}</p>
            </CardContent>
          </Card>
        </div>
      </ModernLayout>
    );
  }

  if (isLoading) {
    return (
      <ModernLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Walk-in Sessions</h1>
              <p className="text-muted-foreground">{format(today, 'dd MMMM yyyy')}</p>
            </div>
          </div>
          <div className="text-center py-8">Loading...</div>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Walk-in Sessions</h1>
            <p className="text-muted-foreground">{format(today, 'dd MMMM yyyy')}</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingSession(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Walk-in Session
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingSession ? 'Edit Walk-in Session' : 'Tambah Walk-in Session Baru'}
                </DialogTitle>
              </DialogHeader>
              <WalkinBookingForm booking={editingSession} onSuccess={handleSuccess} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                  <p className="text-xl font-bold">{sessions?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                  <p className="text-xl font-bold">
                    {sessions?.filter(s => s.status === 'confirmed').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-xl font-bold">
                    {sessions?.filter(s => s.status === 'completed').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-xl font-bold">
                    Rp {sessions?.reduce((total, session) => total + (session.total_amount || 0), 0).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sessions List with consistent WITA time formatting */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {sessions?.map((session: any) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{session.users?.name || 'Walk-in Customer'}</CardTitle>
                  {getStatusBadge(session.status)}
                </div>
                <p className="text-sm text-muted-foreground">{session.users?.email || 'No email'}</p>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{session.studios?.name}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {session.studios?.type === 'self_photo' ? 'Self Photo' : 'Regular'}
                  </Badge>
                </div>
                
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>
                    {formatTimeWITA(session.start_time)} - {formatTimeWITA(session.end_time)} WITA
                  </span>
                </div>
                
                <div className="text-sm">
                  <p className="font-medium">{session.studio_packages?.title}</p>
                  {session.package_categories && (
                    <p className="text-muted-foreground">{session.package_categories.name}</p>
                  )}
                  <p className="text-green-600 font-medium">
                    Rp {(session.total_amount || 0).toLocaleString('id-ID')}
                  </p>
                </div>

                {session.booking_additional_services && session.booking_additional_services.length > 0 && (
                  <div className="text-sm">
                    <p className="font-medium text-muted-foreground">Additional Services:</p>
                    {session.booking_additional_services.map((service: any, index: number) => (
                      <p key={index} className="text-xs">
                        • {service.additional_services.name} (x{service.quantity})
                      </p>
                    ))}
                  </div>
                )}

                {session.additional_time_minutes && session.additional_time_minutes > 0 && (
                  <div className="text-sm">
                    <p className="text-orange-600">
                      +{session.additional_time_minutes} menit tambahan
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(session)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {isOwner && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(session.id)}
                      className="text-red-600 hover:text-red-700"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="text-xs text-gray-500 border-t pt-2">
                  <p>Dibuat: {formatDateTimeWITA(session.created_at)} WITA</p>
                  <p>Payment: {session.payment_method}</p>
                  {!isOwner && (
                    <p className="text-orange-600 text-xs mt-1">
                      * Hanya owner yang dapat menghapus data
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(!sessions || sessions.length === 0) && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Belum ada walk-in session hari ini</p>
              <p className="text-sm text-muted-foreground mt-2">
                Klik "Tambah Walk-in Session" untuk menambah session baru
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ModernLayout>
  );
};

export default WalkinSessionsPage;
