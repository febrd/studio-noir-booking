
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Settings, Eye, EyeOff } from 'lucide-react';
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AddPaymentProviderForm } from '@/components/PaymentGateway/AddPaymentProviderForm';

const PaymentProviders = () => {
  const { userProfile } = useJWTAuth();
  const [showSecrets, setShowSecrets] = useState<{[key: string]: boolean}>({});

  const { data: providers, isLoading, refetch } = useQuery({
    queryKey: ['payment-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_providers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const toggleSecretVisibility = (providerId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }));
  };

  const maskSecret = (secret: string | null) => {
    if (!secret) return 'Tidak diset';
    return secret.replace(/./g, '*');
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus provider ini?')) {
      try {
        const { error } = await supabase
          .from('payment_providers')
          .delete()
          .eq('id', providerId);

        if (error) throw error;

        toast.success('Provider berhasil dihapus');
        refetch();
      } catch (error) {
        console.error('Error deleting provider:', error);
        toast.error('Gagal menghapus provider');
      }
    }
  };

  // Check if current user can manage payment providers
  const canManageProviders = userProfile?.role && ['owner', 'admin', 'keuangan'].includes(userProfile.role);

  if (!canManageProviders) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Akses Ditolak</h2>
          <p className="text-muted-foreground">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payment Providers</h2>
          <p className="text-muted-foreground">
            Kelola penyedia layanan pembayaran
          </p>
        </div>
        
        <AddPaymentProviderForm onSuccess={refetch} />
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <p>Memuat provider...</p>
            </CardContent>
          </Card>
        ) : providers && providers.length > 0 ? (
          providers.map((provider) => (
            <Card key={provider.id} className="glass-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      {provider.name}
                    </CardTitle>
                    <CardDescription>
                      Environment: {provider.environment} | Status: {provider.status}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={provider.status === 'active' ? 'default' : 'secondary'}
                      className={provider.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {provider.status}
                    </Badge>
                    <Badge variant="outline">
                      {provider.environment}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {provider.client_id && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-muted-foreground">Client ID</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSecretVisibility(`${provider.id}-client`)}
                        >
                          {showSecrets[`${provider.id}-client`] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                      </div>
                      <p className="font-mono text-xs bg-muted p-2 rounded">
                        {showSecrets[`${provider.id}-client`] ? provider.client_id : maskSecret(provider.client_id)}
                      </p>
                    </div>
                  )}
                  
                  {provider.client_secret && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-muted-foreground">Client Secret</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSecretVisibility(`${provider.id}-secret`)}
                        >
                          {showSecrets[`${provider.id}-secret`] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                      </div>
                      <p className="font-mono text-xs bg-muted p-2 rounded">
                        {showSecrets[`${provider.id}-secret`] ? provider.client_secret : maskSecret(provider.client_secret)}
                      </p>
                    </div>
                  )}
                  
                  {provider.server_key && (
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-muted-foreground">Server Key</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSecretVisibility(`${provider.id}-server`)}
                        >
                          {showSecrets[`${provider.id}-server`] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                      </div>
                      <p className="font-mono text-xs bg-muted p-2 rounded">
                        {showSecrets[`${provider.id}-server`] ? provider.server_key : maskSecret(provider.server_key)}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteProvider(provider.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Hapus
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">Belum ada payment provider yang dikonfigurasi</p>
              <AddPaymentProviderForm onSuccess={refetch} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PaymentProviders;
