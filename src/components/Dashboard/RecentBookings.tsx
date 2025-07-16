import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const recentBookings = [
  {
    id: 1,
    customer: 'Sarah Johnson',
    package: 'Premium Self-Photo',
    date: '2024-01-15',
    time: '14:00',
    status: 'confirmed',
    amount: 'Rp 350,000',
  },
  {
    id: 2,
    customer: 'Michael Chen',
    package: 'Basic Package',
    date: '2024-01-15',
    time: '16:30',
    status: 'pending',
    amount: 'Rp 150,000',
  },
  {
    id: 3,
    customer: 'Emma Wilson',
    package: 'Deluxe Experience',
    date: '2024-01-16',
    time: '10:00',
    status: 'confirmed',
    amount: 'Rp 500,000',
  },
  {
    id: 4,
    customer: 'David Brown',
    package: 'Basic Package',
    date: '2024-01-16',
    time: '13:15',
    status: 'completed',
    amount: 'Rp 150,000',
  },
];

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'completed':
      return 'outline';
    default:
      return 'secondary';
  }
};

export const RecentBookings = () => {
  return (
    <Card className="glass-elegant">
      <CardHeader>
        <CardTitle className="text-elegant">Recent Bookings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentBookings.map((booking) => (
            <div key={booking.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-smooth">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {booking.customer.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-elegant">{booking.customer}</p>
                <p className="text-xs text-muted-foreground">{booking.package}</p>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-medium">{booking.amount}</p>
                <p className="text-xs text-muted-foreground">
                  {booking.date} • {booking.time}
                </p>
              </div>
              
              <Badge variant={getStatusVariant(booking.status)} className="capitalize">
                {booking.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};