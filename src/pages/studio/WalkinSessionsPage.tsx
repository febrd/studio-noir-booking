
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Users, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { WalkinBookingForm } from '@/components/studio/WalkinBookingForm';
import WalkinSessionsFilters from '@/components/studio/WalkinSessionsFilters';
import { WalkinTimeExtensionManager } from '@/components/studio/WalkinTimeExtensionManager';
import { format } from 'date-fns';

const WalkinSessionsPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [showTimeExtension, setShowTimeExtension] = useState(false);
  const [filters, setFilters] = useState<any>({
    dateRange: {
      from: new Date(),
      to: new Date()
    },
    status: 'all',
    studio: 'all'
  });
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['bookings', 'walkin', filters],
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
          )
        `)
        .eq('is_walking_session', true)
        .order('created_at', { ascending: false });

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.studio !== 'all') {
        query = query.eq('studio_id', filters.studio);
      }

      if (filters.dateRange?.from) {
        query = query.gte('start_time', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        query = query.lte('start_time', filters.dateRange.to.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
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
      toast.success('Walk-in session deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete walk-in session');
    },
  });

  const handleDeleteSession = (sessionId: string) => {
    if (window.confirm('Are you sure you want to delete this walk-in session?')) {
      deleteSessionMutation.mutate(sessionId);
    }
  };

  const handleTimeExtensionClick = (session: any) => {
    setSelectedSession(session);
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
          <p className="mt-2 text-gray-600">Loading walk-in sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Walk-in Sessions</h1>
          <p className="text-gray-600">Kelola sesi walk-in pelanggan</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Walk-in
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Tambah Walk-in Session</DialogTitle>
            </DialogHeader>
            <WalkinBookingForm
              onClose={() => setIsCreateDialogOpen(false)}
              onSuccess={() => {
                setIsCreateDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ['bookings', 'walkin'] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <WalkinSessionsFilters
        filters={filters}
        onFiltersChange={setFilters}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Walk-in Sessions ({sessions?.length || 0})
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
                {sessions?.map((session) => (
                  <tr key={session.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{session.users?.name}</p>
                        <p className="text-sm text-gray-600">{session.users?.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{session.studio_packages?.title}</p>
                        <p className="text-sm text-gray-600">{session.studio_packages?.category?.name}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{session.studios?.name}</p>
                        <p className="text-sm text-gray-600 capitalize">{session.studios?.type}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        {session.start_time && (
                          <>
                            <p className="font-medium text-gray-900">
                              {format(new Date(session.start_time), 'dd MMM yyyy')}
                            </p>
                            <p className="text-sm text-gray-600">
                              {format(new Date(session.start_time), 'HH:mm')} - 
                              {session.end_time && format(new Date(session.end_time), 'HH:mm')}
                            </p>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{formatCurrency(session.total_amount)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(session.status)}`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTimeExtensionClick(session)}
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteSession(session.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sessions?.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No walk-in sessions found</h3>
                <p className="text-gray-600">Start by creating your first walk-in session</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Time Extension Manager Modal */}
      {showTimeExtension && selectedSession && (
        <Dialog open={showTimeExtension} onOpenChange={setShowTimeExtension}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Manage Time Extension</DialogTitle>
            </DialogHeader>
            <WalkinTimeExtensionManager
              session={selectedSession}
              onClose={() => setShowTimeExtension(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default WalkinSessionsPage;
