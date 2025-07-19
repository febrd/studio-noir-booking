
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
import { format, startOfDay, endOfDay, addMinutes } from 'date-fns';
import { WalkinTimeExtensionManager } from './WalkinTimeExtensionManager';

const walkinBookingSchema = z.object({
  customer_name: z.string().min(1, 'Nama customer wajib diisi'),
  customer_email: z.string().email('Email tidak valid').min(1, 'Email wajib diisi'),
  studio_id: z.string().min(1, 'Studio wajib dipilih'),
  category_id: z.string().optional(),
  package_id: z.string().min(1, 'Package wajib dipilih'),
  start_time: z.string().min(1, 'Waktu mulai wajib diisi'),
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
  const [additionalTime, setAdditionalTime] = useState(0);
  const queryClient = useQueryClient();
  
  const today = new Date();
  const todayString = format(today, 'yyyy-MM-dd');

  const form = useForm<WalkinBookingFormData>({
    resolver: zodResolver(walkinBookingSchema),
    defaultValues: {
      customer_name: booking?.customer_name || '',
      customer_email: booking?.customer_email || '',
      studio_id: booking?.studio_id || '',
      category_id: booking?.package_category_id || '',
      package_id: booking?.studio_package_id || '',
      start_time: booking?.start_time ? format(new Date(booking.start_time), 'HH:mm') : '',
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

  // Get selected studio details
  const selectedStudioId = form.watch('studio_id');
  const selectedStudio = studios?.find(studio => studio.id === selectedStudioId);
  const isRegularStudio = selectedStudio?.type === 'regular';

  // Fetch categories for regular studios
  const { data: categories } = useQuery({
    queryKey: ['package-categories-by-studio', selectedStudioId],
    queryFn: async () => {
      if (!selectedStudioId || !isRegularStudio) return [];
      
      const { data, error } = await supabase
        .from('package_categories')
        .select('id, name, description')
        .eq('studio_id', selectedStudioId)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedStudioId && isRegularStudio
  });

  // Fetch packages based on selected studio and category
  const selectedCategoryId = form.watch('category_id');
  const { data: packages } = useQuery({
    queryKey: ['packages-by-studio-category', selectedStudioId, selectedCategoryId, isRegularStudio],
    queryFn: async () => {
      if (!selectedStudioId) return [];
      
      let query = supabase
        .from('studio_packages')
        .select('id, title, price, base_time_minutes')
        .eq('studio_id', selectedStudioId);
      
      if (isRegularStudio && selectedCategoryId) {
        query = query.eq('category_id', selectedCategoryId);
      } else if (!isRegularStudio) {
        query = query.is('category_id', null);
      }
      
      const { data, error } = await query.order('title');
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedStudioId && (!isRegularStudio || !!selectedCategoryId)
  });

  // Get selected package details
  const selectedPackageId = form.watch('package_id');
  const selectedPackage = packages?.find(pkg => pkg.id === selectedPackageId);

  // Calculate total amount
  const calculateTotalAmount = () => {
    const packagePrice = selectedPackage?.price || 0;
    const extensionCost = additionalTime > 0 ? 
      Math.ceil(additionalTime / 5) * (isRegularStudio ? 15000 : 5000) : 0;
    return packagePrice + extensionCost;
  };

  // Auto-calculate end time
  const calculateEndTime = () => {
    const startTime = form.watch('start_time');
    if (!startTime || !selectedPackage) return '';
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const totalMinutes = selectedPackage.base_time_minutes + additionalTime;
    const endDate = addMinutes(startDate, totalMinutes);
    
    return format(endDate, 'HH:mm');
  };

  // Reset category and package when studio changes
  useEffect(() => {
    if (selectedStudioId) {
      form.setValue('category_id', '');
      form.setValue('package_id', '');
      setAdditionalTime(0);
    }
  }, [selectedStudioId, form]);

  // Reset package when category changes for regular studios
  useEffect(() => {
    if (isRegularStudio && selectedCategoryId) {
      form.setValue('package_id', '');
      setAdditionalTime(0);
    }
  }, [selectedCategoryId, isRegularStudio, form]);

  // Create/Update mutation
  const createMutation = useMutation({
    mutationFn: async (data: WalkinBookingFormData) => {
      const startDateTime = new Date(`${todayString}T${data.start_time}:00`);
      const totalMinutes = selectedPackage?.base_time_minutes + additionalTime;
      const endDateTime = addMinutes(startDateTime, totalMinutes);

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
        const { data: existingUsers } = await supabase
          .from('users')
          .select('id')
          .eq('email', data.customer_email)
          .limit(1);

        if (existingUsers && existingUsers.length > 0) {
          customerId = existingUsers[0].id;
        } else {
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

      const totalAmount = calculateTotalAmount();

      if (booking) {
        // Update existing booking
        const { error } = await supabase
          .from('bookings')
          .update({
            studio_id: data.studio_id,
            studio_package_id: data.package_id,
            package_category_id: isRegularStudio ? data.category_id : null,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            additional_time_minutes: additionalTime > 0 ? additionalTime : null,
            payment_method: 'offline',
            total_amount: totalAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.id);

        if (error) throw error;

        // Create transaction record
        await supabase
          .from('transactions')
          .insert({
            booking_id: booking.id,
            amount: totalAmount,
            payment_type: 'offline',
            type: 'offline',
            status: 'paid',
            description: `Walk-in session payment - ${data.payment_method}`
          });

        return { id: booking.id };
      } else {
        // Create new booking
        const { data: newBooking, error } = await supabase
          .from('bookings')
          .insert({
            user_id: customerId,
            studio_id: data.studio_id,
            studio_package_id: data.package_id,
            package_category_id: isRegularStudio ? data.category_id : null,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            additional_time_minutes: additionalTime > 0 ? additionalTime : null,
            payment_method: 'offline',
            type: 'self_photo',
            status: 'confirmed',
            total_amount: totalAmount
          })
          .select('id')
          .single();

        if (error) throw error;

        // Create transaction record
        await supabase
          .from('transactions')
          .insert({
            booking_id: newBooking.id,
            amount: totalAmount,
            payment_type: 'offline',
            type: 'offline',
            status: 'paid',
            description: `Walk-in session payment - ${data.payment_method}`
          });

        return newBooking;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walkin-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
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

  const endTime = calculateEndTime();
  const totalAmount = calculateTotalAmount();

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                      {studio.name} ({studio.type === 'self_photo' ? 'Self Photo' : 'Regular'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.studio_id && (
                <p className="text-sm text-red-600">{form.formState.errors.studio_id.message}</p>
              )}
            </div>

            {/* Category selection - only for regular studios */}
            {isRegularStudio && (
              <div>
                <Label htmlFor="category_id">Kategori Package *</Label>
                <Select 
                  value={form.watch('category_id')} 
                  onValueChange={(value) => form.setValue('category_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="package_id">Package *</Label>
              <Select 
                value={form.watch('package_id')} 
                onValueChange={(value) => form.setValue('package_id', value)}
                disabled={!selectedStudioId || (isRegularStudio && !selectedCategoryId)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih package" />
                </SelectTrigger>
                <SelectContent>
                  {packages?.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.title} - Rp {pkg.price.toLocaleString('id-ID')} ({pkg.base_time_minutes} menit)
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
                <Label htmlFor="end_time">Waktu Selesai</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={endTime}
                  readOnly
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">Otomatis dihitung</p>
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

            <div>
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                {...form.register('notes')}
                placeholder="Catatan tambahan (opsional)"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Time Management & Pricing */}
        <div className="space-y-4">
          {selectedPackage && (
            <WalkinTimeExtensionManager
              baseTimeMinutes={selectedPackage.base_time_minutes}
              studioType={selectedStudio?.type || 'self_photo'}
              additionalTime={additionalTime}
              onAdditionalTimeChange={setAdditionalTime}
              disabled={isSubmitting}
            />
          )}

          {/* Pricing Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ringkasan Biaya</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Paket:</span>
                <span>Rp {(selectedPackage?.price || 0).toLocaleString('id-ID')}</span>
              </div>
              {additionalTime > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tambahan Waktu:</span>
                  <span>Rp {(Math.ceil(additionalTime / 5) * (isRegularStudio ? 15000 : 5000)).toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="border-t pt-2">
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
