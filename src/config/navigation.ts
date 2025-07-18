import { 
  Home, 
  CreditCard, 
  Users, 
  Building2, 
  Receipt, 
  Calendar,
  Settings,
  Package,
  FolderOpen,
  BarChart3,
  Tags,
  Plus,
  DollarSign,
  Activity
} from 'lucide-react';

export interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  allowedRoles: ('owner' | 'admin' | 'keuangan' | 'pelanggan')[];
  children?: NavigationItem[];
}

export const navigationConfig: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
    allowedRoles: ['owner', 'admin', 'keuangan', 'pelanggan']
  },
  {
    name: 'Payment Gateway',
    href: '/payment-gateway',
    icon: CreditCard,
    allowedRoles: ['owner', 'admin', 'keuangan']
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
    allowedRoles: ['owner', 'admin']
  },
  {
    name: 'Studio Management',
    href: '/studio',
    icon: Building2,
    allowedRoles: ['owner', 'admin'],
    children: [
      {
        name: 'Studios',
        href: '/studio/studios',
        icon: Building2,
        allowedRoles: ['owner', 'admin']
      },
      {
        name: 'Package Categories',
        href: '/studio/categories',
        icon: FolderOpen,
        allowedRoles: ['owner', 'admin']
      },
      {
        name: 'Packages',
        href: '/studio/packages',
        icon: Package,
        allowedRoles: ['owner', 'admin']
      },
      {
        name: 'Additional Services',
        href: '/studio/services',
        icon: Settings,
        allowedRoles: ['owner', 'admin']
      },
      {
        name: 'Bookings',
        href: '/studio/bookings',
        icon: Calendar,
        allowedRoles: ['owner', 'admin']
      }
    ]
  },
  {
    name: 'Transactions',
    href: '/transactions',
    icon: Receipt,
    allowedRoles: ['owner', 'admin', 'keuangan'],
    children: [
      {
        name: 'Online Bookings',
        href: '/transactions/online',
        icon: Receipt,
        allowedRoles: ['owner', 'admin', 'keuangan']
      },
      {
        name: 'Offline Bookings',
        href: '/transactions/offline',
        icon: Receipt,
        allowedRoles: ['owner', 'admin', 'keuangan']
      },
      {
        name: 'Reports',
        href: '/transactions/reports',
        icon: Receipt,
        allowedRoles: ['owner', 'admin', 'keuangan']
      }
    ]
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: Calendar,
    allowedRoles: ['owner', 'admin', 'keuangan']
  }
];

export const studioManagementItems = [
  {
    title: "Dashboard",
    url: "/studio",
    icon: BarChart3,
  },
  {
    title: "Studios",
    url: "/studio/studios",
    icon: Building2,
  },
  {
    title: "Kategori Paket",
    url: "/studio/categories",
    icon: Tags,
  },
  {
    title: "Paket Studio",
    url: "/studio/packages",
    icon: Package,
  },
  {
    title: "Layanan Tambahan",
    url: "/studio/services",
    icon: Plus,
  },
  {
    title: "Bookings",
    url: "/studio/bookings",
    icon: Calendar,
  },
  {
    title: "Transaksi Offline",
    url: "/studio/transactions",
    icon: DollarSign,
  },
  {
    title: "Log Aktivitas",
    url: "/studio/logs",
    icon: Activity,
  },
];

export const getAccessibleNavigation = (userRole: string): NavigationItem[] => {
  return navigationConfig.filter(item => 
    item.allowedRoles.includes(userRole as any)
  ).map(item => ({
    ...item,
    children: item.children?.filter(child => 
      child.allowedRoles.includes(userRole as any)
    )
  }));
};
