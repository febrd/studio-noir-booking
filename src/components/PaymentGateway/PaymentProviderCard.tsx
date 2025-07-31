
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, TestTube, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface PaymentProvider {
  id: string;
  name: string;
  client_id: string | null;
  client_secret: string | null;
  server_key: string | null;
  api_key: string | null;
  secret_key: string | null;
  public_key: string | null;
  api_url: string | null;
  environment: 'sandbox' | 'production';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface PaymentProviderCardProps {
  provider: PaymentProvider;
  onEdit: (provider: PaymentProvider) => void;
  onDelete: (id: string) => void;
}

// Xendit Authentication Helper
class XenditAuthHelper {
  private secretKey: string;
  private apiUrl: string;

  constructor(secretKey: string, apiUrl: string = 'https://api.xendit.co/v2/') {
    this.secretKey = secretKey;
    this.apiUrl = apiUrl;
  }

  getAuthHeader(): string {
    const credentials = `${this.secretKey}:`;
    const base64Credentials = btoa(credentials);
    return `Basic ${base64Credentials}`;
  }

  async testConnection(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('Testing Xendit connection to:', this.apiUrl);
      
      const response = await fetch(`${this.apiUrl}/invoices?limit=1`, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });
      
      const responseData = await response.json();

      console.log('Xendit API Response Status:', response.status);
      console.log('Xendit API Response:', responseData);

      if (response.ok) {
        return {
          success: true,
          data: {
            status: response.status,
            message: 'Koneksi berhasil ke Xendit API',
            invoices: responseData,
            timestamp: new Date().toISOString()
          }
        };
      } else {
        return {
          success: false,
          error: responseData.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      console.error('Xendit connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export const PaymentProviderCard = ({ provider, onEdit, onDelete }: PaymentProviderCardProps) => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const maskSecretKey = (key: string | null) => {
    if (!key) return 'Not set';
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '****' + key.substring(key.length - 4);
  };

  const handleTestConnection = async () => {
    if (!provider.secret_key) {
      toast.error('Secret key tidak ditemukan untuk testing koneksi');
      return;
    }

    setIsTestingConnection(true);
    console.log('Testing connection for provider:', provider.id);

    try {
      const xenditAuth = new XenditAuthHelper(
        provider.secret_key,
        provider.api_url || 'https://api.xendit.co'
      );

      const testResult = await xenditAuth.testConnection();

      console.log('Test connection result:', testResult);

      if (testResult.success) {
        toast.success(`✅ Koneksi berhasil ke Xendit API (${provider.environment})`);
        console.log('Test result data:', testResult.data);
      } else {
        toast.error(`❌ Test koneksi gagal: ${testResult.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Unexpected test error:', error);
      toast.error('Terjadi kesalahan saat testing koneksi');
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{provider.name}</CardTitle>
            <CardDescription>
              Diperbarui: {formatDate(provider.updated_at)}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge 
              variant={provider.environment === 'production' ? 'default' : 'secondary'}
            >
              {provider.environment}
            </Badge>
            <Badge 
              variant={provider.status === 'active' ? 'default' : 'destructive'}
            >
              {provider.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-muted-foreground">API Key:</span>
            <p className="text-xs font-mono bg-muted p-2 rounded mt-1">
              {maskSecretKey(provider.api_key)}
            </p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Secret Key:</span>
            <p className="text-xs font-mono bg-muted p-2 rounded mt-1">
              {maskSecretKey(provider.secret_key)}
            </p>
          </div>
        </div>
        
        {provider.public_key && (
          <div>
            <span className="font-medium text-muted-foreground">Public Key:</span>
            <p className="text-xs font-mono bg-muted p-2 rounded mt-1">
              {maskSecretKey(provider.public_key)}
            </p>
          </div>
        )}
        
        <div>
          <span className="font-medium text-muted-foreground">API URL:</span>
          <p className="text-xs text-blue-600 mt-1">
            {provider.api_url || 'https://api.xendit.co'}
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleTestConnection}
          disabled={isTestingConnection || !provider.secret_key}
          className="flex-1"
        >
          {isTestingConnection ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Testing...
            </>
          ) : (
            <>
              <TestTube className="h-4 w-4 mr-2" />
              Test Koneksi
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(provider)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(provider.id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
