
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ModernLayout } from '@/components/Layout/ModernLayout';
import { Camera, Clock, Search, Filter, ArrowLeft, Star, Heart, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const SelfPhotoPackagesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('popular');

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['self-photo-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('studio_packages')
        .select(`
          *,
          studios!inner (
            id,
            name,
            type,
            location
          ),
          package_categories (
            name
          )
        `)
        .eq('studios.type', 'self_photo')
        .eq('studios.is_active', true);
      
      if (error) throw error;
      return data || [];
    }
  });

  const filteredPackages = packages
    .filter(pkg => 
      pkg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.studios?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'duration':
          return b.base_time_minutes - a.base_time_minutes;
        default:
          return 0;
      }
    });

  if (isLoading) {
    return (
      <ModernLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-4 mb-6">
              <Link to="/customer/booking-selection">
                <Button variant="outline" size="sm" className="hover-scale">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Paket Self Photo
                  </h1>
                  <p className="text-muted-foreground">Foto sendiri dengan kontrol penuh atas gaya Anda</p>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Cari paket atau studio..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={sortBy === 'popular' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('popular')}
                  className="hover-scale"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Populer
                </Button>
                <Button
                  variant={sortBy === 'price-low' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('price-low')}
                  className="hover-scale"
                >
                  Harga ↑
                </Button>
                <Button
                  variant={sortBy === 'price-high' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('price-high')}
                  className="hover-scale"
                >
                  Harga ↓
                </Button>
                <Button
                  variant={sortBy === 'duration' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('duration')}
                  className="hover-scale"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Durasi
                </Button>
              </div>
            </div>
          </div>

          {/* Packages Grid */}
          {filteredPackages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPackages.map((pkg, index) => (
                <Card 
                  key={pkg.id} 
                  className={`group relative overflow-hidden hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 animate-scale-in border-0 bg-white/80 backdrop-blur-sm`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <CardHeader className="relative z-10">
                    <div className="flex justify-between items-start mb-3">
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                        Self Photo
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50"
                      >
                        <Heart className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    
                    <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                      {pkg.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {pkg.studios?.name} • {pkg.studios?.location}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{pkg.base_time_minutes} menit</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Sparkles className="h-4 w-4" />
                        <span>{pkg.package_categories?.name || 'Umum'}</span>
                      </div>
                    </div>
                    
                    {pkg.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {pkg.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between pt-4">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          Rp {pkg.price.toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ~Rp {Math.round(pkg.price / pkg.base_time_minutes).toLocaleString('id-ID')}/menit
                        </p>
                      </div>
                      <Button 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transform hover:scale-105 transition-all duration-300"
                        onClick={() => {
                          // Navigate to booking form with this package
                          console.log('Booking package:', pkg.id);
                        }}
                      >
                        Pilih Paket
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                <Camera className="h-12 w-12 text-blue-500" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Paket Tidak Ditemukan</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Maaf, tidak ada paket self photo yang sesuai dengan pencarian Anda. 
                Coba ubah kata kunci atau filter pencarian.
              </p>
              <Button variant="outline" onClick={() => setSearchTerm('')} className="hover-scale">
                Reset Pencarian
              </Button>
            </div>
          )}

          {/* Call to Action */}
          <div className="mt-16 text-center animate-fade-in">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Butuh Bantuan Memilih?</h3>
              <p className="text-lg mb-6 opacity-90">
                Tim kami siap membantu Anda menemukan paket self photo yang sempurna
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="secondary" size="lg" className="hover-scale">
                  Hubungi Customer Service
                </Button>
                <Button variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-blue-600 hover-scale">
                  Lihat FAQ
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
};

export default SelfPhotoPackagesPage;
