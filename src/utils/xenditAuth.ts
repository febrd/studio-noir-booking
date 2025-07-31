
import { supabase } from '@/integrations/supabase/client';

export interface XenditTestResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface XenditProvider {
  id: string;
  name: string;
  environment: 'sandbox' | 'production';
  api_url?: string;
}

export class XenditAuthClient {
  // Test connection to Xendit using active production provider
  static async testConnection(): Promise<{
    provider?: XenditProvider;
    test: XenditTestResult;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('xendit-auth-test');

      if (error) {
        return {
          test: {
            success: false,
            error: error.message || 'Failed to test connection'
          }
        };
      }

      return data;
    } catch (error) {
      return {
        test: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }

  // Test connection for specific provider
  static async testProviderConnection(providerId: string): Promise<{
    provider?: XenditProvider;
    test: XenditTestResult;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('xendit-test-provider', {
        body: { providerId }
      });

      if (error) {
        return {
          test: {
            success: false,
            error: error.message || 'Failed to test connection'
          }
        };
      }

      return data;
    } catch (error) {
      return {
        test: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }

  // Get active production provider for general use
  static async getActiveProvider(): Promise<XenditProvider | null> {
    try {
      const { data: provider, error } = await supabase
        .from('payment_providers')
        .select('id, name, environment, api_url')
        .eq('environment', 'production')
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !provider) {
        return null;
      }

      return provider as XenditProvider;
    } catch (error) {
      console.error('Error getting active provider:', error);
      return null;
    }
  }
}
