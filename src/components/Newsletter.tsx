import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";

const Newsletter = () => {
  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          <Mail className="h-16 w-16 mx-auto mb-6 animate-float" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Stay Connected with Wellness
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 leading-relaxed">
            Subscribe to our newsletter for exclusive offers, wellness tips, and the latest CBD insights 
            delivered straight to your inbox.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <Input
              type="email"
              placeholder="Enter your email address"
              className="bg-primary-foreground text-foreground border-none h-12 text-lg flex-1"
            />
            <Button 
              size="lg"
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 h-12 px-8 whitespace-nowrap"
            >
              Subscribe Now
            </Button>
          </div>
          
          <p className="text-sm text-primary-foreground/70 mt-4">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
