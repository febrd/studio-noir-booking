
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Package, Settings, Calendar, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudioDashboard = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'Studios',
      description: 'Kelola studio self photo dan regular',
      icon: Building2,
      href: '/studio/studios',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'Packages',
      description: 'Kelola paket studio dan pricing',
      icon: Package,
      href: '/studio/packages',
      color: 'bg-green-50 text-green-600'
    },
    {
      title: 'Additional Services',
      description: 'Kelola layanan tambahan studio',
      icon: Settings,
      href: '/studio/services',
      color: 'bg-purple-50 text-purple-600'
    },
    {
      title: 'Bookings',
      description: 'Kelola booking dan sesi studio',
      icon: Calendar,
      href: '/studio/bookings',
      color: 'bg-orange-50 text-orange-600'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Studio Management</h1>
          <p className="text-gray-600">Kelola studio, paket, layanan, dan booking</p>
        </div>
        <Button onClick={() => navigate('/studio/studios')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Tambah Studio
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {menuItems.map((item) => (
          <Card 
            key={item.title} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(item.href)}
          >
            <CardHeader className="pb-3">
              <div className={`w-12 h-12 rounded-lg ${item.color} flex items-center justify-center mb-3`}>
                <item.icon className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Studios</span>
                <span className="font-semibold">2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Packages</span>
                <span className="font-semibold">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Additional Services</span>
                <span className="font-semibold">-</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">No recent activity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => navigate('/studio/studios')}
            >
              <Building2 className="h-4 w-4 mr-2" />
              Manage Studios
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => navigate('/studio/packages')}
            >
              <Package className="h-4 w-4 mr-2" />
              Manage Packages
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => navigate('/studio/bookings')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              View Bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudioDashboard;
