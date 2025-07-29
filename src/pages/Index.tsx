import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import HeroSection from "@/components/landing/HeroSection";
import StudiosSection from "@/components/landing/StudiosSection";
import AdditionalServicesSection from "@/components/landing/AdditionalServicesSection";
import PackagesSection from "@/components/landing/PackagesSection";
import ShortcutsSection from "@/components/landing/ShortcutsSection";
import AboutSection from "@/components/landing/AboutSection";
import FooterSection from "@/components/landing/FooterSection";

const Index = () => {
  // Fetch all required data
  const { data: studios, isLoading: studiosLoading } = useQuery({
    queryKey: ['studios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('studios')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    }
  });

  const { data: additionalServices, isLoading: servicesLoading } = useQuery({
    queryKey: ['additional-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('additional_services')
        .select('*, studios(name)');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: packages, isLoading: packagesLoading } = useQuery({
    queryKey: ['studio-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('studio_packages')
        .select(`
          *,
          studios(name, type, location),
          package_categories(name, description)
        `);
      
      if (error) throw error;
      return data;
    }
  });

  if (studiosLoading || servicesLoading || packagesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-yellow-50">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="space-y-8">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-yellow-50">
      <HeroSection />
      <StudiosSection studios={studios || []} />
      <PackagesSection packages={packages || []} />
      <AdditionalServicesSection services={additionalServices || []} />
      <ShortcutsSection />
      <AboutSection />
      <FooterSection />
    </div>
  );
};

export default Index;
