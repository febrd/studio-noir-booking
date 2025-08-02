import { useState, useEffect } from 'react';
import { useInvoiceAPI } from '@/hooks/useInvoiceAPI';
import { useJWTAuth } from '@/hooks/useJWTAuth';

interface XenditInvoiceStatus {
  id: string | null;
  status: string | null;
  invoice_url: string | null;
  paid_amount: number | null;
  loading: boolean;
  error: string | null;
  checkInvoice: () => void;
}

export const useXenditInvoiceStatus = (
  bookingId: string,
  shouldCheck: boolean = false
): XenditInvoiceStatus => {
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
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

      const result = await getInvoice({
        performed_by: userProfile.id,
        external_id: bookingId
      });

      if (result.success && result.data) {
        const invoice = result.data.invoice;

        setInvoiceId(invoice.id || null);
        setStatus(invoice.status);
        setInvoiceUrl(invoice.invoice_url);
        setPaidAmount(invoice.amount || null);
      } else {
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
    id: invoiceId,
    status,
    invoice_url: invoiceUrl,
    paid_amount: paidAmount,
    loading,
    error,
    checkInvoice
  };
};
