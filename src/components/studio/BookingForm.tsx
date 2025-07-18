
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
import { Calendar, Clock, Plus, Minus } from 'lucide-react';

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

const BookingForm = ({ booking, onSuccess }: BookingFormProps) => {
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

  // Fetch users (customers only)
  const { data: users } = useQuery({
    queryKey: ['users-customers'],
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

  // Get selected studio early to avoid declaration issues
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

      // For regular studios, filter by category if selected
      if (selectedStudio?.type === 'regular' && formData.package_category_id) {
        query = query.eq('category_id', formData.package_category_id);
      }

      // For self photo studios, only show packages without categories
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

  // Create guest user mutation
  const createGuestMutation = useMutation({
    mutationFn: async (userData: { name: string; email: string }) => {
      // Generate guest ID
      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .like('id', 'guest_%');
      
      const guestNumber = (count || 0) + 1;
      const guestId = `guest_${guestNumber.toString().padStart(3, '0')}`;
      
      // Generate random password
      const randomPassword = Math.random().toString(36).slice(-8);
      
      const { data, error } = await supabase
        .from('users')
        .insert([{
          id: guestId,
          name: userData.name,
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
      toast.success(`Guest user created: ${data.id}`);
    }
  });

  // Create booking mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Create booking
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert([{
          ...data,
          total_amount: totalPrice,
          end_time: calculateEndTime(data.start_time, selectedPackage?.base_time_minutes || 0, data.additional_time_minutes || 0)
        }])
        .select()
        .single();
      
      if (bookingError) throw bookingError;
      
      // Create booking additional services
      if (selectedServices.length > 0) {
        const serviceData = selectedServices.map(service => ({
          booking_id: bookingData.id,
          additional_service_id: service.id,
          quantity: service.quantity
        }));
        
        const { error: serviceError } = await supabase
          .from('booking_additional_services')
          .insert(serviceData);
        
        if (serviceError) throw serviceError;
      }
      
      return bookingData;
    },
    onSuccess: () => {
      toast.success('Booking berhasil ditambahkan');
      onSuccess();
    },
    onError: (error) => {
      console.error('Error creating booking:', error);
      toast.error('Gagal menambahkan booking');
    }
  });

  // Calculate end time
  const calculateEndTime = (startTime: string, baseMinutes: number, additionalMinutes: number = 0) => {
    if (!startTime) return '';
    
    const start = new Date(startTime);
    const totalMinutes = baseMinutes + additionalMinutes;
    const end = new Date(start.getTime() + (totalMinutes * 60 * 1000));
    
    return end.toISOString();
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
    
    // Additional time (50,000 per 30 minutes)
    if (formData.additional_time_minutes > 0) {
      total += Math.ceil(formData.additional_time_minutes / 30) * 50000;
    }
    
    setTotalPrice(total);
  }, [selectedPackage, selectedServices, formData.additional_time_minutes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create guest user if needed
      if (createGuestUser && guestUser.name && guestUser.email) {
        await createGuestMutation.mutateAsync(guestUser);
      }
      
      await createMutation.mutateAsync(formData);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Customer Selection */}
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
            <Select value={formData.user_id} onValueChange={(value) => handleInputChange('user_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih customer yang sudah terdaftar" />
              </SelectTrigger>
              <SelectContent>
                {users?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          
          {formData.additional_time_minutes > 0 && (
            <div className="flex justify-between text-sm">
              <span>
                Tambahan waktu ({formData.additional_time_minutes} menit)
              </span>
              <span>
                {selectedStudio?.type === 'regular' &&
                  formatPrice(Math.ceil(formData.additional_time_minutes / 5) * 15000)}
                {selectedStudio?.type === 'self_photo' &&
                  formatPrice(Math.ceil(formData.additional_time_minutes / 5) * 5000)}
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
            (!formData.user_id && (!createGuestUser || !guestUser.name || !guestUser.email)) ||
            !formData.studio_id || 
            !formData.studio_package_id ||
            !formData.start_time
          } 
          className="flex-1"
        >
          {isSubmitting ? 'Menyimpan...' : 'Tambah Booking'}
        </Button>
      </div>
    </form>
  );
};

export default BookingForm;
