
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface TimeExtensionManagerProps {
  bookingId: string;
  currentEndTime?: string;
  studioType: string;
  currentAdditionalTime: number;
  onSuccess: () => void;
}

// Timezone utility functions for WITA (GMT+8)
const toWITAString = (date: Date): string => {
  const witaOffset = 8 * 60;
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const witaTime = new Date(utc + (witaOffset * 60000));
  return witaTime.toISOString().slice(0, 16);
};

const fromWITAString = (dateString: string): Date => {
  const localDate = new Date(dateString);
  const witaOffset = 8 * 60;
  const utc = localDate.getTime() - (witaOffset * 60000);
  return new Date(utc);
};

const formatDateTimeWITA = (dateTimeString: string) => {
  if (!dateTimeString) return '';
  const date = new Date(dateTimeString);
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const TimeExtensionManager = ({ 
  bookingId, 
  currentEndTime, 
  studioType, 
  currentAdditionalTime,
  onSuccess 
}: TimeExtensionManagerProps) => {
  const [extensionMinutes, setExtensionMinutes] = useState(0);
  const queryClient = useQueryClient();

  const calculateExtensionCost = (minutes: number) => {
    if (minutes <= 0) return 0;
    
    const slots = Math.ceil(minutes / 5);
    if (studioType === 'self_photo') {
      return slots * 5000; // 5000 per 5 minutes for self photo
    } else {
      return slots * 15000; // 15000 per 5 minutes for regular
    }
  };

  const extendTimeMutation = useMutation({
    mutationFn: async () => {
      if (extensionMinutes <= 0) {
        throw new Error('Waktu tambahan harus lebih dari 0 menit');
      }

      // Get current booking data
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (fetchError) throw fetchError;

      // Calculate new end time based on start time + base time + total additional time
      const startTime = new Date(booking.start_time);
      const newAdditionalTime = currentAdditionalTime + extensionMinutes;
      
      // Get package base time
      const { data: packageData, error: packageError } = await supabase
        .from('studio_packages')
        .select('base_time_minutes')
        .eq('id', booking.studio_package_id)
        .single();

      if (packageError) throw packageError;

      const totalMinutes = packageData.base_time_minutes + newAdditionalTime;
      const newEndTime = new Date(startTime.getTime() + (totalMinutes * 60 * 1000));

      // Calculate extension cost
      const extensionCost = calculateExtensionCost(extensionMinutes);
      const newTotalAmount = (booking.total_amount || 0) + extensionCost;

      // Update booking with WITA timezone consideration
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          end_time: newEndTime.toISOString(),
          additional_time_minutes: newAdditionalTime,
          total_amount: newTotalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      return {
        newEndTime: newEndTime.toISOString(),
        newAdditionalTime,
        extensionCost,
        newTotalAmount
      };
    },
    onSuccess: (result) => {
      toast.success(`Waktu berhasil diperpanjang ${extensionMinutes} menit. Biaya tambahan: Rp ${result.extensionCost.toLocaleString('id-ID')}`);
      queryClient.invalidateQueries({ queryKey: ['bookings-enhanced'] });
      setExtensionMinutes(0);
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(`Gagal memperpanjang waktu: ${error.message}`);
    }
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price);
  };

  const extensionCost = calculateExtensionCost(extensionMinutes);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Perpanjang Waktu Sesi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentEndTime && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Waktu Selesai Saat Ini (WITA):</strong><br />
                {formatDateTimeWITA(currentEndTime)}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Tambahan waktu saat ini: {currentAdditionalTime} menit
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="extension-minutes">
              Tambahan Waktu (menit) - Kelipatan 5 menit
            </Label>
            <Input
              id="extension-minutes"
              type="number"
              min="5"
              step="5"
              value={extensionMinutes}
              onChange={(e) => setExtensionMinutes(parseInt(e.target.value) || 0)}
              placeholder="Masukkan waktu tambahan dalam menit"
            />
            <p className="text-xs text-gray-500">
              Tarif: {studioType === 'self_photo' ? 'Rp 5.000' : 'Rp 15.000'} per 5 menit
            </p>
          </div>

          {extensionMinutes > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Preview Perpanjangan:</strong>
              </p>
              <p className="text-sm text-green-700">
                • Waktu tambahan: {extensionMinutes} menit
              </p>
              <p className="text-sm text-green-700">
                • Biaya tambahan: {formatPrice(extensionCost)}
              </p>
              <p className="text-sm text-green-700">
                • Total waktu tambahan: {currentAdditionalTime + extensionMinutes} menit
              </p>
            </div>
          )}

          <Button 
            onClick={() => extendTimeMutation.mutate()}
            disabled={extensionMinutes <= 0 || extendTimeMutation.isPending}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {extendTimeMutation.isPending 
              ? 'Memproses...' 
              : `Perpanjang ${extensionMinutes} Menit (${formatPrice(extensionCost)})`
            }
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeExtensionManager;
