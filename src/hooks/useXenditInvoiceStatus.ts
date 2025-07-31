
import { useState, useEffect } from 'react';
import { useInvoiceAPI } from '@/hooks/useInvoiceAPI';

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

  const checkInvoice = async () => {
    if (!bookingId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Checking Xendit invoice status for booking:', bookingId);
      
      const result = await getInvoice({
        performed_by: 'system-check',
        external_id: bookingId
      });

      if (result.success && result.data) {
        console.log('📊 Xendit invoice data:', result.data);
        setStatus(result.data.status);
        setInvoiceUrl(result.data.invoice_url);
        setPaidAmount(result.data.paid_amount || result.data.amount);
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
    if (shouldCheck && bookingId) {
      checkInvoice();
    }
  }, [bookingId, shouldCheck]);

  return {
    status,
    invoice_url: invoiceUrl,
    paid_amount: paidAmount,
    loading,
    error,
    checkInvoice
  };
};
