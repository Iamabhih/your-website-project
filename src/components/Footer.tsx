import { Leaf } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-natural-deep text-primary-foreground py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="h-8 w-8 text-secondary" />
              <span className="text-2xl font-bold">Ideal Smoke Supply</span>
            </div>
            <p className="text-primary-foreground/80 mb-4 leading-relaxed">
              Your trusted source for premium vaping and smoking products.
              Bringing you quality vapes, e-liquids, and accessories since 2024.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><a href="#" className="hover:text-secondary transition-colors">Shop All</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Lab Results</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Support</h3>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><a href="#" className="hover:text-secondary transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Shipping</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Returns</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 pt-8 text-center text-primary-foreground/70">
          <p>&copy; 2024 Ideal Smoke Supply. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
