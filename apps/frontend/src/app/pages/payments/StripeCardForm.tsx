/**
 * StripeCardForm
 *
 * Renders a real Stripe Elements card form inside a Dialog modal.
 * Sensitive card data (number, expiry, CVC) goes directly to Stripe servers
 * via the Stripe.js SDK — it never touches the application backend.
 *
 * Flow:
 *  1. Parent calls backend POST /api/payments/stripe/create-payment-intent
 *     → receives { clientSecret }
 *  2. This component receives clientSecret as a prop and mounts Elements
 *  3. On submit, stripe.confirmCardPayment(clientSecret) is called
 *  4. On success, onSuccess(paymentIntentId) is called so the parent can
 *     persist the payment record
 */

import { useState, FormEvent } from "react";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Lock, CreditCard } from "lucide-react";

// ─── Stripe public key ────────────────────────────────────────────────────────
// Set VITE_STRIPE_PUBLISHABLE_KEY in .env file (get from Stripe dashboard)
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_YOUR_KEY_HERE"
);

// ─── Stripe Element shared style ──────────────────────────────────────────────
const ELEMENT_STYLE = {
  style: {
    base: {
      fontSize: "15px",
      color: "#1a1a1a",
      fontFamily: "'Inter', sans-serif",
      "::placeholder": { color: "#9ca3af" },
    },
    invalid: { color: "#ef4444" },
  },
};

// ─── Inner form (must be inside <Elements>) ───────────────────────────────────
interface InnerFormProps {
  clientSecret: string;
  amount: number;
  siteName: string;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

function InnerCardForm({ clientSecret, amount, siteName, onSuccess, onCancel }: InnerFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [cardholderName, setCardholderName] = useState("");
  const [nameError, setNameError] = useState("");
  const [stripeError, setStripeError] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStripeError("");

    if (!cardholderName.trim()) {
      setNameError("Cardholder name is required.");
      return;
    }
    setNameError("");

    if (!stripe || !elements) return;

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) return;

    setProcessing(true);

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardNumber,
        billing_details: { name: cardholderName.trim() },
      },
    });

    setProcessing(false);

    if (error) {
      setStripeError(error.message || "Payment failed. Please check your card details.");
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      onSuccess(paymentIntent.id);
    } else {
      setStripeError("Payment was not completed. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Summary */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm">
        <p className="text-blue-700 font-semibold text-base mb-1">Payment Summary</p>
        <div className="flex justify-between text-blue-800">
          <span>Site</span>
          <span className="font-medium">{siteName}</span>
        </div>
        <div className="flex justify-between text-blue-800 mt-1">
          <span>Amount</span>
          <span className="font-bold text-lg">{amount.toFixed(3)} DT</span>
        </div>
      </div>

      {/* Cardholder Name */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Cardholder Name *</label>
        <Input
          placeholder="Name as it appears on the card"
          value={cardholderName}
          onChange={(e) => {
            setCardholderName(e.target.value);
            if (e.target.value.trim()) setNameError("");
          }}
          className={nameError ? "border-red-500" : ""}
          autoComplete="cc-name"
        />
        {nameError && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {nameError}
          </p>
        )}
      </div>

      {/* Card Number */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Card Number *</label>
        <div className="flex items-center border rounded-md px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-500 bg-white">
          <CreditCard className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
          <div className="flex-1">
            <CardNumberElement options={ELEMENT_STYLE} />
          </div>
        </div>
      </div>

      {/* Expiry + CVC side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Expiry Date *</label>
          <div className="border rounded-md px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-500 bg-white">
            <CardExpiryElement options={ELEMENT_STYLE} />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">CVC *</label>
          <div className="border rounded-md px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-500 bg-white">
            <CardCvcElement options={ELEMENT_STYLE} />
          </div>
        </div>
      </div>

      {/* Stripe error */}
      {stripeError && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{stripeError}</span>
        </div>
      )}

      {/* Security note */}
      <p className="text-xs text-gray-400 flex items-center gap-1">
        <Lock className="h-3 w-3" />
        Your card details are encrypted and sent directly to Stripe. They never pass through our servers.
      </p>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={processing}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700"
          disabled={!stripe || processing}
        >
          {processing ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Processing…
            </span>
          ) : (
            `Pay ${amount.toFixed(3)} DT`
          )}
        </Button>
      </div>
    </form>
  );
}

// ─── Public component (wraps with <Elements>) ─────────────────────────────────
interface StripeCardFormProps {
  clientSecret: string;
  amount: number;
  siteName: string;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

export default function StripeCardForm(props: StripeCardFormProps) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret: props.clientSecret }}>
      <InnerCardForm {...props} />
    </Elements>
  );
}
