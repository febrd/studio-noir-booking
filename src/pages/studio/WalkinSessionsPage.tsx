import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Clock, User, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import WalkinBookingForm from '@/components/studio/WalkinBookingForm';
import { WalkinSessionsFilters } from '@/components/studio/WalkinSessionsFilters';
import { WalkinTimeExtensionManager } from '@/components/studio/WalkinTimeExtensionManager';

const WalkinSessionsPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [showTimeExtensions, setShowTimeExtensions] = useState(false);
  const [filters, setFilters] = useState({
    studioId: '',
    dateRange: null,
  });
  const queryClient = useQueryClient();

  const { data: walkinSessions, isLoading } = useQuery({
    queryKey: ['walkinSessions', filters],
    queryFn: async () => {
      let query = supabase
        .from('walkin_sessions')
        .select('*, studio:studio_id(*)')
        .order('created_at', { ascending: false });

      if (filters.studioId) {
        query = query.eq('studio_id', filters.studioId);
      }

      if (filters.dateRange) {
        const [start, end] = filters.dateRange;
        query = query.gte('created_at', start?.toISOString());
        query = query.lte('created_at', end?.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('walkin_sessions')
        .delete()
        .eq('id', sessionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walkinSessions'] });
      toast.success('Walk-in session berhasil dihapus');
    },
    onError: (error) => {
      console.error('Error deleting walk-in session:', error);
      toast.error('Gagal menghapus walk-in session');
    }
  });

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleDelete = async (sessionId: string) => {
    try {
      await deleteSessionMutation.mutateAsync(sessionId);
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Walk-in Sessions</h1>
          <p className="text-gray-600">Kelola sesi walk-in tanpa reservasi</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Walk-in
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tambah Walk-in Session</DialogTitle>
            </DialogHeader>
            <WalkinBookingForm onSuccess={() => {
              setIsCreateDialogOpen(false);
              queryClient.invalidateQueries({ queryKey: ['walkinSessions'] });
            }} />
          </DialogContent>
        </Dialog>
      </div>

      <WalkinSessionsFilters onChange={handleFiltersChange} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {walkinSessions?.map((session) => (
          <Card key={session.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Camera className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      Sesi Walk-in
                    </CardTitle>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">
                        {session.studio?.name}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedSession(session);
                      setShowTimeExtensions(true);
                    }}
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(session.id)}
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Waktu Mulai:</span> {new Date(session.start_time).toLocaleTimeString()}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Waktu Selesai:</span> {new Date(session.end_time).toLocaleTimeString()}
                </p>
                <p className="text-xs text-gray-500">
                  Dibuat: {new Date(session.created_at).toLocaleDateString('id-ID')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {walkinSessions?.length === 0 && (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada walk-in session</h3>
          <p className="text-gray-600 mb-4">Mulai dengan menambahkan walk-in session pertama Anda</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Walk-in
          </Button>
        </div>
      )}

      {/* Time Extension Dialog */}
      {selectedSession && (
        <Dialog open={showTimeExtensions} onOpenChange={() => {
          setShowTimeExtensions(false);
          setSelectedSession(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Perpanjang Waktu Sesi</DialogTitle>
            </DialogHeader>
            <WalkinTimeExtensionManager
              session={selectedSession}
              onSuccess={() => {
                setShowTimeExtensions(false);
                setSelectedSession(null);
                queryClient.invalidateQueries({ queryKey: ['walkinSessions'] });
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default WalkinSessionsPage;
