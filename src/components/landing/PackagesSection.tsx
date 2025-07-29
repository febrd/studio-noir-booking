
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Clock, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";

interface Package {
  id: string;
  title: string;
  description?: string;
  price: number;
  base_time_minutes: number;
  studios: {
    name: string;
    type: string;
    location?: string;
  };
  package_categories?: {
    name: string;
    description?: string;
  };
}

interface PackagesSectionProps {
  packages: Package[];
}

const PackagesSection = ({ packages }: PackagesSectionProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}j ${mins}m` : `${hours}j`;
    }
    return `${mins}m`;
  };

  return (
    <section className="py-20 bg-gradient-to-br from-purple-50/50 to-blue-50/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-full mb-6">
            <Package className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent mb-6 font-playfair">
            Paket Foto
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Paket lengkap yang disesuaikan dengan budget dan kebutuhan kamu. Semua udah include, tinggal dateng dan pose! 📸
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="group hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:scale-105 relative overflow-hidden">
              {/* Decorative gradient */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500" />
              
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  {pkg.package_categories && (
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 px-3 py-1 text-sm">
                      {pkg.package_categories.name}
                    </Badge>
                  )}
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  </div>
                </div>
                
                <CardTitle className="text-2xl font-bold text-gray-800 group-hover:text-orange-600 transition-colors duration-300 mb-2">
                  {pkg.title}
                </CardTitle>
                
                <div className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  {formatPrice(pkg.price)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {pkg.description && (
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {pkg.description}
                  </p>
                )}
                
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2 text-orange-500" />
                    <span className="text-sm">Durasi: {formatTime(pkg.base_time_minutes)}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-orange-500" />
                    <span className="text-sm">{pkg.studios.name}</span>
                  </div>
                  
                  <Badge variant="outline" className="text-xs">
                    {pkg.studios.type === 'self_photo' ? 'Self Photo' : 'Regular Photo'}
                  </Badge>
                </div>
                
                <div className="pt-4">
                  <Link to="/auth">
                    <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-full transition-all duration-300 hover:shadow-lg">
                      Book Paket Ini
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PackagesSection;
