import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QrCode, CheckCircle, ExternalLink, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function TelegramLink() {
  const { user } = useAuth();
  const [isLinked, setIsLinked] = useState(false);
  const [linkingCode, setLinkingCode] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkLinkStatus();
      generateLinkingCode();
    }
  }, [user]);

  const checkLinkStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("telegram_customers")
        .select("*")
        .eq("customer_email", user.email)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      setIsLinked(!!data);
    } catch (error) {
      console.error("Error checking link status:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateLinkingCode = () => {
    if (!user?.id) return;
    // Create a unique linking code based on user ID
    const code = btoa(user.id).replace(/=/g, "").substring(0, 12);
    setLinkingCode(code);
  };

  const botUsername = "YourBot"; // Replace with actual bot username from env
  const deepLink = `https://t.me/${botUsername}?start=link_${linkingCode}`;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Link Telegram Account</h1>
            <p className="text-muted-foreground">
              Connect your Telegram account to receive order updates and notifications
            </p>
          </div>

          {loading ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center">Loading...</p>
              </CardContent>
            </Card>
          ) : isLinked ? (
            <Card>
              <CardContent className="p-8 text-center space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">Account Linked!</h2>
                  <p className="text-muted-foreground">
                    Your Telegram account is successfully linked to your account.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => window.open(`https://t.me/${botUsername}`, "_blank")}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Open Telegram Bot
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>How to Link Your Account</CardTitle>
                  <CardDescription>Follow these simple steps to connect your Telegram</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Click the button below or scan the QR code</p>
                        <p className="text-sm text-muted-foreground">This will open our Telegram bot</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        2
                      </div>
                      <div>
                        <p className="font-medium">Press the "Start" button in Telegram</p>
                        <p className="text-sm text-muted-foreground">Your account will be automatically linked</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        3
                      </div>
                      <div>
                        <p className="font-medium">Start receiving updates!</p>
                        <p className="text-sm text-muted-foreground">Get notified about orders, promotions, and more</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5" />
                      Open in Telegram
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Click the button below to open our bot directly in Telegram
                    </p>
                    <Button
                      className="w-full"
                      onClick={() => window.open(deepLink, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Link via Telegram
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <QrCode className="w-5 h-5" />
                      Scan QR Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Or scan this QR code with your phone's camera
                    </p>
                    <div className="bg-white p-4 rounded-lg inline-block">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(deepLink)}`}
                        alt="QR Code"
                        className="w-48 h-48 mx-auto"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Benefits of Linking</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Receive instant order status updates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Get notified when products are back in stock</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Track your orders directly from Telegram</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Receive exclusive promotions and offers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Quick access to customer support</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
