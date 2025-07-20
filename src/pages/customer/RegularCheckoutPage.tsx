
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, Package, User, CreditCard, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format, addMinutes, parse, startOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

// WITA timezone utilities - WITA is GMT+8 (Waktu Indonesia Tengah - Central Indonesia Time)
const formatDatetimeLocalWITA = (dateTimeString: string): string => {
  if (!dateTimeString) return '';
  
  // Parse the datetime and format for local input (treating as WITA)
  const date = new Date(dateTimeString);
  // WITA is GMT+8, so we add 8 hours to get the local WITA time for display
  const witaOffset = 8 * 60; // 8 hours in minutes
  const witaTime = new Date(date.getTime() + (witaOffset * 60000));
  
  return witaTime.toISOString().slice(0, 16);
};

const parseWITAToUTC = (dateTimeString: string): Date => {
  if (!dateTimeString) return new Date();
  
  // Create date object treating the input as WITA time
  const date = new Date(dateTimeString);
  // Subtract 8 hours to convert WITA to UTC for storage
  const witaOffset = 8 * 60; // 8 hours in minutes
  return new Date(date.getTime() - (witaOffset * 60000));
};

const formatDateTimeWITA = (dateTimeString: string) => {
  if (!dateTimeString) return '';
  const date = new Date(dateTimeString);
  // Format in WITA timezone (GMT+8)
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Makassar', // WITA timezone
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
};

const RegularCheckoutPage = () => {
  const { packageId } = useParams();
  const navigate = useNavigate();
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictingBookings, setConflictingBookings] = useState<any[]>([]);

  // Fetch package details
  const { data: packageData, isLoading } = useQuery({
    queryKey: ['package', packageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('studio_packages')
        .select(`
          *,
          studios (id, name, location, type),
          package_categories (id, name)
        `)
        .eq('id', packageId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch additional services
  const { data: additionalServices } = useQuery({
    queryKey: ['additional-services', packageData?.studio_id],
    queryFn: async () => {
      if (!packageData?.studio_id) return [];
      
      const { data, error } = await supabase
        .from('additional_services')
        .select('*')
        .eq('studio_id', packageData.studio_id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!packageData?.studio_id
  });

  // Check for booking conflicts with WITA timezone handling
  const checkConflicts = async (date: string, time: string) => {
    if (!date || !time || !packageId) return;

    try {
      const dateTimeString = `${date}T${time}`;
      const startDateTime = parseWITAToUTC(dateTimeString).toISOString();
      const endDateTime = new Date(parseWITAToUTC(dateTimeString).getTime() + (packageData?.base_time_minutes || 60) * 60000).toISOString();

      console.log('Checking conflicts for WITA times:', {
        input: dateTimeString,
        startUTC: startDateTime,
        endUTC: endDateTime
      });

      const { data, error } = await supabase
        .from('bookings')
        .select('start_time, end_time, id')
        .eq('studio_package_id', packageId)
        .eq('status', 'pending');

      if (error) throw error;

      const conflicts = data?.filter(booking => {
        const bookingStart = new Date(booking.start_time).getTime();
        const bookingEnd = new Date(booking.end_time).getTime();
        const newStart = new Date(startDateTime).getTime();
        const newEnd = new Date(endDateTime).getTime();

        return (
          (newStart >= bookingStart && newStart < bookingEnd) ||
          (newEnd > bookingStart && newEnd <= bookingEnd) ||
          (newStart <= bookingStart && newEnd >= bookingEnd)
        );
      }) || [];

      setConflictingBookings(conflicts);
    } catch (error) {
      console.error('Error checking conflicts:', error);
    }
  };

  // Handle date/time changes
  useEffect(() => {
    if (selectedDate && selectedTime) {
      checkConflicts(selectedDate, selectedTime);
    }
  }, [selectedDate, selectedTime, packageId]);

  // Generate time slots (WITA)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
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

  const calculateTotal = () => {
    let total = packageData?.price || 0;
    selectedServices.forEach(service => {
      total += service.price * service.quantity;
    });
    return total;
  };

  // Create booking mutation with WITA timezone handling
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const dateTimeString = `${selectedDate}T${selectedTime}`;
      const startDateTime = parseWITAToUTC(dateTimeString).toISOString();
      const endDateTime = new Date(parseWITAToUTC(dateTimeString).getTime() + (packageData?.base_time_minutes || 60) * 60000).toISOString();

      console.log('Creating booking with WITA conversion:', {
        inputWITA: dateTimeString,
        startUTC: startDateTime,
        endUTC: endDateTime
      });

      // Create user first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          name: customerInfo.name,
          email: customerInfo.email,
          role: 'pelanggan'
        })
        .select()
        .single();

      if (userError) throw userError;

      // Create booking with proper WITA to UTC conversion
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: userData.id,
          studio_package_id: packageId,
          package_category_id: packageData?.category_id,
          studio_id: packageData.studios?.id,
          start_time: startDateTime,
          end_time: endDateTime,
          status: 'pending',
          total_amount: calculateTotal(),
          payment_method: 'online',
          type: 'regular',
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Add additional services if any
      if (selectedServices.length > 0) {
        const serviceData = selectedServices.map(service => ({
          booking_id: booking.id,
          additional_service_id: service.id,
          quantity: service.quantity,
          total_price: service.price * service.quantity
        }));

        const { error: serviceError } = await supabase
          .from('booking_additional_services')
          .insert(serviceData);

        if (serviceError) throw serviceError;
      }

      return booking;
    },
    onSuccess: (booking) => {
      toast.success('Booking berhasil dibuat');
      navigate(`/booking-confirmation/${booking.id}`);
    },
    onError: (error: any) => {
      console.error('Error creating booking:', error);
      toast.error('Gagal membuat booking');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (conflictingBookings.length > 0) {
      toast.error('Jadwal yang dipilih bertabrakan dengan booking lain');
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast.error('Pilih tanggal dan waktu');
      return;
    }

    if (!customerInfo.name || !customerInfo.email) {
      toast.error('Lengkapi informasi customer');
      return;
    }

    setIsSubmitting(true);
    try {
      await createBookingMutation.mutateAsync({});
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price);
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!packageData) {
    return <div className="p-6">Package not found</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Package className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Checkout - {packageData.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Form */}
        <Card>
          <CardHeader>
            <CardTitle>Detail Booking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Package Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">{packageData.studios?.name}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4" />
                <span>{packageData.title}</span>
                <Badge variant="outline">{packageData.package_categories?.name}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{packageData.base_time_minutes} menit</span>
                <span className="ml-auto font-bold text-green-600">
                  {formatPrice(packageData.price)}
                </span>
              </div>
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="date">Tanggal (WITA) *</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                required
              />
            </div>

            {/* Time Selection */}
            <div className="space-y-2">
              <Label htmlFor="time">Waktu (WITA) *</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih waktu (WITA)" />
                </SelectTrigger>
                <SelectContent>
                  {generateTimeSlots().map((time) => (
                    <SelectItem key={time} value={time}>
                      {time} WITA
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Waktu Indonesia Tengah (GMT+8)</p>
            </div>

            {/* Conflict Warning */}
            {conflictingBookings.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Jadwal yang dipilih bertabrakan dengan booking lain. Silakan pilih waktu yang berbeda.
                </AlertDescription>
              </Alert>
            )}

            {/* Customer Info */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Informasi Customer
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama *</Label>
                  <Input
                    id="name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">No. HP</Label>
                <Input
                  id="phone"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Catatan</Label>
                <Textarea
                  id="notes"
                  value={customerInfo.notes}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Permintaan khusus atau catatan..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Services & Summary */}
        <div className="space-y-6">
          {/* Additional Services */}
          {additionalServices && additionalServices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Layanan Tambahan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {additionalServices.map((service) => {
                  const selectedService = selectedServices.find(s => s.id === service.id);
                  const isSelected = !!selectedService;
                  
                  return (
                    <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleServiceToggle(service, e.target.checked)}
                          className="rounded"
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
                            -
                          </Button>
                          <span className="w-8 text-center">{selectedService.quantity}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateServiceQuantity(service.id, selectedService.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Ringkasan Pesanan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Paket: {packageData.title}</span>
                <span>{formatPrice(packageData.price)}</span>
              </div>
              
              {selectedServices.map((service) => (
                <div key={service.id} className="flex justify-between text-sm">
                  <span>{service.name} × {service.quantity}</span>
                  <span>{formatPrice(service.price * service.quantity)}</span>
                </div>
              ))}
              
              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-green-600">{formatPrice(calculateTotal())}</span>
              </div>

              {selectedDate && selectedTime && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
                  <p className="font-medium text-blue-800">Jadwal Booking (WITA):</p>
                  <p className="text-blue-700">
                    {format(new Date(`${selectedDate}T${selectedTime}`), 'dd MMMM yyyy')} pukul {selectedTime} WITA
                  </p>
                  <p className="text-blue-600">
                    Durasi: {packageData.base_time_minutes} menit
                  </p>
                </div>
              )}
              
              <Button 
                onClick={handleSubmit} 
                className="w-full" 
                disabled={isSubmitting || conflictingBookings.length > 0}
              >
                {isSubmitting ? 'Processing...' : 'Buat Booking'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RegularCheckoutPage;
