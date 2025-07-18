
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface BookingFormProps {
  booking?: any;
  onSuccess: () => void;
}

const BookingForm = ({ booking, onSuccess }: BookingFormProps) => {
  const [formData, setFormData] = useState({
    user_id: booking?.user_id || '',
    studio_id: booking?.studio_id || '',
    studio_package_id: booking?.studio_package_id || '',
    type: booking?.type || 'self_photo',
    payment_method: booking?.payment_method || 'online',
    status: booking?.status || 'pending'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: users } = useQuery({
    queryKey: ['users-for-booking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: studios } = useQuery({
    queryKey: ['studios-for-booking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('studios')
        .select('id, name, type')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: packages } = useQuery({
    queryKey: ['packages-for-booking', formData.studio_id],
    queryFn: async () => {
      if (!formData.studio_id) return [];
      
      const { data, error } = await supabase
        .from('studio_packages')
        .select('id, title, price, base_time_minutes')
        .eq('studio_id', formData.studio_id)
        .order('title');
      
      if (error) throw error;
      return data;
    },
    enabled: !!formData.studio_id
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('bookings')
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Booking berhasil ditambahkan');
      onSuccess();
    },
    onError: (error) => {
      console.error('Error creating booking:', error);
      toast.error('Gagal menambahkan booking');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('bookings')
        .update(data)
        .eq('id', booking.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Booking berhasil diperbarui');
      onSuccess();
    },
    onError: (error) => {
      console.error('Error updating booking:', error);
      toast.error('Gagal memperbarui booking');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (booking) {
        await updateMutation.mutateAsync(formData);
      } else {
        await createMutation.mutateAsync(formData);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Reset package when studio changes
      if (field === 'studio_id') {
        newData.studio_package_id = '';
      }
      
      return newData;
    });
  };

  const selectedStudio = studios?.find(s => s.id === formData.studio_id);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="user_id">Customer *</Label>
          <Select value={formData.user_id} onValueChange={(value) => handleInputChange('user_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih customer" />
            </SelectTrigger>
            <SelectContent>
              {users?.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="studio_id">Studio *</Label>
          <Select value={formData.studio_id} onValueChange={(value) => handleInputChange('studio_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih studio" />
            </SelectTrigger>
            <SelectContent>
              {studios?.map((studio) => (
                <SelectItem key={studio.id} value={studio.id}>
                  {studio.name} ({studio.type === 'self_photo' ? 'Self Photo' : 'Regular'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="studio_package_id">Paket Studio *</Label>
        <Select 
          value={formData.studio_package_id} 
          onValueChange={(value) => handleInputChange('studio_package_id', value)}
          disabled={!formData.studio_id}
        >
          <SelectTrigger>
            <SelectValue placeholder={formData.studio_id ? "Pilih paket" : "Pilih studio terlebih dahulu"} />
          </SelectTrigger>
          <SelectContent>
            {packages?.map((pkg) => (
              <SelectItem key={pkg.id} value={pkg.id}>
                {pkg.title} - Rp {pkg.price?.toLocaleString('id-ID')} ({pkg.base_time_minutes} menit)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Tipe Booking *</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value) => handleInputChange('type', value)}
            disabled={!selectedStudio}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih tipe" />
            </SelectTrigger>
            <SelectContent>
              {selectedStudio?.type === 'self_photo' && (
                <SelectItem value="self_photo">Self Photo</SelectItem>
              )}
              {selectedStudio?.type === 'regular' && (
                <SelectItem value="regular">Regular</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_method">Metode Pembayaran *</Label>
          <Select value={formData.payment_method} onValueChange={(value) => handleInputChange('payment_method', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih metode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status *</Label>
        <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-4">
        <Button 
          type="submit" 
          disabled={isSubmitting || !formData.user_id || !formData.studio_id || !formData.studio_package_id} 
          className="flex-1"
        >
          {isSubmitting ? 'Menyimpan...' : booking ? 'Perbarui' : 'Tambah'}
        </Button>
      </div>
    </form>
  );
};

export default BookingForm;
