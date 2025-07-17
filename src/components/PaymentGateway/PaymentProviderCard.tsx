
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, Settings } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface PaymentProviderCardProps {
  provider: PaymentProvider;
  onEdit: (provider: PaymentProvider) => void;
  onDelete: (id: string) => void;
}

export const PaymentProviderCard = ({
  provider,
  onEdit,
  onDelete,
}: PaymentProviderCardProps) => {
  const [isActive, setIsActive] = useState(provider.status === 'active');
  const queryClient = useQueryClient();

  const toggleStatusMutation = useMutation({
    mutationFn: async (newStatus: 'active' | 'inactive') => {
      console.log('Toggling provider status:', provider.id, newStatus);
      const { error } = await supabase
        .from('payment_providers')
        .update({ status: newStatus })
        .eq('id', provider.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status provider berhasil diubah');
      queryClient.invalidateQueries({ queryKey: ['payment-providers'] });
    },
    onError: (error: any) => {
      console.error('Error toggling provider status:', error);
      toast.error('Gagal mengubah status provider: ' + error.message);
      setIsActive(provider.status === 'active'); // Reset switch
    },
  });

  const handleToggle = (checked: boolean) => {
    setIsActive(checked);
    const newStatus = checked ? 'active' : 'inactive';
    toggleStatusMutation.mutate(newStatus);
  };

  const handleDelete = () => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus provider "${provider.name}"?`)) {
      onDelete(provider.id);
    }
  };

  return (
    <Card className="glass-card hover-lift">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-elegant">{provider.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant={provider.environment === 'production' ? 'default' : 'secondary'}
            >
              {provider.environment}
            </Badge>
            <Switch
              checked={isActive}
              onCheckedChange={handleToggle}
              disabled={toggleStatusMutation.isPending}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {provider.client_id && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Client ID:</span>
              <span className="font-mono text-xs">
                {provider.client_id.substring(0, 8)}...
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Created:</span>
            <span>{new Date(provider.created_at).toLocaleDateString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(provider)}
            className="flex-1 hover-scale"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hover-scale"
            onClick={() => toast.info('Fitur konfigurasi akan datang')}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive hover-scale"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
