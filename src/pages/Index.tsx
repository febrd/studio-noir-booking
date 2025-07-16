import { useState } from 'react';
import { Header } from '@/components/Layout/Header';
import { Sidebar } from '@/components/Layout/Sidebar';
import { StatsCards } from '@/components/Dashboard/StatsCards';
import { RecentBookings } from '@/components/Dashboard/RecentBookings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, TrendingUp } from 'lucide-react';
import studioHero from '@/assets/studio-hero.jpg';

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="lg:ml-64">
        <Header onMenuToggle={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        
        <main className="p-6 space-y-8">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-black via-gray-900 to-black">
            <div className="absolute inset-0">
              <img
                src={studioHero}
                alt="Studio Interior"
                className="w-full h-full object-cover opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
            </div>
            
            <div className="relative px-8 py-12 lg:py-16">
              <div className="max-w-xl">
                <h1 className="text-4xl lg:text-5xl font-bold text-white text-elegant mb-4">
                  Studio Noir
                </h1>
                <p className="text-xl text-gray-200 mb-6 text-elegant">
                  Professional booking management system for modern photography studios
                </p>
                <div className="flex gap-4">
                  <Button className="bg-white text-black hover:bg-gray-100 hover-scale">
                    <Plus className="h-4 w-4 mr-2" />
                    New Booking
                  </Button>
                  <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black hover-scale">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Schedule
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div>
            <h2 className="text-2xl font-semibold text-elegant mb-6">Dashboard Overview</h2>
            <StatsCards />
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Bookings */}
            <div className="lg:col-span-2">
              <RecentBookings />
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <Card className="glass-elegant">
                <CardHeader>
                  <CardTitle className="text-elegant">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start hover-lift" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Package
                  </Button>
                  <Button className="w-full justify-start hover-lift" variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Session
                  </Button>
                  <Button className="w-full justify-start hover-lift" variant="outline">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Reports
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-elegant">
                <CardHeader>
                  <CardTitle className="text-elegant">Today's Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Sessions Today</span>
                    <span className="font-semibold">8</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Revenue Today</span>
                    <span className="font-semibold">Rp 2,450,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pending Bookings</span>
                    <span className="font-semibold">3</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
