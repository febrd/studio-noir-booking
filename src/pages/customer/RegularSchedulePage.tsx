
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Clock, User, MapPin, Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';
import { format, addDays, isSameDay, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Studio {
  id: string;
  name: string;
  address: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

interface StudioPackage {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  max_people: number;
  studio_id: string;
  package_category_id: string;
  created_at: string;
  updated_at: string;
  studios: Studio;
}

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  bookingId?: string;
}

const RegularSchedulePage: React.FC = () => {
  const { packageId } = useParams<{ packageId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [selectedPackage, setSelectedPackage] = useState<StudioPackage | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (packageId) {
      fetchPackageDetails();
      fetchUnavailableDates();
    }
  }, [packageId]);

  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots();
    }
  }, [selectedDate]);

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

  const fetchUnavailableDates = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('booking_date')
        .eq('package_id', packageId)
        .eq('status', 'confirmed');

      if (error) throw error;

      const bookedDates = data.map(booking => parseISO(booking.booking_date));
      setUnavailableDates(bookedDates);
    } catch (error) {
      console.error('Error fetching unavailable dates:', error);
    }
  };

  const fetchTimeSlots = async () => {
    if (!selectedDate) return;

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Get existing bookings for this date
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('booking_time, id')
        .eq('package_id', packageId)
        .eq('booking_date', dateStr)
        .eq('status', 'confirmed');

      if (error) throw error;

      // Generate time slots (9 AM to 9 PM)
      const slots: TimeSlot[] = [];
      for (let hour = 9; hour <= 21; hour++) {
        const time = `${hour.toString().padStart(2, '0')}:00`;
        const isBooked = bookings.some(booking => booking.booking_time === time);
        
        slots.push({
          id: `${dateStr}-${time}`,
          time,
          available: !isBooked,
          bookingId: isBooked ? bookings.find(b => b.booking_time === time)?.id : undefined
        });
      }

      setTimeSlots(slots);
    } catch (error) {
      console.error('Error fetching time slots:', error);
      toast({
        title: 'Error',
        description: 'Failed to load time slots',
        variant: 'destructive'
      });
    }
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
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          customer_id: user.id,
          package_id: packageId,
          studio_id: selectedPackage.studio_id,
          booking_date: format(selectedDate, 'yyyy-MM-dd'),
          booking_time: selectedTimeSlot.time,
          status: 'confirmed',
          total_price: selectedPackage.price,
          payment_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Booking created successfully',
      });

      // Navigate to checkout page
      navigate(`/customer/regular-checkout/${data.id}`);
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

  const isDateDisabled = (date: Date) => {
    const today = startOfDay(new Date());
    return isBefore(date, today) || unavailableDates.some(unavailable => isSameDay(date, unavailable));
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
          <Button onClick={() => navigate('/customer/regular-packages')} className="mt-4">
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
          onClick={() => navigate('/customer/regular-packages')}
          className="mr-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Packages
        </Button>
        <h1 className="text-2xl font-bold">Schedule Your Session</h1>
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
              <h3 className="font-semibold text-lg">{selectedPackage.name}</h3>
              <p className="text-gray-600">{selectedPackage.description}</p>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{selectedPackage.duration} minutes</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>Max {selectedPackage.max_people} people</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{selectedPackage.studios.name}</span>
            </div>
            
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
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
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              initialFocus
              className="rounded-md border"
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
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {timeSlots.map((slot) => (
                <Button
                  key={slot.id}
                  variant={selectedTimeSlot?.id === slot.id ? "default" : "outline"}
                  className={`${
                    !slot.available 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'cursor-pointer'
                  }`}
                  disabled={!slot.available}
                  onClick={() => handleTimeSlotSelect(slot)}
                >
                  {slot.time}
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
                <span className="font-medium">{selectedPackage.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span className="font-medium">{format(selectedDate, 'EEEE, MMMM dd, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span className="font-medium">{selectedTimeSlot.time}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-medium">{selectedPackage.duration} minutes</span>
              </div>
              <div className="flex justify-between">
                <span>Studio:</span>
                <span className="font-medium">{selectedPackage.studios.name}</span>
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

export default RegularSchedulePage;
