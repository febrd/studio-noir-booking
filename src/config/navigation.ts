
import { 
  LayoutDashboard, 
  Building2, 
  Package, 
  Calendar, 
  Users, 
  CreditCard, 
  FileText, 
  BarChart3, 
  Settings,
  Clock,
  UserPlus
} from 'lucide-react';

export const navigationItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    roles: ['admin', 'owner', 'keuangan', 'pelanggan']
  },
  {
    title: 'Studio Management',
    icon: Building2,
    href: '/studio/studios',
    roles: ['admin', 'owner']
  },
  {
    title: 'Package Categories',
    icon: Package,
    href: '/studio/package-categories',
    roles: ['admin', 'owner']
  },
  {
    title: 'Packages',
    icon: Package,
    href: '/studio/packages',
    roles: ['admin', 'owner']
  },
  {
    title: 'Additional Services',
    icon: Settings,
    href: '/studio/services',
    roles: ['admin', 'owner']
  },
  {
    title: 'Bookings Transaction',
    icon: Calendar,
    href: '/studio/bookings',
    roles: ['admin', 'owner', 'keuangan']
  },
  {
    title: 'Walk-in Sessions',
    icon: Clock,
    href: '/studio/walkin-sessions',
    roles: ['admin', 'owner', 'keuangan']
  },
  {
    title: 'Booking Logs',
    icon: FileText,
    href: '/studio/booking-logs',
    roles: ['admin', 'owner']
  },
  {
    title: 'Offline Transactions',
    icon: CreditCard,
    href: '/studio/offline-transactions',
    roles: ['admin', 'owner', 'keuangan']
  },
  {
    title: 'Transaction Reports',
    icon: BarChart3,
    href: '/transactions/reports',
    roles: ['admin', 'owner', 'keuangan']
  },
  {
    title: 'Online Bookings Report',
    icon: FileText,
    href: '/transactions/online-bookings',
    roles: ['admin', 'owner', 'keuangan']
  },
  {
    title: 'Offline Bookings Report',
    icon: FileText,
    href: '/transactions/offline-bookings',
    roles: ['admin', 'owner', 'keuangan']
  },
  {
    title: 'Transaction History',
    icon: CreditCard,
    href: '/transactions',
    roles: ['admin', 'owner', 'keuangan']
  },
  {
    title: 'Monthly Recaps',
    icon: BarChart3,
    href: '/recaps',
    roles: ['admin', 'owner', 'keuangan']
  },
  {
    title: 'Customer Management',
    icon: Users,
    href: '/admin/customers',
    roles: ['admin', 'owner']
  },
  {
    title: 'User Management',
    icon: UserPlus,
    href: '/admin/users',
    roles: ['admin', 'owner']
  },
  {
    title: 'Payment Providers',
    icon: CreditCard,
    href: '/admin/payment-providers',
    roles: ['admin', 'owner']
  }
];

// Helper function to get accessible navigation based on user role
export const getAccessibleNavigation = (userRole: string) => {
  return navigationItems
    .filter(item => item.roles.includes(userRole as any))
    .map(item => ({
      name: item.title,
      href: item.href,
      icon: item.icon,
      children: [] // For future use if we add nested navigation
    }));
};
