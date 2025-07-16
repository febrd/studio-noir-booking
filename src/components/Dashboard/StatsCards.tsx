import { TrendingUp, Calendar, DollarSign, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const stats = [
  {
    title: 'Total Revenue',
    value: 'Rp 45,890,000',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
  },
  {
    title: 'Active Bookings',
    value: '156',
    change: '+8.2%',
    trend: 'up',
    icon: Calendar,
  },
  {
    title: 'Total Customers',
    value: '2,394',
    change: '+15.3%',
    trend: 'up',
    icon: Users,
  },
  {
    title: 'Growth Rate',
    value: '23.1%',
    change: '+2.4%',
    trend: 'up',
    icon: TrendingUp,
  },
];

export const StatsCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card key={stat.title} className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-elegant">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-primary font-medium">{stat.change}</span> from last month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};