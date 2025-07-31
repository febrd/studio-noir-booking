import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, User, Calendar } from 'lucide-react';

const BookingLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useQuery({
    queryKey: ['bookingLogs'],
    queryFn: async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('booking_logs')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          setError(error);
          throw error;
        }

        setLogs(data || []);
        return data;
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading booking logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error</h2>
          <p className="text-gray-600">{error.message || 'Failed to load booking logs'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Booking Logs</h1>
        <p className="text-gray-600">Lihat riwayat dan log aktivitas booking</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {logs.map((log) => (
          <Card key={log.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{log.event_type}</CardTitle>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary">
                        {log.table_name}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">User ID:</span> {log.user_id}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Record ID:</span> {log.record_id}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Details:</span> {log.details}
                </p>
                <p className="text-xs text-gray-500">
                  Dibuat: {new Date(log.created_at).toLocaleDateString('id-ID')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {logs.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No booking logs found</h3>
          <p className="text-gray-600 mb-4">There are currently no booking logs to display.</p>
        </div>
      )}
    </div>
  );
};

export default BookingLogsPage;
