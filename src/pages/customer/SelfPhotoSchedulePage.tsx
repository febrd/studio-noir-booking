
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, MapPin, Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';
import { format, isSameDay, parseISO, isBefore, startOfDay, addMinutes } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Studio {
  id: string;
  name: string;
  location: string;
  description: string;
  type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface StudioPackage {
  id: string;
  title: string;
  price: number;
  base_time_minutes: number;
  description: string;
  studio_id: string;
  category_id: string;
  created_at: string;
  updated_at: string;
  studios: Studio;
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

const SelfPhotoSchedulePage: React.FC = () => {
  const { packageId } = useParams<{ packageId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [selectedPackage, setSelectedPackage] = useState<StudioPackage | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<{[key: string]: BookedSlot[]}>({});
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (packageId) {
      fetchPackageDetails();
      fetchBookedSlots();
    }
  }, [packageId]);

  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots();
    }
  }, [selectedDate, bookedSlots]);

  const fetchPackageDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('studio_packages')
        .select(`
          *,
          studios (*)
        `)
        .eq('id', packageId)
        .single();

      if (error) throw error;
      setSelectedPackage(data);
    } catch (error) {
      console.error('Error fetching package details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load package details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

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
    if (!selectedDate || !selectedPackage) return;

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const dayBookings = bookedSlots[dateKey] || [];
    const slots: TimeSlot[] = [];

    // Generate time slots from 9 AM to 9 PM
    for (let hour = 9; hour <= 21; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const startDateTime = new Date(`${dateKey}T${startTime}:00`);
      const endDateTime = addMinutes(startDateTime, selectedPackage.base_time_minutes);
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

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
  };

  const handleTimeSlotSelect = (timeSlot: TimeSlot) => {
    if (timeSlot.available) {
      setSelectedTimeSlot(timeSlot);
    }
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTimeSlot || !user || !selectedPackage) {
      toast({
        title: 'Error',
        description: 'Please select a date and time slot',
        variant: 'destructive'
      });
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
          studio_id: selectedPackage.studio_id,
          start_time: startDateTime,
          end_time: endDateTime,
          status: 'confirmed',
          total_amount: selectedPackage.price,
          payment_method: 'online',
          type: 'self_photo'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Booking created successfully',
      });

      // Navigate to checkout page
      navigate(`/customer/self-photo-checkout/${data.id}`);
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to create booking',
        variant: 'destructive'
      });
    } finally {
      setBookingLoading(false);
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

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!selectedPackage) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <p className="text-lg text-gray-600">Package not found</p>
          <Button onClick={() => navigate('/customer/self-photo-packages')} className="mt-4">
            Back to Packages
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/customer/self-photo-packages')}
          className="mr-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Packages
        </Button>
        <h1 className="text-2xl font-bold">Schedule Your Self Photo Session Yuk!</h1>
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
              <h3 className="font-semibold text-lg">{selectedPackage.title}</h3>
              <p className="text-gray-600">{selectedPackage.description}</p>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{selectedPackage.base_time_minutes} minutes</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{selectedPackage.studios.name}</span>
            </div>
            
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Quantity:</span>
                <Badge variant="secondary">1 (Fixed)</Badge>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-600">Price:</span>
                <span className="text-lg font-semibold text-primary">
                  Rp {selectedPackage.price.toLocaleString()}
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
        <Card className="mt-6">
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
                  <div className="text-xs opacity-75">{selectedPackage.base_time_minutes} min</div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Summary */}
      {selectedDate && selectedTimeSlot && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Package:</span>
                <span className="font-medium">{selectedPackage.title}</span>
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
                <span className="font-medium">{selectedPackage.base_time_minutes} minutes</span>
              </div>
              <div className="flex justify-between">
                <span>Studio:</span>
                <span className="font-medium">{selectedPackage.studios.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Quantity:</span>
                <span className="font-medium">1</span>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Price:</span>
                <span className="text-primary">Rp {selectedPackage.price.toLocaleString()}</span>
              </div>
            </div>

            <Button 
              onClick={handleBooking} 
              disabled={bookingLoading}
              className="w-full"
            >
              {bookingLoading ? 'Creating Booking...' : 'Proceed to Checkout'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SelfPhotoSchedulePage;
