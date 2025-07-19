
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface AddCustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddCustomerForm = ({ open, onOpenChange, onSuccess }: AddCustomerFormProps) => {
 
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const { data: users } = useQuery({
    queryKey: ['users-list', customerSearch],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'pelanggan')
        .order('name');
  
      if (customerSearch.trim()) {
        query = query.or(`name.ilike.%${customerSearch}%,email.ilike.%${customerSearch}%`);
      }
  
      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data;
    }
  });
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    gender: '' as 'male' | 'female' | '',
    notes: '',
    is_active: true
  });

  const addCustomerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('customer_profiles' as any)
        .insert({
          full_name: data.full_name,
          email: data.email,
          phone: data.phone || null,
          address: data.address || null,
          date_of_birth: data.date_of_birth || null,
          gender: data.gender || null,
          notes: data.notes || null,
          is_active: data.is_active
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Customer berhasil ditambahkan');
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        address: '',
        date_of_birth: '',
        gender: '',
        notes: '',
        is_active: true
      });
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Error adding customer:', error);
      toast.error('Gagal menambahkan customer: ' + error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.email) {
      toast.error('Nama lengkap dan email harus diisi');
      return;
    }

    addCustomerMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Customer Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nama Lengkap *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Masukkan nama lengkap"
                required
              />
            </div>

            <div className="space-y-2">
  <Label htmlFor="email">Email *</Label>
  <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={customerSearchOpen}
        className="w-full justify-between"
      >
        {formData.email ? (
          `${formData.email} ${formData.full_name ? `(${formData.full_name})` : ''}`
        ) : (
          "Cari dan pilih email customer..."
        )}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-full p-0">
      <Command>
        <CommandInput 
          placeholder="Cari nama atau email customer..." 
          value={customerSearch}
          onValueChange={setCustomerSearch}
        />
        <CommandList>
          <CommandEmpty>Tidak ada customer ditemukan.</CommandEmpty>
          <CommandGroup>
            {users?.map((user) => (
              <CommandItem
                key={user.id}
                value={`${user.name} ${user.email}`}
                onSelect={() => {
                  setFormData({
                    ...formData,
                    email: user.email,
                    full_name: user.name // opsional: auto isi nama juga
                  });
                  setCustomerSearchOpen(false);
                }}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{user.email}</span>
                  <span className="text-sm text-gray-500">{user.name}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</div>


            <div className="space-y-2">
              <Label htmlFor="phone">Telepon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08xxxxxxxxxx"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Jenis Kelamin</Label>
              <Select
                value={formData.gender}
                onValueChange={(value: 'male' | 'female') => 
                  setFormData({ ...formData, gender: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis kelamin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Laki-laki</SelectItem>
                  <SelectItem value="female">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Tanggal Lahir</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Status Aktif</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Masukkan alamat lengkap"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Catatan tambahan tentang customer"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={addCustomerMutation.isPending}>
              {addCustomerMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
