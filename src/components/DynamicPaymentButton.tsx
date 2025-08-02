
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

  // console.log('🔄 Dynamic Payment Button:', {
  //   bookingId: booking.id,
  //   paymentMethod: booking.payment_method,
  //   bookingStatus: booking.status,
  //   xenditStatus,
  //   invoice_url,
  //   bookingPaymentLink: booking.payment_link,
  //   shouldCheckXendit
  // });

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
    
    // Jika payment method online
    if (booking.payment_method === 'online') {
      
      // Cek status terbaru dulu
      await checkInvoice();
      
      // Jika sudah settled, refresh halaman
      if (xenditStatus === 'SETTLED') {
        toast.success('Pembayaran sudah berhasil!');
        onPaymentUpdate?.();
        return;
      }
      
      // Jika expired, tampilkan pesan
      if (xenditStatus === 'EXPIRED') {
        toast.error('Link pembayaran sudah expired. Silakan hubungi admin.');
        return;
      }
      
      // PRIORITAS: gunakan invoice_url dari Xendit API, jika tidak ada gunakan dari booking.payment_link
      const paymentUrl = invoice_url || booking.payment_link;
      
      // console.log('🔗 Available payment URLs:', {
      //   invoice_url_from_xendit: invoice_url,
      //   payment_link_from_db: booking.payment_link,
      //   final_url: paymentUrl
      // });
      
      if (paymentUrl) {
        window.open(paymentUrl, '_blank');
        return;
      } else {
        toast.error('Link pembayaran tidak tersedia. Silakan hubungi admin.');
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
      } else if (invoice_url || booking.payment_link) {
        return (
          <>
            <ExternalLink className="w-4 h-4 mr-2" />
            Pay Me
          </>
        );
      } else {
        return (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Pay me
          </>
        );
      }
    } else {
      // payment_method === 'offline' atau 'manual'
      return (
        <>
          <QrCode className="w-4 h-4 mr-2" />
          Paymanual
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

      {/* QRIS Dialog hanya untuk pembayaran manual/offline */}
      {showQRIS && (booking.payment_method === 'manual' || booking.payment_method === 'offline') && (
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
