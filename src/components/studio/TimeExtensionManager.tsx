
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Clock, Plus } from 'lucide-react';

interface TimeExtensionManagerProps {
  bookingId: string;
  currentEndTime: string;
  studioType: string;
  currentAdditionalTime: number;
}

const TimeExtensionManager = ({ 
  bookingId, 
  currentEndTime, 
  studioType, 
  currentAdditionalTime 
}: TimeExtensionManagerProps) => {
  const [extensionMinutes, setExtensionMinutes] = useState(0);
  const queryClient = useQueryClient();

  // Extend time mutation
  const extendTimeMutation = useMutation({
    mutationFn: async (additionalMinutes: number) => {
      const currentTime = new Date();
      const newAdditionalTime = currentAdditionalTime + additionalMinutes;
      
      // Calculate new end time from current time + additional minutes
      const newEndTime = new Date(currentTime.getTime() + (additionalMinutes * 60 * 1000));
      
      const { data, error } = await supabase
        .from('bookings')
        .update({
          additional_time_minutes: newAdditionalTime,
          end_time: newEndTime.toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Waktu berhasil diperpanjang');
      setExtensionMinutes(0);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (error) => {
      console.error('Error extending time:', error);
      toast.error('Gagal memperpanjang waktu');
    }
  });

  const calculateExtensionCost = (minutes: number) => {
    if (minutes <= 0) return 0;
    
    const slots = Math.ceil(minutes / 5);
    if (studioType === 'self_photo') {
      return slots * 5000;
    } else {
      return slots * 15000;
    }
  };

  const handleExtendTime = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (extensionMinutes <= 0) {
      toast.error('Masukkan durasi perpanjangan yang valid');
      return;
    }
    
    if (extensionMinutes % 5 !== 0) {
      toast.error('Perpanjangan waktu harus kelipatan 5 menit');
      return;
    }
    
    extendTimeMutation.mutate(extensionMinutes);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID');
  };

  const extensionCost = calculateExtensionCost(extensionMinutes);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Perpanjang Waktu Sesi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Session Info */}
        <div className="p-3 bg-gray-50 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span>Waktu Selesai Saat Ini:</span>
            <span className="font-medium">{formatDateTime(currentEndTime)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total Tambahan Waktu:</span>
            <span className="font-medium">{currentAdditionalTime} menit</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tipe Studio:</span>
            <span className="font-medium">
              {studioType === 'self_photo' ? 'Self Photo' : 'Regular'} 
              ({studioType === 'self_photo' ? 'Rp 5.000/5 menit' : 'Rp 15.000/5 menit'})
            </span>
          </div>
        </div>

        {/* Extension Form */}
        <form onSubmit={handleExtendTime} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="extension">Tambahan Waktu (menit) *</Label>
            <Input
              id="extension"
              type="number"
              min="5"
              step="5"
              value={extensionMinutes}
              onChange={(e) => setExtensionMinutes(parseInt(e.target.value) || 0)}
              placeholder="Kelipatan 5 menit (5, 10, 15, ...)"
              required
            />
            <p className="text-xs text-gray-500">
              Catatan: Perpanjangan waktu harus dalam kelipatan 5 menit
            </p>
          </div>

          {/* Cost Preview */}
          {extensionMinutes > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-800">
                  Biaya Perpanjangan:
                </span>
                <span className="font-bold text-blue-900">
                  {formatPrice(extensionCost)}
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                {Math.ceil(extensionMinutes / 5)} slot × {formatPrice(studioType === 'self_photo' ? 5000 : 15000)}
              </p>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={extendTimeMutation.isPending || extensionMinutes <= 0}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {extendTimeMutation.isPending ? 'Memperpanjang...' : 'Perpanjang Waktu'}
          </Button>
        </form>

        {/* Warning */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Catatan:</strong> Perpanjangan waktu akan dihitung dari waktu submit saat ini, 
            bukan dari waktu selesai yang sudah dijadwalkan sebelumnya.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeExtensionManager;
