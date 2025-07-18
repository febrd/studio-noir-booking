
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CreditCard, Plus, Calendar } from 'lucide-react';

interface InstallmentManagerProps {
  bookingId: string;
  totalAmount: number;
  currentStatus: string;
  onSuccess?: () => void;
}

const InstallmentManager = ({ bookingId, totalAmount, currentStatus, onSuccess }: InstallmentManagerProps) => {
  const [newInstallment, setNewInstallment] = useState({
    amount: '',
    note: ''
  });
  const queryClient = useQueryClient();

  // Fetch installments for this booking
  const { data: installments, isLoading } = useQuery({
    queryKey: ['installments', bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('installments')
        .select('*')
        .eq('booking_id', bookingId)
        .order('paid_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Add installment mutation
  const addInstallmentMutation = useMutation({
    mutationFn: async (installmentData: { amount: number; note: string }) => {
      const { data, error } = await supabase
        .from('installments')
        .insert([{
          booking_id: bookingId,
          amount: installmentData.amount,
          note: installmentData.note
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Cicilan berhasil ditambahkan');
      setNewInstallment({ amount: '', note: '' });
      queryClient.invalidateQueries({ queryKey: ['installments', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error adding installment:', error);
      toast.error('Gagal menambahkan cicilan');
    }
  });

  const totalPaid = installments?.reduce((sum, installment) => sum + Number(installment.amount), 0) || 0;
  const remainingAmount = totalAmount - totalPaid;
  const isFullyPaid = remainingAmount <= 0;

  const handleAddInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(newInstallment.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Masukkan nominal yang valid');
      return;
    }
    
    if (amount > remainingAmount) {
      toast.error('Nominal melebihi sisa tagihan');
      return;
    }
    
    addInstallmentMutation.mutate({
      amount,
      note: newInstallment.note
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'installment': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div>Loading installments...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Ringkasan Pembayaran
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Total Tagihan:</span>
            <span className="font-semibold">{formatPrice(totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Dibayar:</span>
            <span className="font-semibold text-green-600">{formatPrice(totalPaid)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span>Sisa Tagihan:</span>
            <span className={`font-bold ${isFullyPaid ? 'text-green-600' : 'text-red-600'}`}>
              {formatPrice(remainingAmount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <Badge className={getStatusColor(currentStatus)}>
              {currentStatus.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Add New Installment */}
      {!isFullyPaid && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Tambah Cicilan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddInstallment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Nominal Cicilan *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  max={remainingAmount}
                  value={newInstallment.amount}
                  onChange={(e) => setNewInstallment(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder={`Maksimal: ${formatPrice(remainingAmount)}`}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="note">Catatan (opsional)</Label>
                <Textarea
                  id="note"
                  value={newInstallment.note}
                  onChange={(e) => setNewInstallment(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Catatan pembayaran..."
                  rows={3}
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={addInstallmentMutation.isPending}
                className="w-full"
              >
                {addInstallmentMutation.isPending ? 'Menyimpan...' : 'Tambah Cicilan'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Installment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Riwayat Cicilan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {installments && installments.length > 0 ? (
            <div className="space-y-3">
              {installments.map((installment) => (
                <div key={installment.id} className="flex justify-between items-start p-3 border rounded-lg">
                  <div>
                    <div className="font-semibold">{formatPrice(installment.amount)}</div>
                    <div className="text-sm text-gray-600">
                      {formatDateTime(installment.paid_at)}
                    </div>
                    {installment.note && (
                      <div className="text-sm text-gray-500 mt-1">
                        {installment.note}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    Lunas
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada riwayat cicilan</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallmentManager;
