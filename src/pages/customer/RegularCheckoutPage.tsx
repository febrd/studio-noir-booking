
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Minus, Clock, Users, MapPin, Camera } from 'lucide-react';
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

interface AdditionalService {
  id: string;
  name: string;
  price: number;
  description: string;
}

const RegularCheckoutPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const packageId = searchParams.get('package');
  const [packageQuantity, setPackageQuantity] = useState(1);
  const [showAdditionalServices, setShowAdditionalServices] = useState(false);
  const [selectedServices, setSelectedServices] = useState<{[key: string]: number}>({});

  // Fetch package details
  const { data: packageData, isLoading: packageLoading } = useQuery({
    queryKey: ['regular-package', packageId],
    queryFn: async () => {
      if (!packageId) return null;
      
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
        .eq('id', packageId)
        .eq('studios.type', 'regular')
        .single();

      if (error) throw error;
      return data as Package;
    },
    enabled: !!packageId
  });

  // Fetch additional services for the studio
  const { data: additionalServices = [] } = useQuery({
    queryKey: ['additional-services', packageData?.studios?.id],
    queryFn: async () => {
      if (!packageData?.studios?.id) return [];
      
      const { data, error } = await supabase
        .from('additional_services')
        .select('*')
        .eq('studio_id', packageData.studios.id);

      if (error) throw error;
      return data as AdditionalService[];
    },
    enabled: !!packageData?.studios?.id
  });

  const handlePackageQuantityChange = (increment: boolean) => {
    if (increment) {
      setPackageQuantity(prev => prev + 1);
    } else if (packageQuantity > 1) {
      setPackageQuantity(prev => prev - 1);
    }
  };

  const handleContinueToServices = () => {
    setShowAdditionalServices(true);
  };

  const handleServiceQuantityChange = (serviceId: string, increment: boolean) => {
    setSelectedServices(prev => {
      const current = prev[serviceId] || 0;
      if (increment) {
        return { ...prev, [serviceId]: current + 1 };
      } else if (current > 0) {
        return { ...prev, [serviceId]: current - 1 };
      }
      return prev;
    });
  };

  const calculateTotal = () => {
    const packageTotal = (packageData?.price || 0) * packageQuantity;
    const servicesTotal = additionalServices.reduce((sum, service) => {
      const serviceQuantity = selectedServices[service.id] || 0;
      return sum + (service.price * serviceQuantity);
    }, 0);
    return packageTotal + servicesTotal;
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'personal':
        return <Users className="h-5 w-5" />;
      case 'couple':
        return <Users className="h-5 w-5" />;
      case 'group':
        return <Users className="h-5 w-5" />;
      case 'family':
        return <Users className="h-5 w-5" />;
      default:
        return <Camera className="h-5 w-5" />;
    }
  };

  const handleProceedToSchedule = () => {
    toast.success('Proceeding to schedule selection...');
    // Navigate to schedule page (coming soon)
  };

  if (packageLoading) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-2xl font-peace-sans font-black mb-4">Package not found</h2>
          <Button onClick={() => navigate('/customer/regular-packages')} className="bg-black text-white font-peace-sans font-bold">
            Back to Packages
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Clean Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => navigate('/customer/regular-packages')}
              className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-inter font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
            <h1 className="text-3xl font-peace-sans font-black text-black">Checkout</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-12">
        {!showAdditionalServices ? (
          /* Package Selection */
          <div className="space-y-12">
            <div className="text-center">
              <h2 className="text-5xl font-peace-sans font-black mb-4 text-black">Studio Package</h2>
              <p className="text-lg font-inter text-gray-500">Choose your package quantity</p>
            </div>

            <Card className="border border-gray-100 shadow-none">
              <CardHeader className="p-8">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl font-peace-sans font-black text-black mb-2">
                      {packageData.title}
                    </CardTitle>
                    <p className="text-gray-500 font-inter mb-4">{packageData.description}</p>
                    <div className="flex items-center gap-6 text-sm font-inter text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {packageData.base_time_minutes} menit
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {packageData.studios?.name}
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-blue-50 text-blue-600 border-blue-200 font-peace-sans font-bold flex items-center gap-2">
                    {getCategoryIcon(packageData.package_categories?.name || '')}
                    {packageData.package_categories?.name || 'Studio'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePackageQuantityChange(false)}
                      disabled={packageQuantity <= 1}
                      className="border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-2xl font-peace-sans font-black min-w-[3rem] text-center">
                      {packageQuantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePackageQuantityChange(true)}
                      className="border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-inter text-gray-500 mb-1">Total</p>
                    <p className="text-3xl font-peace-sans font-black text-black">
                      {((packageData.price * packageQuantity)).toLocaleString('id-ID', { 
                        style: 'currency', 
                        currency: 'IDR', 
                        minimumFractionDigits: 0 
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button 
                onClick={handleContinueToServices}
                className="bg-black text-white hover:bg-gray-800 font-peace-sans font-bold px-12 py-4 text-lg"
              >
                Continue to Additional Services
              </Button>
            </div>
          </div>
        ) : (
          /* Additional Services */
          <div className="space-y-12">
            <div className="text-center">
              <h2 className="text-5xl font-peace-sans font-black mb-4 text-black">Additional Services</h2>
              <p className="text-lg font-inter text-gray-500">Enhance your photo session</p>
            </div>

            <div className="space-y-6">
              {additionalServices.map((service) => (
                <Card key={service.id} className="border border-gray-100 shadow-none">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-peace-sans font-black text-black mb-2">
                          {service.name}
                        </h3>
                        <p className="text-gray-500 font-inter mb-2">{service.description}</p>
                        <p className="text-lg font-peace-sans font-bold text-blue-600">
                          {service.price.toLocaleString('id-ID', { 
                            style: 'currency', 
                            currency: 'IDR', 
                            minimumFractionDigits: 0 
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleServiceQuantityChange(service.id, false)}
                          disabled={(selectedServices[service.id] || 0) <= 0}
                          className="border-gray-200 text-gray-600 hover:bg-gray-50"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-xl font-peace-sans font-black min-w-[3rem] text-center">
                          {selectedServices[service.id] || 0}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleServiceQuantityChange(service.id, true)}
                          className="border-gray-200 text-gray-600 hover:bg-gray-50"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <Card className="border border-gray-100 shadow-none bg-gray-50">
              <CardContent className="p-8">
                <h3 className="text-2xl font-peace-sans font-black text-black mb-6">Order Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-inter text-gray-600">
                      {packageData.title} × {packageQuantity}
                    </span>
                    <span className="font-peace-sans font-bold">
                      {(packageData.price * packageQuantity).toLocaleString('id-ID', { 
                        style: 'currency', 
                        currency: 'IDR', 
                        minimumFractionDigits: 0 
                      })}
                    </span>
                  </div>
                  {additionalServices.map((service) => {
                    const serviceQuantity = selectedServices[service.id] || 0;
                    if (serviceQuantity > 0) {
                      return (
                        <div key={service.id} className="flex justify-between items-center">
                          <span className="font-inter text-gray-600">
                            {service.name} × {serviceQuantity}
                          </span>
                          <span className="font-peace-sans font-bold">
                            {(service.price * serviceQuantity).toLocaleString('id-ID', { 
                              style: 'currency', 
                              currency: 'IDR', 
                              minimumFractionDigits: 0 
                            })}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-peace-sans font-black text-black">Total</span>
                      <span className="text-2xl font-peace-sans font-black text-black">
                        {calculateTotal().toLocaleString('id-ID', { 
                          style: 'currency', 
                          currency: 'IDR', 
                          minimumFractionDigits: 0 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button 
                onClick={handleProceedToSchedule}
                className="bg-black text-white hover:bg-gray-800 font-peace-sans font-bold px-12 py-4 text-lg"
              >
                Proceed to Schedule Selection (Soon)
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegularCheckoutPage;
