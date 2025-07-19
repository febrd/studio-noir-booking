
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, Camera, Clock, MapPin, Star, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Package {
  id: string;
  title: string;
  price: number;
  base_time_minutes: number;
  description: string;
  package_categories: {
    name: string;
    id: string;
  } | null;
  studios: {
    name: string;
    id: string;
  } | null;
}

const SelfPhotoPackagesPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('popular');

  // Fetch self photo packages from database
  const { data: packages = [], isLoading, error } = useQuery({
    queryKey: ['self-photo-packages'],
    queryFn: async () => {
      console.log('Fetching self photo packages...');
      const { data, error } = await supabase
        .from('studio_packages')
        .select(`
          id,
          title,
          price,
          base_time_minutes,
          description,
          package_categories(id, name),
          studios!inner(id, name, type)
        `)
        .eq('studios.type', 'self_photo')
        .eq('studios.is_active', true)
        .order('title');

      if (error) {
        console.error('Error fetching self photo packages:', error);
        throw error;
      }

      console.log('Fetched self photo packages:', data);
      return data as Package[];
    },
  });

  // Filter and sort packages
  const filteredPackages = packages
    .filter(pkg => 
      pkg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'duration':
          return a.base_time_minutes - b.base_time_minutes;
        case 'popular':
        default:
          return 0;
      }
    });

  const handlePackageSelect = (packageId: string) => {
    toast.success('Paket dipilih! Mengarahkan ke halaman booking...');
    navigate(`/booking?package=${packageId}`);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 border-4 border-black bg-red-100">
            <h2 className="text-3xl font-black text-black mb-4">ERROR LOADING PACKAGES</h2>
            <p className="text-gray-700 font-medium">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Bauhaus Header */}
      <div className="bg-black text-white border-b-4 border-black sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <Button
              variant="outline"
              onClick={() => navigate('/customer/booking-selection')}
              className="border-2 border-white text-white hover:bg-white hover:text-black font-bold"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              KEMBALI
            </Button>
            <h1 className="text-4xl font-black tracking-wide">SELF PHOTO</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter - Bauhaus Style */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Cari paket self photo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 border-2 border-gray-300 focus:border-black text-lg py-3"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48 border-2 border-gray-300 focus:border-black text-lg py-3">
                <SelectValue placeholder="Urutkan berdasarkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">
                  <div className="flex items-center gap-2 font-bold">
                    <Star className="h-4 w-4" />
                    POPULER
                  </div>
                </SelectItem>
                <SelectItem value="price-low">HARGA TERENDAH</SelectItem>
                <SelectItem value="price-high">HARGA TERTINGGI</SelectItem>
                <SelectItem value="duration">DURASI</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-4 border-black">
                <div className="h-48 bg-gray-200 animate-pulse"></div>
                <CardContent className="p-4">
                  <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4 animate-pulse"></div>
                  <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Packages Grid - Bauhaus Style */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPackages.map((pkg, index) => {
              const colorClasses = ['bg-red-500', 'bg-blue-600', 'bg-yellow-400'];
              const colorClass = colorClasses[index % colorClasses.length];
              
              return (
                <Card 
                  key={pkg.id} 
                  className="border-4 border-black shadow-none cursor-pointer hover:shadow-lg transition-shadow bg-white"
                  onClick={() => handlePackageSelect(pkg.id)}
                >
                  <div className={`h-48 ${colorClass} relative overflow-hidden flex items-center justify-center`}>
                    <div className="text-white text-center">
                      <Users className="h-16 w-16 mx-auto mb-2" />
                      <p className="text-xl font-black tracking-wide">SELF PHOTO</p>
                    </div>
                    <Badge className="absolute top-4 right-4 bg-black text-white border-2 border-white font-bold">
                      POPULER
                    </Badge>
                  </div>
                  
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl font-black tracking-wide">
                        {pkg.title}
                      </CardTitle>
                      <div className="text-right">
                        <div className="text-3xl font-black text-black">
                          Rp {pkg.price?.toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 font-medium">
                        {pkg.description || 'Paket self photo dengan kualitas profesional'}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm font-medium text-gray-700">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {pkg.base_time_minutes} menit
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {pkg.studios?.name || 'Studio'}
                        </div>
                      </div>
                      
                      <Button className="w-full bg-black text-white hover:bg-gray-800 font-black py-3 text-lg tracking-wide">
                        PILIH PAKET
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* No Results */}
        {!isLoading && filteredPackages.length === 0 && (
          <div className="text-center py-12 border-4 border-black bg-gray-100">
            <Camera className="h-20 w-20 text-gray-400 mx-auto mb-4" />
            <h3 className="text-3xl font-black mb-2">TIDAK ADA PAKET DITEMUKAN</h3>
            <p className="text-gray-600 font-medium">Coba ubah pencarian atau filter</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelfPhotoPackagesPage;
