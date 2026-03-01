"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router";
import toast from "react-hot-toast";
import axios from "axios";

const formSchema = z.object({
  otp: z
    .string()
    .length(6, "Le code OTP doit contenir exactement 6 chiffres")
    .regex(/^\d+$/, "Le code OTP doit contenir uniquement des chiffres"),
});

type OTPFormData = z.infer<typeof formSchema>;

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [countdown, setCountdown] = React.useState(0);

  // Get CIN from navigation state
  const cin = location.state?.cin;
  const email = location.state?.email;

  React.useEffect(() => {
    if (!cin) {
      toast.error("Session expirée. Veuillez vous réinscrire.");
      navigate("/register");
    }
  }, [cin, navigate]);

  // Countdown timer for resend button
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const form = useForm<OTPFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: "",
    },
  });

  const onSubmit = async (data: OTPFormData) => {
    setIsLoading(true);
    try {
      const res = await axios.post("http://localhost:3000/auth/verify-otp", {
        cin: cin,
        otp: data.otp,
      });

      if (res.status === 201 || res.status === 200) {
        toast.success("Email vérifié avec succès! Vous pouvez maintenant vous connecter.");
        navigate("/login");
      }
    } catch (error: any) {
      console.error("Erreur vérification OTP:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Code OTP invalide ou expiré.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      const res = await axios.post("http://localhost:3000/auth/resend-otp", {
        cin: cin,
      });

      if (res.status === 201 || res.status === 200) {
        toast.success("Un nouveau code a été envoyé à votre email!");
        setCountdown(60); // 60 seconds cooldown
      }
    } catch (error: any) {
      console.error("Erreur renvoi OTP:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Impossible de renvoyer le code.";
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="h-screen flex min-h-full flex-1">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          <div>
            <img
              src="/logo.png"
              alt="SmartSite"
              className="h-16 w-16 object-contain"
            />
            <h2 className="mt-8 text-2xl font-bold leading-9 tracking-tight text-gray-900">
              Vérifiez votre email
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Un code de vérification à 6 chiffres a été envoyé à{" "}
              <span className="font-semibold">{email || "votre email"}</span>
            </p>
          </div>

          <div className="mt-10">
            <Card>
              <CardHeader>
                <CardTitle>Code de vérification</CardTitle>
                <CardDescription>
                  Entrez le code reçu par email pour finaliser votre inscription
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FieldGroup>
                    <Controller
                      name="otp"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="otp">Code OTP</FieldLabel>
                          <Input
                            {...field}
                            id="otp"
                            placeholder="123456"
                            maxLength={6}
                            className="text-center text-2xl tracking-widest"
                            aria-invalid={fieldState.invalid}
                            autoComplete="off"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                          <p className="text-sm text-gray-500 mt-2">
                            Le code est valide pendant 10 minutes
                          </p>
                        </Field>
                      )}
                    />
                  </FieldGroup>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Vérification en cours...
                      </>
                    ) : (
                      "Vérifier"
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Vous n'avez pas reçu le code ?{" "}
                      {countdown > 0 ? (
                        <span className="text-gray-400">
                          Renvoyer dans {countdown}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOTP}
                          disabled={isResending || countdown > 0}
                          className="font-semibold text-indigo-600 hover:text-indigo-500 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          {isResending ? "Envoi..." : "Renvoyer le code"}
                        </button>
                      )}
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="mt-6">
              <Button
                variant="outline"
                onClick={() => navigate("/login")}
                className="w-full"
              >
                Retour à la connexion
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1908&q=80"
          alt=""
        />
      </div>
    </div>
  );
}
