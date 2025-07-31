
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
    api_key: '',
    secret_key: '',
    public_key: '',
    api_url: 'https://api.xendit.co',
    environment: 'sandbox' as 'sandbox' | 'production',
    status: 'active' as 'active' | 'inactive'
  });

  const addProviderMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      console.log('Adding Xendit payment provider:', data);
      
      // Validate required fields
      if (!data.name.trim()) {
        throw new Error('Nama provider harus diisi');
      }
      if (!data.api_key.trim()) {
        throw new Error('API Key harus diisi');
      }
      if (!data.secret_key.trim()) {
        throw new Error('Secret Key harus diisi');
      }

      const { data: result, error } = await supabase
        .from('payment_providers')
        .insert({
          name: data.name.trim(),
          api_key: data.api_key.trim(),
          secret_key: data.secret_key.trim(),
          public_key: data.public_key.trim() || null,
          api_url: data.api_url.trim(),
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
      toast.success('Xendit provider berhasil ditambahkan');
      setFormData({
        name: '',
        api_key: '',
        secret_key: '',
        public_key: '',
        api_url: 'https://api.xendit.co',
        environment: 'sandbox',
        status: 'active'
      });
      setOpen(false);
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Error adding Xendit provider:', error);
      toast.error('Gagal menambahkan Xendit provider: ' + error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    addProviderMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      api_key: '',
      secret_key: '',
      public_key: '',
      api_url: 'https://api.xendit.co',
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
          Tambah Xendit Provider
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tambah Xendit Payment Provider</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Provider *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Xendit Production, Xendit Sandbox"
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
            <Label htmlFor="api_key">API Key *</Label>
            <Input
              id="api_key"
              type="password"
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              placeholder="xnd_development_... atau xnd_production_..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secret_key">Secret Key *</Label>
            <Input
              id="secret_key"
              type="password"
              value={formData.secret_key}
              onChange={(e) => setFormData({ ...formData, secret_key: e.target.value })}
              placeholder="Xendit Secret Key"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="public_key">Public Key</Label>
            <Input
              id="public_key"
              value={formData.public_key}
              onChange={(e) => setFormData({ ...formData, public_key: e.target.value })}
              placeholder="Xendit Public Key (opsional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_url">API URL</Label>
            <Input
              id="api_url"
              value={formData.api_url}
              onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
              placeholder="https://api.xendit.co"
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
