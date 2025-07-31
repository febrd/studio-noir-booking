
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, Search } from 'lucide-react';

const BookingLogsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const { data: bookingLogs, isLoading } = useQuery({
    queryKey: ['booking-logs', searchTerm, actionFilter],
    queryFn: async () => {
      let query = supabase
        .from('booking_logs')
        .select(`
          *,
          bookings (
            customers (name, phone),
            studios (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Filter by search term if provided
      let filteredData = data || [];
      if (searchTerm) {
        filteredData = filteredData.filter(log => 
          log.bookings?.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.bookings?.studios?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      return filteredData.map(log => ({
        ...log,
        customer_name: log.bookings?.customers?.name || 'Unknown Customer',
        customer_phone: log.bookings?.customers?.phone || '',
        studio_name: log.bookings?.studios?.name || 'Unknown Studio'
      }));
    }
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'created':
        return <Badge className="bg-green-100 text-green-800">Created</Badge>;
      case 'updated':
        return <Badge className="bg-blue-100 text-blue-800">Updated</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case 'completed':
        return <Badge className="bg-purple-100 text-purple-800">Completed</Badge>;
      case 'payment_updated':
        return <Badge className="bg-yellow-100 text-yellow-800">Payment Updated</Badge>;
      case 'time_extended':
        return <Badge className="bg-orange-100 text-orange-800">Time Extended</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading booking logs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Booking Logs</h1>
        <p className="text-gray-600">Riwayat aktivitas dan perubahan booking</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari berdasarkan nama customer, studio, atau detail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="updated">Updated</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="payment_updated">Payment Updated</SelectItem>
            <SelectItem value="time_extended">Time Extended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {bookingLogs?.map((log) => (
          <Card key={log.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <CardTitle className="text-lg">{log.customer_name}</CardTitle>
                      <p className="text-sm text-gray-600">{log.studio_name}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {getActionBadge(log.action)}
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(log.created_at).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4" />
                    <span>{log.performed_by}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {log.details && (
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-sm text-gray-700">{log.details}</p>
                </div>
              )}
              {log.customer_phone && (
                <div className="mt-2 text-sm text-gray-600">
                  Customer Phone: {log.customer_phone}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {bookingLogs?.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No booking logs found</h3>
          <p className="text-gray-600">
            {searchTerm || actionFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Booking activity logs will appear here as they are created'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default BookingLogsPage;
