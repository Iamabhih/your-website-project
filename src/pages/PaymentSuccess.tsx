import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("order_id");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8 flex justify-center">
            <CheckCircle className="h-24 w-24 text-green-600" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Payment Successful!</CardTitle>
              <CardDescription className="text-lg">
                Thank you for your order
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
                <p className="font-semibold">What happens next?</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>You'll receive an order confirmation email shortly</li>
                  <li>We'll process your order within 1-2 business days</li>
                  <li>You'll receive tracking information once shipped</li>
                  <li>Track your order status in "My Orders"</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button
                  onClick={() => navigate("/my-orders")}
                  size="lg"
                >
                  View My Orders
                </Button>
                <Button
                  onClick={() => navigate("/shop")}
                  variant="outline"
                  size="lg"
                >
                  Continue Shopping
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
