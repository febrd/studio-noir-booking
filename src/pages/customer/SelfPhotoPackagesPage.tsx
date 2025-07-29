
import { useState, useEffect } from 'react';
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
import { useJWTAuth } from '@/hooks/useJWTAuth';

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
  const { userProfile, isAuthenticated } = useJWTAuth();

  // Redirect if not authenticated or not a customer
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('SelfPhotoPackagesPage - Not authenticated, redirecting to auth');
      navigate('/auth');
      return;
    }
    
    if (userProfile && userProfile.role !== 'pelanggan') {
      console.log('SelfPhotoPackagesPage - Not a customer, redirecting to dashboard');
      navigate('/dashboard');
      return;
    }
  }, [isAuthenticated, userProfile, navigate]);

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
    enabled: isAuthenticated && userProfile?.role === 'pelanggan'
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
    toast.success('Navigating to checkout...');
    navigate(`/customer/self-photo-checkout?package=${packageId}`);
  };

  // Show loading while checking authentication
  if (!isAuthenticated || !userProfile) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-3xl font-peace-sans font-black text-black mb-4">Error Loading Packages</h2>
            <p className="text-gray-700 font-inter">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Clean Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => navigate('/customer/booking-selection')}
              className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-inter font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
            <h1 className="text-4xl font-peace-sans font-black text-black">Self Photo</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Search and Filter */}
        <div className="mb-16 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Cari paket self photo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 border border-gray-200 focus:border-black text-base py-3 font-inter"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48 border border-gray-200 focus:border-black text-base py-3 font-inter">
                <SelectValue placeholder="Urutkan berdasarkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">
                  <div className="flex items-center gap-2 font-inter font-medium">
                    <Star className="h-4 w-4" />
                    Populer
                  </div>
                </SelectItem>
                <SelectItem value="price-low">Harga Terendah</SelectItem>
                <SelectItem value="price-high">Harga Tertinggi</SelectItem>
                <SelectItem value="duration">Durasi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border border-gray-100 shadow-none">
                <div className="h-48 bg-gray-100 animate-pulse"></div>
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-100 rounded mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-100 rounded mb-4 animate-pulse"></div>
                  <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Packages Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPackages.map((pkg, index) => {
              const colors = ['bg-red-50', 'bg-blue-50', 'bg-yellow-50'];
              const textColors = ['text-red-600', 'text-blue-600', 'text-yellow-600'];
              const colorClass = colors[index % colors.length];
              const textColorClass = textColors[index % textColors.length];
              
              return (
                <Card 
                  key={pkg.id} 
                  className="border border-gray-100 shadow-none cursor-pointer hover:shadow-sm transition-all bg-white group"
                  onClick={() => handlePackageSelect(pkg.id)}
                >
                  <div className={`h-48 ${colorClass} relative overflow-hidden flex items-center justify-center`}>
                    <div className="text-center">
                      <Users className={`h-16 w-16 mx-auto mb-3 ${textColorClass}`} />
                      <p className={`text-xl font-peace-sans font-black tracking-wide ${textColorClass}`}>
                        SELF PHOTO
                      </p>
                    </div>
                    <Badge className="absolute top-4 right-4 bg-white text-black border border-gray-200 font-peace-sans font-bold">
                      Popular
                    </Badge>
                  </div>
                  
                  <CardHeader className="pb-3 p-6">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl font-peace-sans font-black text-black">
                        {pkg.title}
                      </CardTitle>
                      <div className="text-right">
                        <div className="text-2xl font-peace-sans font-black text-black">
                          {pkg.price?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 p-6">
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 font-inter">
                        {pkg.description || 'Paket self photo dengan kualitas profesional'}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm font-inter text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {pkg.base_time_minutes} menit
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {pkg.studios?.name || 'Studio'}
                        </div>
                      </div>
                      
                      <Button className="w-full bg-black text-white hover:bg-gray-800 font-peace-sans font-bold py-3 text-base group-hover:bg-gray-900 transition-all">
                        Pilih Paket
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
          <div className="text-center py-16">
            <Camera className="h-20 w-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-3xl font-peace-sans font-black mb-4 text-black">Tidak Ada Paket Ditemukan</h3>
            <p className="text-gray-600 font-inter">Coba ubah pencarian atau filter</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelfPhotoPackagesPage;
