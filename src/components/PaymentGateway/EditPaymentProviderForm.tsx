
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

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

interface EditPaymentProviderFormProps {
  provider: PaymentProvider;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditPaymentProviderForm = ({ provider, open, onOpenChange, onSuccess }: EditPaymentProviderFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    client_id: '',
    client_secret: '',
    server_key: '',
    environment: 'sandbox' as 'sandbox' | 'production',
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => {
    if (provider) {
      console.log('Setting form data for provider:', provider);
      setFormData({
        name: provider.name || '',
        client_id: provider.client_id || '',
        client_secret: provider.client_secret || '',
        server_key: provider.server_key || '',
        environment: provider.environment || 'sandbox',
        status: provider.status || 'active'
      });
    }
  }, [provider]);

  const updateProviderMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      console.log('Updating payment provider:', provider.id, data);
      
      // Validate required fields
      if (!data.name.trim()) {
        throw new Error('Nama provider harus diisi');
      }

      const { error } = await supabase
        .from('payment_providers')
        .update({
          name: data.name.trim(),
          client_id: data.client_id.trim() || null,
          client_secret: data.client_secret.trim() || null,
          server_key: data.server_key.trim() || null,
          environment: data.environment,
          status: data.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', provider.id);

      if (error) {
        console.error('Update error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Payment provider berhasil diperbarui');
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Error updating payment provider:', error);
      toast.error('Gagal memperbarui payment provider: ' + error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateProviderMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Payment Provider</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Provider *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Midtrans, Xendit, dll"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="environment">Environment</Label>
              <Select
                value={formData.environment}
                onValueChange={(value: 'sandbox' | 'production') => 
                  setFormData({ ...formData, environment: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive') => 
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_id">Client ID</Label>
            <Input
              id="client_id"
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              placeholder="Client ID (opsional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_secret">Client Secret</Label>
            <Input
              id="client_secret"
              type="password"
              value={formData.client_secret}
              onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })}
              placeholder="Client Secret (opsional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="server_key">Server Key</Label>
            <Input
              id="server_key"
              type="password"
              value={formData.server_key}
              onChange={(e) => setFormData({ ...formData, server_key: e.target.value })}
              placeholder="Server Key (opsional)"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={updateProviderMutation.isPending}
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={updateProviderMutation.isPending}
            >
              {updateProviderMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
