import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface InstallmentManagerProps {
  bookingId: string;
  totalAmount: number;
  currentStatus: string;
  onSuccess?: (bookingId: string, amount: number, paymentMethod: string) => void;
}

const InstallmentManager = ({ bookingId, totalAmount, currentStatus, onSuccess }: InstallmentManagerProps) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('offline');
  const [note, setNote] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      } else {
        // Fallback: try to get from users table (for non-auth users)
        const { data: users } = await supabase
          .from('users')
          .select('id')
          .limit(1);
        
        if (users && users.length > 0) {
          setCurrentUserId(users[0].id);
        }
      }
    };
    
    getCurrentUser();
  }, []);

  const { data: installments, isLoading, error } = useQuery({
    queryKey: ['installments', bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('installments')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const { data: bookingSummary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['booking-summary', bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('total_amount')
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!bookingId
  });

  const totalPaid = installments?.reduce((sum, inst) => sum + (inst.amount || 0), 0) || 0;
  const remainingAmount = (bookingSummary?.total_amount || totalAmount) - totalPaid;

  const deleteInstallmentMutation = useMutation({
    mutationFn: async (installmentId: string) => {
      const { error } = await supabase
        .from('installments')
        .delete()
        .eq('id', installmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installments', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['booking-summary', bookingId] });
      toast.success('Cicilan berhasil dihapus');
    },
    onError: (error: any) => {
      console.error('Error deleting installment:', error);
      toast.error('Gagal menghapus cicilan');
    }
  });

  const addInstallmentMutation = useMutation({
    mutationFn: async (installmentData: any) => {
      console.log('Adding installment with data:', installmentData);
      
      // First, insert the installment
      const { data: installmentResult, error: installmentError } = await supabase
        .from('installments')
        .insert({
          booking_id: bookingId,
          amount: parseFloat(installmentData.amount),
          payment_method: installmentData.paymentMethod,
          note: installmentData.note || null,
          performed_by: currentUserId
        })
        .select()
        .single();

      if (installmentError) {
        console.error('Error inserting installment:', installmentError);
        throw installmentError;
      }

      // Then, create a transaction record based on payment method
      const transactionData = {
        booking_id: bookingId,
        amount: parseFloat(installmentData.amount),
        payment_type: installmentData.paymentMethod as 'offline' | 'online' | 'installment',
        status: 'paid' as const,
        description: `Pembayaran cicilan - ${installmentData.note || 'Cicilan'}`,
        performed_by: currentUserId,
        type: 'installment'
      };

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert(transactionData);

      if (transactionError) {
        console.error('Error creating transaction record:', transactionError);
        // Don't throw error here as installment was already created successfully
        // Just log the error
      }

      return installmentResult;
    },
    onSuccess: (data) => {
      console.log('Installment added successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['installments', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['booking-summary', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['offline-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['online-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      // Call the parent success handler with the required parameters
      if (onSuccess) {
        onSuccess(bookingId, parseFloat(amount), paymentMethod);
      }
      
      toast.success('Cicilan berhasil ditambahkan dan masuk ke laporan transaksi');
      setAmount('');
      setNote('');
    },
    onError: (error: any) => {
      console.error('Error adding installment:', error);
      toast.error(`Gagal menambahkan cicilan: ${error.message || 'Unknown error'}`);
    }
  });

  const handleDeleteInstallment = async (installmentId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus cicilan ini?')) {
      await deleteInstallmentMutation.mutate(installmentId);
    }
  };

  const handleAddInstallment = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Masukkan jumlah pembayaran yang valid');
      return;
    }

    if (!currentUserId) {
      toast.error('Tidak dapat menentukan pengguna yang sedang login');
      return;
    }

    const installmentAmount = parseFloat(amount);
    if (installmentAmount > remainingAmount) {
      toast.error(`Jumlah tidak boleh melebihi sisa pembayaran (Rp ${remainingAmount.toLocaleString('id-ID')})`);
      return;
    }

    console.log('Adding installment with user ID:', currentUserId);
    
    addInstallmentMutation.mutate({
      amount,
      paymentMethod,
      note
    });
  };

  return (
    <div className="space-y-6">
      {/* Booking Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Informasi Booking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-xs">Total Tagihan</Label>
              <p className="font-medium">Rp {totalAmount.toLocaleString('id-ID')}</p>
            </div>
            <div>
              <Label className="text-xs">Total Dibayar</Label>
              <p className="font-medium">Rp {totalPaid.toLocaleString('id-ID')}</p>
            </div>
            <div>
              <Label className="text-xs">Sisa Tagihan</Label>
              <p className="font-medium">Rp {remainingAmount.toLocaleString('id-ID')}</p>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Badge variant="secondary">{currentStatus}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Installment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Tambah Pembayaran Cicilan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah Pembayaran</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Masukkan jumlah"
                min="0"
                max={remainingAmount}
              />
              <p className="text-sm text-muted-foreground">
                Maksimal: Rp {remainingAmount.toLocaleString('id-ID')}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment-method">Metode Pembayaran</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="note">Catatan (Opsional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tambahkan catatan pembayaran..."
              rows={2}
            />
          </div>
          
          <Button 
            onClick={handleAddInstallment}
            disabled={addInstallmentMutation.isPending || !amount || !currentUserId}
            className="w-full"
          >
            {addInstallmentMutation.isPending ? 'Menambahkan...' : 'Tambah Pembayaran'}
          </Button>
          
          {!currentUserId && (
            <p className="text-sm text-red-500">
              Tidak dapat menentukan pengguna yang sedang login
            </p>
          )}
        </CardContent>
      </Card>

      {/* Installments History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Riwayat Pembayaran
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading installments...</p>
          ) : error ? (
            <p className="text-red-500">Error: {error.message}</p>
          ) : (
            <div className="space-y-3">
              {installments && installments.length > 0 ? (
                installments.map((installment) => (
                  <div key={installment.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">
                          Rp {installment.amount.toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(installment.created_at), 'dd MMMM yyyy, HH:mm')}
                        </p>
                        {installment.note && (
                          <p className="text-xs text-gray-500 mt-1">
                            Catatan: {installment.note}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{installment.payment_method}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteInstallment(installment.id)}
                          disabled={deleteInstallmentMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p>Belum ada cicilan</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallmentManager;
