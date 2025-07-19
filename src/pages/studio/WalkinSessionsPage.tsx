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
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import WalkinBookingForm from '@/components/studio/WalkinBookingForm';
import { ModernLayout } from '@/components/Layout/ModernLayout';

const WITA_TIMEZONE = 'Asia/Makassar';

const WalkinSessionsPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const queryClient = useQueryClient();
  
  const today = new Date();
  const witaToday = toZonedTime(today, WITA_TIMEZONE);

  console.log('Today UTC:', today);
  console.log('Today WITA:', witaToday);

  // Fetch today's walking sessions with corrected query
  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['walkin-sessions', format(witaToday, 'yyyy-MM-dd')],
    queryFn: async () => {
      console.log('Fetching walk-in sessions for date:', format(witaToday, 'yyyy-MM-dd'));
      
      // Convert WITA times to UTC for database query
      const startOfDayWita = startOfDay(witaToday);
      const endOfDayWita = endOfDay(witaToday);
      const startOfDayUtc = fromZonedTime(startOfDayWita, WITA_TIMEZONE);
      const endOfDayUtc = fromZonedTime(endOfDayWita, WITA_TIMEZONE);

      console.log('Query range UTC:', {
        start: startOfDayUtc.toISOString(),
        end: endOfDayUtc.toISOString()
      });

      // First, let's check all walk-in sessions to debug
      const { data: allWalkInData, error: allError } = await supabase
        .from('bookings')
        .select('*')
        .eq('is_walking_session', true);

      console.log('All walk-in sessions in database:', allWalkInData);
      console.log('All walk-in sessions error:', allError);

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
        .gte('start_time', startOfDayUtc.toISOString())
        .lte('start_time', endOfDayUtc.toISOString())
        .order('start_time', { ascending: true });

      console.log('Filtered walk-in sessions query result:', { data, error });

      if (error) {
        console.error('Error fetching walk-in sessions:', error);
        throw error;
      }
      
      // Convert UTC times back to WITA for display
      const sessionsWithWitaTime = data?.map(session => ({
        ...session,
        start_time_wita: toZonedTime(new Date(session.start_time), WITA_TIMEZONE),
        end_time_wita: toZonedTime(new Date(session.end_time), WITA_TIMEZONE)
      })) || [];

      console.log('Sessions with WITA time:', sessionsWithWitaTime);
      return sessionsWithWitaTime;
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', sessionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walkin-sessions'] });
      toast.success('Walk-in session berhasil dihapus');
    },
    onError: (error: any) => {
      console.error('Error deleting session:', error);
      toast.error('Gagal menghapus walk-in session');
    }
  });

  const handleEdit = (session: any) => {
    setEditingSession(session);
    setIsDialogOpen(true);
  };

  const handleDelete = async (sessionId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus walk-in session ini?')) {
      await deleteMutation.mutateAsync(sessionId);
    }
  };

  const handleSuccess = () => {
    setIsDialogOpen(false);
    setEditingSession(null);
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
              <p className="text-muted-foreground">{format(witaToday, 'dd MMMM yyyy')}</p>
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
              <p className="text-muted-foreground">{format(witaToday, 'dd MMMM yyyy')}</p>
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
            <p className="text-muted-foreground">{format(witaToday, 'dd MMMM yyyy')}</p>
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

        {/* Debug Information */}
        {process.env.NODE_ENV === 'development' && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Debug Info:</h3>
              <p>Sessions found: {sessions?.length || 0}</p>
              <p>Today WITA: {format(witaToday, 'yyyy-MM-dd HH:mm:ss')}</p>
              <pre className="text-xs mt-2 bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(sessions?.slice(0, 2), null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Sessions List */}
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
                    {format(session.start_time_wita, 'HH:mm')} - {format(session.end_time_wita, 'HH:mm')}
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(session.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
