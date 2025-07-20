import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, addMinutes } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { formatUTCToDatetimeLocal } from '@/utils/timezoneUtils';
import { ScrollArea } from '@/components/ui/scroll-area';

const bookingSchema = z.object({
  customer_type: z.enum(['existing', 'guest']),
  user_id: z.string().optional(),
  guest_name: z.string().optional(),
  guest_email: z.string().optional(),
  studio_id: z.string().min(1, 'Studio wajib dipilih'),
  category_id: z.string().optional(),
  package_id: z.string().min(1, 'Package wajib dipilih'),
  booking_date: z.date(),
  start_time: z.string().min(1, 'Waktu mulai wajib diisi'),
  payment_method: z.enum(['online', 'offline']),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
  notes: z.string().optional(),
  additional_services: z.array(z.string()).optional()
}).refine((data) => {
  if (data.customer_type === 'existing') {
    return !!data.user_id;
  }
  return !!(data.guest_name && data.guest_email);
}, {
  message: "Customer information is required",
  path: ["customer_type"]
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  booking?: any;
  onSuccess: (bookingData?: any) => void;
}

// Helper function to convert WITA time to UTC
const parseWITAToUTC = (timeString: string, date: Date): Date => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const witaDateTime = new Date(`${dateStr}T${timeString}+08:00`);
  return new Date(witaDateTime.getTime() - (8 * 60 * 60 * 1000)); // Convert WITA (+8) to UTC
};

const BookingForm = ({ booking, onSuccess }: BookingFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [additionalTime, setAdditionalTime] = useState(0);
  const [selectedServices, setSelectedServices] = useState<{ [key: string]: number }>({});
  const [packageQuantity, setPackageQuantity] = useState(1);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const queryClient = useQueryClient();
  const { userProfile } = useJWTAuth();

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customer_type: 'guest',
      user_id: '',
      guest_name: '',
      guest_email: '',
      studio_id: '',
      category_id: '',
      package_id: '',
      booking_date: new Date(),
      start_time: '',
      payment_method: 'offline',
      status: 'pending',
      notes: '',
      additional_services: []
    }
  });

  // Fetch customers
  const { data: customers } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'pelanggan')
        .order('name');
      
      if (error) throw error;
      return data;
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
  const isSelfPhotoStudio = selectedStudio?.type === 'self_photo';

  // Get selected category ID
  const selectedCategoryId = form.watch('category_id');

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

  // Load booking data for editing
  useEffect(() => {
    if (booking && customers && studios && !isDataLoaded) {
      console.log('Loading booking data for edit:', booking);
      
      // Set customer type and info
      if (booking.user_id) {
        form.setValue('customer_type', 'existing');
        form.setValue('user_id', booking.user_id);
      } else {
        form.setValue('customer_type', 'guest');
        form.setValue('guest_name', booking.customer_name || '');
        form.setValue('guest_email', booking.customer_email || '');
      }
      
      // Set studio
      form.setValue('studio_id', booking.studio_id || '');
      
      // Set booking date and time using WITA format
      if (booking.start_time) {
        const bookingDate = parseISO(booking.start_time);
        form.setValue('booking_date', bookingDate);
        
        const witaTime = formatUTCToDatetimeLocal(booking.start_time);
        form.setValue('start_time', witaTime);
      }
      
      // Set payment method and status
      form.setValue('payment_method', booking.payment_method || 'offline');
      form.setValue('status', booking.status || 'pending');
      
      // Set additional time
      if (booking.additional_time_minutes) {
        setAdditionalTime(booking.additional_time_minutes);
      }
      
      // Set package quantity if exists
      if (booking.package_quantity) {
        setPackageQuantity(booking.package_quantity);
      }
      
      // Set notes - FIXED: Load notes properly
      if (booking.notes) {
        form.setValue('notes', booking.notes);
      }
      
      setIsDataLoaded(true);
    }
  }, [booking, customers, studios, form, isDataLoaded]);

  // Load category after studio is set - only for editing
  useEffect(() => {
    if (booking && isDataLoaded && selectedStudioId && categories && !form.getValues('category_id')) {
      if (booking.package_category_id) {
        form.setValue('category_id', booking.package_category_id);
      }
    }
  }, [booking, isDataLoaded, selectedStudioId, categories, form]);

  // Load package after category is set - only for editing
  useEffect(() => {
    if (booking && isDataLoaded && packages && !form.getValues('package_id')) {
      if (booking.studio_package_id) {
        form.setValue('package_id', booking.studio_package_id);
      }
    }
  }, [booking, isDataLoaded, packages, form]);

  // Load additional services - FIXED: Properly load selected services from booking
  useEffect(() => {
    const loadAdditionalServices = async () => {
      if (booking && isDataLoaded && additionalServices && Object.keys(selectedServices).length === 0) {
        console.log('Loading additional services for booking ID:', booking.id);
        
        try {
          // Fetch booking additional services from database
          const { data: bookingServices, error } = await supabase
            .from('booking_additional_services')
            .select('additional_service_id, quantity')
            .eq('booking_id', booking.id);
          
          if (error) {
            console.error('Error fetching booking additional services:', error);
            return;
          }
          
          console.log('Fetched booking services:', bookingServices);
          
          if (bookingServices && bookingServices.length > 0) {
            const services: { [key: string]: number } = {};
            bookingServices.forEach((service: any) => {
              services[service.additional_service_id] = service.quantity || 1;
            });
            console.log('Setting selected services:', services);
            setSelectedServices(services);
          }
        } catch (error) {
          console.error('Error loading additional services:', error);
        }
      }
    };
    
    loadAdditionalServices();
  }, [booking, isDataLoaded, additionalServices, selectedServices]);

  // Calculate total amount
  const calculateTotalAmount = () => {
    const packagePrice = (selectedPackage?.price || 0) * packageQuantity;
    const extensionCost = additionalTime > 0 ? 
      Math.ceil(additionalTime / 5) * (isRegularStudio ? 15000 : 5000) : 0;
    
    const servicesTotal = Object.entries(selectedServices).reduce((total, [serviceId, quantity]) => {
      const service = additionalServices?.find(s => s.id === serviceId);
      return total + ((service?.price || 0) * quantity);
    }, 0);
    
    return packagePrice + extensionCost + servicesTotal;
  };

  // Calculate end time with proper validation - FIXED
  const calculateEndTime = () => {
    const startTime = form.watch('start_time');
    const bookingDate = form.watch('booking_date');
    
    if (!startTime || !bookingDate || !selectedPackage) return null;
    
    try {
      // Validate time format first
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(startTime)) {
        console.log('Invalid time format:', startTime);
        return null;
      }
      
      // Create datetime string properly - FIXED
      const dateStr = format(bookingDate, 'yyyy-MM-dd');
      const startDateTimeStr = `${dateStr}T${startTime}:00`;
      const startDateTime = new Date(startDateTimeStr);
      
      // Validate the start time
      if (isNaN(startDateTime.getTime())) {
        console.log('Invalid start time created:', startDateTimeStr);
        return null;
      }
      
      const totalMinutes = (selectedPackage.base_time_minutes * packageQuantity) + additionalTime;
      const endDateTime = new Date(startDateTime.getTime() + (totalMinutes * 60 * 1000));
      
      // Validate the end time
      if (isNaN(endDateTime.getTime())) {
        console.log('Invalid end time calculation');
        return null;
      }
      
      return endDateTime;
    } catch (error) {
      console.log('Error calculating end time:', error);
      return null;
    }
  };

  // Handle service quantity change
  const handleServiceQuantityChange = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      const newServices = { ...selectedServices };
      delete newServices[serviceId];
      setSelectedServices(newServices);
    } else {
      setSelectedServices(prev => ({
        ...prev,
        [serviceId]: quantity
      }));
    }
  };

  // Handle package quantity change
  const handleQuantityChange = (increment: boolean) => {
    if (increment) {
      setPackageQuantity(prev => prev + 1);
    } else if (packageQuantity > 1) {
      setPackageQuantity(prev => prev - 1);
    }
  };

  // Reset dependent fields when studio changes (but not during initial load)
  useEffect(() => {
    if (selectedStudioId && !booking && isDataLoaded) {
      form.setValue('category_id', '');
      form.setValue('package_id', '');
      setAdditionalTime(0);
      setSelectedServices({});
      setPackageQuantity(1);
    }
  }, [selectedStudioId, form, booking, isDataLoaded]);

  // Reset package when category changes for regular studios (but not during initial load)
  useEffect(() => {
    if (isRegularStudio && selectedCategoryId && !booking && isDataLoaded) {
      form.setValue('package_id', '');
      setAdditionalTime(0);
      setPackageQuantity(1);
    }
  }, [selectedCategoryId, isRegularStudio, form, booking, isDataLoaded]);

  // Create/Update mutation
  const createMutation = useMutation({
    mutationKey: ['save-booking'],
    mutationFn: async (data: BookingFormData) => {
      console.log('Creating booking with data:', data);
      
      // Validate time format first
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(data.start_time)) {
        throw new Error('Invalid time format. Please use HH:MM format.');
      }
      
      // Convert to UTC using WITA timezone - FIXED: Using correct function signature
      const startDateTimeUTC = parseWITAToUTC(data.start_time, data.booking_date);
      
      // Validate the converted time
      if (isNaN(startDateTimeUTC.getTime())) {
        throw new Error('Invalid start time. Please check your time input.');
      }
      
      const totalMinutes = ((selectedPackage?.base_time_minutes || 0) * packageQuantity) + additionalTime;
      const endDateTime = new Date(startDateTimeUTC.getTime() + (totalMinutes * 60 * 1000));

      // Validate the end time
      if (isNaN(endDateTime.getTime())) {
        throw new Error('Invalid end time calculation');
      }

      console.log('🔧 Booking WITA Times:', {
        startInput: data.start_time,
        startDateTimeUTC: startDateTimeUTC.toISOString(),
        endDateTimeUTC: endDateTime.toISOString(),
        totalMinutes,
        packageQuantity
      });

      // Handle customer creation/selection
      let customerId = data.user_id;
      
      if (data.customer_type === 'guest') {
        // Check if customer already exists
        const { data: existingUsers } = await supabase
          .from('users')
          .select('id')
          .eq('email', data.guest_email!)
          .limit(1);

        if (existingUsers && existingUsers.length > 0) {
          customerId = existingUsers[0].id;
        } else {
          // Create new customer
          const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert({
              name: data.guest_name!,
              email: data.guest_email!,
              role: 'pelanggan'
            })
            .select('id')
            .single();

          if (userError) throw userError;
          customerId = newUser.id;
        }
      }

      const totalAmount = calculateTotalAmount();
      const bookingType = selectedStudio?.type === 'self_photo' ? 'self_photo' : 'regular';

      const bookingData = {
        user_id: customerId,
        studio_id: data.studio_id,
        studio_package_id: data.package_id,
        package_category_id: isRegularStudio ? data.category_id : null,
        type: bookingType as 'self_photo' | 'regular',
        start_time: startDateTimeUTC.toISOString(),
        end_time: endDateTime.toISOString(),
        additional_time_minutes: additionalTime > 0 ? additionalTime : null,
        payment_method: data.payment_method,
        status: data.status,
        total_amount: totalAmount,
        package_quantity: isSelfPhotoStudio ? packageQuantity : null,
        notes: data.notes || null,
        performed_by: userProfile?.id
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
        if (Object.keys(selectedServices).length > 0) {
          const servicesToAdd = Object.entries(selectedServices).map(([serviceId, quantity]) => ({
            booking_id: booking.id,
            additional_service_id: serviceId,
            quantity
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
          .insert(bookingData)
          .select('id')
          .single();

        if (error) throw error;

        // Add selected additional services
        if (Object.keys(selectedServices).length > 0) {
          const servicesToAdd = Object.entries(selectedServices).map(([serviceId, quantity]) => ({
            booking_id: newBooking.id,
            additional_service_id: serviceId,
            quantity
          }));

          await supabase
            .from('booking_additional_services')
            .insert(servicesToAdd);
        }

        return { ...newBooking, ...bookingData };
      }
    },
    onSuccess: (bookingData) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success(booking ? 'Booking berhasil diupdate' : 'Booking berhasil dibuat');
      onSuccess(bookingData);
    },
    onError: (error: any) => {
      console.error('Error saving booking:', error);
      toast.error(error.message || 'Gagal menyimpan booking');
    }
  });

  const onSubmit = async (data: BookingFormData) => {
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
    <ScrollArea className="h-[80vh] pr-4">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Section */}
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                name="customer_type"
                control={form.control}
                render={({ field }) => (
                  <RadioGroup value={field.value} onValueChange={field.onChange}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="guest" id="guest" />
                      <Label htmlFor="guest">Buat akun guest baru</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="existing" id="existing" />
                      <Label htmlFor="existing">Pilih Customer</Label>
                    </div>
                  </RadioGroup>
                )}
              />

              {form.watch('customer_type') === 'existing' && (
                <div>
                  <Label htmlFor="user_id">Pilih Customer *</Label>
                  <Select value={form.watch('user_id')} onValueChange={(value) => form.setValue('user_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} ({customer.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {form.watch('customer_type') === 'guest' && (
                <>
                  <div>
                    <Label htmlFor="guest_name">Nama Customer *</Label>
                    <Input
                      id="guest_name"
                      {...form.register('guest_name')}
                      placeholder="Masukkan nama customer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guest_email">Email Customer *</Label>
                    <Input
                      id="guest_email"
                      type="email"
                      {...form.register('guest_email')}
                      placeholder="Masukkan email customer"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Detail Booking Section */}
          <Card>
            <CardHeader>
              <CardTitle>Detail Booking</CardTitle>
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
              </div>

              {/* Category selection - only for regular studios */}
              {isRegularStudio && (
                <div>
                  <Label htmlFor="category_id">Kategori Package</Label>
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
                <Label htmlFor="package_id">Paket Studio *</Label>
                <Select 
                  value={form.watch('package_id')} 
                  onValueChange={(value) => form.setValue('package_id', value)}
                  disabled={!selectedStudioId || (isRegularStudio && !selectedCategoryId)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih paket" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages?.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.title} - Rp {pkg.price.toLocaleString('id-ID')} ({pkg.base_time_minutes} menit)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              <div>
                <Label>Tanggal & Waktu Mulai (WITA) *</Label>
                <div className="flex space-x-2">
                  <Controller
                    name="booking_date"
                    control={form.control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "flex-1 justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "dd/MM/yyyy") : "Pilih tanggal"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  <Input
                    type="time"
                    {...form.register('start_time')}
                    className="flex-1"
                    placeholder="HH:MM"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Waktu Indonesia Tengah (GMT+8) - Central Indonesia Time</p>
              </div>

              <div>
                <Label htmlFor="payment_method">Metode Pembayaran *</Label>
                <Select value={form.watch('payment_method')} onValueChange={(value) => form.setValue('payment_method', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih metode pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status *</Label>
                <Select value={form.watch('status')} onValueChange={(value) => form.setValue('status', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Time & Services Section */}
          <div className="space-y-4">
            {/* Booking Schedule */}
            {endTime && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Jadwal Booking (WITA)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>Mulai: {format(endTime, 'dd/MM/yyyy, HH:mm')}</p>
                  <p>Selesai: {format(addMinutes(endTime, ((selectedPackage?.base_time_minutes || 0) * packageQuantity) + additionalTime), 'dd/MM/yyyy, HH:mm')}</p>
                  <p>Durasi: {((selectedPackage?.base_time_minutes || 0) * packageQuantity) + additionalTime} menit</p>
                </CardContent>
              </Card>
            )}

            {/* Additional Services */}
            {additionalServices && additionalServices.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Layanan Tambahan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {additionalServices.map((service) => (
                    <div key={service.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={service.id}
                          checked={!!selectedServices[service.id]}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleServiceQuantityChange(service.id, 1);
                            } else {
                              handleServiceQuantityChange(service.id, 0);
                            }
                          }}
                        />
                        <div>
                          <Label htmlFor={service.id} className="text-sm font-medium">
                            {service.name}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Rp {service.price.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                      {selectedServices[service.id] && (
                        <div className="flex items-center space-x-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleServiceQuantityChange(service.id, selectedServices[service.id] - 1)}
                            disabled={selectedServices[service.id] <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{selectedServices[service.id]}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleServiceQuantityChange(service.id, selectedServices[service.id] + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
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
                {Object.keys(selectedServices).length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Layanan Tambahan:</span>
                    <span>Rp {Object.entries(selectedServices).reduce((total, [serviceId, quantity]) => {
                      const service = additionalServices?.find(s => s.id === serviceId);
                      return total + ((service?.price || 0) * quantity);
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

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Catatan</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              {...form.register('notes')}
              placeholder="Catatan tambahan (opsional)"
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 sticky bottom-0 bg-white pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onSuccess()}>
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : booking ? 'Update Booking' : 'Buat Booking'}
          </Button>
        </div>
      </form>
    </ScrollArea>
  );
};

export default BookingForm;
