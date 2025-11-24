import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MessageCircle, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useStoreSettings } from '@/hooks/useStoreSettings';

export default function Support() {
  const { data: settings } = useStoreSettings();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success('Message sent! We\'ll get back to you soon.');
    e.currentTarget.reset();
  };

  const storeEmail = settings?.store_email || 'support@idealsmokesupply.com';
  const storePhone = settings?.store_phone || '+27 12 345 6789';
  const businessHours = settings?.business_hours_weekday || '08:00 - 17:00';

  const hasAddress = settings?.store_address || settings?.store_city;
  const fullAddress = [
    settings?.store_address,
    settings?.store_city,
    settings?.store_province,
    settings?.store_postal_code,
  ].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8">
            Support
          </h1>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="text-center">
                <Mail className="h-10 w-10 text-primary mx-auto mb-2" />
                <CardTitle>Email Us</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <a href={`mailto:${storeEmail}`} className="text-primary hover:underline">
                  {storeEmail}
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Phone className="h-10 w-10 text-primary mx-auto mb-2" />
                <CardTitle>Call Us</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <a href={`tel:${storePhone.replace(/\s/g, '')}`} className="text-primary hover:underline">
                  {storePhone}
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Clock className="h-10 w-10 text-primary mx-auto mb-2" />
                <CardTitle>Business Hours</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-sm text-muted-foreground">
                <p><strong>Mon-Fri:</strong> {settings?.business_hours_weekday || '08:00 - 17:00'}</p>
                <p><strong>Sat:</strong> {settings?.business_hours_saturday || '09:00 - 14:00'}</p>
                <p><strong>Sun:</strong> {settings?.business_hours_sunday || 'Closed'}</p>
              </CardContent>
            </Card>
          </div>

          {hasAddress && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Our Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{fullAddress}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" name="subject" required />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" name="message" rows={5} required />
                </div>
                <Button type="submit" className="w-full">
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
