
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfDay, endOfDay } from 'date-fns';

const walkinBookingSchema = z.object({
  customer_name: z.string().min(1, 'Nama customer wajib diisi'),
  customer_email: z.string().email('Email tidak valid').min(1, 'Email wajib diisi'),
  studio_id: z.string().min(1, 'Studio wajib dipilih'),
  package_id: z.string().min(1, 'Package wajib dipilih'),
  start_time: z.string().min(1, 'Waktu mulai wajib diisi'),
  end_time: z.string().min(1, 'Waktu selesai wajib diisi'),
  payment_method: z.enum(['cash', 'debit', 'credit', 'qris', 'transfer']),
  notes: z.string().optional()
});

type WalkinBookingFormData = z.infer<typeof walkinBookingSchema>;

interface WalkinBookingFormProps {
  booking?: any;
  onSuccess: () => void;
}

const WalkinBookingForm = ({ booking, onSuccess }: WalkinBookingFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  
  const today = new Date();
  const todayString = format(today, 'yyyy-MM-dd');

  const form = useForm<WalkinBookingFormData>({
    resolver: zodResolver(walkinBookingSchema),
    defaultValues: {
      customer_name: booking?.customer_name || '',
      customer_email: booking?.customer_email || '',
      studio_id: booking?.studio_id || '',
      package_id: booking?.studio_package_id || '',
      start_time: booking?.start_time ? format(new Date(booking.start_time), 'HH:mm') : '',
      end_time: booking?.end_time ? format(new Date(booking.end_time), 'HH:mm') : '',
      payment_method: booking?.payment_method || 'cash',
      notes: ''
    }
  });

  // Fetch studios
  const { data: studios } = useQuery({
    queryKey: ['studios-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('studios')
        .select('id, name, type')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch packages based on selected studio
  const selectedStudioId = form.watch('studio_id');
  const { data: packages } = useQuery({
    queryKey: ['packages-by-studio', selectedStudioId],
    queryFn: async () => {
      if (!selectedStudioId) return [];
      
      const { data, error } = await supabase
        .from('studio_packages')
        .select('id, title, price, base_time_minutes')
        .eq('studio_id', selectedStudioId)
        .order('title');
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedStudioId
  });

  // Create/Update mutation
  const createMutation = useMutation({
    mutationFn: async (data: WalkinBookingFormData) => {
      const startDateTime = new Date(`${todayString}T${data.start_time}:00`);
      const endDateTime = new Date(`${todayString}T${data.end_time}:00`);

      // Check for conflicts
      const { data: conflicts } = await supabase
        .from('bookings')
        .select('id')
        .eq('studio_id', data.studio_id)
        .not('status', 'in', '(cancelled,failed)')
        .gte('start_time', startOfDay(today).toISOString())
        .lte('start_time', endOfDay(today).toISOString())
        .or(`and(start_time.lte.${startDateTime.toISOString()},end_time.gt.${startDateTime.toISOString()}),and(start_time.lt.${endDateTime.toISOString()},end_time.gte.${endDateTime.toISOString()}),and(start_time.gte.${startDateTime.toISOString()},end_time.lte.${endDateTime.toISOString()})`);

      if (conflicts && conflicts.length > 0 && (!booking || !conflicts.some(c => c.id === booking.id))) {
        throw new Error('Waktu tersebut sudah dipesan untuk studio ini');
      }

      // Create or get customer
      let customerId = booking?.user_id;
      
      if (!customerId) {
        // Check if customer exists
        const { data: existingUsers } = await supabase
          .from('users')
          .select('id')
          .eq('email', data.customer_email)
          .limit(1);

        if (existingUsers && existingUsers.length > 0) {
          customerId = existingUsers[0].id;
        } else {
          // Create new customer
          const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert({
              name: data.customer_name,
              email: data.customer_email,
              role: 'pelanggan'
            })
            .select('id')
            .single();

          if (userError) throw userError;
          customerId = newUser.id;
        }
      }

      // Get package info for total calculation
      const selectedPackage = packages?.find(p => p.id === data.package_id);
      const totalAmount = selectedPackage?.price || 0;

      if (booking) {
        // Update existing booking
        const { error } = await supabase
          .from('bookings')
          .update({
            studio_id: data.studio_id,
            studio_package_id: data.package_id,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            payment_method: data.payment_method,
            total_amount: totalAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.id);

        if (error) throw error;
        return { id: booking.id };
      } else {
        // Create new booking
        const { data: newBooking, error } = await supabase
          .from('bookings')
          .insert({
            user_id: customerId,
            studio_id: data.studio_id,
            studio_package_id: data.package_id,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            payment_method: data.payment_method,
            type: 'self_photo',
            status: 'confirmed',
            total_amount: totalAmount
          })
          .select('id')
          .single();

        if (error) throw error;
        return newBooking;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walkin-sessions'] });
      toast.success(booking ? 'Walk-in session berhasil diupdate' : 'Walk-in session berhasil dibuat');
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Error saving walk-in session:', error);
      toast.error(error.message || 'Gagal menyimpan walk-in session');
    }
  });

  const onSubmit = async (data: WalkinBookingFormData) => {
    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="customer_name">Nama Customer *</Label>
              <Input
                id="customer_name"
                {...form.register('customer_name')}
                placeholder="Masukkan nama customer"
              />
              {form.formState.errors.customer_name && (
                <p className="text-sm text-red-600">{form.formState.errors.customer_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="customer_email">Email Customer *</Label>
              <Input
                id="customer_email"
                type="email"
                {...form.register('customer_email')}
                placeholder="Masukkan email customer"
              />
              {form.formState.errors.customer_email && (
                <p className="text-sm text-red-600">{form.formState.errors.customer_email.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Session Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detail Sesi - {format(today, 'dd/MM/yyyy')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="studio_id">Studio *</Label>
              <Select value={form.watch('studio_id')} onValueChange={(value) => form.setValue('studio_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih studio" />
                </SelectTrigger>
                <SelectContent>
                  {studios?.map((studio) => (
                    <SelectItem key={studio.id} value={studio.id}>
                      {studio.name} ({studio.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.studio_id && (
                <p className="text-sm text-red-600">{form.formState.errors.studio_id.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="package_id">Package *</Label>
              <Select 
                value={form.watch('package_id')} 
                onValueChange={(value) => form.setValue('package_id', value)}
                disabled={!selectedStudioId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih package" />
                </SelectTrigger>
                <SelectContent>
                  {packages?.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.title} - {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(pkg.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.package_id && (
                <p className="text-sm text-red-600">{form.formState.errors.package_id.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Waktu Mulai *</Label>
                <Input
                  id="start_time"
                  type="time"
                  {...form.register('start_time')}
                />
                {form.formState.errors.start_time && (
                  <p className="text-sm text-red-600">{form.formState.errors.start_time.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="end_time">Waktu Selesai *</Label>
                <Input
                  id="end_time"
                  type="time"
                  {...form.register('end_time')}
                />
                {form.formState.errors.end_time && (
                  <p className="text-sm text-red-600">{form.formState.errors.end_time.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="payment_method">Metode Pembayaran *</Label>
              <Select value={form.watch('payment_method')} onValueChange={(value) => form.setValue('payment_method', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih metode pembayaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="debit">Debit Card</SelectItem>
                  <SelectItem value="credit">Credit Card</SelectItem>
                  <SelectItem value="qris">QRIS</SelectItem>
                  <SelectItem value="transfer">Transfer Bank</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.payment_method && (
                <p className="text-sm text-red-600">{form.formState.errors.payment_method.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan...' : booking ? 'Update Session' : 'Buat Walk-in Session'}
        </Button>
      </div>
    </form>
  );
};

export default WalkinBookingForm;
