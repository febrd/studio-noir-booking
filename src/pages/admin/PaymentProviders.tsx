
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ModernLayout } from '@/components/Layout/ModernLayout';
import { AddPaymentProviderForm } from '@/components/PaymentGateway/AddPaymentProviderForm';
import { EditPaymentProviderForm } from '@/components/PaymentGateway/EditPaymentProviderForm';
import { PaymentProviderCard } from '@/components/PaymentGateway/PaymentProviderCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaymentProvider {
  id: string;
  name: string;
  client_id: string | null;
  client_secret: string | null;
  server_key: string | null;
  environment: 'sandbox' | 'production';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

const PaymentProviders = () => {
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: providers, isLoading, error } = useQuery({
    queryKey: ['payment-providers'],
    queryFn: async () => {
      console.log('Fetching payment providers...');
      const { data, error } = await supabase
        .from('payment_providers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment providers:', error);
        throw error;
      }

      console.log('Fetched payment providers:', data);
      return data as PaymentProvider[];
    },
  });

  const deleteProviderMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting payment provider:', id);
      const { error } = await supabase
        .from('payment_providers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Payment provider berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['payment-providers'] });
    },
    onError: (error: any) => {
      console.error('Error deleting payment provider:', error);
      toast.error('Gagal menghapus payment provider: ' + error.message);
    },
  });

  const handleEdit = (provider: PaymentProvider) => {
    console.log('Editing provider:', provider);
    setSelectedProvider(provider);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteProviderMutation.mutate(id);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedProvider(null);
    queryClient.invalidateQueries({ queryKey: ['payment-providers'] });
  };

  const handleAddSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['payment-providers'] });
  };

  if (isLoading) {
    return (
      <ModernLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Memuat payment providers...</span>
          </div>
        </div>
      </ModernLayout>
    );
  }

  if (error) {
    return (
      <ModernLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment Gateway</h1>
            <p className="text-muted-foreground">
              Kelola provider pembayaran untuk sistem booking
            </p>
          </div>
          
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Gagal memuat data payment providers: {error instanceof Error ? error.message : 'Unknown error'}
            </AlertDescription>
          </Alert>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment Gateway</h1>
            <p className="text-muted-foreground">
              Kelola provider pembayaran untuk sistem booking
            </p>
          </div>
          
          <AddPaymentProviderForm onSuccess={handleAddSuccess} />
        </div>

        {providers && providers.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Belum ada payment provider</h3>
            <p className="text-muted-foreground mb-4">
              Tambahkan payment provider pertama Anda untuk mulai menerima pembayaran
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers?.map((provider) => (
              <PaymentProviderCard
                key={provider.id}
                provider={provider}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {selectedProvider && (
          <EditPaymentProviderForm
            provider={selectedProvider}
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            onSuccess={handleEditSuccess}
          />
        )}
      </div>
    </ModernLayout>
  );
};

export default PaymentProviders;
