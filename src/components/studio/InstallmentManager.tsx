
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CreditCard, Plus, Calendar, User } from 'lucide-react';
import { useJWTAuth } from '@/hooks/useJWTAuth';

interface InstallmentManagerProps {
  bookingId: string;
  totalAmount: number;
  currentStatus: string;
  onSuccess?: () => void;
}

const InstallmentManager = ({ bookingId, totalAmount, currentStatus, onSuccess }: InstallmentManagerProps) => {
  const [newInstallment, setNewInstallment] = useState({
    amount: '',
    note: '',
    payment_method: 'offline'
  });
  const { userProfile } = useJWTAuth();

  const queryClient = useQueryClient();

  // Get current user for tracking
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch installments for this booking with enhanced data
  const { data: installments, isLoading } = useQuery({
    queryKey: ['installments', bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('installments')
        .select(`
          *,
          users:performed_by(name, email)
        `)
        .eq('booking_id', bookingId)
        .order('paid_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Add installment mutation with enhanced tracking
  const addInstallmentMutation = useMutation({
    mutationFn: async (installmentData: { amount: number; note: string; payment_method: string }) => {
      if (!userProfile?.id) {
        throw new Error('User not authenticated');
      }
      const { data: previousInstallments } = await supabase
      .from('installments')
      .select('installment_number')
      .eq('booking_id', bookingId);

      const nextNumber = (previousInstallments?.length || 0) + 1;
      const { data, error } = await supabase
        .from('installments')
        .insert([{
          booking_id: bookingId,
          amount: installmentData.amount,
          note: installmentData.note,
          payment_method: installmentData.payment_method,
          performed_by: userProfile.id,
          installment_number: nextNumber
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Cicilan berhasil ditambahkan');
      setNewInstallment({ amount: '', note: '', payment_method: 'offline' });
      queryClient.invalidateQueries({ queryKey: ['installments', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings-enhanced'] });
      queryClient.invalidateQueries({ queryKey: ['installment-summary'] });
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
      note: newInstallment.note,
      payment_method: newInstallment.payment_method
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

  const getPaymentMethodBadge = (method: string) => {
    const colors = {
      offline: 'bg-gray-100 text-gray-800',
      online: 'bg-blue-100 text-blue-800',
      transfer: 'bg-green-100 text-green-800',
      cash: 'bg-yellow-100 text-yellow-800'
    };
    return colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return <div>Loading installments...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Payment Summary */}
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
          <div className="flex justify-between">
            <span>Jumlah Cicilan:</span>
            <span className="font-medium">{installments?.length || 0}x pembayaran</span>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Add New Installment */}
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
                <Label htmlFor="payment_method">Metode Pembayaran *</Label>
                <Select 
                  value={newInstallment.payment_method} 
                  onValueChange={(value) => setNewInstallment(prev => ({ ...prev, payment_method: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih metode pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offline">Offline/Tunai</SelectItem>
                    <SelectItem value="transfer">Transfer Bank</SelectItem>
                    <SelectItem value="online">Online Payment</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
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

      {/* Enhanced Installment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Riwayat Cicilan ({installments?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {installments && installments.length > 0 ? (
            <div className="space-y-3">
              {installments.map((installment) => (
                <div key={installment.id} className="flex justify-between items-start p-4 border rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-lg">{formatPrice(installment.amount)}</span>
                      <Badge className={getPaymentMethodBadge(installment.payment_method)}>
                        {installment.payment_method}
                      </Badge>
                      {installment.installment_number && (
                        <Badge variant="outline">
                          Cicilan #{installment.installment_number}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDateTime(installment.paid_at)}</span>
                      </div>
                      {installment.users && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>Dicatat oleh: {installment.users.name}</span>
                        </div>
                      )}
                      {installment.note && (
                        <div className="text-gray-500 mt-1 italic">
                          "{installment.note}"
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-300">
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
