
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Clock, Users, MapPin, Camera, Calendar as CalendarIcon } from 'lucide-react';
import { format, parseISO, isSameDay, isBefore, startOfDay, addMinutes } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface Package {
  id: string;
  title: string;
  price: number;
  base_time_minutes: number;
  description: string;
  package_categories: {
    name: string;
    id: string;
  } | null;
  studios: {
    name: string;
    id: string;
  } | null;
}

interface AdditionalService {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  available: boolean;
  bookingId?: string;
}

interface BookedSlot {
  start_time: string;
  end_time: string;
  id: string;
}

const RegularCheckoutPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const packageId = searchParams.get('package');
  const { user } = useAuth();
  
  // Package quantity is fixed at 1 for regular packages
  const packageQuantity = 1;
  
  const [currentStep, setCurrentStep] = useState<'package' | 'services' | 'schedule'>('package');
  const [selectedServices, setSelectedServices] = useState<{[key: string]: number}>({});
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<{[key: string]: BookedSlot[]}>({});
  const [bookingLoading, setBookingLoading] = useState(false);

  // Fetch package details
  const { data: packageData, isLoading: packageLoading } = useQuery({
    queryKey: ['regular-package', packageId],
    queryFn: async () => {
      if (!packageId) return null;
      
      const { data, error } = await supabase
        .from('studio_packages')
        .select(`
          id,
          title,
          price,
          base_time_minutes,
          description,
          package_categories(id, name),
          studios!inner(id, name, type)
        `)
        .eq('id', packageId)
        .eq('studios.type', 'regular')
        .single();

      if (error) throw error;
      return data as Package;
    },
    enabled: !!packageId
  });

  // Fetch additional services for the studio
  const { data: additionalServices = [] } = useQuery({
    queryKey: ['additional-services', packageData?.studios?.id],
    queryFn: async () => {
      if (!packageData?.studios?.id) return [];
      
      const { data, error } = await supabase
        .from('additional_services')
        .select('*')
        .eq('studio_id', packageData.studios.id);

      if (error) throw error;
      return data as AdditionalService[];
    },
    enabled: !!packageData?.studios?.id
  });

  // Fetch booked slots when we reach schedule step
  useEffect(() => {
    if (currentStep === 'schedule' && packageId) {
      fetchBookedSlots();
    }
  }, [currentStep, packageId]);

  // Generate time slots when date changes
  useEffect(() => {
    if (selectedDate && packageData) {
      generateTimeSlots();
    }
  }, [selectedDate, bookedSlots, packageData]);

  const fetchBookedSlots = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('start_time, end_time, id')
        .eq('studio_package_id', packageId)
        .eq('status', 'confirmed');

      if (error) throw error;

      // Group bookings by date
      const groupedBookings: {[key: string]: BookedSlot[]} = {};
      data.forEach(booking => {
        if (booking.start_time && booking.end_time) {
          const dateKey = format(parseISO(booking.start_time), 'yyyy-MM-dd');
          if (!groupedBookings[dateKey]) {
            groupedBookings[dateKey] = [];
          }
          groupedBookings[dateKey].push({
            start_time: booking.start_time,
            end_time: booking.end_time,
            id: booking.id
          });
        }
      });

      setBookedSlots(groupedBookings);
    } catch (error) {
      console.error('Error fetching booked slots:', error);
    }
  };

  const generateTimeSlots = () => {
    if (!selectedDate || !packageData) return;

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const dayBookings = bookedSlots[dateKey] || [];
    const slots: TimeSlot[] = [];

    // Generate time slots from 9 AM to 9 PM
    for (let hour = 9; hour <= 21; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const startDateTime = new Date(`${dateKey}T${startTime}:00`);
      const endDateTime = addMinutes(startDateTime, packageData.base_time_minutes);
      const endTime = format(endDateTime, 'HH:mm');

      // Check if this slot conflicts with any existing booking
      const isBooked = dayBookings.some(booking => {
        const bookingStart = parseISO(booking.start_time);
        const bookingEnd = parseISO(booking.end_time);
        const slotStart = startDateTime;
        const slotEnd = endDateTime;

        // Check for overlap
        return (slotStart < bookingEnd && slotEnd > bookingStart);
      });

      slots.push({
        id: `${dateKey}-${startTime}`,
        startTime,
        endTime,
        available: !isBooked,
        bookingId: isBooked ? dayBookings.find(b => {
          const bookingStart = parseISO(b.start_time);
          const bookingEnd = parseISO(b.end_time);
          return (startDateTime < bookingEnd && endDateTime > bookingStart);
        })?.id : undefined
      });
    }

    setTimeSlots(slots);
  };

  const handleServiceQuantityChange = (serviceId: string, increment: boolean) => {
    setSelectedServices(prev => {
      const current = prev[serviceId] || 0;
      if (increment) {
        return { ...prev, [serviceId]: current + 1 };
      } else if (current > 0) {
        return { ...prev, [serviceId]: current - 1 };
      }
      return prev;
    });
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
  };

  const handleTimeSlotSelect = (timeSlot: TimeSlot) => {
    if (timeSlot.available) {
      setSelectedTimeSlot(timeSlot);
    }
  };

  const isDateUnavailable = (date: Date) => {
    const today = startOfDay(new Date());
    if (isBefore(date, today)) return true;

    const dateKey = format(date, 'yyyy-MM-dd');
    const dayBookings = bookedSlots[dateKey] || [];
    
    // Check if all time slots are booked for this date
    const totalSlots = 13; // 9 AM to 9 PM = 13 hours
    return dayBookings.length >= totalSlots;
  };

  const getDateTooltipContent = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayBookings = bookedSlots[dateKey] || [];
    
    if (dayBookings.length === 0) return null;
    
    return (
      <div className="text-sm">
        <div className="font-medium mb-1">Booked times:</div>
        {dayBookings.map((booking, index) => (
          <div key={index}>
            {format(parseISO(booking.start_time), 'HH:mm')} - {format(parseISO(booking.end_time), 'HH:mm')}
          </div>
        ))}
      </div>
    );
  };

  const CustomDay = ({ date, displayMonth }: { date: Date; displayMonth: Date }) => {
    const isUnavailable = isDateUnavailable(date);
    const isSelected = selectedDate && isSameDay(date, selectedDate);
    const isToday = isSameDay(date, new Date());
    const tooltipContent = getDateTooltipContent(date);

    const dayComponent = (
      <button
        className={`
          w-9 h-9 text-sm rounded-md transition-colors
          ${isSelected ? 'bg-primary text-primary-foreground' : ''}
          ${isUnavailable ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border border-green-500 hover:bg-green-50 cursor-pointer'}
          ${isToday && !isSelected ? 'border-2 border-blue-500' : ''}
        `}
        onClick={() => !isUnavailable && handleDateSelect(date)}
        disabled={isUnavailable}
      >
        {date.getDate()}
      </button>
    );

    if (tooltipContent && isUnavailable) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {dayComponent}
            </TooltipTrigger>
            <TooltipContent>
              {tooltipContent}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return dayComponent;
  };

  const calculateTotal = () => {
    const packageTotal = (packageData?.price || 0) * packageQuantity;
    const servicesTotal = additionalServices.reduce((sum, service) => {
      const serviceQuantity = selectedServices[service.id] || 0;
      return sum + (service.price * serviceQuantity);
    }, 0);
    return packageTotal + servicesTotal;
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'personal':
        return <Users className="h-5 w-5" />;
      case 'couple':
        return <Users className="h-5 w-5" />;
      case 'group':
        return <Users className="h-5 w-5" />;
      case 'family':
        return <Users className="h-5 w-5" />;
      default:
        return <Camera className="h-5 w-5" />;
    }
  };

  const handleProceedToServices = () => {
    setCurrentStep('services');
  };

  const handleProceedToSchedule = () => {
    setCurrentStep('schedule');
  };

  const handleFinalBooking = async () => {
    if (!selectedDate || !selectedTimeSlot || !user || !packageData) {
      toast.error('Please select a date and time slot');
      return;
    }

    setBookingLoading(true);

    try {
      const startDateTime = `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTimeSlot.startTime}:00`;
      const endDateTime = `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTimeSlot.endTime}:00`;

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          studio_package_id: packageId,
          studio_id: packageData.studios?.id,
          start_time: startDateTime,
          end_time: endDateTime,
          status: 'confirmed',
          total_amount: calculateTotal(),
          payment_method: 'online',
          type: 'regular'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Booking created successfully!');
      navigate('/customer/order-history');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking');
    } finally {
      setBookingLoading(false);
    }
  };

  if (packageLoading) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-2xl font-peace-sans font-black mb-4">Package not found</h2>
          <Button onClick={() => navigate('/customer/regular-packages')} className="bg-black text-white font-peace-sans font-bold">
            Back to Packages
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Clean Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (currentStep === 'schedule') {
                  setCurrentStep('services');
                } else if (currentStep === 'services') {
                  setCurrentStep('package');
                } else {
                  navigate('/customer/regular-packages');
                }
              }}
              className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-inter font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
            <h1 className="text-3xl font-peace-sans font-black text-black">
              {currentStep === 'package' && 'Package Selection'}
              {currentStep === 'services' && 'Additional Services'}
              {currentStep === 'schedule' && 'Schedule Selection'}
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-12">
        {currentStep === 'package' && (
          /* Package Selection */
          <div className="space-y-12">
            <div className="text-center">
              <h2 className="text-5xl font-peace-sans font-black mb-4 text-black">Studio Package</h2>
              <p className="text-lg font-inter text-gray-500">Choose your package</p>
            </div>

            <Card className="border border-gray-100 shadow-none">
              <CardHeader className="p-8">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl font-peace-sans font-black text-black mb-2">
                      {packageData.title}
                    </CardTitle>
                    <p className="text-gray-500 font-inter mb-4">{packageData.description}</p>
                    <div className="flex items-center gap-6 text-sm font-inter text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {packageData.base_time_minutes} menit
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {packageData.studios?.name}
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-blue-50 text-blue-600 border-blue-200 font-peace-sans font-bold flex items-center gap-2">
                    {getCategoryIcon(packageData.package_categories?.name || '')}
                    {packageData.package_categories?.name || 'Studio'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-peace-sans font-black text-gray-400">
                      Quantity: {packageQuantity} (Fixed)
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-inter text-gray-500 mb-1">Total</p>
                    <p className="text-3xl font-peace-sans font-black text-black">
                      {((packageData.price * packageQuantity)).toLocaleString('id-ID', { 
                        style: 'currency', 
                        currency: 'IDR', 
                        minimumFractionDigits: 0 
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button 
                onClick={handleProceedToServices}
                className="bg-black text-white hover:bg-gray-800 font-peace-sans font-bold px-12 py-4 text-lg"
              >
                Continue to Additional Services
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'services' && (
          /* Additional Services */
          <div className="space-y-12">
            <div className="text-center">
              <h2 className="text-5xl font-peace-sans font-black mb-4 text-black">Additional Services</h2>
              <p className="text-lg font-inter text-gray-500">Enhance your photo session</p>
            </div>

            <div className="space-y-6">
              {additionalServices.map((service) => (
                <Card key={service.id} className="border border-gray-100 shadow-none">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-peace-sans font-black text-black mb-2">
                          {service.name}
                        </h3>
                        <p className="text-gray-500 font-inter mb-2">{service.description}</p>
                        <p className="text-lg font-peace-sans font-bold text-blue-600">
                          {service.price.toLocaleString('id-ID', { 
                            style: 'currency', 
                            currency: 'IDR', 
                            minimumFractionDigits: 0 
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleServiceQuantityChange(service.id, false)}
                          disabled={(selectedServices[service.id] || 0) <= 0}
                          className="border-gray-200 text-gray-600 hover:bg-gray-50"
                        >
                          <span className="text-lg">-</span>
                        </Button>
                        <span className="text-xl font-peace-sans font-black min-w-[3rem] text-center">
                          {selectedServices[service.id] || 0}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleServiceQuantityChange(service.id, true)}
                          className="border-gray-200 text-gray-600 hover:bg-gray-50"
                        >
                          <span className="text-lg">+</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <Card className="border border-gray-100 shadow-none bg-gray-50">
              <CardContent className="p-8">
                <h3 className="text-2xl font-peace-sans font-black text-black mb-6">Order Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-inter text-gray-600">
                      {packageData.title} × {packageQuantity}
                    </span>
                    <span className="font-peace-sans font-bold">
                      {(packageData.price * packageQuantity).toLocaleString('id-ID', { 
                        style: 'currency', 
                        currency: 'IDR', 
                        minimumFractionDigits: 0 
                      })}
                    </span>
                  </div>
                  {additionalServices.map((service) => {
                    const serviceQuantity = selectedServices[service.id] || 0;
                    if (serviceQuantity > 0) {
                      return (
                        <div key={service.id} className="flex justify-between items-center">
                          <span className="font-inter text-gray-600">
                            {service.name} × {serviceQuantity}
                          </span>
                          <span className="font-peace-sans font-bold">
                            {(service.price * serviceQuantity).toLocaleString('id-ID', { 
                              style: 'currency', 
                              currency: 'IDR', 
                              minimumFractionDigits: 0 
                            })}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-peace-sans font-black text-black">Total</span>
                      <span className="text-2xl font-peace-sans font-black text-black">
                        {calculateTotal().toLocaleString('id-ID', { 
                          style: 'currency', 
                          currency: 'IDR', 
                          minimumFractionDigits: 0 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button 
                onClick={handleProceedToSchedule}
                className="bg-black text-white hover:bg-gray-800 font-peace-sans font-bold px-12 py-4 text-lg"
              >
                Continue to Schedule Selection
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'schedule' && (
          /* Schedule Selection */
          <div className="space-y-12">
            <div className="text-center">
              <h2 className="text-5xl font-peace-sans font-black mb-4 text-black">Schedule Selection</h2>
              <p className="text-lg font-inter text-gray-500">Choose your preferred date and time</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Package Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Package Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{packageData.title}</h3>
                    <p className="text-gray-600">{packageData.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{packageData.base_time_minutes} minutes</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{packageData.studios?.name}</span>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Quantity:</span>
                      <Badge variant="secondary">{packageQuantity} (Fixed)</Badge>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-600">Total Price:</span>
                      <span className="text-lg font-semibold text-primary">
                        {calculateTotal().toLocaleString('id-ID', { 
                          style: 'currency', 
                          currency: 'IDR', 
                          minimumFractionDigits: 0 
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Date Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Select Date
                    <div className="ml-auto flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-white border border-green-500 rounded"></div>
                        <span>Available</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-gray-200 rounded"></div>
                        <span>Unavailable</span>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={isDateUnavailable}
                    initialFocus
                    className="rounded-md border"
                    components={{
                      Day: CustomDay
                    }}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <Card>
                <CardHeader>
                  <CardTitle>Available Time Slots</CardTitle>
                  <p className="text-sm text-gray-600">
                    {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot.id}
                        variant={selectedTimeSlot?.id === slot.id ? "default" : "outline"}
                        className={`flex flex-col py-3 h-auto ${
                          !slot.available 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'cursor-pointer'
                        }`}
                        disabled={!slot.available}
                        onClick={() => handleTimeSlotSelect(slot)}
                      >
                        <div className="font-medium">{slot.startTime} - {slot.endTime}</div>
                        <div className="text-xs opacity-75">{packageData.base_time_minutes} min</div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Booking Summary */}
            {selectedDate && selectedTimeSlot && (
              <Card>
                <CardHeader>
                  <CardTitle>Final Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Package:</span>
                      <span className="font-medium">{packageData.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span className="font-medium">{format(selectedDate, 'EEEE, MMMM dd, yyyy')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span className="font-medium">{selectedTimeSlot.startTime} - {selectedTimeSlot.endTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">{packageData.base_time_minutes} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Studio:</span>
                      <span className="font-medium">{packageData.studios?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quantity:</span>
                      <span className="font-medium">{packageQuantity}</span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total Price:</span>
                      <span className="text-primary">
                        {calculateTotal().toLocaleString('id-ID', { 
                          style: 'currency', 
                          currency: 'IDR', 
                          minimumFractionDigits: 0 
                        })}
                      </span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleFinalBooking} 
                    disabled={bookingLoading}
                    className="w-full bg-black text-white hover:bg-gray-800 font-peace-sans font-bold py-4 text-lg"
                  >
                    {bookingLoading ? 'Creating Booking...' : 'Confirm Booking'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegularCheckoutPage;
