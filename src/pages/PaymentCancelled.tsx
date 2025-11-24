import { useNavigate, useSearchParams } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PaymentCancelled() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("order_id");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8 flex justify-center">
            <XCircle className="h-24 w-24 text-red-600" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Payment Cancelled</CardTitle>
              <CardDescription className="text-lg">
                Your payment was not completed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {orderId && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Order Number</p>
                  <p className="text-2xl font-bold">{orderId.slice(0, 8).toUpperCase()}</p>
                </div>
              )}

              <div className="text-left space-y-2 bg-muted/50 p-4 rounded-lg">
                <p className="font-semibold">What happened?</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Your payment was cancelled or unsuccessful</li>
                  <li>No charges were made to your account</li>
                  <li>Your order has been saved but not confirmed</li>
                  <li>You can try again or contact support for help</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button
                  onClick={() => navigate("/checkout")}
                  size="lg"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => navigate("/support")}
                  variant="outline"
                  size="lg"
                >
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
