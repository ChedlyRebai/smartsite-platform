"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import ReCAPTCHA from "react-google-recaptcha";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/app/store/authStore";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

const formSchema = z.object({
  cin: z
    .string()
    .min(5, "CIN est requis et doit contenir au moins 5 caractères.")
    .max(32, "CIN ne doit pas dépasser 32 caractères."),
  password: z
    .string()
    .min(5, "Le mot de passe est requis et doit contenir au moins 5 caractères.")
    .max(100, "Le mot de passe ne doit pas dépasser 100 caractères."),
  recaptchaToken: z.string().min(1, "Veuillez vérifier que vous n'êtes pas un robot"),
});

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const recaptchaRef = React.useRef<ReCAPTCHA>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cin: "",
      password: "",
      recaptchaToken: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      await login(data.cin, data.password, data.recaptchaToken);
      toast.success("Connexion réussie!");
      navigate("/dashboard");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Identifiants invalides. Veuillez réessayer.";
      toast.error(message);
      
      // Reset reCAPTCHA
      recaptchaRef.current?.reset();
      form.setValue("recaptchaToken", "");
    } finally {
      setIsLoading(false);
    }
  };

  const onRecaptchaChange = (token: string | null) => {
    form.setValue("recaptchaToken", token || "");
  };

  return (
    <div className="h-screen flex min-h-full flex-1">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full lg:w-96">
          <div>
            <img
              src="/logo.png"
              alt="SmartSite"
              className="h-16 w-16 object-contain"
            />
            <h2 className="mt-8 text-2xl font-bold leading-9 tracking-tight text-gray-900">
              Connectez-vous à votre compte
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Pas encore de compte?{" "}
              <a
                href="/register"
                className="font-semibold text-indigo-600 hover:text-indigo-500"
              >
                S'inscrire
              </a>
            </p>
          </div>

          <div className="mt-10">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <Controller
                  name="cin"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="cin">CIN</FieldLabel>
                      <Input
                        {...field}
                        id="cin"
                        placeholder="Entrez votre CIN"
                        aria-invalid={fieldState.invalid}
                        disabled={isLoading}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                
                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          id="password"
                          placeholder="Entrez votre mot de passe"
                          aria-invalid={fieldState.invalid}
                          disabled={isLoading}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <div className="flex justify-center my-4">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                    onChange={onRecaptchaChange}
                  />
                </div>
                {form.formState.errors.recaptchaToken && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.recaptchaToken.message}
                  </p>
                )}

                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm">
                    <a
                      href="/forgot-password"
                      className="font-semibold text-indigo-600 hover:text-indigo-500"
                    >
                      Mot de passe oublié?
                    </a>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full mt-4 justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  {isLoading ? "Connexion en cours..." : "Se connecter"}
                </Button>
              </FieldGroup>
            </form>

            {/* Séparateur */}
            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Ou continuer avec</span>
              </div>
            </div>

            {/* Bouton Google */}
            <div className="mt-6">
              <a
                href="http://localhost:3000/auth/google"
                className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:ring-transparent"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1496917756835-20cb06e75b4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1908&q=80"
          alt=""
        />
      </div>
    </div>
  );
}