
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

interface CustomerProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  date_of_birth: string | null;
  gender: 'male' | 'female' | null;
  notes: string | null;
}

export const EditProfileForm = () => {
  const { userProfile } = useJWTAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    gender: '' as 'male' | 'female' | '',
    notes: ''
  });

  // Fetch customer profile data
  const { data: customerProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['customer-profile', userProfile?.email],
    queryFn: async () => {
      if (!userProfile?.email) return null;
      
      const { data, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('email', userProfile.email)
        .maybeSingle();

      if (error) {
        console.error('Error fetching customer profile:', error);
        throw error;
      }

      return data as CustomerProfile | null;
    },
    enabled: !!userProfile?.email,
  });

  // Update form when profile data is loaded
  useEffect(() => {
    if (customerProfile) {
      setFormData({
        full_name: customerProfile.full_name || '',
        email: customerProfile.email || '',
        phone: customerProfile.phone || '',
        address: customerProfile.address || '',
        date_of_birth: customerProfile.date_of_birth || '',
        gender: customerProfile.gender || '',
        notes: customerProfile.notes || ''
      });
    }
  }, [customerProfile]);

  // Update or create customer profile
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!userProfile?.email) throw new Error('User not authenticated');

      if (customerProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('customer_profiles')
          .update({
            full_name: data.full_name,
            email: data.email,
            phone: data.phone || null,
            address: data.address || null,
            date_of_birth: data.date_of_birth || null,
            gender: data.gender || null,
            notes: data.notes || null
          })
          .eq('id', customerProfile.id);

        if (error) throw error;
      } else {
        // Create new profile
        const { error } = await supabase
          .from('customer_profiles')
          .insert({
            full_name: data.full_name,
            email: data.email,
            phone: data.phone || null,
            address: data.address || null,
            date_of_birth: data.date_of_birth || null,
            gender: data.gender || null,
            notes: data.notes || null
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Profile berhasil diperbarui!');
    },
    onError: (error: any) => {
      console.error('Error updating profile:', error);
      toast.error('Gagal memperbarui profile: ' + error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.email) {
      toast.error('Nama lengkap dan email harus diisi');
      return;
    }

    updateProfileMutation.mutate(formData);
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Memuat profile...</span>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
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

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="date_of_birth">Tanggal Lahir</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Masukkan alamat lengkap"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Catatan tambahan"
              rows={2}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              type="submit" 
              disabled={updateProfileMutation.isPending}
              className="w-full md:w-auto"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Profile'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
