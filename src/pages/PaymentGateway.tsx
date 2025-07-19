import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from '@/components/ui/use-toast';
import { ModernLayout } from '@/components/Layout/ModernLayout';

const PaymentGateway = () => {
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');

  const queryClient = useQueryClient();

  const { data: paymentProviders, isLoading, isError } = useQuery({
    queryKey: ['paymentProviders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_providers')
        .select('*');

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });

  const createPaymentProviderMutation = useMutation(
    async () => {
      const { error } = await supabase
        .from('payment_providers')
        .insert([{ name, api_key: apiKey, secret_key: secretKey }]);

      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: () => {
        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey: ['paymentProviders'] });
        toast({
          title: "Success!",
          description: "Payment provider created successfully.",
        })
      },
      onError: (error: any) => {
        toast({
          title: "Failed!",
          description: error.message,
        })
      },
    }
  );

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await createPaymentProviderMutation.mutateAsync();
      // Clear form fields
      setName('');
      setApiKey('');
      setSecretKey('');
    } catch (error: any) {
      // Error handled in mutation
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error fetching payment providers.</div>;

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Gateways</h1>
          <p className="text-muted-foreground">
            Manage your payment gateway integrations here.
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Add Payment Provider</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Payment Provider</DialogTitle>
              <DialogDescription>
                Create a new payment provider to integrate with our system.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="apiKey" className="text-right">
                  API Key
                </Label>
                <Input
                  type="text"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="secretKey" className="text-right">
                  Secret Key
                </Label>
                <Input
                  type="text"
                  id="secretKey"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <Button type="submit" onClick={handleSubmit}>
              Create Payment Provider
            </Button>
          </DialogContent>
        </Dialog>

        <div className="mx-auto max-w-2xl">
          <Table>
            <TableCaption>A list of your payment providers.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Name</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Secret Key</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentProviders?.map((provider: any) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium">{provider.name}</TableCell>
                  <TableCell>{provider.api_key}</TableCell>
                  <TableCell>{provider.secret_key}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </ModernLayout>
  );
};

export default PaymentGateway;
