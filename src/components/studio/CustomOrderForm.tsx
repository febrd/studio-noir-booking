
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

const customOrderSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  studio_id: z.string().min(1, 'Studio is required'),
  payment_method: z.enum(['online', 'offline']),
  notes: z.string().optional(),
});

type CustomOrderFormData = z.infer<typeof customOrderSchema>;

interface AdditionalService {
  id: string;
  name: string;
  price: number;
  description?: string;
}

interface SelectedService {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CustomOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingOrder?: any;
}

const CustomOrderForm: React.FC<CustomOrderFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingOrder
}) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [studios, setStudios] = useState<any[]>([]);
  const [additionalServices, setAdditionalServices] = useState<AdditionalService[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CustomOrderFormData>({
    resolver: zodResolver(customOrderSchema),
    defaultValues: {
      customer_id: '',
      studio_id: '',
      payment_method: 'offline',
      notes: ''
    }
  });

  const selectedStudioId = watch('studio_id');

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      fetchStudios();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedStudioId) {
      fetchAdditionalServices(selectedStudioId);
    }
  }, [selectedStudioId]);

  useEffect(() => {
    if (editingOrder) {
      setValue('customer_id', editingOrder.customer_id);
      setValue('studio_id', editingOrder.studio_id);
      setValue('payment_method', editingOrder.payment_method);
      setValue('notes', editingOrder.notes || '');
      
      // Load selected services for editing
      if (editingOrder.custom_order_services) {
        const services = editingOrder.custom_order_services.map((service: any) => ({
          id: service.additional_service_id,
          name: service.additional_services?.name || '',
          price: service.unit_price,
          quantity: service.quantity
        }));
        setSelectedServices(services);
      }
    }
  }, [editingOrder, setValue]);

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from('customer_profiles')
      .select('*')
      .eq('is_active', true)
      .order('full_name');
    setCustomers(data || []);
  };

  const fetchStudios = async () => {
    const { data } = await supabase
      .from('studios')
      .select('*')
      .eq('is_active', true)
      .order('name');
    setStudios(data || []);
  };

  const fetchAdditionalServices = async (studioId: string) => {
    const { data } = await supabase
      .from('additional_services')
      .select('*')
      .eq('studio_id', studioId)
      .order('name');
    setAdditionalServices(data || []);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.email) {
      toast.error('Name and email are required');
      return;
    }

    const { data, error } = await supabase
      .from('customer_profiles')
      .insert([{
        full_name: newCustomer.name,
        email: newCustomer.email
      }])
      .select()
      .single();

    if (error) {
      toast.error('Failed to create customer');
      return;
    }

    setCustomers([...customers, data]);
    setValue('customer_id', data.id);
    setShowNewCustomerForm(false);
    setNewCustomer({ name: '', email: '' });
    toast.success('Customer created successfully');
  };

  const handleServiceToggle = (service: AdditionalService) => {
    const existing = selectedServices.find(s => s.id === service.id);
    if (existing) {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, {
        id: service.id,
        name: service.name,
        price: service.price,
        quantity: 1
      }]);
    }
  };

  const updateServiceQuantity = (serviceId: string, quantity: number) => {
    if (quantity < 1) return;
    setSelectedServices(selectedServices.map(s => 
      s.id === serviceId ? { ...s, quantity } : s
    ));
  };

  const calculateTotal = () => {
    return selectedServices.reduce((total, service) => 
      total + (service.price * service.quantity), 0
    );
  };

  const onSubmit = async (data: CustomOrderFormData) => {
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    setLoading(true);
    const totalAmount = calculateTotal();

    try {
      let customOrderId = editingOrder?.id;

      if (editingOrder) {
        // Update existing order
        const { error: updateError } = await supabase
          .from('custom_orders')
          .update({
            customer_id: data.customer_id,
            studio_id: data.studio_id,
            payment_method: data.payment_method,
            total_amount: totalAmount,
            notes: data.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingOrder.id);

        if (updateError) throw updateError;

        // Delete existing services
        await supabase
          .from('custom_order_services')
          .delete()
          .eq('custom_order_id', editingOrder.id);
      } else {
        // Create new order
        const { data: orderData, error: orderError } = await supabase
          .from('custom_orders')
          .insert([{
            customer_id: data.customer_id,
            studio_id: data.studio_id,
            payment_method: data.payment_method,
            total_amount: totalAmount,
            notes: data.notes
          }])
          .select()
          .single();

        if (orderError) throw orderError;
        customOrderId = orderData.id;
      }

      // Insert services
      const servicesData = selectedServices.map(service => ({
        custom_order_id: customOrderId,
        additional_service_id: service.id,
        quantity: service.quantity,
        unit_price: service.price,
        total_price: service.price * service.quantity
      }));

      const { error: servicesError } = await supabase
        .from('custom_order_services')
        .insert(servicesData);

      if (servicesError) throw servicesError;

      toast.success(editingOrder ? 'Order updated successfully' : 'Order created successfully');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Failed to save order');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedServices([]);
    setShowNewCustomerForm(false);
    setNewCustomer({ name: '', email: '' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingOrder ? 'Edit Custom Order' : 'Create Custom Order'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer Selection */}
          <div className="space-y-4">
            <Label>Customer</Label>
            {!showNewCustomerForm ? (
              <div className="flex gap-2">
                <Controller
                  name="customer_id"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.full_name} ({customer.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewCustomerForm(true)}
                >
                  New Customer
                </Button>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Create New Customer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                      placeholder="Customer name"
                    />
                  </div>
                  <div>
                    <Label>Email/WhatsApp *</Label>
                    <Input
                      type="text"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                      placeholder="customer@email.com or WhatsApp number"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" onClick={handleCreateCustomer}>
                      Create Customer
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewCustomerForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {errors.customer_id && (
              <p className="text-sm text-red-500">{errors.customer_id.message}</p>
            )}
          </div>

          {/* Studio Selection */}
          <div className="space-y-2">
            <Label>Studio</Label>
            <Controller
              name="studio_id"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select studio" />
                  </SelectTrigger>
                  <SelectContent>
                    {studios.map(studio => (
                      <SelectItem key={studio.id} value={studio.id}>
                        {studio.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.studio_id && (
              <p className="text-sm text-red-500">{errors.studio_id.message}</p>
            )}
          </div>

          {/* Additional Services */}
          {selectedStudioId && (
            <div className="space-y-4">
              <Label>Additional Services</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {additionalServices.map(service => {
                  const selected = selectedServices.find(s => s.id === service.id);
                  return (
                    <Card key={service.id} className={selected ? 'border-primary' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={!!selected}
                            onCheckedChange={() => handleServiceToggle(service)}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{service.name}</h4>
                            <p className="text-sm text-gray-600">
                              Rp {service.price.toLocaleString()}
                            </p>
                            {service.description && (
                              <p className="text-sm text-gray-500 mt-1">
                                {service.description}
                              </p>
                            )}
                            {selected && (
                              <div className="flex items-center gap-2 mt-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateServiceQuantity(service.id, selected.quantity - 1)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="px-2">{selected.quantity}</span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateServiceQuantity(service.id, selected.quantity + 1)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Controller
              name="payment_method"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder="Additional notes..."
                  rows={3}
                />
              )}
            />
          </div>

          {/* Total */}
          {selectedServices.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Order Summary</h4>
              {selectedServices.map(service => (
                <div key={service.id} className="flex justify-between text-sm">
                  <span>{service.name} x {service.quantity}</span>
                  <span>Rp {(service.price * service.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>Rp {calculateTotal().toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingOrder ? 'Update Order' : 'Create Order'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomOrderForm;
