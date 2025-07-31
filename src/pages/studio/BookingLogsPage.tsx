import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Activity, Search, Filter, Calendar, User, Eye, FileText } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { ModernLayout } from '@/components/Layout/ModernLayout';

const BookingLogsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch booking logs with related data
  const { data: logs, isLoading } = useQuery({
    queryKey: ['booking-logs', debouncedSearchQuery, actionFilter, dateFilter],
    queryFn: async () => {
      let query = supabase
        .from('booking_logs')
        .select(`
          *,
          bookings!inner(
            id,
            user_id,
            studio_id,
            total_amount,
            status,
            users!inner(name, email),
            studios!inner(name)
          )
        `)
        .order('created_at', { ascending: false });

      // Apply action filter
      if (actionFilter !== 'all') {
        query = query.eq('action_type', actionFilter);
      }

      // Apply date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Filter by search query
      let filteredData = data || [];
      if (debouncedSearchQuery.trim()) {
        const searchLower = debouncedSearchQuery.toLowerCase();
        filteredData = filteredData.filter(log => 
          log.bookings?.users?.name?.toLowerCase().includes(searchLower) ||
          log.bookings?.users?.email?.toLowerCase().includes(searchLower) ||
          log.booking_id?.toLowerCase().includes(searchLower) ||
          log.note?.toLowerCase().includes(searchLower)
        );
      }

      return filteredData;
    }
  });

  // Calculate summary statistics
  const summary = logs?.reduce((acc, log) => {
    acc[log.action_type] = (acc[log.action_type] || 0) + 1;
    acc.total += 1;
    return acc;
  }, { total: 0 } as Record<string, number>) || { total: 0 };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID');
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'payment_added': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return '➕';
      case 'update': return '✏️';
      case 'delete': return '🗑️';
      case 'payment_added': return '💰';
      default: return '📝';
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActionFilter('all');
    setDateFilter('all');
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading logs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Log Aktivitas Booking</h1>
          <p className="text-gray-600">Pantau semua aktivitas yang dilakukan pada booking</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Create</CardTitle>
              <span className="text-lg">➕</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.create || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Update</CardTitle>
              <span className="text-lg">✏️</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.update || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payment</CardTitle>
              <span className="text-lg">💰</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.payment_added || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delete</CardTitle>
              <span className="text-lg">🗑️</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.delete || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
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
                <label className="text-sm font-medium">Cari Aktivitas</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Nama customer, booking ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Jenis Aktivitas</label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih aktivitas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua aktivitas</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="payment_added">Payment Added</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Periode</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih periode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua waktu</SelectItem>
                    <SelectItem value="today">Hari ini</SelectItem>
                    <SelectItem value="week">7 hari terakhir</SelectItem>
                    <SelectItem value="month">Bulan ini</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Aksi</label>
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Reset Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Log Aktivitas ({logs?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {logs && logs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Aktivitas</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Studio</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead>Dilakukan Oleh</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {formatDateTime(log.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action_type)}>
                          <span className="mr-1">{getActionIcon(log.action_type)}</span>
                          {log.action_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.bookings?.users?.name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{log.bookings?.users?.email || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.bookings?.studios?.name || 'N/A'}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={log.note || ''}>
                          {log.note || 'Tidak ada keterangan'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          System
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Detail Log Aktivitas</DialogTitle>
                            </DialogHeader>
                            {selectedLog && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Waktu</label>
                                    <p>{formatDateTime(selectedLog.created_at)}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Aktivitas</label>
                                    <p>
                                      <Badge className={getActionColor(selectedLog.action_type)}>
                                        {selectedLog.action_type}
                                      </Badge>
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Customer</label>
                                    <p>{selectedLog.bookings?.users?.name || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Dilakukan Oleh</label>
                                    <p>System</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Keterangan</label>
                                  <p>{selectedLog.note || 'Tidak ada keterangan'}</p>
                                </div>
                                
                                {selectedLog.old_data && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Data Lama</label>
                                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                                      {JSON.stringify(selectedLog.old_data, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                
                                {selectedLog.new_data && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Data Baru</label>
                                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                                      {JSON.stringify(selectedLog.new_data, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada log aktivitas</h3>
                <p className="text-gray-600">
                  {searchQuery || actionFilter !== 'all' || dateFilter !== 'all'
                    ? "Tidak ada aktivitas yang sesuai dengan filter"
                    : "Belum ada aktivitas booking"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ModernLayout>
  );
};

export default BookingLogsPage;
