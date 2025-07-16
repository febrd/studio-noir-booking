import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from './Layout';
import { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, CreditCard, Settings, TestTube } from 'lucide-react';

type PaymentProvider = Tables<'payment_providers'>;

const PaymentProviders = () => {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<PaymentProvider | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    client_id: '',
    client_secret: '',
    server_key: '',
    environment: 'sandbox' as 'sandbox' | 'production',
    status: 'active' as 'active' | 'inactive'
  });

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_providers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProviders(data || []);
    } catch (error: any) {
      toast.error('Gagal memuat data payment provider: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      client_id: '',
      client_secret: '',
      server_key: '',
      environment: 'sandbox',
      status: 'active'
    });
    setEditingProvider(null);
  };

  const openDialog = (provider?: PaymentProvider) => {
    if (provider) {
      setEditingProvider(provider);
      setFormData({
        name: provider.name,
        client_id: provider.client_id || '',
        client_secret: provider.client_secret || '',
        server_key: provider.server_key || '',
        environment: provider.environment,
        status: provider.status
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Nama provider harus diisi');
      return;
    }

    try {
      if (editingProvider) {
        // Update provider
        const { error } = await supabase
          .from('payment_providers')
          .update({
            name: formData.name,
            client_id: formData.client_id || null,
            client_secret: formData.client_secret || null,
            server_key: formData.server_key || null,
            environment: formData.environment,
            status: formData.status
          })
          .eq('id', editingProvider.id);

        if (error) throw error;
        toast.success('Payment provider berhasil diperbarui');
      } else {
        // Create new provider
        const { error } = await supabase
          .from('payment_providers')
          .insert({
            name: formData.name,
            client_id: formData.client_id || null,
            client_secret: formData.client_secret || null,
            server_key: formData.server_key || null,
            environment: formData.environment,
            status: formData.status
          });

        if (error) throw error;
        toast.success('Payment provider berhasil ditambahkan');
      }

      fetchProviders();
      closeDialog();
    } catch (error: any) {
      toast.error('Gagal menyimpan payment provider: ' + error.message);
    }
  };

  const handleDelete = async (provider: PaymentProvider) => {
    try {
      const { error } = await supabase
        .from('payment_providers')
        .delete()
        .eq('id', provider.id);

      if (error) throw error;
      toast.success('Payment provider berhasil dihapus');
      fetchProviders();
    } catch (error: any) {
      toast.error('Gagal menghapus payment provider: ' + error.message);
    }
  };

  const getEnvironmentIcon = (environment: string) => {
    return environment === 'production' ? <CreditCard className="h-4 w-4" /> : <TestTube className="h-4 w-4" />;
  };

  const getEnvironmentColor = (environment: string) => {
    return environment === 'production' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
  };

  const getStatusColor = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-elegant">Payment Gateway</h1>
          <p className="text-muted-foreground">Kelola provider pembayaran</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()} className="hover-lift">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingProvider ? 'Edit Payment Provider' : 'Tambah Payment Provider'}
                </DialogTitle>
                <DialogDescription>
                  {editingProvider 
                    ? 'Perbarui konfigurasi payment provider' 
                    : 'Tambahkan payment provider baru'
                  }
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Provider *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Midtrans, Xendit, dll"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_id">Client ID</Label>
                  <Input
                    id="client_id"
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    placeholder="Client ID dari provider"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_secret">Client Secret</Label>
                  <Input
                    id="client_secret"
                    type="password"
                    value={formData.client_secret}
                    onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })}
                    placeholder="Client Secret dari provider"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="server_key">Server Key</Label>
                  <Input
                    id="server_key"
                    type="password"
                    value={formData.server_key}
                    onChange={(e) => setFormData({ ...formData, server_key: e.target.value })}
                    placeholder="Server Key dari provider"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="environment">Environment</Label>
                  <Select value={formData.environment} onValueChange={(value: any) => setFormData({ ...formData, environment: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih environment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">
                        <div className="flex items-center">
                          <TestTube className="h-4 w-4 mr-2" />
                          Sandbox (Testing)
                        </div>
                      </SelectItem>
                      <SelectItem value="production">
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Production (Live)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingProvider ? 'Perbarui' : 'Tambah'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-elegant">
        <CardHeader>
          <CardTitle>Daftar Payment Provider</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Provider</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : providers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Belum ada payment provider
                  </TableCell>
                </TableRow>
              ) : (
                providers.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell className="font-medium">{provider.name}</TableCell>
                    <TableCell>
                      <Badge className={getEnvironmentColor(provider.environment)}>
                        <div className="flex items-center">
                          {getEnvironmentIcon(provider.environment)}
                          <span className="ml-1 capitalize">{provider.environment}</span>
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(provider.status)}>
                        <span className="capitalize">{provider.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(provider.created_at).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog(provider)}
                        className="hover-lift"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="hover-lift">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Payment Provider</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus provider "{provider.name}"?
                              Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(provider)}>
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
};

export default PaymentProviders;