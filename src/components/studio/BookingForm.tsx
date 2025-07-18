import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Plus, Minus, AlertTriangle, Search } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useJWTAuth } from '@/hooks/useJWTAuth';


interface BookingFormProps {
  booking?: any;
  onSuccess: () => void;
}


interface AdditionalService {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// UUID validation helper
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const BookingForm = ({ booking, onSuccess }: BookingFormProps) => {
  const { userProfile } = useJWTAuth();

  const [formData, setFormData] = useState({
    user_id: booking?.user_id || '',
    studio_id: booking?.studio_id || '',
    studio_package_id: booking?.studio_package_id || '',
    package_category_id: booking?.package_category_id || '',
    type: booking?.type || '',
    start_time: booking?.start_time || '',
    additional_time_minutes: booking?.additional_time_minutes || 0,
    payment_method: booking?.payment_method || 'offline',
    status: booking?.status || 'pending'
  });

  const [guestUser, setGuestUser] = useState({
    name: '',
    email: ''
  });

  const [selectedServices, setSelectedServices] = useState<AdditionalService[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createGuestUser, setCreateGuestUser] = useState(false);
  const [bookingConflict, setBookingConflict] = useState(false);
  const [endTime, setEndTime] = useState('');
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  // Fetch users with search functionality
  const { data: users } = useQuery({
    queryKey: ['users-customers', customerSearch],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'pelanggan')
        .order('name');
      
      if (customerSearch.trim()) {
        query = query.or(`name.ilike.%${customerSearch}%,email.ilike.%${customerSearch}%`);
      }
      
      const { data, error } = await query.limit(50);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch studios
  const { data: studios } = useQuery({
    queryKey: ['studios-for-booking'],
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

  const selectedStudio = studios?.find(s => s.id === formData.studio_id);

  // Fetch package categories based on studio
  const { data: categories } = useQuery({
    queryKey: ['package-categories', formData.studio_id],
    queryFn: async () => {
      if (!formData.studio_id) return [];
      
      const { data, error } = await supabase
        .from('package_categories')
        .select('id, name, description')
        .eq('studio_id', formData.studio_id)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!formData.studio_id
  });

  // Fetch packages based on studio and category
  const { data: packages } = useQuery({
    queryKey: ['packages-for-booking', formData.studio_id, formData.package_category_id],
    queryFn: async () => {
      if (!formData.studio_id) return [];
      
      let query = supabase
        .from('studio_packages')
        .select('id, title, price, base_time_minutes, category_id')
        .eq('studio_id', formData.studio_id)
        .order('title');

      if (selectedStudio?.type === 'regular' && formData.package_category_id) {
        query = query.eq('category_id', formData.package_category_id);
      }

      if (selectedStudio?.type === 'self_photo') {
        query = query.is('category_id', null);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: !!formData.studio_id && (selectedStudio?.type === 'self_photo' || !!formData.package_category_id)
  });

  // Fetch additional services based on studio
  const { data: additionalServices } = useQuery({
    queryKey: ['additional-services', formData.studio_id],
    queryFn: async () => {
      if (!formData.studio_id) return [];
      
      const { data, error } = await supabase
        .from('additional_services')
        .select('id, name, price, description')
        .eq('studio_id', formData.studio_id)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!formData.studio_id
  });

  const selectedPackage = packages?.find(p => p.id === formData.studio_package_id);

  // Check for booking conflicts
  const checkConflictMutation = useMutation({
    mutationFn: async ({ studioId, startTime, endTime }: { studioId: string, startTime: string, endTime: string }) => {
      const { data, error } = await supabase.rpc('check_booking_conflict', {
        studio_id_param: studioId,
        start_time_param: startTime,
        end_time_param: endTime,
        exclude_booking_id: booking?.id || null
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (hasConflict) => {
      setBookingConflict(hasConflict);
    }
  });

  // Create guest user mutation - FIXED: Use proper UUID generation
  const createGuestMutation = useMutation({
    mutationFn: async (userData: { name: string; email: string }) => {
      // Generate random password
      const randomPassword = Math.random().toString(36).slice(-8);
      
      // Use proper UUID generation and add guest prefix to name
      const guestName = `guest_${userData.name}`;
      
      const { data, error } = await supabase
        .from('users')
        .insert([{
          name: guestName,
          email: userData.email,
          role: 'pelanggan',
          password: randomPassword
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setFormData(prev => ({ ...prev, user_id: data.id }));
      toast.success(`Guest user created: ${data.name}`);
    },
    onError: (error) => {
      console.error('Error creating guest user:', error);
      toast.error('Gagal membuat user guest');
    }
  });

  // Create/Update booking mutation - FIXED: Better error handling
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
    
      const tentativeUserId = data.user_id || '';
      const finalUserId = isValidUUID(tentativeUserId) ? tentativeUserId : null;

      if (!finalUserId) {
        throw new Error('User ID tidak valid atau kosong');
      }

      const bookingData = {
        ...data,
        user_id: finalUserId, // ✅ gunakan UUID yang sudah tervalidasi
        studio_id: data.studio_id,
        studio_package_id: data.studio_package_id,
        package_category_id: data.package_category_id || null,
        start_time: data.start_time,
        end_time: endTime,
        additional_time_minutes: data.additional_time_minutes || 0,
        payment_method: data.payment_method,
        type: data.type,
        status: data.status,
        total_amount: totalPrice,
      };
     

      console.log('🔧 BookingData to save:', bookingData);
      console.log('📦 userProfile:', userProfile);
      console.log('📝 incoming data parameter:', data);
  
      let result;
      let oldData: any = null;
  
      if (booking?.id) {
        // Ambil data lama
        const { data: existing, error: fetchError } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', booking.id)
          .single();
  
        if (fetchError) {
          console.warn('⚠️ Gagal mengambil data lama:', fetchError);
        } else {
          oldData = existing;
          console.log('📜 Old booking data:', oldData);
        }
  
        // Update booking
        const { data: updatedBooking, error } = await supabase
          .from('bookings')
          .update(bookingData)
          .eq('id', booking.id)
          .select()
          .single();
  
        if (error) {
          console.error('❌ Error updating booking:', error);
          throw error;
        }
  
        result = updatedBooking;
      } else {
        // Create booking
        const { data: newBooking, error } = await supabase
          .from('bookings')
          .insert([bookingData])
          .select()
          .single();
  
        if (error) {
          console.error('❌ Error creating booking:', error);
          throw error;
        }
  
        result = newBooking;
      }
  
      console.log('✅ Final saved booking result:', result);
  
      // Logging aktivitas
      if (userProfile?.id && ['admin', 'owner'].includes(userProfile.role)) {
        const isUpdate = Boolean(booking?.id);
        const logPayload = {
          booking_id: result.id,
          action_type: isUpdate ? 'update' : 'create',
          note: isUpdate ? 'Booking diperbarui oleh admin/owner' : 'Booking dibuat oleh admin/owner',
          performed_by: userProfile.id,
          ...(isUpdate && { old_data: oldData }),
          ...(isUpdate && { new_data: result }),
        };
  
        console.log('🧾 Log payload to insert:', logPayload);
  
        const { error: logError } = await supabase
          .from('booking_logs')
          .insert([logPayload]);
  
        if (logError) {
          console.error('⚠️ Error inserting booking log:', logError);
          toast.warning('Booking disimpan tapi gagal mencatat log.');
        }
      } else {
        console.warn('⚠️ Tidak mencatat log: userProfile belum siap atau tidak memiliki izin.');
      }
  
      // Additional services
      if (selectedServices.length > 0) {
        if (booking?.id) {
          await supabase
            .from('booking_additional_services')
            .delete()
            .eq('booking_id', booking.id);
        }
  
        const serviceData = selectedServices.map(service => ({
          booking_id: result.id,
          additional_service_id: service.id,
          quantity: service.quantity,
          total_price: service.price * service.quantity
        }));
  
        console.log('🧩 Additional services to insert:', serviceData);
  
        const { error: serviceError } = await supabase
          .from('booking_additional_services')
          .insert(serviceData);
  
        if (serviceError) {
          console.error('❌ Error creating additional services:', serviceError);
          throw serviceError;
        }
      }
  
      return result;
    },
  
    onSuccess: () => {
      toast.success(booking?.id ? 'Booking berhasil diupdate' : 'Booking berhasil ditambahkan');
      onSuccess();
    },
  
    onError: (error: any) => {
      console.error('❌ Error saving booking:', error);
      let errorMessage = 'Gagal menyimpan booking';
  
      if (error.code === '23503') {
        errorMessage = 'Error: Data yang dipilih tidak valid atau sudah dihapus';
      } else if (error.code === '23502') {
        errorMessage = 'Error: Ada kolom penting yang belum diisi (mungkin performed_by?)';
      } else if (error.message) {
        errorMessage = `Error booking: ${error.message}`;
      }
  
      toast.error(errorMessage);
    }
  });
  

  // Calculate end time
  const calculateEndTime = (startTime: string, baseMinutes: number, additionalMinutes: number = 0) => {
    if (!startTime || !baseMinutes) return '';
    
    const start = new Date(startTime);
    const totalMinutes = baseMinutes + additionalMinutes;
    const end = new Date(start.getTime() + (totalMinutes * 60 * 1000));
    
    return end.toISOString();
  };

  // Calculate additional time cost
  const calculateAdditionalTimeCost = (minutes: number, studioType: string) => {
    if (minutes <= 0) return 0;
    
    const slots = Math.ceil(minutes / 5);
    if (studioType === 'self_photo') {
      return slots * 5000;
    } else {
      return slots * 15000;
    }
  };

  // Calculate total price
  useEffect(() => {
    let total = 0;
    
    // Package price
    if (selectedPackage) {
      total += selectedPackage.price;
    }
    
    // Additional services
    selectedServices.forEach(service => {
      total += service.price * service.quantity;
    });
    
    // Additional time
    if (formData.additional_time_minutes > 0 && selectedStudio) {
      total += calculateAdditionalTimeCost(formData.additional_time_minutes, selectedStudio.type);
    }
    
    setTotalPrice(total);
  }, [selectedPackage, selectedServices, formData.additional_time_minutes, selectedStudio]);

  // Update end time when start time, package, or additional time changes
  useEffect(() => {
    if (formData.start_time && selectedPackage) {
      const newEndTime = calculateEndTime(
        formData.start_time, 
        selectedPackage.base_time_minutes, 
        formData.additional_time_minutes
      );
      setEndTime(newEndTime);
      
      // Check for conflicts
      if (newEndTime && formData.studio_id) {
        checkConflictMutation.mutate({
          studioId: formData.studio_id,
          startTime: formData.start_time,
          endTime: newEndTime
        });
      }
    }
  }, [formData.start_time, selectedPackage, formData.additional_time_minutes, formData.studio_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (bookingConflict) {
      toast.error('Jadwal bertabrakan dengan booking lain. Silakan pilih waktu yang berbeda.');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Create guest user if needed
      if (createGuestUser && guestUser.name && guestUser.email) {
        await createGuestMutation.mutateAsync(guestUser);
      }
      
      await saveMutation.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Reset dependent fields when studio changes
      if (field === 'studio_id') {
        newData.package_category_id = '';
        newData.studio_package_id = '';
        newData.type = studios?.find(s => s.id === value)?.type || '';
        setSelectedServices([]);
      }
      
      // Reset package when category changes
      if (field === 'package_category_id') {
        newData.studio_package_id = '';
      }
      
      return newData;
    });
  };

  const handleServiceToggle = (service: any, checked: boolean) => {
    if (checked) {
      setSelectedServices(prev => [...prev, { ...service, quantity: 1 }]);
    } else {
      setSelectedServices(prev => prev.filter(s => s.id !== service.id));
    }
  };

  const updateServiceQuantity = (serviceId: string, quantity: number) => {
    if (quantity < 1) return;
    
    setSelectedServices(prev =>
      prev.map(service =>
        service.id === serviceId ? { ...service, quantity } : service
      )
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price);
  };

  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return '';
    return new Date(dateTimeString).toLocaleString('id-ID');
  };

  const selectedUser = users?.find(u => u.id === formData.user_id);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Customer Selection - IMPROVED: Searchable dropdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Customer</h3>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="create-guest"
            checked={createGuestUser}
            onCheckedChange={(checked) => setCreateGuestUser(checked === true)}
          />
          <Label htmlFor="create-guest">Buat akun guest baru</Label>
        </div>

        {createGuestUser ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guest-name">Nama *</Label>
              <Input
                id="guest-name"
                value={guestUser.name}
                onChange={(e) => setGuestUser(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nama customer"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guest-email">Email *</Label>
              <Input
                id="guest-email"
                type="email"
                value={guestUser.email}
                onChange={(e) => setGuestUser(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
                required
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="user_id">Pilih Customer *</Label>
            <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={customerSearchOpen}
                  className="w-full justify-between"
                >
                  {selectedUser ? (
                    `${selectedUser.name} (${selectedUser.email})`
                  ) : (
                    "Cari dan pilih customer..."
                  )}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput 
                    placeholder="Cari nama atau email customer..." 
                    value={customerSearch}
                    onValueChange={setCustomerSearch}
                  />
                  <CommandList>
                    <CommandEmpty>Tidak ada customer ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {users?.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={`${user.name} ${user.email}`}
                          onSelect={() => {
                            handleInputChange('user_id', user.id);
                            setCustomerSearchOpen(false);
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{user.name}</span>
                            <span className="text-sm text-gray-500">{user.email}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Studio Selection */}
      <div className="space-y-2">
        <Label htmlFor="studio_id">Studio *</Label>
        <Select value={formData.studio_id} onValueChange={(value) => handleInputChange('studio_id', value)}>
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

      {/* Package Category (for regular studios only) */}
      {selectedStudio?.type === 'regular' && (
        <div className="space-y-2">
          <Label htmlFor="package_category_id">Kategori Paket *</Label>
          <Select value={formData.package_category_id} onValueChange={(value) => handleInputChange('package_category_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih kategori paket" />
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

      {/* Package Selection */}
      <div className="space-y-2">
        <Label htmlFor="studio_package_id">Paket Studio *</Label>
        <Select 
          value={formData.studio_package_id} 
          onValueChange={(value) => handleInputChange('studio_package_id', value)}
          disabled={!formData.studio_id || (selectedStudio?.type === 'regular' && !formData.package_category_id)}
        >
          <SelectTrigger>
            <SelectValue placeholder={
              !formData.studio_id 
                ? "Pilih studio terlebih dahulu"
                : selectedStudio?.type === 'regular' && !formData.package_category_id
                ? "Pilih kategori terlebih dahulu"
                : "Pilih paket"
            } />
          </SelectTrigger>
          <SelectContent>
            {packages?.map((pkg) => (
              <SelectItem key={pkg.id} value={pkg.id}>
                {pkg.title} - {formatPrice(pkg.price)} ({pkg.base_time_minutes} menit)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_time">Tanggal & Waktu Mulai *</Label>
          <Input
            id="start_time"
            type="datetime-local"
            value={formData.start_time}
            onChange={(e) => handleInputChange('start_time', e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="additional_time">Tambahan Waktu (menit)</Label>
          <Input
            id="additional_time"
            type="number"
            min="0"
            step="5"
            value={formData.additional_time_minutes}
            onChange={(e) => handleInputChange('additional_time_minutes', parseInt(e.target.value) || 0)}
            placeholder="0"
          />
        </div>
      </div>

      {/* Booking Conflict Warning */}
      {bookingConflict && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">
            Jadwal bertabrakan dengan booking lain. Silakan pilih waktu yang berbeda.
          </span>
        </div>
      )}

      {/* Schedule Info */}
      {endTime && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Jadwal Booking</span>
          </div>
          <div className="mt-2 text-sm text-blue-700">
            <p>Mulai: {formatDateTime(formData.start_time)}</p>
            <p>Selesai: {formatDateTime(endTime)}</p>
            <p>Durasi: {selectedPackage?.base_time_minutes + formData.additional_time_minutes} menit</p>
          </div>
        </div>
      )}

      {/* Additional Services */}
      {additionalServices && additionalServices.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Layanan Tambahan</h3>
          <div className="space-y-3">
            {additionalServices.map((service) => {
              const selectedService = selectedServices.find(s => s.id === service.id);
              const isSelected = !!selectedService;
              
              return (
                <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleServiceToggle(service, checked === true)}
                    />
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-gray-600">{formatPrice(service.price)}</p>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateServiceQuantity(service.id, selectedService.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{selectedService.quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateServiceQuantity(service.id, selectedService.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <span className="ml-2 font-medium">
                        {formatPrice(service.price * selectedService.quantity)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Method and Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="payment_method">Metode Pembayaran *</Label>
          <Select value={formData.payment_method} onValueChange={(value) => handleInputChange('payment_method', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih metode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="installment">Installment</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Price Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Preview Harga
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {selectedPackage && (
            <div className="flex justify-between">
              <span>Paket: {selectedPackage.title}</span>
              <span>{formatPrice(selectedPackage.price)}</span>
            </div>
          )}
          
          {selectedServices.map((service) => (
            <div key={service.id} className="flex justify-between text-sm">
              <span>{service.name} × {service.quantity}</span>
              <span>{formatPrice(service.price * service.quantity)}</span>
            </div>
          ))}
          
          {formData.additional_time_minutes > 0 && selectedStudio && (
            <div className="flex justify-between text-sm">
              <span>
                Tambahan waktu ({formData.additional_time_minutes} menit)
              </span>
              <span>
                {formatPrice(calculateAdditionalTimeCost(formData.additional_time_minutes, selectedStudio.type))}
              </span>
            </div>
          )}
          
          <div className="border-t pt-2 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-green-600">{formatPrice(totalPrice)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 pt-4">
        <Button 
          type="submit" 
          disabled={
            isSubmitting || 
            bookingConflict ||
            (!formData.user_id && (!createGuestUser || !guestUser.name || !guestUser.email)) ||
            !formData.studio_id || 
            !formData.studio_package_id ||
            !formData.start_time ||
            (selectedStudio?.type === 'regular' && !formData.package_category_id)
          } 
          className="flex-1"
        >
          {isSubmitting ? 'Menyimpan...' : booking?.id ? 'Update Booking' : 'Tambah Booking'}
        </Button>
      </div>
    </form>
  );
};

export default BookingForm;
