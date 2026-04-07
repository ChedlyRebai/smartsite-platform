import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckoutSimulator() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(8);

  // Get parameters from URL
  const amount = searchParams.get('amount') || "0";
  const description = searchParams.get('description') || "Payment";
  const successUrl = searchParams.get('successUrl') || "payments?success=true";
  const cancelUrl = searchParams.get('cancelUrl') || "payments?canceled=true";

  // Convert amount to number and format as currency
  const formattedAmount = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(parseFloat(amount));

  // Handle successful payment after countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Use window.location to ensure full page navigation
          window.location.href = `/${successUrl}`;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [successUrl]);

  // Handle cancel payment
  const handleCancel = () => {
    window.location.href = `/${cancelUrl}`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Card className="w-[450px]">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="text-xl flex items-center">
            <span className="mr-2">💳</span> Paiement Sécurisé
          </CardTitle>
          <CardDescription>
            Simulation de paiement pour test
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-500">Description:</span>
            <span>{description}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-500">Montant:</span>
            <span className="font-bold text-lg">{formattedAmount}</span>
          </div>
          <div className="border rounded-md p-4 bg-green-50 text-green-700 text-center mt-4">
            Simulation en cours... Redirection dans {countdown} secondes
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleCancel}>Annuler</Button>
          <Button onClick={() => window.location.href = `/${successUrl}`}>Payer maintenant</Button>
        </CardFooter>
      </Card>
    </div>
  );
}