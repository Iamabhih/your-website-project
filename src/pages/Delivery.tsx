import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Clock, MapPin, ShieldCheck } from 'lucide-react';

export default function Delivery() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8">
            Delivery Information
          </h1>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <Package className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Safe Packaging</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  All orders are packaged discreetly and securely to ensure your products arrive in perfect condition.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Fast Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Orders are typically processed within 1-2 business days after payment confirmation.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MapPin className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Nationwide Delivery</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We deliver to all major cities and towns across South Africa through trusted courier services.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <ShieldCheck className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Order Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track your order status and delivery progress through your account dashboard.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Delivery Times & Costs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Delivery times and costs vary depending on your location and chosen delivery method. Select your preferred option at checkout.
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Major cities: 2-4 business days</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Regional areas: 3-7 business days</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Remote areas: 5-10 business days</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Important Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                <strong className="text-foreground">Age Verification:</strong> A signature is required upon delivery to confirm you are 18 years or older.
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Incomplete Deliveries:</strong> If you're not available, the courier will leave a notification card for re-delivery or collection.
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Damaged Goods:</strong> Please inspect your order upon delivery. Contact us immediately if there are any issues.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
