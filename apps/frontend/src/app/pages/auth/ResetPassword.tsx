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
import { useNavigate, useLocation } from "react-router";
import toast from "react-hot-toast";
import axios from "axios";
import { ArrowLeft, Eye, EyeOff, Lock } from "lucide-react";

const formSchema = z
  .object({
    email: z.string().email("Email invalide"),
    resetCode: z
      .string()
      .length(6, "Le code doit être composé de 6 chiffres"),
    newPassword: z
      .string()
      .min(8, "Le mot de passe doit contenir au least 8 caractères"),
    confirmPassword: z.string().min(1, "Confirmation requise"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [resendCountdown, setResendCountdown] = React.useState(0);

  const email = (location.state as any)?.email || "";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: email,
      resetCode: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCountdown]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:3000/auth/reset-password",
        {
          email: data.email,
          resetCode: data.resetCode,
          newPassword: data.newPassword,
        }
      );

      toast.success("Mot de passe réinitialisé avec succès!");
      navigate("/login");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Erreur lors de la réinitialisation du mot de passe";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await axios.post("http://localhost:3000/auth/resend-reset-code", {
        email: form.getValues("email"),
      });
      toast.success("Code de réinitialisation renvoyé!");
      setResendCountdown(60);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Erreur lors de renvoi du code";
      toast.error(message);
    }
  };

  return (
    <div className="h-screen flex min-h-full flex-1">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full lg:w-96">
          <div>
            <button
              onClick={() => navigate("/forgot-password")}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </button>
            <img
              src="/logo.png"
              alt="SmartSite"
              className="h-16 w-16 object-contain"
            />
            <h2 className="mt-8 text-2xl font-bold leading-9 tracking-tight text-gray-900">
              Réinitialiser votre mot de passe
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Entrez le code reçu par email et choisissez un nouveau mot de passe.
            </p>
          </div>

          <div className="mt-10">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FieldGroup>
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <Input
                        {...field}
                        id="email"
                        type="email"
                        disabled
                        className="bg-gray-100"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>

              <FieldGroup>
                <Controller
                  name="resetCode"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="resetCode">Code de réinitialisation (6 chiffres)</FieldLabel>
                      <Input
                        {...field}
                        id="resetCode"
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        disabled={isLoading}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>

              <FieldGroup>
                <Controller
                  name="newPassword"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="newPassword">Nouveau mot de passe</FieldLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          {...field}
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>

              <FieldGroup>
                <Controller
                  name="confirmPassword"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="confirmPassword">Confirmer le mot de passe</FieldLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          {...field}
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isLoading ? "Réinitialisation en cours..." : "Réinitialiser le mot de passe"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Vous n'avez pas reçu le code?{" "}
                <button
                  onClick={handleResendCode}
                  disabled={resendCountdown > 0 || isLoading}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold disabled:text-gray-400"
                >
                  {resendCountdown > 0
                    ? `Renvoyer dans ${resendCountdown}s`
                    : "Renvoyer"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side image */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1496384968514-baf1d1332fba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
          alt=""
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-white mb-4">
              Protégez votre compte
            </h3>
            <p className="text-white/80 text-lg">
              Choisissez un mot de passe fort pour sécuriser vos données
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
