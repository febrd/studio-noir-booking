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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfDay, endOfDay, addMinutes } from 'date-fns';
import { WalkinTimeExtensionManager } from './WalkinTimeExtensionManager';
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { formatUTCToDatetimeLocal, parseWITAToUTC } from '@/utils/timezoneUtils';
import { Plus, Minus } from 'lucide-react';

const walkinBookingSchema = z.object({
  customer_name: z.string().min(1, 'Nama customer wajib diisi'),
  customer_email: z.string().email('Email tidak valid').min(1, 'Email wajib diisi'),
  studio_id: z.string().min(1, 'Studio wajib dipilih'),
  category_id: z.string().optional(),
  package_id: z.string().min(1, 'Package wajib dipilih'),
  start_time: z.string().min(1, 'Waktu mulai wajib diisi'),
  payment_method: z.enum(['cash', 'debit', 'credit', 'qris', 'transfer']),
  notes: z.string().optional(),
  additional_services: z.array(z.string()).optional()
});

type WalkinBookingFormData = z.infer<typeof walkinBookingSchema>;

interface WalkinBookingFormProps {
  booking?: any;
  onSuccess: (bookingData?: any) => void;
}

const WalkinBookingForm = ({ booking, onSuccess }: WalkinBookingFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [additionalTime, setAdditionalTime] = useState(0);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [packageQuantity, setPackageQuantity] = useState(1);
  const queryClient = useQueryClient();
  
  const today = new Date();
  const todayString = format(today, 'yyyy-MM-dd');
  const { userProfile } = useJWTAuth();

  const form = useForm<WalkinBookingFormData>({
    resolver: zodResolver(walkinBookingSchema),
    defaultValues: {
      customer_name: '',
      customer_email: '',
      studio_id: '',
      category_id: '',
      package_id: '',
      start_time: '',
      payment_method: 'cash',
      notes: '',
      additional_services: []
    }
  });

  // Load booking data for editing
  useEffect(() => {
    if (booking) {
      console.log('Loading booking data for edit:', booking);
      
      form.setValue('customer_name', booking.users?.name || '');
      form.setValue('customer_email', booking.users?.email || '');
      form.setValue('studio_id', booking.studio_id || '');
      form.setValue('category_id', booking.package_category_id || '');
      form.setValue('package_id', booking.studio_package_id || '');
      form.setValue('payment_method', booking.payment_method || 'cash');
      form.setValue('notes', booking.notes || '');
      
      // Set time using WITA format
      if (booking.start_time) {
        const witaTime = formatUTCToDatetimeLocal(booking.start_time);
        const timeOnly = witaTime.split('T')[1]; // Extract time part only
        form.setValue('start_time', timeOnly);
      }
      
      // Set additional time
      if (booking.additional_time_minutes) {
        setAdditionalTime(booking.additional_time_minutes);
      }
      
      // Set package quantity if exists
      if (booking.package_quantity) {
        setPackageQuantity(booking.package_quantity);
      }
      
      // Set selected additional services
      if (booking.booking_additional_services) {
        const serviceIds = booking.booking_additional_services.map((service: any) => service.additional_service_id);
        setSelectedServices(serviceIds);
      }
    }
  }, [booking, form]);

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
  const isSelfPhotoStudio = selectedStudio?.type === 'self_photo';

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

  // Fetch additional services for selected studio
  const { data: additionalServices } = useQuery({
    queryKey: ['additional-services-by-studio', selectedStudioId],
    queryFn: async () => {
      if (!selectedStudioId) return [];
      
      const { data, error } = await supabase
        .from('additional_services')
        .select('id, name, price, description')
        .eq('studio_id', selectedStudioId)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedStudioId
  });

  // Get selected package details
  const selectedPackageId = form.watch('package_id');
  const selectedPackage = packages?.find(pkg => pkg.id === selectedPackageId);

  // Calculate total amount
  const calculateTotalAmount = () => {
    const packagePrice = (selectedPackage?.price || 0) * packageQuantity;
    const extensionCost = additionalTime > 0 ? 
      Math.ceil(additionalTime / 5) * (isRegularStudio ? 15000 : 5000) : 0;
    
    const servicesTotal = selectedServices.reduce((total, serviceId) => {
      const service = additionalServices?.find(s => s.id === serviceId);
      return total + (service?.price || 0);
    }, 0);
    
    return packagePrice + extensionCost + servicesTotal;
  };

  // Auto-calculate end time with WITA consistency
  const calculateEndTime = () => {
    const startTime = form.watch('start_time');
    if (!startTime || !selectedPackage) return '';
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const totalMinutes = (selectedPackage.base_time_minutes * packageQuantity) + additionalTime;
    const endDate = addMinutes(startDate, totalMinutes);
    
    return format(endDate, 'HH:mm');
  };

  // Handle service selection
  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    if (checked) {
      setSelectedServices(prev => [...prev, serviceId]);
    } else {
      setSelectedServices(prev => prev.filter(id => id !== serviceId));
    }
  };

  // Handle quantity change
  const handleQuantityChange = (increment: boolean) => {
    if (increment) {
      setPackageQuantity(prev => prev + 1);
    } else if (packageQuantity > 1) {
      setPackageQuantity(prev => prev - 1);
    }
  };

  // Reset category and package when studio changes
  useEffect(() => {
    if (selectedStudioId) {
      form.setValue('category_id', '');
      form.setValue('package_id', '');
      setAdditionalTime(0);
      setSelectedServices([]);
      setPackageQuantity(1);
    }
  }, [selectedStudioId, form]);

  // Reset package when category changes for regular studios
  useEffect(() => {
    if (isRegularStudio && selectedCategoryId) {
      form.setValue('package_id', '');
      setAdditionalTime(0);
      setPackageQuantity(1);
    }
  }, [selectedCategoryId, isRegularStudio, form]);

  // Create/Update mutation with WITA timezone preservation
  const createMutation = useMutation({
    mutationKey: ['save-walkin-booking'],
    mutationFn: async (data: WalkinBookingFormData) => {
      // Create full datetime string with WITA consistency
      const startTimeString = `${todayString}T${data.start_time}:00`;
      const startDateTime = parseWITAToUTC(startTimeString);
      const totalMinutes = ((selectedPackage?.base_time_minutes || 0) * packageQuantity) + additionalTime;
      const endDateTime = new Date(startDateTime.getTime() + (totalMinutes * 60 * 1000));

      console.log('🔧 Walk-in WITA Times:', {
        startInput: startTimeString,
        startDateTimeUTC: startDateTime.toISOString(),
        endDateTimeUTC: endDateTime.toISOString(),
        totalMinutes,
        packageQuantity
      });

      // Check for conflicts with regular bookings only
      const { data: conflicts, error: conflictError } = await supabase
        .from('bookings')
        .select('id, start_time, end_time, is_walking_session')
        .eq('studio_id', data.studio_id)
        .eq('is_walking_session', false)
        .not('status', 'in', '(cancelled,failed)')
        .gte('start_time', startOfDay(today).toISOString())
        .lte('start_time', endOfDay(today).toISOString());

      if (conflictError) {
        console.error('Error checking conflicts:', conflictError);
        throw new Error('Gagal memeriksa konflik waktu');
      }

      if (conflicts && conflicts.length > 0) {
        const hasConflict = conflicts.some(conflict => {
          if (booking && conflict.id === booking.id) return false;
          
          const conflictStart = new Date(conflict.start_time);
          const conflictEnd = new Date(conflict.end_time);
          
          return (
            (startDateTime >= conflictStart && startDateTime < conflictEnd) ||
            (endDateTime > conflictStart && endDateTime <= conflictEnd) ||
            (startDateTime <= conflictStart && endDateTime >= conflictEnd)
          );
        });
        
        if (hasConflict) {
          throw new Error('Waktu tersebut sudah dipesan untuk studio ini');
        }
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

      const bookingData = {
        studio_id: data.studio_id,
        studio_package_id: data.package_id,
        package_category_id: isRegularStudio ? data.category_id : null,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        additional_time_minutes: additionalTime > 0 ? additionalTime : null,
        payment_method: 'offline' as const,
        total_amount: totalAmount,
        is_walking_session: true,
        package_quantity: isSelfPhotoStudio ? packageQuantity : null,
        notes: data.notes || null
      };

      if (booking) {
        // Update existing booking
        const { error } = await supabase
          .from('bookings')
          .update({
            ...bookingData,
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.id);

        if (error) throw error;

        // Delete existing additional services
        await supabase
          .from('booking_additional_services')
          .delete()
          .eq('booking_id', booking.id);

        // Add selected additional services
        if (selectedServices.length > 0) {
          const servicesToAdd = selectedServices.map(serviceId => ({
            booking_id: booking.id,
            additional_service_id: serviceId,
            quantity: 1
          }));

          await supabase
            .from('booking_additional_services')
            .insert(servicesToAdd);
        }

        return { id: booking.id, ...bookingData };
      } else {
        // Create new booking
        const { data: newBooking, error } = await supabase
          .from('bookings')
          .insert({
            user_id: customerId,
            type: 'self_photo',
            status: 'confirmed',
            performed_by: userProfile?.id,
            ...bookingData
          })
          .select('id')
          .single();

        if (error) throw error;

        // Add selected additional services
        if (selectedServices.length > 0) {
          const servicesToAdd = selectedServices.map(serviceId => ({
            booking_id: newBooking.id,
            additional_service_id: serviceId,
            quantity: 1
          }));

          await supabase
            .from('booking_additional_services')
            .insert(servicesToAdd);
        }

        return { ...newBooking, ...bookingData };
      }
    },
    onSuccess: (bookingData) => {
      queryClient.invalidateQueries({ queryKey: ['walkin-sessions'] });
      toast.success(booking ? 'Walk-in session berhasil diupdate' : 'Walk-in session berhasil dibuat');
      onSuccess(bookingData);
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
            <CardTitle>Detail Sesi - {format(today, 'dd/MM/yyyy')} (WITA)</CardTitle>
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

            {/* Package Quantity - only for self photo studios */}
            {isSelfPhotoStudio && selectedPackage && (
              <div>
                <Label htmlFor="package_quantity">Jumlah Package</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(false)}
                    disabled={packageQuantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="package_quantity"
                    type="number"
                    value={packageQuantity}
                    onChange={(e) => setPackageQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center"
                    min="1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total waktu: {(selectedPackage.base_time_minutes * packageQuantity)} menit
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Waktu Mulai (WITA) *</Label>
                <Input
                  id="start_time"
                  type="time"
                  {...form.register('start_time')}
                />
                <p className="text-xs text-gray-500 mt-1">Waktu Indonesia Tengah (GMT+8)</p>
                {form.formState.errors.start_time && (
                  <p className="text-sm text-red-600">{form.formState.errors.start_time.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="end_time">Waktu Selesai (WITA)</Label>
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

            {/* Additional Services */}
            {additionalServices && additionalServices.length > 0 && (
              <div>
                <Label>Additional Services</Label>
                <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                  {additionalServices.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={service.id}
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={(checked) => handleServiceToggle(service.id, !!checked)}
                      />
                      <Label htmlFor={service.id} className="text-sm">
                        {service.name} - Rp {service.price.toLocaleString('id-ID')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
              baseTimeMinutes={selectedPackage.base_time_minutes * packageQuantity}
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
                <span>Paket{isSelfPhotoStudio && packageQuantity > 1 ? ` (x${packageQuantity})` : ''}:</span>
                <span>Rp {((selectedPackage?.price || 0) * packageQuantity).toLocaleString('id-ID')}</span>
              </div>
              {additionalTime > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tambahan Waktu:</span>
                  <span>Rp {(Math.ceil(additionalTime / 5) * (isRegularStudio ? 15000 : 5000)).toLocaleString('id-ID')}</span>
                </div>
              )}
              {selectedServices.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Additional Services:</span>
                  <span>Rp {selectedServices.reduce((total, serviceId) => {
                    const service = additionalServices?.find(s => s.id === serviceId);
                    return total + (service?.price || 0);
                  }, 0).toLocaleString('id-ID')}</span>
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
        <Button type="button" variant="outline" onClick={() => onSuccess()}>
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
