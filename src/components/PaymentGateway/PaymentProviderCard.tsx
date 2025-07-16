import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, Settings } from 'lucide-react';

interface PaymentProvider {
  id: number;
  name: string;
  clientId: string;
  environment: 'sandbox' | 'production';
  status: 'active' | 'inactive';
  createdAt: string;
}

interface PaymentProviderCardProps {
  provider: PaymentProvider;
  onEdit: (provider: PaymentProvider) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number, status: 'active' | 'inactive') => void;
}

export const PaymentProviderCard = ({
  provider,
  onEdit,
  onDelete,
  onToggleStatus,
}: PaymentProviderCardProps) => {
  const [isActive, setIsActive] = useState(provider.status === 'active');

  const handleToggle = (checked: boolean) => {
    setIsActive(checked);
    onToggleStatus(provider.id, checked ? 'active' : 'inactive');
  };

  return (
    <Card className="glass-card hover-lift">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-elegant">{provider.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant={provider.environment === 'production' ? 'default' : 'secondary'}
            >
              {provider.environment}
            </Badge>
            <Switch
              checked={isActive}
              onCheckedChange={handleToggle}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Client ID:</span>
            <span className="font-mono text-xs">
              {provider.clientId.substring(0, 8)}...
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Created:</span>
            <span>{new Date(provider.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(provider)}
            className="flex-1 hover-scale"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hover-scale"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(provider.id)}
            className="text-destructive hover:text-destructive hover-scale"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};