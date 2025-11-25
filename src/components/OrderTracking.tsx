import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Truck, MapPin, Calendar, ExternalLink, Clock } from 'lucide-react';

interface TrackingInfo {
  tracking_number: string | null;
  courier: string | null;
  estimated_delivery_date: string | null;
  actual_delivery_date: string | null;
  tracking_url: string | null;
  last_location: string | null;
}

interface StatusHistory {
  id: string;
  old_status: string | null;
  new_status: string;
  notes: string | null;
  changed_at: string;
}

interface OrderTrackingProps {
  orderId: string;
}

export default function OrderTracking({ orderId }: OrderTrackingProps) {
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrackingData();
  }, [orderId]);

  const loadTrackingData = async () => {
    // Load tracking information
    const { data: tracking } = await supabase
      .from('order_tracking')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (tracking) {
      setTrackingInfo(tracking);
    }

    // Load status history
    const { data: history } = await supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', orderId)
      .order('changed_at', { ascending: false });

    if (history) {
      setStatusHistory(history);
    }

    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <Package className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <MapPin className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string): "default" | "secondary" | "destructive" => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading tracking information...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tracking Information Card */}
      {trackingInfo && (trackingInfo.tracking_number || trackingInfo.courier) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Tracking Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {trackingInfo.courier && (
                <div>
                  <p className="text-sm text-muted-foreground">Courier</p>
                  <p className="font-semibold">{trackingInfo.courier}</p>
                </div>
              )}
              {trackingInfo.tracking_number && (
                <div>
                  <p className="text-sm text-muted-foreground">Tracking Number</p>
                  <p className="font-mono text-sm">{trackingInfo.tracking_number}</p>
                </div>
              )}
            </div>

            {trackingInfo.last_location && (
              <div>
                <p className="text-sm text-muted-foreground">Last Known Location</p>
                <p className="font-semibold flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {trackingInfo.last_location}
                </p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              {trackingInfo.estimated_delivery_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(trackingInfo.estimated_delivery_date).toLocaleDateString('en-ZA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
              {trackingInfo.actual_delivery_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Delivered On</p>
                  <p className="font-semibold text-success flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(trackingInfo.actual_delivery_date).toLocaleDateString('en-ZA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>

            {trackingInfo.tracking_url && (
              <div className="pt-2">
                <a href={trackingInfo.tracking_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Track Package
                  </Button>
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status History Card */}
      {statusHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Status History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusHistory.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex gap-4 ${
                    index !== statusHistory.length - 1 ? 'border-l-2 border-muted pl-4 pb-4' : 'pl-4'
                  }`}
                >
                  <div className="flex-shrink-0 -ml-[25px] mt-1">
                    <div className="bg-background border-2 border-primary rounded-full p-1">
                      {getStatusIcon(item.new_status)}
                    </div>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getStatusColor(item.new_status)} className="capitalize">
                        {item.new_status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.changed_at).toLocaleString('en-ZA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {item.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
