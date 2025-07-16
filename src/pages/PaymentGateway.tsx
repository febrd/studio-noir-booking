import { useState } from 'react';
import { Header } from '@/components/Layout/Header';
import { Sidebar } from '@/components/Layout/Sidebar';
import { PaymentProviderCard } from '@/components/PaymentGateway/PaymentProviderCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search } from 'lucide-react';

interface PaymentProvider {
  id: number;
  name: string;
  clientId: string;
  clientSecret: string;
  serverKey: string;
  environment: 'sandbox' | 'production';
  status: 'active' | 'inactive';
  createdAt: string;
}

const mockProviders: PaymentProvider[] = [
  {
    id: 1,
    name: 'Midtrans',
    clientId: 'mid_client_12345',
    clientSecret: 'mid_secret_abcdef',
    serverKey: 'mid_server_xyz789',
    environment: 'sandbox',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Xendit',
    clientId: 'xen_client_67890',
    clientSecret: 'xen_secret_ghijkl',
    serverKey: 'xen_server_abc123',
    environment: 'production',
    status: 'inactive',
    createdAt: '2024-01-05T00:00:00Z',
  },
];

const PaymentGateway = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [providers, setProviders] = useState<PaymentProvider[]>(mockProviders);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<PaymentProvider | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    clientId: '',
    clientSecret: '',
    serverKey: '',
    environment: 'sandbox' as 'sandbox' | 'production',
    status: 'active' as 'active' | 'inactive',
  });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const filteredProviders = providers.filter(provider =>
    provider.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (provider: PaymentProvider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      clientId: provider.clientId,
      clientSecret: provider.clientSecret,
      serverKey: provider.serverKey,
      environment: provider.environment,
      status: provider.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setProviders(providers.filter(p => p.id !== id));
  };

  const handleToggleStatus = (id: number, status: 'active' | 'inactive') => {
    setProviders(providers.map(p => 
      p.id === id ? { ...p, status } : p
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProvider) {
      // Update existing provider
      setProviders(providers.map(p => 
        p.id === editingProvider.id 
          ? { ...p, ...formData }
          : p
      ));
    } else {
      // Create new provider
      const newProvider: PaymentProvider = {
        id: Math.max(...providers.map(p => p.id)) + 1,
        ...formData,
        createdAt: new Date().toISOString(),
      };
      setProviders([...providers, newProvider]);
    }

    setIsDialogOpen(false);
    setEditingProvider(null);
    setFormData({
      name: '',
      clientId: '',
      clientSecret: '',
      serverKey: '',
      environment: 'sandbox',
      status: 'active',
    });
  };

  const openCreateDialog = () => {
    setEditingProvider(null);
    setFormData({
      name: '',
      clientId: '',
      clientSecret: '',
      serverKey: '',
      environment: 'sandbox',
      status: 'active',
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="lg:ml-64">
        <Header onMenuToggle={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        
        <main className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-semibold text-elegant">Payment Gateway Management</h1>
              <p className="text-muted-foreground mt-1">Manage payment providers and their configurations</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog} className="hover-scale">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Provider
                </Button>
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingProvider ? 'Edit Payment Provider' : 'Add Payment Provider'}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Provider Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., Midtrans"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="clientId">Client ID</Label>
                    <Input
                      id="clientId"
                      value={formData.clientId}
                      onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                      placeholder="Client ID from provider"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="clientSecret">Client Secret</Label>
                    <Input
                      id="clientSecret"
                      type="password"
                      value={formData.clientSecret}
                      onChange={(e) => setFormData({...formData, clientSecret: e.target.value})}
                      placeholder="Client Secret from provider"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="serverKey">Server Key</Label>
                    <Input
                      id="serverKey"
                      type="password"
                      value={formData.serverKey}
                      onChange={(e) => setFormData({...formData, serverKey: e.target.value})}
                      placeholder="Server Key from provider"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="environment">Environment</Label>
                    <Select value={formData.environment} onValueChange={(value: 'sandbox' | 'production') => setFormData({...formData, environment: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sandbox">Sandbox</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1">
                      {editingProvider ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payment providers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Providers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map((provider) => (
              <PaymentProviderCard
                key={provider.id}
                provider={provider}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>

          {filteredProviders.length === 0 && (
            <Card className="glass-elegant">
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No payment providers found.</p>
                <Button onClick={openCreateDialog} variant="outline" className="mt-4 hover-scale">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Provider
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default PaymentGateway;