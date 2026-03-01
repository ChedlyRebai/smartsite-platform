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
import { useAuthStore } from "@/app/store/authStore";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";

const formSchema = z
  .object({
    cin: z
      .string()
      .min(5, "CIN est requis et doit contenir au moins 5 caractères.")
      .max(32, "CIN ne doit pas dépasser 32 caractères."),
    firstName: z
      .string()
      .min(2, "Le prénom est requis et doit contenir au moins 2 caractères.")
      .max(50, "Le prénom ne doit pas dépasser 50 caractères."),
    lastName: z
      .string()
      .min(2, "Le nom est requis et doit contenir au moins 2 caractères.")
      .max(50, "Le nom ne doit pas dépasser 50 caractères."),
    email: z
      .string()
      .email("Veuillez entrer une adresse email valide.")
      .min(5, "L'email est requis."),
    phoneNumber: z
      .string()
      .min(8, "Le téléphone doit contenir au moins 8 caractères.")
      .max(20, "Le téléphone ne doit pas dépasser 20 caractères.")
      .optional()
      .or(z.literal("")),
    address: z
      .string()
      .min(5, "L'adresse doit contenir au moins 5 caractères.")
      .max(200, "L'adresse ne doit pas dépasser 200 caractères.")
      .optional()
      .or(z.literal("")),

    companyName: z
      .string()
      .max(200, "Le nom de l'entreprise ne doit pas dépasser 200 caractères.")
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(6, "Password must be at least 8 characters")
      .max(100, "Password must be less than 100 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
  });

type RegisterFormData = z.infer<typeof formSchema>;

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cin: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      address: "",
      companyName: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await register(
        data.cin,
        data.password, // mot de passe vide à l'inscription, généré à l'approbation
        data.firstName,
        data.lastName,
        data.email,
        data.phoneNumber || "",
        data.address || "",
        data.companyName || "",
      );
      toast.success(
        "Inscription réussie! Un code de vérification a été envoyé à votre email.",
      );
      // Redirect to OTP verification page with user data
      navigate("/verify-otp", {
        state: {
          cin: data.cin,
          email: data.email,
        },
      });
    } catch (error: any) {
      console.error("Erreur inscription:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Une erreur est survenue lors de l'inscription.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex min-h-full flex-1">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-lg lg:w-2xl">
          <div>
            <img
              src="/logo.png"
              alt="SmartSite"
              className="h-16 w-16 object-contain"
            />
            <h2 className="mt-8 text-2xl font-bold leading-9 tracking-tight text-gray-900">
              Créer votre compte
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Déjà un compte?{" "}
              <a
                href="/login"
                className="font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Se connecter
              </a>
            </p>
          </div>

          <div className="mt-10">
            <Card>
              <CardHeader>
                <CardTitle>Formulaire d'inscription</CardTitle>
                <CardDescription>
                  Remplissez ce formulaire pour créer votre compte SmartSite
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldGroup>
                      <Controller
                        name="cin"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="cin">CIN *</FieldLabel>
                            <Input
                              {...field}
                              id="cin"
                              placeholder="Entrez votre CIN"
                              aria-invalid={fieldState.invalid}
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
                        name="email"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="email">Email *</FieldLabel>
                            <Input
                              {...field}
                              id="email"
                              type="email"
                              placeholder="Entrez votre email"
                              aria-invalid={fieldState.invalid}
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                    </FieldGroup>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldGroup>
                      <Controller
                        name="firstName"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="firstName">
                              Prénom *
                            </FieldLabel>
                            <Input
                              {...field}
                              id="firstName"
                              placeholder="Entrez votre prénom"
                              aria-invalid={fieldState.invalid}
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
                        name="lastName"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="lastName">Nom *</FieldLabel>
                            <Input
                              {...field}
                              id="lastName"
                              placeholder="Entrez votre nom"
                              aria-invalid={fieldState.invalid}
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                    </FieldGroup>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldGroup>
                      <Controller
                        name="password"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="password">
                              Password *
                            </FieldLabel>
                            <Input
                              {...field}
                              id="password"
                              type="password"
                              placeholder="Entrez votre prénom"
                              aria-invalid={fieldState.invalid}
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
                        name="confirmPassword"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="confirmPassword">
                              Confirmez le mot de passe *
                            </FieldLabel>
                            <Input
                              type="password"
                              {...field}
                              id="confirmPassword"
                              placeholder="Confirmez votre mot de passe"
                              aria-invalid={fieldState.invalid}
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                    </FieldGroup>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldGroup>
                      <Controller
                        name="phoneNumber"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="phoneNumber">
                              Téléphone
                            </FieldLabel>
                            <Input
                              {...field}
                              id="phoneNumber"
                              placeholder="Entrez votre téléphone"
                              aria-invalid={fieldState.invalid}
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
                        name="companyName"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="companyName">
                              Entreprise
                            </FieldLabel>
                            <Input
                              {...field}
                              id="companyName"
                              placeholder="Nom de votre entreprise"
                              aria-invalid={fieldState.invalid}
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                    </FieldGroup>
                  </div>

                  <FieldGroup>
                    <Controller
                      name="address"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="address">Adresse</FieldLabel>
                          <Input
                            {...field}
                            id="address"
                            placeholder="Entrez votre adresse"
                            aria-invalid={fieldState.invalid}
                          />
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
                    className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Inscription en cours...
                      </>
                    ) : (
                      "S'inscrire"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
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
