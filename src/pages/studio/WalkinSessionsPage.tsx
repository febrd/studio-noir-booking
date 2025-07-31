import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, UserCheck, Clock, Calendar, DollarSign, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import WalkinBookingForm from '@/components/studio/WalkinBookingForm';
import { WalkinSessionsFilters } from '@/components/studio/WalkinSessionsFilters';
import { useWalkinSessionsFilter } from '@/hooks/useWalkinSessionsFilter';
import { WalkinTimeExtensionManager } from '@/components/studio/WalkinTimeExtensionManager';

const WalkinSessionsPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [deletingSession, setDeletingSession] = useState<any>(null);
  const [extendingTimeSession, setExtendingTimeSession] = useState<any>(null);
  const queryClient = useQueryClient();
  const { filter, setFilter } = useWalkinSessionsFilter();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['walkin-sessions', filter],
    queryFn: async () => {
      let query = supabase
        .from('walkin_sessions')
        .select('*, customer:customers(*), package:packages(*)')
        .order('created_at', { ascending: false });

      if (filter.date) {
        query = query.gte('created_at', filter.date);
        const tomorrow = new Date(filter.date);
        tomorrow.setDate(tomorrow.getDate() + 1);
        query = query.lt('created_at', tomorrow.toISOString().split('T')[0]);
      }

      if (filter.status) {
        query = query.eq('status', filter.status);
      }

      if (filter.searchTerm) {
        query = query.ilike('id', `%${filter.searchTerm}%`);
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
      queryClient.invalidateQueries({ queryKey: ['walkin-sessions'] });
      toast.success('Sesi walk-in berhasil dihapus');
      setDeletingSession(null);
    },
    onError: (error) => {
      console.error('Error deleting session:', error);
      toast.error('Gagal menghapus sesi walk-in');
    }
  });

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['walkin-sessions'] });
  };

  const handleEditSuccess = () => {
    setEditingSession(null);
    queryClient.invalidateQueries({ queryKey: ['walkin-sessions'] });
  };

  const handleDelete = (session: any) => {
    setDeletingSession(session);
  };

  const confirmDelete = () => {
    if (deletingSession) {
      deleteSessionMutation.mutate(deletingSession.id);
    }
  };

  const handleTimeExtensionSuccess = () => {
    setExtendingTimeSession(null);
    queryClient.invalidateQueries({ queryKey: ['walkin-sessions'] });
  };

  const stats = [
    {
      title: "Total Walk-in Sessions",
      value: sessions?.length || 0,
      icon: UserCheck,
    },
    {
      title: "Total Revenue",
      value: sessions?.reduce((acc, session) => acc + (session.price || 0), 0) || 0,
      icon: DollarSign,
    },
  ];

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
          <p className="text-gray-600">Kelola sesi walk-in dan booking spontan</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Sesi Walk-in
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Sesi Walk-in Baru</DialogTitle>
            </DialogHeader>
            <WalkinBookingForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon && <stat.icon className="h-4 w-4 text-gray-500" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <WalkinSessionsFilters filter={filter} setFilter={setFilter} />

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions?.map((session) => (
              <TableRow key={session.id}>
                <TableCell className="font-medium">{session.id}</TableCell>
                <TableCell>{session.customer?.name || 'Guest'}</TableCell>
                <TableCell>{session.package?.name || 'Custom'}</TableCell>
                <TableCell>
                  {new Date(session.start_time).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </TableCell>
                <TableCell>
                  {new Date(session.end_time).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </TableCell>
                <TableCell>{session.price}</TableCell>
                <TableCell>
                  <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                    {session.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExtendingTimeSession(session)}
                    >
                      <Clock className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingSession(session)}
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(session)}
                    >
                      <UserCheck className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {sessions?.length === 0 && (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada sesi walk-in</h3>
          <p className="text-gray-600 mb-4">Mulai dengan menambahkan sesi walk-in pertama Anda</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Sesi
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingSession} onOpenChange={() => setEditingSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sesi Walk-in</DialogTitle>
          </DialogHeader>
          {editingSession && (
            <WalkinBookingForm
              session={editingSession}
              onSuccess={handleEditSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingSession} onOpenChange={() => setDeletingSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Sesi Walk-in</DialogTitle>
          </DialogHeader>
          <p>Apakah Anda yakin ingin menghapus sesi ini?</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeletingSession(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Time Extension Dialog */}
      <Dialog open={!!extendingTimeSession} onOpenChange={() => setExtendingTimeSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Perpanjang Waktu Sesi</DialogTitle>
          </DialogHeader>
          {extendingTimeSession && (
            <WalkinTimeExtensionManager
              session={extendingTimeSession}
              onSuccess={handleTimeExtensionSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalkinSessionsPage;
