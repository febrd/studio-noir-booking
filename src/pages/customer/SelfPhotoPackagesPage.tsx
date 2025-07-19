
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

interface Package {
  id: string;
  title: string;
  price: number;
  base_time_minutes: number;
  description: string;
  category: {
    name: string;
    id: string;
  } | null;
  studio: {
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
          category:package_categories(id, name),
          studio:studios(id, name)
        `)
        .eq('studio.type', 'self_photo')
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
    // Navigate to booking page with package ID
    navigate(`/booking?package=${packageId}`);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-destructive mb-4">Error Loading Packages</h2>
            <p className="text-muted-foreground">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <div className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/customer/booking-selection')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <h1 className="text-2xl font-bold text-elegant">Self Photo</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari paket self photo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Urutkan berdasarkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">
                  <div className="flex items-center gap-2">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-t-lg"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded mb-4"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Packages Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPackages.map((pkg, index) => (
              <Card 
                key={pkg.id} 
                className="group glass-elegant hover-lift cursor-pointer transition-all duration-300 hover:shadow-xl animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => handlePackageSelect(pkg.id)}
              >
                <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-600 rounded-t-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="text-white text-center">
                      <Users className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">Self Photo</p>
                    </div>
                  </div>
                  <Badge className="absolute top-4 right-4 bg-white/20 text-white border-white/30">
                    Populer
                  </Badge>
                </div>
                
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold text-elegant group-hover:text-primary transition-colors">
                      {pkg.title}
                    </CardTitle>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        Rp {pkg.price?.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {pkg.description || 'Paket self photo dengan kualitas profesional'}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {pkg.base_time_minutes} menit
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {pkg.studio?.name || 'Studio'}
                      </div>
                    </div>
                    
                    <Button className="w-full group-hover:bg-primary/90 transition-colors">
                      Pilih Paket
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && filteredPackages.length === 0 && (
          <div className="text-center py-12">
            <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Tidak ada paket ditemukan</h3>
            <p className="text-muted-foreground">Coba ubah pencarian atau filter</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelfPhotoPackagesPage;
