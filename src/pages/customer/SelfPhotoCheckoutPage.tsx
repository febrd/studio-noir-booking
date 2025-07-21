import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Plus, Minus, Clock, Users, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import { format, isSameDay, parseISO, isBefore, startOfDay, addMinutes } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { formatDateTimeWITA, parseWITAToUTC } from '@/utils/timezoneUtils';

interface Package {
  id: string;
  title: string;
  price: number;
  base_time_minutes: number;
  description: string;
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

const SelfPhotoCheckoutPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const packageId = searchParams.get('package');
  const { userProfile } = useJWTAuth();
  
  console.log('Self Photo Package ID from URL:', packageId);
  
  // Package quantity is now dynamic instead of fixed
  const [packageQuantity, setPackageQuantity] = useState(1);
  
  // Multi-step state
  const [currentStep, setCurrentStep] = useState<'package' | 'services' | 'schedule'>('package');
  const [selectedServices, setSelectedServices] = useState<{[key: string]: number}>({});
  
  // Schedule selection state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<{[key: string]: BookedSlot[]}>({});
  const [bookingLoading, setBookingLoading] = useState(false);

  // Fetch package details
  const { data: packageData, isLoading: packageLoading, error: packageError } = useQuery({
    queryKey: ['self-photo-package', packageId],
    queryFn: async () => {
      if (!packageId) {
        throw new Error('Package ID is missing');
      }
      
      console.log('Fetching self photo package with ID:', packageId);
      
      const { data, error } = await supabase
        .from('studio_packages')
        .select(`
          id,
          title,
          price,
          base_time_minutes,
          description,
          studios!inner(id, name, type)
        `)
        .eq('id', packageId)
        .eq('studios.type', 'self_photo')
        .single();

      if (error) {
        console.error('Error fetching self photo package:', error);
        throw error;
      }
      
      console.log('Fetched self photo package data:', data);
      return data as Package;
    },
    enabled: !!packageId,
    retry: 3,
    retryDelay: 1000
  });

  // Show error if package loading failed
  useEffect(() => {
    if (packageError) {
      console.error('Self photo package loading error:', packageError);
      toast.error('Gagal memuat data paket. Silakan coba lagi.');
    }
  }, [packageError]);

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

  // Fetch booked slots when on schedule step
  useEffect(() => {
    if (currentStep === 'schedule' && packageData?.studios?.id) {
      fetchBookedSlots();
    }
  }, [currentStep, packageData?.studios?.id]);

  // Generate time slots when date is selected
  useEffect(() => {
    if (selectedDate && packageData) {
      generateTimeSlots();
    }
  }, [selectedDate, bookedSlots, packageData]);

  const handleQuantityChange = (increment: boolean) => {
    if (increment) {
      setPackageQuantity(prev => prev + 1);
    } else if (packageQuantity > 1) {
      setPackageQuantity(prev => prev - 1);
    }
  };

  const fetchBookedSlots = async () => {
    try {
      console.log('Fetching booked slots for self_photo type...');
      
      const { data, error } = await supabase
        .from('bookings')
        .select('start_time, end_time, id')
        .eq('type', 'self_photo')
        .eq('studio_id', packageData?.studios?.id)
        .in('status', ['pending', 'confirmed', 'paid']);

      if (error) {
        console.error('Error fetching booked slots:', error);
        throw error;
      }

      console.log('Fetched bookings:', data);

      // Group bookings by date (convert UTC to WITA for date comparison)
      const groupedBookings: {[key: string]: BookedSlot[]} = {};
      data.forEach(booking => {
        if (booking.start_time && booking.end_time) {
          // Convert UTC to WITA to get the correct date
          const utcDate = new Date(booking.start_time);
          const witaDate = new Date(utcDate.getTime() + (8 * 60 * 60 * 1000));
          const dateKey = format(witaDate, 'yyyy-MM-dd');
          
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

      console.log('Grouped bookings by date:', groupedBookings);
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

    console.log(`Generating dynamic time slots for ${dateKey}:`, dayBookings);

    // Convert all booking times to WITA for easier comparison
    const witaBookings = dayBookings.map(booking => {
      const startUTC = new Date(booking.start_time);
      const endUTC = new Date(booking.end_time);
      const startWITA = new Date(startUTC.getTime() + (8 * 60 * 60 * 1000));
      const endWITA = new Date(endUTC.getTime() + (8 * 60 * 60 * 1000));
      
      return {
        ...booking,
        startWITA,
        endWITA
      };
    });

    // Updated operating hours: 10:00 - 20:30 WITA
    const startHour = 10; // 10:00 WITA
    const endTime = "20:30"; // 20:30 WITA
    const slotDuration = packageData.base_time_minutes; // Dynamic duration based on package
    const slotGap = 5; // 5 minutes gap between slots

    // Create initial time (10:00 WITA)
    let currentTime = new Date(`${dateKey}T10:00:00`);
    const endBoundary = new Date(`${dateKey}T20:30:00`);

    let slotCounter = 1;

    while (currentTime < endBoundary) {
      // Calculate slot end time
      const slotEnd = addMinutes(currentTime, slotDuration);
      
      // Stop if slot would start at or after 20:30
      if (currentTime >= endBoundary) {
        break;
      }

      // Stop if slot would end after 20:30
      if (slotEnd > endBoundary) {
        break;
      }

      // Check for conflicts with existing bookings
      const hasConflict = witaBookings.some(booking => {
        // Check if slot overlaps with any booking
        // Slot conflicts if: booking.start < slotEnd AND booking.end > slotStart
        const conflict = booking.startWITA < slotEnd && booking.endWITA > currentTime;
        
        if (conflict) {
          console.log(`Slot ${format(currentTime, 'HH:mm')}-${format(slotEnd, 'HH:mm')} conflicts with booking:`, {
            bookingStart: format(booking.startWITA, 'HH:mm'),
            bookingEnd: format(booking.endWITA, 'HH:mm')
          });
        }
        
        return conflict;
      });

      // Only add slot if there's no conflict
      if (!hasConflict) {
        slots.push({
          id: `${dateKey}-${format(currentTime, 'HH:mm')}`,
          startTime: format(currentTime, 'HH:mm'),
          endTime: format(slotEnd, 'HH:mm'),
          available: true
        });

        console.log(`Added available slot: ${format(currentTime, 'HH:mm')} - ${format(slotEnd, 'HH:mm')}`);
      }

      // Move to next slot time (current slot end + 5 minutes gap)
      currentTime = addMinutes(slotEnd, slotGap);
      slotCounter++;
    }

    console.log(`Generated ${slots.length} available dynamic slots with ${slotDuration}-minute duration and ${slotGap}-minute gap (10:00-20:30 WITA):`);
    slots.forEach(slot => {
      console.log(`- ${slot.startTime} to ${slot.endTime}`);
    });

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

  const calculateTotal = () => {
    const packageTotal = (packageData?.price || 0) * packageQuantity;
    const servicesTotal = additionalServices.reduce((sum, service) => {
      const serviceQuantity = selectedServices[service.id] || 0;
      return sum + (service.price * serviceQuantity);
    }, 0);
    return packageTotal + servicesTotal;
  };

  const handleContinueToServices = () => {
    setCurrentStep('services');
  };

  const handleContinueToSchedule = () => {
    setCurrentStep('schedule');
  };

  const handleBackToPackage = () => {
    setCurrentStep('package');
  };

  const handleBackToServices = () => {
    setCurrentStep('services');
  };

  const isDateUnavailable = (date: Date) => {
    const today = startOfDay(new Date());
    if (isBefore(date, today)) return true;

    const dateKey = format(date, 'yyyy-MM-dd');
    const dayBookings = bookedSlots[dateKey] || [];
    
    // Updated calculation for 10:00-20:30 operating hours
    // Total available time: 10.5 hours (630 minutes)
    // But since slots are dynamic based on package duration, we use a different approach
    return dayBookings.length >= 20; // Conservative estimate for fully booked day
  };

  const getDateTooltipContent = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayBookings = bookedSlots[dateKey] || [];
    
    if (dayBookings.length === 0) return null;
    
    return (
      <div className="text-sm">
        <div className="font-medium mb-1">Booked times:</div>
        {dayBookings.map((booking, index) => {
          // Convert UTC to WITA for display
          const startUTC = new Date(booking.start_time);
          const endUTC = new Date(booking.end_time);
          const startWITA = new Date(startUTC.getTime() + (8 * 60 * 60 * 1000));
          const endWITA = new Date(endUTC.getTime() + (8 * 60 * 60 * 1000));
          
          return (
            <div key={index}>
              {format(startWITA, 'HH:mm')} - {format(endWITA, 'HH:mm')}
            </div>
          );
        })}
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
          ${isSelected ? 'bg-orange-500 text-white hover:bg-orange-600' : 
            isUnavailable ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 
            'bg-white border border-green-500 hover:bg-green-50 cursor-pointer'}
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

  const handleFinalBooking = async () => {
    if (!selectedDate || !selectedTimeSlot || !userProfile || !packageData) {
      toast.error('Silakan pilih tanggal dan waktu');
      return;
    }

    setBookingLoading(true);

    try {
      // Convert selected WITA time to UTC for database storage
      const startDateTimeWITA = `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTimeSlot.startTime}:00`;
      const endDateTimeWITA = `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTimeSlot.endTime}:00`;
      
      const startDateTimeUTC = parseWITAToUTC(startDateTimeWITA);
      const endDateTimeUTC = parseWITAToUTC(endDateTimeWITA);
      const totalAmount = calculateTotal();

      console.log('Creating booking with times:', {
        startWITA: startDateTimeWITA,
        endWITA: endDateTimeWITA,
        startUTC: startDateTimeUTC.toISOString(),
        endUTC: endDateTimeUTC.toISOString()
      });

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id: userProfile.id,
          studio_package_id: packageId,
          studio_id: packageData.studios?.id,
          start_time: startDateTimeUTC.toISOString(),
          end_time: endDateTimeUTC.toISOString(),
          status: 'pending',
          total_amount: totalAmount,
          payment_method: 'online',
          type: 'self_photo',
          performed_by: userProfile.id
        })
        .select()
        .single();

      if (error) throw error;

      // Add selected services to booking
      if (Object.keys(selectedServices).length > 0) {
        const serviceInserts = Object.entries(selectedServices)
          .filter(([_, quantity]) => quantity > 0)
          .map(([serviceId, quantity]) => ({
            booking_id: data.id,
            additional_service_id: serviceId,
            quantity: quantity
          }));

        if (serviceInserts.length > 0) {
          const { error: servicesError } = await supabase
            .from('booking_additional_services')
            .insert(serviceInserts);

          if (servicesError) {
            console.error('Error adding services:', servicesError);
          }
        }
      }

      toast.success('Booking berhasil dibuat!');
      navigate('/customer/order-history');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Gagal membuat booking');
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
          <h2 className="text-2xl font-peace-sans font-black mb-4">Paket tidak ditemukan</h2>
          <p className="text-gray-500 mb-4">Paket yang Anda cari tidak tersedia atau telah dihapus.</p>
          <Button onClick={() => navigate('/customer/self-photo-packages')} className="bg-black text-white font-peace-sans font-bold">
            Kembali ke Daftar Paket
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Clean Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (currentStep === 'package') {
                  navigate('/customer/self-photo-packages');
                } else if (currentStep === 'services') {
                  handleBackToPackage();
                } else {
                  handleBackToServices();
                }
              }}
              className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-inter font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
            <h1 className="text-2xl md:text-3xl font-peace-sans font-black text-black">
              {currentStep === 'package' && 'Checkout'}
              {currentStep === 'services' && 'Layanan Tambahan'}
              {currentStep === 'schedule' && 'Pilih Jadwal'}
            </h1>
            <div className="w-16 md:w-20"></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {currentStep === 'package' && (
          /* Package Selection */
          <div className="space-y-8 md:space-y-12">
            <div className="text-center">
              <h2 className="text-3xl md:text-5xl font-peace-sans font-black mb-4 text-black">Paket Self Photo</h2>
              <p className="text-base md:text-lg font-inter text-gray-500">Pilih jumlah yang Anda inginkan</p>
            </div>

            <Card className="border border-gray-100 shadow-none">
              <CardHeader className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl md:text-2xl font-peace-sans font-black text-black mb-2">
                      {packageData.title}
                    </CardTitle>
                    <p className="text-gray-500 font-inter mb-4">{packageData.description}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6 text-sm font-inter text-gray-600">
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
                  <Badge className="bg-red-50 text-red-600 border-red-200 font-peace-sans font-bold self-start">
                    Sesi Self Photo 
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 md:p-8 pt-0">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <span className="text-base md:text-lg font-inter text-gray-600">Jumlah:</span>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(false)}
                        disabled={packageQuantity <= 1}
                        className="border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-xl md:text-2xl font-peace-sans font-black min-w-[3rem] text-center">
                        {packageQuantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(true)}
                        className="border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-sm font-inter text-gray-500 mb-1">Total</p>
                    <p className="text-2xl md:text-3xl font-peace-sans font-black text-black break-words">
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
                onClick={handleContinueToServices}
                className="bg-black text-white hover:bg-gray-800 font-peace-sans font-bold px-8 md:px-12 py-3 md:py-4 text-base md:text-lg w-full sm:w-auto"
              >
                Lanjut ke Layanan Tambahan
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'services' && (
          /* Additional Services */
          <div className="space-y-8 md:space-y-12">
            <div className="text-center">
              <h2 className="text-3xl md:text-5xl font-peace-sans font-black mb-4 text-black">Layanan Tambahan</h2>
              <p className="text-base md:text-lg font-inter text-gray-500">Tingkatkan pengalaman Anda (opsional)</p>
            </div>

            <div className="space-y-6">
              {additionalServices.length > 0 ? (
                additionalServices.map((service) => (
                  <Card key={service.id} className="border border-gray-100 shadow-none">
                    <CardContent className="p-6 md:p-8">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg md:text-xl font-peace-sans font-black text-black mb-2">
                            {service.name}
                          </h3>
                          <p className="text-gray-500 font-inter mb-2">{service.description}</p>
                          <p className="text-base md:text-lg font-peace-sans font-bold text-blue-600">
                            {service.price.toLocaleString('id-ID', { 
                              style: 'currency', 
                              currency: 'IDR', 
                              minimumFractionDigits: 0 
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 self-start md:self-center">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleServiceQuantityChange(service.id, false)}
                            disabled={(selectedServices[service.id] || 0) <= 0}
                            className="border-gray-200 text-gray-600 hover:bg-gray-50"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-lg md:text-xl font-peace-sans font-black min-w-[3rem] text-center">
                            {selectedServices[service.id] || 0}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleServiceQuantityChange(service.id, true)}
                            className="border-gray-200 text-gray-600 hover:bg-gray-50"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border border-gray-100 shadow-none">
                  <CardContent className="p-6 md:p-8 text-center">
                    <p className="text-gray-500 font-inter">Tidak ada layanan tambahan tersedia untuk paket ini.</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary - Fixed price alignment */}
            <Card className="border border-gray-100 shadow-none bg-gray-50">
              <CardContent className="p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-peace-sans font-black text-black mb-6">Ringkasan Pesanan</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <span className="font-inter text-gray-600 flex-1">
                      {packageData.title} × {packageQuantity}
                    </span>
                    <span className="font-peace-sans font-bold text-right break-words">
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
                        <div key={service.id} className="flex justify-between items-start gap-4">
                          <span className="font-inter text-gray-600 flex-1">
                            {service.name} × {serviceQuantity}
                          </span>
                          <span className="font-peace-sans font-bold text-right break-words">
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
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-lg md:text-xl font-peace-sans font-black text-black">Total</span>
                      <span className="text-xl md:text-2xl font-peace-sans font-black text-black text-right break-words">
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
                onClick={handleContinueToSchedule}
                className="bg-black text-white hover:bg-gray-800 font-peace-sans font-bold px-8 md:px-12 py-3 md:py-4 text-base md:text-lg w-full sm:w-auto"
              >
                Lanjut ke Pilih Jadwal
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'schedule' && (
          /* Schedule Selection */
          <div className="space-y-8 md:space-y-12">
            <div className="text-center">
              <h2 className="text-3xl md:text-5xl font-peace-sans font-black mb-4 text-black">Pilih Jadwal Anda</h2>
              <p className="text-base md:text-lg font-inter text-gray-500">Pilih tanggal dan waktu yang Anda inginkan</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Package Summary */}
              <Card className="border border-gray-100 shadow-none">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl font-peace-sans font-black">
                    <CalendarIcon className="w-5 h-5" />
                    Ringkasan Paket
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0 space-y-4">
                  <div>
                    <h3 className="font-peace-sans font-bold text-base md:text-lg">{packageData.title}</h3>
                    <p className="text-gray-600 font-inter text-sm">{packageData.description}</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{packageData.base_time_minutes} menit</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{packageData.studios?.name}</span>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-sm text-gray-600">Total Harga:</span>
                      <span className="text-base md:text-lg font-peace-sans font-bold text-primary text-right break-words">
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
              <Card className="border border-gray-100 shadow-none">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="font-peace-sans font-black">Pilih Tanggal</span>
                    <div className="flex items-center gap-4 text-xs font-inter">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-white border border-green-500 rounded"></div>
                        <span>Tersedia</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-gray-200 rounded"></div>
                        <span>Tidak Tersedia</span>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={isDateUnavailable}
                    initialFocus
                    className="rounded-md border w-full"
                    components={{
                      Day: CustomDay
                    }}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <Card className="border border-gray-100 shadow-none">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="font-peace-sans font-black">Waktu Tersedia</CardTitle>
                  <p className="text-sm text-gray-600 font-inter">
                    {format(selectedDate, 'EEEE, dd MMMM yyyy')} (WITA) - Slot {packageData.base_time_minutes} menit dengan jeda 5 menit
                  </p>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot.id}
                        variant={selectedTimeSlot?.id === slot.id ? "default" : "outline"}
                        className={`flex flex-col py-3 h-auto font-inter text-xs md:text-sm ${
                          !slot.available 
                            ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-500' 
                            : 'cursor-pointer'
                        }`}
                        disabled={!slot.available}
                        onClick={() => handleTimeSlotSelect(slot)}
                      >
                        <div className="font-medium">{slot.startTime} - {slot.endTime}</div>
                        <div className="text-xs opacity-75">{packageData.base_time_minutes} menit</div>
                        {!slot.available && <div className="text-xs text-red-500">Tidak Tersedia</div>}
                      </Button>
                    ))}
                  </div>
                  {timeSlots.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      Tidak ada slot waktu yang tersedia untuk tanggal ini
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Final Booking Summary - Fixed price alignment */}
            {selectedDate && selectedTimeSlot && (
              <Card className="border border-gray-100 shadow-none bg-gray-50">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="font-peace-sans font-black">Konfirmasi Pesanan</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <span className="font-inter">Paket:</span>
                      <span className="font-peace-sans font-bold text-right break-words">{packageData.title}</span>
                    </div>
                    <div className="flex justify-between items-start gap-4">
                      <span className="font-inter">Tanggal:</span>
                      <span className="font-peace-sans font-bold text-right break-words">{format(selectedDate, 'EEEE, dd MMMM yyyy')}</span>
                    </div>
                    <div className="flex justify-between items-start gap-4">
                      <span className="font-inter">Waktu:</span>
                      <span className="font-peace-sans font-bold text-right break-words">{selectedTimeSlot.startTime} - {selectedTimeSlot.endTime} (WITA)</span>
                    </div>
                    <div className="flex justify-between items-start gap-4">
                      <span className="font-inter">Durasi:</span>
                      <span className="font-peace-sans font-bold text-right break-words">{packageData.base_time_minutes} menit</span>
                    </div>
                    <div className="flex justify-between items-start gap-4">
                      <span className="font-inter">Studio:</span>
                      <span className="font-peace-sans font-bold text-right break-words">{packageData.studios?.name}</span>
                    </div>
                    <div className="flex justify-between items-start gap-4">
                      <span className="font-inter">Jumlah:</span>
                      <span className="font-peace-sans font-bold text-right break-words">{packageQuantity}</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-start gap-4 text-base md:text-lg font-peace-sans font-black">
                      <span>Total Harga:</span>
                      <span className="text-primary text-right break-words">
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
                    className="w-full bg-black text-white hover:bg-gray-800 font-peace-sans font-bold py-3"
                  >
                    {bookingLoading ? 'Membuat Pesanan...' : 'Konfirmasi Pesanan'}
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

export default SelfPhotoCheckoutPage;
