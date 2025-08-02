
import { useState, useEffect } from 'react';
import { useJWTAuth } from '@/hooks/useJWTAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

interface CustomerProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  date_of_birth: string;
  gender: string;
  notes: string;
}

export function EditProfileForm() {
  const { userProfile } = useJWTAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<CustomerProfile>({
    id: '',
    full_name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    gender: '',
    notes: ''
  });

  useEffect(() => {
    if (userProfile) {
      fetchProfile();
    }
  }, [userProfile]);

  const fetchProfile = async () => {
    if (!userProfile) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('email', userProfile.email)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        // If profile doesn't exist, create initial profile with user data
        setProfile({
          id: '',
          full_name: userProfile.name || '',
          email: userProfile.email,
          phone: '',
          address: '',
          date_of_birth: '',
          gender: '',
          notes: ''
        });
      } else if (data) {
        setProfile({
          id: data.id,
          full_name: data.full_name || '',
          email: data.email,
          phone: data.phone || '',
          address: data.address || '',
          date_of_birth: data.date_of_birth || '',
          gender: data.gender || '',
          notes: data.notes || ''
        });
      } else {
        // No profile exists, set up initial profile
        setProfile({
          id: '',
          full_name: userProfile.name || '',
          email: userProfile.email,
          phone: '',
          address: '',
          date_of_birth: '',
          gender: '',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Terjadi kesalahan saat mengambil data profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const profileData = {
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        date_of_birth: profile.date_of_birth || null,
        gender: profile.gender,
        notes: profile.notes,
        is_active: true
      };

      if (profile.id) {
        // Update existing profile
        const { error } = await supabase
          .from('customer_profiles')
          .update(profileData)
          .eq('id', profile.id);

        if (error) throw error;
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('customer_profiles')
          .insert(profileData)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setProfile(prev => ({ ...prev, id: data.id }));
        }
      }

      toast.success('Profil berhasil disimpan!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof CustomerProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="full_name">Nama Lengkap</Label>
            <Input
              id="full_name"
              value={profile.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Masukkan email"
            />
          </div>

          <div>
            <Label htmlFor="phone">No. Telepon</Label>
            <Input
              id="phone"
              value={profile.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Masukkan nomor telepon"
            />
          </div>

          <div>
            <Label htmlFor="date_of_birth">Tanggal Lahir</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={profile.date_of_birth}
              onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="gender">Jenis Kelamin</Label>
            <select
              id="gender"
              value={profile.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Pilih jenis kelamin</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          <div>
            <Label htmlFor="address">Alamat</Label>
            <Textarea
              id="address"
              value={profile.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Masukkan alamat lengkap"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              value={profile.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Catatan tambahan (opsional)"
              rows={2}
            />
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Simpan Profile
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
