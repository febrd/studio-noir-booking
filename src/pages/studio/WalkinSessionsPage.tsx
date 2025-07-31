
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Clock, User, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import WalkinBookingForm from '@/components/studio/WalkinBookingForm';
import WalkinSessionsFilters from '@/components/studio/WalkinSessionsFilters';
import { useWalkinSessionsFilter } from '@/hooks/useWalkinSessionsFilter';

const WalkinSessionsPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [deletingSession, setDeletingSession] = useState<any>(null);
  const queryClient = useQueryClient();

  const { filters, updateFilters } = useWalkinSessionsFilter();

  // Query for bookings instead of walkin_sessions table
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['bookings', 'walkin', filters],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          studios (name, type),
          studio_packages (title, price),
          customers (name, phone, email)
        `)
        .eq('booking_type', 'walkin')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.studio_id) {
        query = query.eq('studio_id', filters.studio_id);
      }

      if (filters.date_range?.from) {
        query = query.gte('booking_date', filters.date_range.from.toISOString().split('T')[0]);
      }

      if (filters.date_range?.to) {
        query = query.lte('booking_date', filters.date_range.to.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      return data?.map(session => ({
        ...session,
        customer_name: session.customers?.name || 'Walk-in Customer',
        customer_phone: session.customers?.phone || '',
        studio_name: session.studios?.name || 'Unknown Studio',
        package_title: session.studio_packages?.title || 'Walk-in Package'
      })) || [];
    }
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', sessionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', 'walkin'] });
      toast.success('Walk-in session berhasil dihapus');
      setDeletingSession(null);
    },
    onError: (error) => {
      console.error('Error deleting session:', error);
      toast.error('Gagal menghapus walk-in session');
    }
  });

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['bookings', 'walkin'] });
  };

  const handleEditSuccess = () => {
    setEditingSession(null);
    queryClient.invalidateQueries({ queryKey: ['bookings', 'walkin'] });
  };

  const handleDelete = (session: any) => {
    setDeletingSession(session);
  };

  const confirmDelete = () => {
    if (deletingSession) {
      deleteSessionMutation.mutate(deletingSession.id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading walk-in sessions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Walk-in Sessions</h1>
          <p className="text-gray-600">Kelola sesi walk-in untuk studio self photo</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Walk-in Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tambah Walk-in Session</DialogTitle>
            </DialogHeader>
            <WalkinBookingForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <WalkinSessionsFilters filters={filters} onFiltersChange={updateFilters} />

      <div className="grid gap-6">
        {sessions?.map((session) => (
          <Card key={session.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <div>
                      <CardTitle className="text-lg">{session.customer_name}</CardTitle>
                      <p className="text-sm text-gray-600">{session.studio_name}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(session.status)}
                    <Badge variant="outline">Walk-in</Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingSession(session)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(session)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{session.start_time} - {session.end_time}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Duration: {session.duration_minutes} minutes
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>{session.customer_phone || 'No phone'}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {session.package_title}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span>IDR {session.total_amount?.toLocaleString('id-ID') || '0'}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(session.booking_date).toLocaleDateString('id-ID')}
                  </div>
                </div>
              </div>
              {session.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">{session.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {sessions?.length === 0 && (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada walk-in session</h3>
          <p className="text-gray-600 mb-4">Mulai dengan menambahkan walk-in session pertama</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Walk-in Session
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingSession} onOpenChange={() => setEditingSession(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Walk-in Session</DialogTitle>
          </DialogHeader>
          {editingSession && (
            <WalkinBookingForm 
              booking={editingSession} 
              onSuccess={handleEditSuccess} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSession} onOpenChange={() => setDeletingSession(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Walk-in Session</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus walk-in session untuk "{deletingSession?.customer_name}"? 
              Tindakan ini tidak dapat dibatalkan.
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

export default WalkinSessionsPage;
