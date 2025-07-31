import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Plus, Minus, Clock, Users, MapPin, Calendar as CalendarIcon, CreditCard } from 'lucide-react';
import { format, isSameDay, parseISO, isBefore, startOfDay, addMinutes } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { formatDateTimeWITA, parseWITAToUTC } from '@/utils/timezoneUtils';
import QRISPaymentDialog from '@/components/QRISPaymentDialog';
import PaymentMethodSelection from '@/components/PaymentMethodSelection';

interface PackageCategory {
  id: string;
  name: string;
}

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

  const [selectedCategory, setSelectedCategory] = useState<PackageCategory | null>(null);
  const [selectedServices, setSelectedServices] = useState<{ [key: string]: number }>({});
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<{ [key: string]: BookedSlot[] }>({});
  const [bookingLoading, setBookingLoading] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<any>(null);
  const [showPaymentMethodSelection, setShowPaymentMethodSelection] = useState(false);

  // Check for pending bookings with transaction status
  const { data: pendingBookings = [], refetch: refetchPendingBookings } = useQuery({
    queryKey: ['pending-selfphoto-bookings-with-transactions', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          start_time,
          end_time,
          total_amount,
          status,
          studio_packages!inner(title),
          booking_additional_services(
            quantity,
            additional_services(name)
          ),
          transactions(
            id,
            amount,
            status,
            payment_type,
            created_at
          ),
          installments(
            id,
            amount,
            installment_number
          )
        `)
        .eq('user_id', userProfile.id)
        .in('status', ['pending', 'installment'])
        .eq('type', 'self_photo');

      if (error) {
        console.error('Error fetching pending selfphoto bookings:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!userProfile?.id
  });

  // Fetch package details
  const { data: packageData, isLoading: packageLoading, error: packageError } = useQuery({
    queryKey: ['selfphoto-package', packageId],
    queryFn: async () => {
      if (!packageId) {
        throw new Error('Package ID is missing');
      }

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
        console.error('Error fetching selfphoto package:', error);
        throw error;
      }

      return data as Package;
    },
    enabled: !!packageId,
    retry: 3,
    retryDelay: 1000
  });

  // Fetch package categories
  const { data: packageCategories = [] } = useQuery({
    queryKey: ['package-categories', packageId],
    queryFn: async () => {
      if (!packageId) return [];

      const { data, error } = await supabase
        .from('package_categories')
        .select('*')
        .eq('studio_package_id', packageId);

      if (error) throw error;
      return data as PackageCategory[];
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

  // Fetch booked slots when date or category changes
  useEffect(() => {
    if (selectedDate && packageData?.studios?.id && selectedCategory) {
      fetchBookedSlots();
    }
  }, [selectedDate, packageData?.studios?.id, selectedCategory]);

  // Generate time slots when date is selected
  useEffect(() => {
    if (selectedDate && packageData) {
      generateTimeSlots();
    }
  }, [selectedDate, bookedSlots, packageData]);

  const fetchBookedSlots = async () => {
    try {
      if (!packageData?.studios?.id || !selectedCategory) return;

      const { data, error } = await supabase
        .from('bookings')
        .select('start_time, end_time, id')
        .eq('type', 'self_photo')
        .eq('studio_id', packageData.studios.id)
        .eq('package_category_id', selectedCategory.id)
        .in('status', ['pending', 'confirmed', 'paid']);

      if (error) {
        console.error('Error fetching booked slots:', error);
        throw error;
      }

      // Group bookings by date (convert UTC to WITA for date comparison)
      const groupedBookings: { [key: string]: BookedSlot[] } = {};
      data.forEach(booking => {
        if (booking.start_time && booking.end_time) {
          const utcDate = new Date(booking.start_time);
          const witaDate = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
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

    // Convert all booking times to WITA for easier comparison
    const witaBookings = dayBookings.map(booking => {
      const startUTC = new Date(booking.start_time);
      const endUTC = new Date(booking.end_time);
      const startWITA = new Date(startUTC.getTime() + 8 * 60 * 60 * 1000);
      const endWITA = new Date(endUTC.getTime() + 8 * 60 * 60 * 1000);

      return {
        ...booking,
        startWITA,
        endWITA
      };
    });

    // Operating hours: 10:00 - 20:30 WITA
    const startHour = 10;
    const endTime = '20:30';
    const slotDuration = packageData.base_time_minutes;
    const slotGap = 5;

    let currentTime = new Date(`${dateKey}T10:00:00`);
    const endBoundary = new Date(`${dateKey}T20:30:00`);

    while (currentTime < endBoundary) {
      const slotEnd = addMinutes(currentTime, slotDuration);

      if (currentTime >= endBoundary) break;
      if (slotEnd > endBoundary) break;

      const hasConflict = witaBookings.some(booking => {
        return booking.startWITA < slotEnd && booking.endWITA > currentTime;
      });

      if (!hasConflict) {
        slots.push({
          id: `${dateKey}-${format(currentTime, 'HH:mm')}`,
          startTime: format(currentTime, 'HH:mm'),
          endTime: format(slotEnd, 'HH:mm'),
          available: true
        });
      }

      currentTime = addMinutes(slotEnd, slotGap);
    }

    setTimeSlots(slots);
  };

  const handleCategoryChange = (categoryId: string) => {
    const category = packageCategories.find(cat => cat.id === categoryId) || null;
    setSelectedCategory(category);
    setSelectedDate(undefined);
    setSelectedTimeSlot(null);
    setTimeSlots([]);
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
    const packageTotal = (packageData?.price || 0);
    const servicesTotal = additionalServices.reduce((sum, service) => {
      const serviceQuantity = selectedServices[service.id] || 0;
      return sum + (service.price * serviceQuantity);
    }, 0);
    return packageTotal + servicesTotal;
  };

  const handleFinalBooking = async () => {
    if (pendingBookings.length > 0) {
      toast.error('Anda memiliki booking yang belum diselesaikan. Silakan selesaikan pembayaran terlebih dahulu.');
      return;
    }

    if (!selectedDate || !selectedTimeSlot || !userProfile || !packageData || !selectedCategory) {
      toast.error('Silakan lengkapi semua pilihan');
      return;
    }

    setBookingLoading(true);

    try {
      const startDateTimeWITA = `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTimeSlot.startTime}:00`;
      const endDateTimeWITA = `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTimeSlot.endTime}:00`;

      const startDateTimeUTC = parseWITAToUTC(startDateTimeWITA);
      const endDateTimeUTC = parseWITAToUTC(endDateTimeWITA);
      const totalAmount = calculateTotal();

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id: userProfile.id,
          studio_package_id: packageId,
          studio_id: packageData.studios?.id,
          package_category_id: selectedCategory.id,
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

      setCurrentBooking(data);
      setShowPaymentMethodSelection(true);

    } catch (error) {
      console.error('Error creating selfphoto booking:', error);
      toast.error('Gagal membuat booking');
    } finally {
      setBookingLoading(false);
    }
  };

  const handlePayment = async (booking: any) => {
    const installmentTransactions = booking.transactions?.filter((t: any) => t.payment_type === 'installment') || [];
    const installmentRecords = booking.installments || [];

    if (installmentTransactions.length > 0) {
      const firstInstallmentTx = installmentTransactions[0];

      try {
        const response = await supabase.functions.invoke('xendit-get-invoice', {
          body: {
            performed_by: userProfile?.id,
            transaction_id: firstInstallmentTx.id
          }
        });

        if (response.data?.success && response.data?.data?.invoice) {
          const invoiceStatus = response.data.data.invoice.status;

          if (invoiceStatus === 'SETTLED') {
            await supabase
              .from('transactions')
              .update({ status: 'paid' })
              .eq('id', firstInstallmentTx.id);

            const totalAmount = booking.total_amount || 0;
            const paidAmount = installmentRecords.reduce((sum: number, inst: any) => sum + inst.amount, 0);
            const remainingAmount = totalAmount - paidAmount;

            if (remainingAmount > 0) {
              await handleInstallmentPayment(booking, remainingAmount, 2);
            } else {
              await supabase
                .from('bookings')
                .update({ status: 'paid' })
                .eq('id', booking.id);

              toast.success('Semua cicilan sudah lunas!');
              refetchPendingBookings();
            }
          } else if (invoiceStatus === 'EXPIRED') {
            await handleInstallmentPayment(booking, firstInstallmentTx.amount, 1);
          } else {
            if (response.data.data.invoice.invoice_url) {
              window.open(response.data.data.invoice.invoice_url, '_blank');
            }
          }
        }
      } catch (error) {
        console.error('Error checking invoice status:', error);
        toast.error('Gagal memeriksa status pembayaran');
      }
    }
  };

  const handleInstallmentPayment = async (booking: any, amount: number, installmentNumber: number) => {
    try {
      const invoiceData = {
        performed_by: userProfile?.id,
        external_id: `installment-${booking.id}-${installmentNumber}-${Date.now()}`,
        amount: amount,
        description: `Cicilan ${installmentNumber} - ${booking.studio_packages?.title}`,
        customer: {
          given_names: userProfile?.name?.split(' ')[0] || 'Customer',
          surname: userProfile?.name?.split(' ').slice(1).join(' ') || '',
          email: userProfile?.email || 'customer@example.com',
          mobile_number: '+6281234567890'
        }
      };

      const response = await supabase.functions.invoke('xendit-create-invoice', {
        body: invoiceData
      });

      if (response.data?.success && response.data?.data?.invoice) {
        const invoice = response.data.data.invoice;

        await supabase
          .from('installments')
          .insert({
            booking_id: booking.id,
            amount: amount,
            installment_number: installmentNumber,
            payment_method: 'online',
            performed_by: userProfile?.id
          });

        await supabase
          .from('transactions')
          .insert({
            booking_id: booking.id,
            amount: amount,
            type: 'online',
            description: `Cicilan ${installmentNumber} - ${booking.studio_packages?.title}`,
            performed_by: userProfile?.id,
            payment_type: 'installment',
            status: 'pending'
          });

        if (installmentNumber === 1) {
          await supabase
            .from('bookings')
            .update({ status: 'installment' })
            .eq('id', booking.id);
        }

        if (invoice.invoice_url) {
          window.open(invoice.invoice_url, '_blank');
          toast.success('Invoice cicilan berhasil dibuat!');
        }

        refetchPendingBookings();
      } else {
        throw new Error(response.data?.error || 'Gagal membuat invoice cicilan');
      }
    } catch (error) {
      console.error('Error creating installment payment:', error);
      toast.error('Gagal membuat pembayaran cicilan');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success('Pesanan berhasil dibatalkan');
      refetchPendingBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Gagal membatalkan pesanan');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-50 text-green-600 border-green-200';
      case 'pending': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'completed': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-200';
      case 'paid': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'installment': return 'bg-orange-50 text-orange-600 border-orange-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Dikonfirmasi';
      case 'pending': return 'Pending';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Cancelled';
      case 'paid': return 'Dibayar';
      case 'installment': return 'Cicilan';
      default: return status;
    }
  };

  const getTypeText = (type: string) => {
    return type === 'self_photo' ? 'Self Photo' : 'Studio Reguler';
  };

  const getPaymentStatusText = (booking: any) => {
    const installmentTransactions = booking.transactions?.filter((t: any) => t.payment_type === 'installment') || [];
    const installmentRecords = booking.installments || [];

    if (installmentTransactions.length > 0) {
      const paidInstallments = installmentTransactions.filter((t: any) => t.status === 'paid').length;
      const totalInstallments = 2;

      if (paidInstallments === 0) {
        return 'Cicilan 1/2 - Belum Dibayar';
      } else if (paidInstallments === 1 && installmentRecords.length < 2) {
        return 'Cicilan 1/2 - Lunas, Menunggu Cicilan 2';
      } else {
        return 'Semua Cicilan Lunas';
      }
    }

    return booking.status === 'paid' ? 'Lunas' : 'Belum Dibayar';
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
          <Button onClick={() => navigate('/customer/selfphoto-packages')} className="bg-black text-white font-peace-sans font-bold">
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
              onClick={() => navigate('/customer/selfphoto-packages')}
              className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-inter font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
            <h1 className="text-2xl md:text-3xl font-peace-sans font-black text-black">
              Checkout Self Photo
            </h1>
            <div className="w-16 md:w-20"></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Package Category Selection */}
        <div className="mb-8">
          <label htmlFor="category-select" className="block mb-2 font-peace-sans font-bold text-black">
            Pilih Kategori Paket
          </label>
          <select
            id="category-select"
            className="w-full border border-gray-300 rounded-md p-2"
            value={selectedCategory?.id || ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            <option value="" disabled>
              Pilih kategori paket
            </option>
            {packageCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Additional Services */}
        <div className="mb-8">
          <h2 className="text-3xl font-peace-sans font-black mb-4 text-black">Layanan Tambahan</h2>
          {additionalServices.length > 0 ? (
            additionalServices.map(service => (
              <Card key={service.id} className="border border-gray-100 shadow-none mb-4">
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
            <p className="text-gray-500 font-inter">Tidak ada layanan tambahan tersedia untuk paket ini.</p>
          )}
        </div>

        {/* Date Selection */}
        <div className="mb-8">
          <h2 className="text-3xl font-peace-sans font-black mb-4 text-black">Pilih Tanggal dan Waktu</h2>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => {
              const today = startOfDay(new Date());
              if (isBefore(date, today)) return true;
              const dateKey = format(date, 'yyyy-MM-dd');
              const dayBookings = bookedSlots[dateKey] || [];
              return dayBookings.length >= 20;
            }}
            initialFocus
            className="rounded-md border w-full mb-6"
          />
          {selectedDate && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {timeSlots.map(slot => (
                <Button
                  key={slot.id}
                  variant={selectedTimeSlot?.id === slot.id ? 'default' : 'outline'}
                  className={`flex flex-col py-3 h-auto font-inter text-xs md:text-sm ${
                    !slot.available ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-500' : 'cursor-pointer'
                  }`}
                  disabled={!slot.available}
                  onClick={() => handleTimeSlotSelect(slot)}
                >
                  <div className="font-medium">{slot.startTime} - {slot.endTime}</div>
                  <div className="text-xs opacity-75">{packageData.base_time_minutes} menit</div>
                  {!slot.available && <div className="text-xs text-red-500">Tidak Tersedia</div>}
                </Button>
              ))}
              {timeSlots.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  Tidak ada slot waktu yang tersedia untuk tanggal ini
                </p>
              )}
            </div>
          )}
        </div>

        {/* Final Booking Summary */}
        {selectedDate && selectedTimeSlot && (
          <Card className="border border-gray-100 shadow-none bg-gray-50 mb-8">
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
                  <span className="font-inter">Kategori:</span>
                  <span className="font-peace-sans font-bold text-right break-words">{selectedCategory?.name}</span>
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

        {/* Pending Bookings Section */}
        {pendingBookings.length > 0 && (
          <Card className="border border-orange-200 shadow-none bg-orange-50 mb-8">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="font-peace-sans font-black text-orange-800">
                Pesanan Belum Selesai
              </CardTitle>
              <p className="text-orange-700 font-inter text-sm">
                Anda memiliki pesanan yang belum diselesaikan pembayarannya
              </p>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              {pendingBookings.map((booking) => (
                <div key={booking.id} className="bg-white p-4 rounded-lg mb-4 last:mb-0">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-peace-sans font-bold text-black mb-1">
                        {booking.studio_packages?.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {formatDateTimeWITA(booking.start_time)}
                      </p>
                      <Badge className={getStatusColor(booking.status) + ' font-peace-sans font-bold border'}>
                        {getStatusText(booking.status)}
                      </Badge>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          Status Pembayaran: {getPaymentStatusText(booking)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handlePayment(booking)}
                        className="bg-green-600 hover:bg-green-700 text-white font-peace-sans font-bold"
                        size="sm"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Bayar Sekarang
                      </Button>
                      {booking.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelBooking(booking.id)}
                          className="border-red-200 text-red-600 hover:bg-red-50 font-peace-sans font-bold"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Payment Method Selection Dialog */}
        {currentBooking && (
          <PaymentMethodSelection
            isOpen={showPaymentMethodSelection}
            onClose={() => setShowPaymentMethodSelection(false)}
            booking={currentBooking}
            totalAmount={calculateTotal()}
            customerName={userProfile?.name || 'Customer'}
            studioName={packageData?.studios?.name || 'Studio'}
            packageTitle={packageData?.title || 'Package'}
            additionalServices={additionalServices.filter(service => (selectedServices[service.id] || 0) > 0).map(service => `${service.name} x${selectedServices[service.id]}`)}
            onPaymentSuccess={() => {
              refetchPendingBookings();
              navigate('/customer/order-history');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default SelfPhotoCheckoutPage;
