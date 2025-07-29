
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Zap, Palette } from "lucide-react";

interface AdditionalService {
  id: string;
  name: string;
  description?: string;
  price: number;
  studios: {
    name: string;
  };
}

interface AdditionalServicesSectionProps {
  services: AdditionalService[];
}

const AdditionalServicesSection = ({ services }: AdditionalServicesSectionProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getServiceIcon = (name: string) => {
    const lowercaseName = name.toLowerCase();
    if (lowercaseName.includes('edit') || lowercaseName.includes('retouch')) {
      return <Palette className="w-6 h-6 text-blue-500" />;
    }
    return <Zap className="w-6 h-6 text-purple-500" />;
  };

  return (
    <section className="py-20 bg-white/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-full mb-6">
            <Plus className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6 font-playfair">
            Add-On Services
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Upgrade pengalaman foto kamu dengan layanan tambahan yang bikin hasil makin perfect! 💎
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <Card key={service.id} className="group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:scale-105 relative">
              {/* Decorative element */}
              <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                {getServiceIcon(service.name)}
              </div>
              
              <CardHeader className="pb-3">
                <div className="flex items-center mb-3">
                  {getServiceIcon(service.name)}
                  <Badge className="ml-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 px-2 py-1 text-xs">
                    Add-On
                  </Badge>
                </div>
                
                <CardTitle className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
                  {service.name}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {service.description && (
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                    {service.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between pt-2">
                  <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {formatPrice(service.price)}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {service.studios.name}
                  </div>
                </div>
                
                <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
              </CardContent>
            </Card>
          ))}
        </div>

        {services.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">Belum ada layanan tambahan tersedia</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdditionalServicesSection;
