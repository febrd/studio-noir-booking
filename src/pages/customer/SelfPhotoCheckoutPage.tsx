import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ModernLayout } from '@/components/Layout/ModernLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { Clock, MapPin, Calendar, CreditCard } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInvoiceAPI } from '@/hooks/useInvoiceAPI';

const SelfPhotoCheckoutPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { createInvoice, getInvoice } = useInvoiceAPI();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      if (!bookingId) throw new Error("Booking ID is required");
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          users (
            id,
            name,
            email
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });

  const handleFullPayment = async () => {
    if (!booking || !booking.users) return;
    
    setIsProcessingPayment(true);
    
    try {
      console.log('🔄 Processing full payment...');
      
      const invoiceData = {
        performed_by: booking.users.id,
        external_id: `booking-${booking.id}-full-${Date.now()}`,
        amount: booking.total_amount,
        description: `Pembayaran penuh booking ${booking.booking_code}`,
        customer: {
          given_names: booking.users.name?.split(' ')[0] || 'Customer',
          surname: booking.users.name?.split(' ').slice(1).join(' ') || '',
          email: booking.users.email || '',
          mobile_number: booking.phone || ''
        },
        currency: 'IDR',
        invoice_duration: 86400
      };

      const result = await createInvoice(invoiceData);

      if (result.success && result.data?.invoice?.invoice_url) {
        console.log('✅ Invoice created successfully');
        
        // Insert into transactions table
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            booking_id: booking.id,
            amount: booking.total_amount,
            payment_type: 'full',
            status: 'pending',
            xendit_invoice_id: result.data.invoice.id,
            external_id: invoiceData.external_id,
            invoice_url: result.data.invoice.invoice_url
          });

        if (transactionError) {
          console.error('❌ Error inserting transaction:', transactionError);
          throw transactionError;
        }

        // Update booking status to pending payment
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({ status: 'pending' })
          .eq('id', booking.id);

        if (bookingError) {
          console.error('❌ Error updating booking status:', bookingError);
          throw bookingError;
        }

        // Redirect to Xendit checkout
        window.location.href = result.data.invoice.invoice_url;
      } else {
        console.error('❌ Invoice creation failed:', result.error);
        toast({
          title: "Error!",
          description: result.error || "Gagal membuat invoice",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('💥 Error in full payment:', error);
      toast({
        title: "Error!",
        description: "Terjadi kesalahan saat memproses pembayaran",
        variant: "destructive"
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleInstallmentPayment = async () => {
    if (!booking || !booking.users) return;
    
    setIsProcessingPayment(true);
    
    try {
      console.log('🔄 Processing installment payment...');
      
      const firstInstallmentAmount = Math.round(booking.total_amount * 0.5);
      
      const invoiceData = {
        performed_by: booking.users.id,
        external_id: `booking-${booking.id}-installment-1-${Date.now()}`,
        amount: firstInstallmentAmount,
        description: `Cicilan 1/2 booking ${booking.booking_code}`,
        customer: {
          given_names: booking.users.name?.split(' ')[0] || 'Customer',
          surname: booking.users.name?.split(' ').slice(1).join(' ') || '',
          email: booking.users.email || '',
          mobile_number: booking.phone || ''
        },
        currency: 'IDR',
        invoice_duration: 86400
      };

      const result = await createInvoice(invoiceData);

      if (result.success && result.data?.invoice?.invoice_url) {
        console.log('✅ Installment invoice created successfully');
        
        // Insert into transactions table with installment payment type
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            booking_id: booking.id,
            amount: firstInstallmentAmount,
            payment_type: 'installment',
            status: 'pending',
            xendit_invoice_id: result.data.invoice.id,
            external_id: invoiceData.external_id,
            invoice_url: result.data.invoice.invoice_url,
            installment_number: 1
          });

        if (transactionError) {
          console.error('❌ Error inserting installment transaction:', transactionError);
          throw transactionError;
        }

        // Update booking status to installment
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({ status: 'installment' })
          .eq('id', booking.id);

        if (bookingError) {
          console.error('❌ Error updating booking status:', bookingError);
          throw bookingError;
        }

        // Redirect to Xendit checkout
        window.location.href = result.data.invoice.invoice_url;
      } else {
        console.error('❌ Installment invoice creation failed:', result.error);
        toast({
          title: "Error!",
          description: result.error || "Gagal membuat invoice cicilan",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('💥 Error in installment payment:', error);
      toast({
        title: "Error!",
        description: "Terjadi kesalahan saat memproses cicilan",
        variant: "destructive"
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePayment = async () => {
    if (!booking || !booking.users) return;
    
    setIsProcessingPayment(true);
    
    try {
      // Check for existing transaction
      const { data: existingTransaction, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('booking_id', booking.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (transError && transError.code !== 'PGRST116') {
        throw transError;
      }

      if (existingTransaction && existingTransaction.xendit_invoice_id) {
        console.log('🔍 Found existing transaction, checking status...');
        
        // Use our internal getInvoice service instead of direct Supabase call
        const statusResult = await getInvoice({
          performed_by: booking.users.id,
          invoice_id: existingTransaction.xendit_invoice_id
        });

        if (statusResult.success && statusResult.data?.invoice) {
          const invoiceStatus = statusResult.data.invoice.status;
          console.log('📊 Invoice status:', invoiceStatus);

          if (invoiceStatus === 'SETTLED') {
            // Payment completed, update transaction status
            const { error: updateError } = await supabase
              .from('transactions')
              .update({ status: 'paid' })
              .eq('id', existingTransaction.id);

            if (updateError) {
              console.error('❌ Error updating transaction status:', updateError);
            }

            // Handle installment logic
            if (existingTransaction.payment_type === 'installment' && existingTransaction.installment_number === 1) {
              // Insert first installment record
              const { error: installmentError } = await supabase
                .from('installments')
                .insert({
                  booking_id: booking.id,
                  installment_number: 1,
                  amount: existingTransaction.amount,
                  status: 'paid',
                  transaction_id: existingTransaction.id
                });

              if (installmentError) {
                console.error('❌ Error inserting installment:', installmentError);
              }

              // Create second installment invoice
              const remainingAmount = booking.total_amount - existingTransaction.amount;
              
              const secondInstallmentData = {
                performed_by: booking.users.id,
                external_id: `booking-${booking.id}-installment-2-${Date.now()}`,
                amount: remainingAmount,
                description: `Cicilan 2/2 booking ${booking.booking_code}`,
                customer: {
                  given_names: booking.users.name?.split(' ')[0] || 'Customer',
                  surname: booking.users.name?.split(' ').slice(1).join(' ') || '',
                  email: booking.users.email || '',
                  mobile_number: booking.phone || ''
                },
                currency: 'IDR',
                invoice_duration: 86400
              };

              const secondResult = await createInvoice(secondInstallmentData);

              if (secondResult.success && secondResult.data?.invoice?.invoice_url) {
                // Insert second installment transaction
                const { error: secondTransError } = await supabase
                  .from('transactions')
                  .insert({
                    booking_id: booking.id,
                    amount: remainingAmount,
                    payment_type: 'installment',
                    status: 'pending',
                    xendit_invoice_id: secondResult.data.invoice.id,
                    external_id: secondInstallmentData.external_id,
                    invoice_url: secondResult.data.invoice.invoice_url,
                    installment_number: 2
                  });

                if (!secondTransError) {
                  window.location.href = secondResult.data.invoice.invoice_url;
                  return;
                }
              }
            }

            toast({
              title: "Pembayaran Berhasil!",
              description: "Pembayaran Anda telah dikonfirmasi",
            });
            
            navigate('/customer/order-history');
            return;
          } else if (invoiceStatus === 'EXPIRED') {
            console.log('⏰ Invoice expired, creating new one...');
            
            // Create new invoice with same data
            const renewData = {
              performed_by: booking.users.id,
              external_id: `booking-${booking.id}-${existingTransaction.payment_type}-${existingTransaction.installment_number || 'full'}-${Date.now()}`,
              amount: existingTransaction.amount,
              description: existingTransaction.payment_type === 'installment' 
                ? `Cicilan ${existingTransaction.installment_number}/2 booking ${booking.booking_code}`
                : `Pembayaran penuh booking ${booking.booking_code}`,
              customer: {
                given_names: booking.users.name?.split(' ')[0] || 'Customer',
                surname: booking.users.name?.split(' ').slice(1).join(' ') || '',
                email: booking.users.email || '',
                mobile_number: booking.phone || ''
              },
              currency: 'IDR',
              invoice_duration: 86400
            };

            const renewResult = await createInvoice(renewData);

            if (renewResult.success && renewResult.data?.invoice?.invoice_url) {
              // Update transaction with new invoice data
              const { error: updateError } = await supabase
                .from('transactions')
                .update({
                  xendit_invoice_id: renewResult.data.invoice.id,
                  external_id: renewData.external_id,
                  invoice_url: renewResult.data.invoice.invoice_url
                })
                .eq('id', existingTransaction.id);

              if (!updateError) {
                window.location.href = renewResult.data.invoice.invoice_url;
                return;
              }
            }
          } else {
            // Still pending, redirect to existing URL
            console.log('⏳ Invoice still pending, redirecting...');
            window.location.href = existingTransaction.invoice_url;
            return;
          }
        }
      }

      // No existing transaction or status check failed, show payment options
      toast({
        title: "Pilih Metode Pembayaran",
        description: "Silakan pilih pembayaran penuh atau cicilan 50%",
      });
      
    } catch (error) {
      console.error('💥 Error checking payment status:', error);
      toast({
        title: "Error!",
        description: "Terjadi kesalahan saat mengecek status pembayaran",
        variant: "destructive"
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const cancelBooking = async () => {
    if (!booking) return;
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', booking.id);

      if (error) throw error;

      toast({
        title: "Booking Dibatalkan",
        description: "Booking Anda telah dibatalkan",
      });
      
      navigate('/customer/order-history');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error!",
        description: "Gagal membatalkan booking",
        variant: "destructive"
      });
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error fetching booking.</div>;

  return (
    <ModernLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Checkout - Self Photo Package</h1>
          <p className="text-muted-foreground">Review and complete your booking</p>
        </div>

        {booking && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Detail Booking</CardTitle>
                <CardDescription>Informasi lengkap tentang booking Anda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{booking.booking_code}</Badge>
                  <Badge>{booking.status}</Badge>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(booking.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{booking.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{booking.location}</span>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Paket:</p>
                  <p className="text-lg">{booking.package_name}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Jumlah Peserta:</p>
                  <p className="text-lg">{booking.participant_count}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Pembayaran
                </CardTitle>
                <CardDescription>
                  Pilih metode pembayaran untuk booking Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="font-medium">Total Pembayaran:</span>
                  <span className="text-2xl font-bold">
                    Rp {booking.total_amount?.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="space-y-3">
                  {(booking.status === 'pending' || booking.status === 'installment') && (
                    <>
                      <Button
                        onClick={handlePayment}
                        disabled={isProcessingPayment}
                        className="w-full"
                        size="lg"
                      >
                        {isProcessingPayment ? 'Memproses...' : 'Bayar Sekarang'}
                      </Button>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={handleFullPayment}
                          disabled={isProcessingPayment}
                          variant="outline"
                        >
                          Bayar Penuh
                        </Button>
                        <Button
                          onClick={handleInstallmentPayment}
                          disabled={isProcessingPayment}
                          variant="outline"
                        >
                          Cicilan 50%
                        </Button>
                      </div>
                    </>
                  )}

                  {booking.status === 'pending' && (
                    <Button
                      onClick={cancelBooking}
                      variant="destructive"
                      className="w-full"
                    >
                      Batalkan Pesanan
                    </Button>
                  )}
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>• Pembayaran aman melalui Xendit</p>
                  <p>• Cicilan tersedia dengan pembayaran 50% di awal</p>
                  <p>• Link pembayaran berlaku selama 24 jam</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ModernLayout>
  );
};

export default SelfPhotoCheckoutPage;
