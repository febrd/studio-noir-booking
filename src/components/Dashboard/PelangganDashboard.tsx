
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Calendar, Camera, Heart, Star, Clock } from 'lucide-react';

export function PelangganDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <User className="h-6 w-6 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back!</h1>
          <p className="text-muted-foreground">
            Kelola booking dan riwayat foto studio Anda
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Sejak bergabung
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Photos Taken</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">240+</div>
            <p className="text-xs text-muted-foreground">
              Foto berkualitas tinggi
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favorite Package</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">Premium Portrait</div>
            <p className="text-xs text-muted-foreground">
              Paling sering dipilih
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">March 2024</div>
            <p className="text-xs text-muted-foreground">
              Customer setia
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Booking Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Booking</CardTitle>
            <CardDescription>
              Buat booking baru dengan mudah
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" size="lg">
              <Camera className="mr-2 h-4 w-4" />
              Book Self Photo Session
            </Button>
            <Button variant="outline" className="w-full" size="lg">
              <Calendar className="mr-2 h-4 w-4" />
              Book Regular Session
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Aktivitas booking terbaru Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Premium Portrait</span>
              </div>
              <Badge className="bg-green-100 text-green-800">Completed</Badge>
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Self Photo Basic</span>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Couple Session</span>
              </div>
              <Badge className="bg-orange-100 text-orange-800">Pending</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Packages */}
      <Card>
        <CardHeader>
          <CardTitle>Available Packages</CardTitle>
          <CardDescription>
            Pilih paket foto sesuai kebutuhan Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold">Basic Self Photo</h3>
              <p className="text-sm text-muted-foreground mb-2">30 menit sesi foto</p>
              <p className="font-bold text-lg">Rp 150,000</p>
              <Button size="sm" className="w-full mt-2">Book Now</Button>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold">Premium Portrait</h3>
              <p className="text-sm text-muted-foreground mb-2">60 menit + editing</p>
              <p className="font-bold text-lg">Rp 300,000</p>
              <Button size="sm" className="w-full mt-2">Book Now</Button>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold">Couple Session</h3>
              <p className="text-sm text-muted-foreground mb-2">90 menit untuk 2 orang</p>
              <p className="font-bold text-lg">Rp 450,000</p>
              <Button size="sm" className="w-full mt-2">Book Now</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
