import { Leaf, Mail, Phone, MapPin, Facebook, Instagram, Twitter } from "lucide-react";
import { Link } from "react-router-dom";
import { useStoreSettings } from "@/hooks/useStoreSettings";

const Footer = () => {
  const { data: settings } = useStoreSettings();
  const currentYear = new Date().getFullYear();

  const storeName = settings?.store_name || 'Ideal Smoke Supply';
  const storeDescription = settings?.store_description || 'Your trusted source for premium vaping and smoking products.';

  const hasAddress = settings?.store_address || settings?.store_city;
  const fullAddress = [
    settings?.store_address,
    settings?.store_city,
    settings?.store_province,
    settings?.store_postal_code,
  ].filter(Boolean).join(', ');

  return (
    <footer className="bg-natural-deep text-primary-foreground py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-5 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="h-8 w-8 text-secondary" />
              <span className="text-2xl font-bold">{storeName}</span>
            </div>
            <p className="text-primary-foreground/80 mb-4 leading-relaxed">
              {storeDescription}
            </p>

            {/* Contact Info */}
            <div className="space-y-2 text-primary-foreground/80 text-sm">
              {settings?.store_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${settings.store_email}`} className="hover:text-secondary transition-colors">
                    {settings.store_email}
                  </a>
                </div>
              )}
              {settings?.store_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${settings.store_phone}`} className="hover:text-secondary transition-colors">
                    {settings.store_phone}
                  </a>
                </div>
              )}
              {hasAddress && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{fullAddress}</span>
                </div>
              )}
            </div>

            {/* Social Links */}
            {(settings?.social_facebook || settings?.social_instagram || settings?.social_twitter) && (
              <div className="flex gap-4 mt-4">
                {settings.social_facebook && (
                  <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {settings.social_instagram && (
                  <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {settings.social_twitter && (
                  <a href={settings.social_twitter} target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><Link to="/shop" className="hover:text-secondary transition-colors">Shop All</Link></li>
              <li><Link to="/about" className="hover:text-secondary transition-colors">About Us</Link></li>
              <li><Link to="/support" className="hover:text-secondary transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Support</h3>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><Link to="/support" className="hover:text-secondary transition-colors">FAQ</Link></li>
              <li><Link to="/delivery" className="hover:text-secondary transition-colors">Shipping</Link></li>
              <li><Link to="/return-policy" className="hover:text-secondary transition-colors">Returns</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Legal</h3>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><Link to="/privacy-policy" className="hover:text-secondary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-secondary transition-colors">Terms of Service</Link></li>
              <li><Link to="/cookie-policy" className="hover:text-secondary transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-8 text-center text-primary-foreground/70">
          <p>&copy; {currentYear} {storeName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
