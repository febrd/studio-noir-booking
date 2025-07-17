
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

interface AddPaymentProviderFormProps {
  onSuccess: () => void;
}

export const AddPaymentProviderForm = ({ onSuccess }: AddPaymentProviderFormProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    client_id: '',
    client_secret: '',
    server_key: '',
    environment: 'sandbox' as 'sandbox' | 'production',
    status: 'active' as 'active' | 'inactive'
  });

  const addProviderMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      console.log('Adding payment provider:', data);
      
      // Validate required fields
      if (!data.name.trim()) {
        throw new Error('Nama provider harus diisi');
      }

      const { data: result, error } = await supabase
        .from('payment_providers')
        .insert({
          name: data.name.trim(),
          client_id: data.client_id.trim() || null,
          client_secret: data.client_secret.trim() || null,
          server_key: data.server_key.trim() || null,
          environment: data.environment,
          status: data.status
        })
        .select()
        .single();

      console.log('Insert result:', result);
      console.log('Insert error:', error);

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success('Payment provider berhasil ditambahkan');
      setFormData({
        name: '',
        client_id: '',
        client_secret: '',
        server_key: '',
        environment: 'sandbox',
        status: 'active'
      });
      setOpen(false);
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Error adding payment provider:', error);
      toast.error('Gagal menambahkan payment provider: ' + error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    addProviderMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      client_id: '',
      client_secret: '',
      server_key: '',
      environment: 'sandbox',
      status: 'active'
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Provider
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tambah Payment Provider</DialogTitle>
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
              onClick={() => setOpen(false)}
              disabled={addProviderMutation.isPending}
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={addProviderMutation.isPending}
            >
              {addProviderMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
