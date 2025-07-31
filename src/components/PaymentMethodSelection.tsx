
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreditCard, QrCode, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useInvoiceAPI } from '@/hooks/useInvoiceAPI';
import { supabase } from '@/integrations/supabase/client';

interface PaymentMethodSelectionProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  totalAmount: number;
  customerName: string;
  studioName: string;
  packageTitle: string;
  additionalServices: string[];
  onPaymentSuccess: () => void;
}

const PaymentMethodSelection = ({
  isOpen,
  onClose,
  booking,
  totalAmount,
  customerName,
  studioName,
  packageTitle,
  additionalServices,
  onPaymentSuccess
}: PaymentMethodSelectionProps) => {
  const [paymentType, setPaymentType] = useState<'manual' | 'auto'>('manual');
  const [autoPaymentOption, setAutoPaymentOption] = useState<'50' | '100'>('100');
  const [processing, setProcessing] = useState(false);
  const { createInvoice } = useInvoiceAPI();

  if (!isOpen) return null;

  const handleManualPayment = async () => {
    try {
      setProcessing(true);
      
      // Keep booking status as pending for manual payment
      await supabase
        .from('bookings')
        .update({ 
          payment_method: 'offline'
        })
        .eq('id', booking.id);

      toast.success('Pesanan berhasil dibuat! Silakan lakukan pembayaran manual.');
      onPaymentSuccess();
      onClose();
    } catch (error) {
      console.error('Error processing manual payment:', error);
      toast.error('Gagal memproses pembayaran manual');
    } finally {
      setProcessing(false);
    }
  };

  const handleAutoPayment = async () => {
    try {
      setProcessing(true);
      
      const isInstallment = autoPaymentOption === '50';
      const invoiceAmount = isInstallment ? totalAmount * 0.5 : totalAmount;
      
      // Use booking ID as external_id
      const externalId = booking.id;
      
      // Get customer email from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', booking.user_id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        toast.error('Gagal mengambil data pengguna');
        return;
      }

      const customerEmail = userData?.email || 'customer@example.com';
      
      // Create description
      let description = `${packageTitle}`;
      if (additionalServices.length > 0) {
        description += ` | Layanan tambahan: ${additionalServices.join(', ')}`;
      }
      
      // Create invoice
      const invoiceResult = await createInvoice({
        performed_by: booking.user_id,
        external_id: externalId,
        amount: invoiceAmount,
        description: description,
        customer: {
          given_names: customerName.split(' ')[0] || customerName,
          surname: customerName.split(' ').slice(1).join(' ') || '',
          email: customerEmail,
          mobile_number: customerEmail // Leave phone number empty as requested
        },
        currency: 'IDR',
        invoice_duration: 86400 // 24 hours
      });

      if (invoiceResult.success && invoiceResult.data?.invoice?.invoice_url) {
        // Update booking status, payment method, and save payment link
        const newStatus = isInstallment ? 'installment' : 'pending';
        
        await supabase
          .from('bookings')
          .update({ 
            payment_method: 'online',
            payment_link: invoiceResult.data.invoice.invoice_url
          })
          .eq('id', booking.id);

        // If installment, create installment record
        if (isInstallment) {
          await supabase
            .from('installments')
            .insert({
              booking_id: booking.id,
              amount: invoiceAmount,
              installment_number: 1,
              payment_method: 'online',
              performed_by: booking.user_id,
              note: 'Cicilan pertama (50%)'
            });
        }

        // Create transaction record
        await supabase
          .from('transactions')
          .insert({
            booking_id: booking.id,
            amount: invoiceAmount,
            type: 'online',
            description: description,
            performed_by: booking.user_id,
            payment_type: isInstallment ? 'installment' : 'online',
            status: 'pending' // Will be updated via status checker later
          });

        toast.success('Invoice berhasil dibuat! Anda akan diarahkan ke halaman pembayaran.');
        
        // Redirect to Xendit checkout
        window.open(invoiceResult.data.invoice.invoice_url, '_blank');
        
        onPaymentSuccess();
        onClose();
      } else {
        throw new Error(invoiceResult.error || 'Gagal membuat invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Kami tidak dapat memproses invoice, coba lagi nanti atau pilih pembayaran manual.');
      
      // Fallback to manual payment
      setPaymentType('manual');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = () => {
    if (paymentType === 'manual') {
      handleManualPayment();
    } else {
      handleAutoPayment();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-peace-sans font-black">
            Pilih Metode Pembayaran
          </CardTitle>
          <p className="text-sm text-gray-600">
            Total: {totalAmount.toLocaleString('id-ID', { 
              style: 'currency', 
              currency: 'IDR', 
              minimumFractionDigits: 0 
            })}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Type Selection */}
          <RadioGroup value={paymentType} onValueChange={(value) => setPaymentType(value as 'manual' | 'auto')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="manual" id="manual" />
              <Label htmlFor="manual" className="flex items-center gap-2 cursor-pointer">
                <QrCode className="w-4 h-4" />
                <span>Manual (QR Code + WhatsApp)</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="auto" id="auto" />
              <Label htmlFor="auto" className="flex items-center gap-2 cursor-pointer">
                <CreditCard className="w-4 h-4" />
                <span>Otomatis (Online Payment)</span>
              </Label>
            </div>
          </RadioGroup>

          {/* Auto Payment Options */}
          {paymentType === 'auto' && (
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3">Pilih Jumlah Pembayaran</h4>
                <RadioGroup value={autoPaymentOption} onValueChange={(value) => setAutoPaymentOption(value as '50' | '100')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="50" id="installment" />
                      <Label htmlFor="installment" className="flex items-center gap-2 cursor-pointer">
                        <Wallet className="w-4 h-4" />
                        <span>50% (Cicilan)</span>
                      </Label>
                    </div>
                    <span className="text-sm font-semibold">
                      {(totalAmount * 0.5).toLocaleString('id-ID', { 
                        style: 'currency', 
                        currency: 'IDR', 
                        minimumFractionDigits: 0 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="100" id="fullpay" />
                      <Label htmlFor="fullpay" className="flex items-center gap-2 cursor-pointer">
                        <CreditCard className="w-4 h-4" />
                        <span>100% (Lunas)</span>
                      </Label>
                    </div>
                    <span className="text-sm font-semibold">
                      {totalAmount.toLocaleString('id-ID', { 
                        style: 'currency', 
                        currency: 'IDR', 
                        minimumFractionDigits: 0 
                      })}
                    </span>
                  </div>
                </RadioGroup>
                
                {autoPaymentOption === '50' && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700">
                      <strong>Catatan:</strong> Dengan memilih cicilan, Anda tidak dapat membatalkan pesanan. 
                      Sisa pembayaran dapat dilakukan melalui halaman riwayat pesanan.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={processing}
              className="flex-1"
            >
              Batal
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={processing}
              className="flex-1 bg-black text-white hover:bg-gray-800"
            >
              {processing ? 'Memproses...' : 'Konfirmasi'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentMethodSelection;
