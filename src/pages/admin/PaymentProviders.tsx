
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, CreditCard, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { AddPaymentProviderForm } from '@/components/PaymentGateway/AddPaymentProviderForm';
import { PaymentProviderCard } from '@/components/PaymentGateway/PaymentProviderCard';

const PaymentProviders = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [paymentProviderToEdit, setPaymentProviderToEdit] = useState(null);
  const queryClient = useQueryClient();

  const { data: paymentProviders, isLoading } = useQuery({
    queryKey: ['paymentProviders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_providers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createPaymentProviderMutation = useMutation({
    mutationFn: async (newProviderData: any) => {
      const { data, error } = await supabase
        .from('payment_providers')
        .insert([newProviderData]);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentProviders'] });
      toast.success('Payment provider berhasil ditambahkan!');
    },
    onError: (error) => {
      console.error('Error creating payment provider:', error);
      toast.error('Gagal menambahkan payment provider.');
    },
  });

  const updatePaymentProviderMutation = useMutation({
    mutationFn: async ({ id, updatedProviderData }: { id: string; updatedProviderData: any }) => {
      const { data, error } = await supabase
        .from('payment_providers')
        .update(updatedProviderData)
        .eq('id', id);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentProviders'] });
      toast.success('Payment provider berhasil diperbarui!');
      setPaymentProviderToEdit(null);
    },
    onError: (error) => {
      console.error('Error updating payment provider:', error);
      toast.error('Gagal memperbarui payment provider.');
    },
  });

  const deletePaymentProviderMutation = useMutation({
    mutationFn: async (providerId: string) => {
      const { error } = await supabase
        .from('payment_providers')
        .delete()
        .eq('id', providerId);

      if (error) throw error;
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentProviders'] });
      toast.success('Payment provider berhasil dihapus!');
    },
    onError: (error) => {
      console.error('Error deleting payment provider:', error);
      toast.error('Gagal menghapus payment provider.');
    },
  });

  const handleCreatePaymentProvider = async (newProviderData: any) => {
    await createPaymentProviderMutation.mutateAsync(newProviderData);
  };

  const handleUpdatePaymentProvider = async (id: string, updatedProviderData: any) => {
    await updatePaymentProviderMutation.mutateAsync({ id, updatedProviderData });
  };

  const handleDeletePaymentProvider = async (providerId: string) => {
    await deletePaymentProviderMutation.mutateAsync(providerId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading payment providers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Providers</h1>
          <p className="text-gray-600">Kelola metode pembayaran dan gateway</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Provider
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Payment Provider</DialogTitle>
            </DialogHeader>
            <AddPaymentProviderForm onSuccess={() => {
              setIsCreateDialogOpen(false);
              queryClient.invalidateQueries({ queryKey: ['paymentProviders'] });
            }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {paymentProviders?.map((provider) => (
          <PaymentProviderCard
            key={provider.id}
            provider={provider}
            onEdit={() => setPaymentProviderToEdit(provider)}
            onDelete={handleDeletePaymentProvider}
          />
        ))}
      </div>

      {paymentProviderToEdit && (
        <Dialog open={!!paymentProviderToEdit} onOpenChange={() => setPaymentProviderToEdit(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Payment Provider</DialogTitle>
            </DialogHeader>
            <AddPaymentProviderForm
              provider={paymentProviderToEdit}
              onSuccess={() => {
                setPaymentProviderToEdit(null);
                queryClient.invalidateQueries({ queryKey: ['paymentProviders'] });
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PaymentProviders;
