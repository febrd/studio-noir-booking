
import { useState, useEffect } from 'react';
import { useInvoiceAPI } from '@/hooks/useInvoiceAPI';
import { useJWTAuth } from '@/hooks/useJWTAuth';

interface XenditInvoiceStatus {
  status: string | null;
  invoice_url: string | null;
  paid_amount: number | null;
  loading: boolean;
  error: string | null;
  checkInvoice: () => void;
}

export const useXenditInvoiceStatus = (bookingId: string, shouldCheck: boolean = false): XenditInvoiceStatus => {
  const [status, setStatus] = useState<string | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [paidAmount, setPaidAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getInvoice } = useInvoiceAPI();
  const { userProfile } = useJWTAuth();

  const checkInvoice = async () => {
    if (!bookingId || !userProfile?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Checking Xendit invoice status for booking:', bookingId);
      
      const result = await getInvoice({
        performed_by: userProfile.id, // Use actual user UUID instead of "system-check"
        external_id: bookingId
      });

      if (result.success && result.data) {
        console.log('📊 Xendit invoice data:', result.data);
        console.log('📊 Xendit URL invoice data:', result.data.invoice.invoice_url);
        console.log('📊 Xendit STATUS invoice:', result.data.invoice.status);
        console.log('📊 Xendit AMOUNT invoice:', result.data.invoice.amount);

        setStatus(result.data.invoice.status);
        setInvoiceUrl(result.data.invoice.invoice_url);
        setPaidAmount(result.data.invoice.amount || result.data.invoice.amount);
      } else {
        console.log('❌ Failed to get invoice status:', result.error);
        setError(result.error || 'Gagal mengecek status pembayaran');
      }
    } catch (err) {
      console.error('💥 Error checking invoice status:', err);
      setError('Terjadi kesalahan saat mengecek status pembayaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shouldCheck && bookingId && userProfile?.id) {
      checkInvoice();
    }
  }, [bookingId, shouldCheck, userProfile?.id]);

  return {
    status,
    invoice_url: invoiceUrl,
    paid_amount: paidAmount,
    loading,
    error,
    checkInvoice
  };
};
