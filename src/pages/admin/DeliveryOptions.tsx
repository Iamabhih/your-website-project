import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface DeliveryOption {
  id: string;
  name: string;
  description: string | null;
  cost: number;
  estimated_days: number;
  is_active: boolean;
}

export default function AdminDeliveryOptions() {
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DeliveryOption | null>(null);

  useEffect(() => {
    loadDeliveryOptions();
  }, []);

  const loadDeliveryOptions = async () => {
    const { data } = await supabase
      .from('delivery_options')
      .select('*')
      .order('cost');

    if (data) setDeliveryOptions(data);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const optionData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      cost: parseFloat(formData.get('cost') as string),
      estimated_days: parseInt(formData.get('estimated_days') as string),
      is_active: formData.get('is_active') === 'on',
    };

    if (editing) {
      const { error } = await supabase
        .from('delivery_options')
        .update(optionData)
        .eq('id', editing.id);

      if (error) {
        toast.error('Failed to update delivery option');
      } else {
        toast.success('Delivery option updated');
      }
    } else {
      const { error } = await supabase
        .from('delivery_options')
        .insert(optionData);

      if (error) {
        toast.error('Failed to create delivery option');
      } else {
        toast.success('Delivery option created');
      }
    }

    setOpen(false);
    setEditing(null);
    loadDeliveryOptions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this delivery option?')) return;

    const { error } = await supabase
      .from('delivery_options')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Deleted successfully');
      loadDeliveryOptions();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold">Delivery Options</h1>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditing(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Option
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editing ? 'Edit' : 'Add'} Delivery Option</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" name="name" defaultValue={editing?.name} required />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" defaultValue={editing?.description || ''} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cost">Cost (R) *</Label>
                      <Input id="cost" name="cost" type="number" step="0.01" defaultValue={editing?.cost} required />
                    </div>
                    <div>
                      <Label htmlFor="estimated_days">Est. Days *</Label>
                      <Input id="estimated_days" name="estimated_days" type="number" defaultValue={editing?.estimated_days} required />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="is_active" name="is_active" defaultChecked={editing?.is_active !== false} />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                  <Button type="submit" className="w-full">
                    {editing ? 'Update' : 'Create'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {deliveryOptions.map((option) => (
              <Card key={option.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{option.name}</h3>
                      {option.description && (
                        <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-sm">
                        <span><span className="text-muted-foreground">Cost:</span> R {option.cost.toFixed(2)}</span>
                        <span><span className="text-muted-foreground">Estimated:</span> {option.estimated_days} days</span>
                        <span className={option.is_active ? 'text-success' : 'text-red-600'}>
                          {option.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setEditing(option); setOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(option.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
      </div>
    </AdminLayout>
  );
}
