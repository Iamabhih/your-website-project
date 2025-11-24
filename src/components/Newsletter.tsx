import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address")
});

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    const validation = emailSchema.safeParse({ email });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      // Check if email already exists
      const { data: existing } = await supabase
        .from("newsletter_subscribers")
        .select("email")
        .eq("email", email)
        .single();

      if (existing) {
        toast.error("This email is already subscribed!");
        setLoading(false);
        return;
      }

      // Insert new subscriber
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email, source: "homepage" });

      if (error) throw error;

      toast.success("Successfully subscribed to newsletter!");
      setEmail("");
    } catch (error: any) {
      console.error("Newsletter subscription error:", error);
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
          
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="bg-primary-foreground text-foreground border-none h-12 text-lg flex-1"
            />
            <Button 
              type="submit"
              size="lg"
              disabled={loading}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 h-12 px-8 whitespace-nowrap"
            >
              {loading ? "Subscribing..." : "Subscribe Now"}
            </Button>
          </form>
          
          <p className="text-sm text-primary-foreground/70 mt-4">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
