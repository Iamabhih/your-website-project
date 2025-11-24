import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Support() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success('Message sent! We\'ll get back to you soon.');
    e.currentTarget.reset();
  };

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
                <a href="mailto:support@idealsmokesupply.com" className="text-primary hover:underline">
                  support@idealsmokesupply.com
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Phone className="h-10 w-10 text-primary mx-auto mb-2" />
                <CardTitle>Call Us</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <a href="tel:+27123456789" className="text-primary hover:underline">
                  +27 12 345 6789
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <MessageCircle className="h-10 w-10 text-primary mx-auto mb-2" />
                <CardTitle>Live Chat</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                  Available Mon-Fri
                  <br />
                  9am - 5pm
                </p>
              </CardContent>
            </Card>
          </div>

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
