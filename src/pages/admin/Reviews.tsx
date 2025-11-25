import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Check, X, Star, ThumbsUp } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface Review {
  id: string;
  product_id: string;
  customer_name: string;
  customer_email: string;
  rating: number;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  is_approved: boolean;
  helpful_count?: number;
  created_at: string;
  products?: {
    name: string;
  };
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');

  useEffect(() => {
    loadReviews();
  }, [filter]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('product_reviews')
        .select('*, products(name)')
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('is_approved', false);
      } else if (filter === 'approved') {
        query = query.eq('is_approved', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReviews(data || []);
    } catch (error: any) {
      toast.error('Failed to load reviews: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const approveReview = async (id: string) => {
    try {
      const { error } = await supabase
        .from('product_reviews')
        .update({ is_approved: true })
        .eq('id', id);

      if (error) throw error;

      toast.success('Review approved');
      await loadReviews();
    } catch (error: any) {
      toast.error('Failed to approve review: ' + error.message);
    }
  };

  const rejectReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const { error } = await supabase
        .from('product_reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Review deleted');
      await loadReviews();
    } catch (error: any) {
      toast.error('Failed to delete review: ' + error.message);
    }
  };

  const unapproveReview = async (id: string) => {
    try {
      const { error } = await supabase
        .from('product_reviews')
        .update({ is_approved: false })
        .eq('id', id);

      if (error) throw error;

      toast.success('Review unapproved');
      await loadReviews();
    } catch (error: any) {
      toast.error('Failed to unapprove review: ' + error.message);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading reviews...</p>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold">Product Reviews</h1>
          </div>

          <Tabs value={filter} onValueChange={(v: any) => setFilter(v)} className="space-y-6">
            <TabsList>
              <TabsTrigger value="pending">
                Pending {reviews.filter(r => !r.is_approved).length > 0 && `(${reviews.filter(r => !r.is_approved).length})`}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="all">All Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="space-y-4">
              {reviews.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">
                      No {filter === 'pending' ? 'pending' : filter === 'approved' ? 'approved' : ''} reviews
                    </p>
                  </CardContent>
                </Card>
              ) : (
                reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              {renderStars(review.rating)}
                              <span className="font-semibold">{review.rating}/5</span>
                            </div>
                            {review.is_verified_purchase && (
                              <Badge variant="secondary" className="text-xs">
                                Verified Purchase
                              </Badge>
                            )}
                            {review.is_approved ? (
                              <Badge variant="default">Approved</Badge>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                          </div>

                          <h3 className="font-semibold text-lg mb-2">{review.title || 'Untitled Review'}</h3>
                          <p className="text-muted-foreground mb-3">{review.comment}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Product:</span>{' '}
                              <span className="font-semibold">{review.products?.name}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Customer:</span>{' '}
                              <span className="font-semibold">{review.customer_name}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Date:</span>{' '}
                              <span className="font-semibold">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{review.helpful_count} helpful</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {!review.is_approved ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => approveReview(review.id)}
                                className="bg-success hover:bg-success/90"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => rejectReview(review.id)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => unapproveReview(review.id)}
                              >
                                Unapprove
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => rejectReview(review.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
      </div>
    </AdminLayout>
  );
}
