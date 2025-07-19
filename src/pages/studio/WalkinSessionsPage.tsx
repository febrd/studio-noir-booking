
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Clock, User, DollarSign, Search, Filter, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import WalkinBookingForm from '@/components/studio/WalkinBookingForm';
import InstallmentManager from '@/components/studio/InstallmentManager';
import TimeExtensionManager from '@/components/studio/TimeExtensionManager';
import { useDebounce } from '@/hooks/useDebounce';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, startOfDay, endOfDay } from 'date-fns';

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'paid' | 'expired' | 'failed' | 'installment';

interface WalkinSessionWithDetails {
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

const WalkinSessionsPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [deletingSession, setDeletingSession] = useState<any>(null);
  const [installmentSession, setInstallmentSession] = useState<any>(null);
  const [extendTimeSession, setExtendTimeSession] = useState<any>(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [studioFilter, setStudioFilter] = useState<string | 'all'>('all');
  const [timeFilter, setTimeFilter] = useState<string>('');
  
  // Current date for today's sessions
  const today = new Date();
  const startToday = startOfDay(today);
  const endToday = endOfDay(today);
  
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

  // Enhanced query focused on today's sessions
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['walkin-sessions', debouncedSearchQuery, statusFilter, studioFilter, timeFilter],
    queryFn: async () => {
      console.log('Fetching walk-in sessions for today with filters:', { 
        searchQuery: debouncedSearchQuery, 
        statusFilter, 
        studioFilter,
        timeFilter 
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
        .gte('created_at', startToday.toISOString())
        .lte('created_at', endToday.toISOString())
        .order('start_time', { ascending: true, nullsFirst: false });

      // Apply status filter
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Apply studio filter
      if (studioFilter && studioFilter !== 'all') {
        query = query.eq('studio_id', studioFilter);
      }
      
      const { data: sessionsData, error: sessionsError } = await query;
      
      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
        throw sessionsError;
      }

      if (!sessionsData || sessionsData.length === 0) {
        return [];
      }

      // Get unique user IDs, studio IDs, and package IDs for batch fetching
      const userIds = [...new Set(sessionsData.map(b => b.user_id))];
      const studioIds = [...new Set(sessionsData.map(b => b.studio_id))];
      const packageIds = [...new Set(sessionsData.map(b => b.studio_package_id))];
      const categoryIds = [...new Set(sessionsData.map(b => b.package_category_id).filter(Boolean))];

      // Fetch related data
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds);

      const { data: studiosData } = await supabase
        .from('studios')
        .select('id, name, type')
        .in('id', studioIds);

      const { data: packagesData } = await supabase
        .from('studio_packages')
        .select('id, title, price')
        .in('id', packageIds);

      const { data: categoriesData } = categoryIds.length > 0 ? await supabase
        .from('package_categories')
        .select('id, name')
        .in('id', categoryIds) : { data: [] };

      // Create lookup maps
      const usersMap = new Map<string, any>();
      usersData?.forEach(u => usersMap.set(u.id, u));
      
      const studiosMap = new Map<string, any>();
      studiosData?.forEach(s => studiosMap.set(s.id, s));
      
      const packagesMap = new Map<string, any>();
      packagesData?.forEach(p => packagesMap.set(p.id, p));
      
      const categoriesMap = new Map<string, any>();
      categoriesData?.forEach(c => categoriesMap.set(c.id, c));

      // Transform and filter the data
      let transformedSessions = sessionsData.map(session => {
        const user = usersMap.get(session.user_id);
        const studio = studiosMap.get(session.studio_id);
        const packageInfo = packagesMap.get(session.studio_package_id);
        const category = session.package_category_id ? categoriesMap.get(session.package_category_id) : null;

        return {
          ...session,
          customer_name: user?.name || 'Unknown',
          customer_email: user?.email || 'Unknown',
          package_title: packageInfo?.title || 'Package tidak ditemukan',
          package_price: packageInfo?.price || 0,
          studio_name: studio?.name || 'Unknown Studio',
          studio_type: studio?.type || 'regular',
          category_name: category?.name || undefined
        };
      });

      // Apply search filter
      if (debouncedSearchQuery.trim()) {
        const searchLower = debouncedSearchQuery.toLowerCase();
        transformedSessions = transformedSessions.filter(session => 
          session.customer_name.toLowerCase().includes(searchLower) ||
          session.customer_email.toLowerCase().includes(searchLower)
        );
      }

      // Apply time filter
      if (timeFilter) {
        transformedSessions = transformedSessions.filter(session => {
          if (!session.start_time) return false;
          const sessionTime = format(new Date(session.start_time), 'HH:mm');
          return sessionTime.includes(timeFilter);
        });
      }

      console.log('Transformed sessions:', transformedSessions);
      return transformedSessions as WalkinSessionWithDetails[];
    }
  });

  // Get installment summary for each session
  const { data: installmentSummary } = useQuery({
    queryKey: ['installment-summary', sessions?.map(s => s.id)],
    queryFn: async () => {
      if (!sessions?.length) return {};
      
      const sessionIds = sessions.map(s => s.id);
      
      const { data: installments, error } = await supabase
        .from('installments')
        .select('booking_id, amount')
        .in('booking_id', sessionIds);
      
      if (error) throw error;
      
      const summary: Record<string, any> = {};
      
      sessions.forEach(session => {
        const sessionInstallments = installments?.filter(i => i.booking_id === session.id) || [];
        const totalPaid = sessionInstallments.reduce((sum, inst) => sum + (inst.amount || 0), 0);
        const remainingAmount = (session.total_amount || 0) - totalPaid;
        const installmentCount = sessionInstallments.length;
        
        let paymentStatus: BookingStatus = session.status;
        if (totalPaid >= (session.total_amount || 0)) {
          paymentStatus = 'paid';
        } else if (totalPaid > 0) {
          paymentStatus = 'installment';
        }
        
        summary[session.id] = {
          id: session.id,
          total_paid: totalPaid,
          remaining_amount: remainingAmount,
          installment_count: installmentCount,
          payment_status: paymentStatus
        };
      });
      
      return summary;
    },
    enabled: !!sessions?.length
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      // Delete additional services first
      await supabase
        .from('booking_additional_services')
        .delete()
        .eq('booking_id', sessionId);
      
      // Delete installments
      await supabase
        .from('installments')
        .delete()
        .eq('booking_id', sessionId);
      
      // Delete session
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', sessionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walkin-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['installment-summary'] });
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
    queryClient.invalidateQueries({ queryKey: ['walkin-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['installment-summary'] });
  };

  const handleEditSuccess = () => {
    setEditingSession(null);
    queryClient.invalidateQueries({ queryKey: ['walkin-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['installment-summary'] });
  };

  const handleInstallmentSuccess = () => {
    setInstallmentSession(null);
    queryClient.invalidateQueries({ queryKey: ['walkin-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['installment-summary'] });
  };

  const handleTimeExtensionSuccess = () => {
    setExtendTimeSession(null);
    queryClient.invalidateQueries({ queryKey: ['walkin-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['installment-summary'] });
  };

  const handleDelete = (session: WalkinSessionWithDetails) => {
    setDeletingSession(session);
  };

  const confirmDelete = () => {
    if (deletingSession) {
      deleteSessionMutation.mutate(deletingSession.id);
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

  const formatTime = (dateTimeString: string) => {
    if (!dateTimeString) return '';
    return format(new Date(dateTimeString), 'HH:mm');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setStudioFilter('all');
    setTimeFilter('');
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Walk-in Sessions - Hari Ini</h1>
          <p className="text-gray-600">Kelola sesi walk-in untuk hari ini - {format(today, 'dd/MM/yyyy')}</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Walk-in Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Tambah Walk-in Session Baru</DialogTitle>
            </DialogHeader>
            <WalkinBookingForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Pencarian Realtime - Sessions Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <label className="text-sm font-medium">Waktu</label>
              <Input
                placeholder="Cari waktu (misal: 14:30)"
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
              />
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

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daftar Walk-in Sessions Hari Ini ({sessions?.length || 0} sesi)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Studio</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions?.map((session) => {
                  const installmentInfo = installmentSummary?.[session.id];
                  const actualStatus = installmentInfo?.payment_status || session.status;
                  const totalPaid = installmentInfo?.total_paid || 0;
                  const remainingAmount = installmentInfo?.remaining_amount || session.total_amount || 0;
                  
                  return (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <div>
                            {session.start_time && (
                              <p className="font-medium">{formatTime(session.start_time)}</p>
                            )}
                            {session.end_time && (
                              <p className="text-sm text-gray-500">- {formatTime(session.end_time)}</p>
                            )}
                            {session.additional_time_minutes && session.additional_time_minutes > 0 && (
                              <p className="text-xs text-blue-600">+{session.additional_time_minutes}min</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="font-medium">{session.customer_name}</p>
                            <p className="text-sm text-gray-500">{session.customer_email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{session.studio_name}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{session.package_title}</p>
                        {session.category_name && (
                          <p className="text-sm text-gray-500">{session.category_name}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="font-bold text-green-600">
                              {formatPrice(session.total_amount || 0)}
                            </p>
                            {totalPaid > 0 && (
                              <p className="text-sm text-blue-600">
                                Dibayar: {formatPrice(totalPaid)}
                              </p>
                            )}
                            {actualStatus !== 'paid' && remainingAmount > 0 && (
                              <p className="text-sm text-orange-600">
                                Sisa: {formatPrice(remainingAmount)}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(actualStatus)}>
                          {actualStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingSession(session)}
                            title="Edit session"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(session)}
                            title="Hapus session"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {(actualStatus === 'pending' || actualStatus === 'installment') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setInstallmentSession(session)}
                              title="Kelola cicilan"
                            >
                              Cicilan
                            </Button>
                          )}
                          {(actualStatus === 'confirmed' || actualStatus === 'paid') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setExtendTimeSession(session)}
                              title="Tambah waktu"
                            >
                              +Waktu
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {sessions?.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada walk-in session hari ini</h3>
          <p className="text-gray-600 mb-4">
            Mulai dengan menambahkan walk-in session pertama untuk hari ini
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Walk-in Session
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingSession} onOpenChange={() => setEditingSession(null)}>
        <DialogContent className="max-w-4xl">
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

      {/* Installment Dialog */}
      <Dialog open={!!installmentSession} onOpenChange={() => setInstallmentSession(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Kelola Cicilan</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {installmentSession && (
              <InstallmentManager 
                bookingId={installmentSession.id}
                totalAmount={installmentSession.total_amount || 0}
                currentStatus={installmentSession.status}
                onSuccess={handleInstallmentSuccess} 
              />
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Time Extension Dialog */}
      <Dialog open={!!extendTimeSession} onOpenChange={() => setExtendTimeSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Waktu Sesi</DialogTitle>
          </DialogHeader>
          {extendTimeSession && (
            <TimeExtensionManager 
              bookingId={extendTimeSession.id}
              currentEndTime={extendTimeSession.end_time}
              studioType={extendTimeSession.studio_type || 'regular'}
              currentAdditionalTime={extendTimeSession.additional_time_minutes || 0}
              onSuccess={handleTimeExtensionSuccess} 
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

export default WalkinSessionsPage;
