
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { useJWTAuth } from '@/hooks/useJWTAuth';

interface EditUserFormProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditUserForm = ({ user, open, onOpenChange, onSuccess }: EditUserFormProps) => {
  const { userProfile } = useJWTAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'pelanggan' as 'owner' | 'admin' | 'keuangan' | 'pelanggan',
    is_active: true,
    password: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'pelanggan',
        is_active: user.is_active !== undefined ? user.is_active : true,
        password: ''
      });
    }
  }, [user]);

  const updateUserMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      console.log('Updating user with data:', data);
      
      let updateData: any = {
        name: data.name,
        email: data.email,
        role: data.role,
        is_active: data.is_active
      };

      // If password is provided, hash it
      if (data.password && data.password.trim() !== '') {
        const { data: hashResult, error: hashError } = await supabase.rpc('hash_password', {
          password: data.password
        });

        if (hashError) {
          console.error('Error hashing password:', hashError);
          throw new Error('Gagal mengenkripsi password');
        }

        updateData.password = hashResult;
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Pengguna berhasil diperbarui');
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Error updating user:', error);
      toast.error('Gagal memperbarui pengguna: ' + error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error('Nama dan email harus diisi');
      return;
    }

    // Check if current user can edit this role
    const canEdit = canEditUserRole(user.role);
    if (!canEdit) {
      toast.error('Anda tidak memiliki akses untuk mengedit user ini');
      return;
    }

    // Check if role is being changed and if user has permission
    if (formData.role !== user.role && !canChangeToRole(formData.role)) {
      toast.error('Anda tidak memiliki akses untuk mengubah role ke level ini');
      return;
    }

    // Check password field access
    if (formData.password && !canEditPassword(user.role)) {
      toast.error('Anda tidak memiliki akses untuk mengubah password user ini');
      return;
    }

    updateUserMutation.mutate(formData);
  };

  const canEditUserRole = (targetUserRole: string) => {
    if (userProfile?.role === 'owner') return true;
    if (userProfile?.role === 'admin') {
      return ['admin', 'keuangan', 'pelanggan'].includes(targetUserRole);
    }
    return false;
  };

  const canChangeToRole = (newRole: string) => {
    if (userProfile?.role === 'owner') return true;
    if (userProfile?.role === 'admin') {
      return ['admin', 'keuangan', 'pelanggan'].includes(newRole);
    }
    return false;
  };

  const canEditPassword = (targetUserRole: string) => {
    if (userProfile?.role === 'owner') return true;
    if (userProfile?.role === 'admin') {
      return ['admin', 'keuangan', 'pelanggan'].includes(targetUserRole);
    }
    return false;
  };

  const getAvailableRoles = () => {
    if (userProfile?.role === 'owner') {
      return [
        { value: 'pelanggan', label: 'Pelanggan' },
        { value: 'keuangan', label: 'Keuangan' },
        { value: 'admin', label: 'Admin' },
        { value: 'owner', label: 'Owner' }
      ];
    }
    if (userProfile?.role === 'admin') {
      return [
        { value: 'pelanggan', label: 'Pelanggan' },
        { value: 'keuangan', label: 'Keuangan' },
        { value: 'admin', label: 'Admin' }
      ];
    }
    return [];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Pengguna</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@contoh.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password Baru (Kosongkan jika tidak ingin mengubah)</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Masukkan password baru (opsional)"
              disabled={!canEditPassword(user.role)}
            />
            {!canEditPassword(user.role) && (
              <p className="text-sm text-muted-foreground">
                Anda tidak memiliki akses untuk mengubah password user ini
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value: 'owner' | 'admin' | 'keuangan' | 'pelanggan') => 
                setFormData({ ...formData, role: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getAvailableRoles().map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Status Aktif</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
