"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { roleLabels } from "@/app/utils/roleConfig";
import type { RoleType } from "@/app/types";

// Liste des roles disponibles (sauf super_admin)
const availableRoles: RoleType[] = [
  "director",
  "project_manager",
  "site_manager",
  "works_manager",
  "accountant",
  "procurement_manager",
  "qhse_manager",
  "client",
  "subcontractor",
  "user"
];

const phoneCountryCodes = [
  { label: "Tunisie (+216)", value: "+216" },
  { label: "France (+33)", value: "+33" },
  { label: "Maroc (+212)", value: "+212" },
  { label: "Algérie (+213)", value: "+213" },
  { label: "Belgique (+32)", value: "+32" },
  { label: "Suisse (+41)", value: "+41" },
  { label: "Canada (+1)", value: "+1" },
  { label: "USA (+1)", value: "+1" },
];

const formSchema = z.object({
  cin: z
    .string()
    .min(5, "CIN est requis et doit contenir au moins 5 caractères.")
    .max(32, "CIN ne doit pas dépasser 32 caractères."),
  firstname: z
    .string()
    .min(2, "Le prénom est requis et doit contenir au moins 2 caractères.")
    .max(50, "Le prénom ne doit pas dépasser 50 caractères."),
  lastname: z
    .string()
    .min(2, "Le nom est requis et doit contenir au moins 2 caractères.")
    .max(50, "Le nom ne doit pas dépasser 50 caractères."),
  email: z
    .string()
    .email("Veuillez entrer une adresse email valide.")
    .min(5, "L'email est requis."),
  telephone: z
    .string()
    .regex(/^\d{6,14}$/, "Numéro invalide (6 à 14 chiffres)."),
  phoneCountryCode: z
    .string()
    .min(2, "Veuillez choisir un indicatif pays."),
  country: z
    .string()
    .min(2, "Le pays est requis.")
    .max(56, "Le pays est trop long."),
  city: z
    .string()
    .min(2, "La ville est requise.")
    .max(80, "Le nom de la ville est trop long.")
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/, "Ville invalide."),
  postalCode: z
    .string()
    .min(3, "Le code postal est requis.")
    .max(12, "Le code postal est invalide.")
    .regex(/^[A-Za-z0-9 -]+$/, "Code postal invalide."),
  addressLine: z
    .string()
    .min(5, "L'adresse est requise et doit contenir au moins 5 caractères.")
    .max(200, "L'adresse ne doit pas dépasser 200 caractères."),
  role: z
    .string()
    .min(1, "Le rôle est requis."),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, "Vous devez accepter les critères d'acceptation pour continuer."),
  acceptReglement: z
    .boolean()
    .refine((val) => val === true, "Vous devez accepter le règlement pour continuer."),
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
      firstname: "",
      lastname: "",
      email: "",
      telephone: "",
      phoneCountryCode: "+216",
      country: "",
      city: "",
      postalCode: "",
      addressLine: "",
      role: "",
      acceptTerms: false,
      acceptReglement: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const fullAddress = `${data.addressLine}, ${data.city}, ${data.postalCode}, ${data.country}`;
      const fullPhone = `${data.phoneCountryCode} ${data.telephone}`;
      await register(
        data.cin,
        "", // PAS de mot de passe - sera généré lors de l'approbation
        data.firstname,
        data.lastname,
        data.email,
        fullPhone,
        "", // pas de département
        fullAddress,
        data.role
      );
      toast.success("Inscription réussie! Votre compte est en attente d'approbation. Vous recevrez un email avec vos identifiants.");
      navigate("/login");
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
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        name="firstname"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="firstname">Prénom *</FieldLabel>
                            <Input
                              {...field}
                              id="firstname"
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
                        name="lastname"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="lastname">Nom *</FieldLabel>
                            <Input
                              {...field}
                              id="lastname"
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FieldGroup>
                      <Controller
                        name="phoneCountryCode"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="phoneCountryCode">Pays (indicatif) *</FieldLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger id="phoneCountryCode">
                                <SelectValue placeholder="Indicatif" />
                              </SelectTrigger>
                              <SelectContent>
                                {phoneCountryCodes.map((item) => (
                                  <SelectItem key={`${item.label}-${item.value}`} value={item.value}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                    </FieldGroup>

                    <div className="md:col-span-2">
                      <FieldGroup>
                        <Controller
                          name="telephone"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel htmlFor="telephone">Téléphone *</FieldLabel>
                              <Input
                                {...field}
                                id="telephone"
                                placeholder="12345678"
                                aria-invalid={fieldState.invalid}
                              />
                              <FieldDescription>
                                Saisir uniquement les chiffres, l'indicatif est choisi à gauche.
                              </FieldDescription>
                              {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                              )}
                            </Field>
                          )}
                        />
                      </FieldGroup>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FieldGroup>
                      <Controller
                        name="country"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="country">Pays *</FieldLabel>
                            <Input
                              {...field}
                              id="country"
                              placeholder="Tunisie"
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
                        name="city"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="city">Ville *</FieldLabel>
                            <Input
                              {...field}
                              id="city"
                              placeholder="Tunis"
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
                        name="postalCode"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="postalCode">Code postal *</FieldLabel>
                            <Input
                              {...field}
                              id="postalCode"
                              placeholder="1000"
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
                      name="addressLine"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="addressLine">Adresse (rue / numéro) *</FieldLabel>
                          <Input
                            {...field}
                            id="addressLine"
                            placeholder="Rue de ..., N 15"
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
                      name="role"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="role">Rôle *</FieldLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un rôle" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableRoles.map((roleName) => (
                                <SelectItem key={roleName} value={roleName}>
                                  {roleLabels[roleName] || roleName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </FieldGroup>

                  {/* Critères d'acceptation */}
                  <FieldGroup>
                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                      <h4 className="font-semibold text-sm text-gray-900">📋 Critères d'acceptation</h4>
                      <div className="text-xs text-gray-600 space-y-2">
                        <p>Avant de soumettre votre demande d'inscription, veuillez noter que :</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>Les informations fournies doivent être exactes et vérifiables</li>
                          <li>Le profil doit correspondre aux exigences du rôle demandé</li>
                          <li>Une vérification sera effectuée par notre équipe administrative</li>
                          <li>Le processus d'approbation peut prendre 24-48 heures</li>
                          <li>Un email de confirmation sera envoyé après validation</li>
                        </ul>
                      </div>

                      <Controller
                        name="acceptTerms"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <div className="flex items-start space-x-2">
                              <input
                                type="checkbox"
                                id="acceptTerms"
                                checked={field.value}
                                onChange={(e) => field.onChange(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <div className="space-y-1">
                                <FieldLabel htmlFor="acceptTerms" className="text-sm font-normal">
                                  J'ai lu et j'accepte les critères d'acceptation ci-dessus
                                </FieldLabel>
                                {fieldState.invalid && (
                                  <FieldError errors={[fieldState.error]} />
                                )}
                              </div>
                            </div>
                          </Field>
                        )}
                      />
                    </div>
                  </FieldGroup>

                  {/* Règlement */}
                  <FieldGroup>
                    <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-sm text-blue-900">📜 Règlement de la plateforme</h4>
                      <div className="text-xs text-blue-800 space-y-2">
                        <p>En utilisant la plateforme SmartSite, vous vous engagez à respecter :</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>Respecter les politiques de confidentialité et de sécurité</li>
                          <li>Fournir des informations exactes et à jour</li>
                          <li>Utiliser la plateforme à des fins professionnelles uniquement</li>
                          <li>Ne pas partager vos identifiants avec des tiers</li>
                          <li>Respecter les autres utilisateurs et collaborateurs</li>
                          <li>Signalier tout problème ou anomalie rapidement</li>
                          <li>Accepter les décisions administratives finales</li>
                        </ul>
                        <p className="font-medium text-blue-900">
                          Toute violation du règlement peut entraîner la suspension ou la suppression de votre compte.
                        </p>
                      </div>

                      <Controller
                        name="acceptReglement"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <div className="flex items-start space-x-2">
                              <input
                                type="checkbox"
                                id="acceptReglement"
                                checked={field.value}
                                onChange={(e) => field.onChange(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="space-y-1">
                                <FieldLabel htmlFor="acceptReglement" className="text-sm font-normal text-blue-900">
                                  J'ai lu et j'accepte le règlement de la plateforme
                                </FieldLabel>
                                {fieldState.invalid && (
                                  <FieldError errors={[fieldState.error]} />
                                )}
                              </div>
                            </div>
                          </Field>
                        )}
                      />
                    </div>
                  </FieldGroup>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
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
