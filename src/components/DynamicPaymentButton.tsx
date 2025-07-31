
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, QrCode, ExternalLink, Loader2 } from 'lucide-react';
import { useXenditInvoiceStatus } from '@/hooks/useXenditInvoiceStatus';
import QRISPaymentDialog from '@/components/QRISPaymentDialog';
import { toast } from 'sonner';

interface DynamicPaymentButtonProps {
  booking: any;
  qrisImageUrl: string;
  onPaymentUpdate?: () => void;
}

const DynamicPaymentButton = ({ booking, qrisImageUrl, onPaymentUpdate }: DynamicPaymentButtonProps) => {
  const [showQRIS, setShowQRIS] = useState(false);
  const shouldCheckXendit = booking.payment_method === 'online' && 
                           (booking.status === 'pending' || booking.status === 'installment');
  
  const { status: xenditStatus, invoice_url, loading, checkInvoice } = useXenditInvoiceStatus(
    booking.id, 
    shouldCheckXendit
  );

  console.log('🔄 Dynamic Payment Button:', {
    bookingId: booking.id,
    paymentMethod: booking.payment_method,
    bookingStatus: booking.status,
    xenditStatus,
    invoice_url,
    shouldCheckXendit
  });

  // Jangan tampilkan tombol jika sudah lunas
  if (booking.status === 'paid' || booking.status === 'completed') {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-300">
        Lunas
      </Badge>
    );
  }

  // Jika cicilan 50% dan sudah dibayar, sembunyikan tombol
  if (booking.status === 'installment' && xenditStatus === 'SETTLED') {
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-300">
        Cicilan - Bayar Sisanya di Lokasi
      </Badge>
    );
  }

  const handlePayment = async () => {
    // Jika payment method online, cek status terbaru dulu
    if (booking.payment_method === 'online') {
      await checkInvoice();
      
      // Jika sudah settled, refresh halaman
      if (xenditStatus === 'SETTLED') {
        toast.success('Pembayaran sudah berhasil!');
        onPaymentUpdate?.();
        return;
      }
      
      // Jika ada invoice_url, buka di tab baru
      if (invoice_url) {
        window.open(invoice_url, '_blank');
        return;
      }
    }
    
    // Jika offline/manual, tampilkan QRIS
    setShowQRIS(true);
  };

  const getButtonContent = () => {
    if (loading) {
      return (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Mengecek Status...
        </>
      );
    }

    if (booking.payment_method === 'online') {
      if (xenditStatus === 'SETTLED') {
        return (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Sudah Dibayar
          </>
        );
      } else if (xenditStatus === 'EXPIRED') {
        return (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Link Expired - Hubungi Admin
          </>
        );
      } else if (invoice_url) {
        return (
          <>
            <ExternalLink className="w-4 h-4 mr-2" />
            Lanjutkan Pembayaran
          </>
        );
      } else {
        return (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Cek Pembayaran
          </>
        );
      }
    } else {
      return (
        <>
          <QrCode className="w-4 h-4 mr-2" />
          Bayar Manual
        </>
      );
    }
  };

  const isDisabled = loading || 
                    (booking.payment_method === 'online' && xenditStatus === 'SETTLED') ||
                    (booking.payment_method === 'online' && xenditStatus === 'EXPIRED');

  return (
    <>
      <Button
        onClick={handlePayment}
        disabled={isDisabled}
        className={`
          ${booking.payment_method === 'online' 
            ? 'bg-blue-600 hover:bg-blue-700' 
            : 'bg-green-600 hover:bg-green-700'
          } 
          text-white font-peace-sans font-bold
          ${xenditStatus === 'SETTLED' ? 'opacity-50 cursor-not-allowed' : ''}
          ${xenditStatus === 'EXPIRED' ? 'bg-red-600 hover:bg-red-700' : ''}
        `}
      >
        {getButtonContent()}
      </Button>

      {/* QRIS Dialog untuk pembayaran manual */}
      {showQRIS && (
        <QRISPaymentDialog
          isOpen={showQRIS}
          onClose={() => setShowQRIS(false)}
          qrisImageUrl={qrisImageUrl}
          booking={booking}
        />
      )}
    </>
  );
};

export default DynamicPaymentButton;
