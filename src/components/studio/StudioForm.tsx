
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface StudioFormProps {
  studio?: any;
  onSuccess: () => void;
}

const StudioForm = ({ studio, onSuccess }: StudioFormProps) => {
  const [formData, setFormData] = useState({
    name: studio?.name || '',
    type: studio?.type || 'self_photo',
    location: studio?.location || '',
    description: studio?.description || '',
    is_active: studio?.is_active ?? true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('studios')
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Studio berhasil ditambahkan');
      onSuccess();
    },
    onError: (error) => {
      console.error('Error creating studio:', error);
      toast.error('Gagal menambahkan studio');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('studios')
        .update(data)
        .eq('id', studio.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Studio berhasil diperbarui');
      onSuccess();
    },
    onError: (error) => {
      console.error('Error updating studio:', error);
      toast.error('Gagal memperbarui studio');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (studio) {
        await updateMutation.mutateAsync(formData);
      } else {
        await createMutation.mutateAsync(formData);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Studio *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Masukkan nama studio"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Tipe Studio *</Label>
        <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih tipe studio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="self_photo">Self Photo</SelectItem>
            <SelectItem value="regular">Regular</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Lokasi</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => handleInputChange('location', e.target.value)}
          placeholder="Masukkan lokasi studio"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Masukkan deskripsi studio"
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => handleInputChange('is_active', checked)}
        />
        <Label htmlFor="is_active">Studio Aktif</Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Menyimpan...' : studio ? 'Perbarui' : 'Tambah'}
        </Button>
      </div>
    </form>
  );
};

export default StudioForm;
