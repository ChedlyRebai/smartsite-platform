"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, type FieldErrors } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldDescription,
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
import { SmartSiteLogo } from "@/app/components/branding/SmartSiteLogo";
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
  "user",
];

const phoneCountryCodes = [
  { label: "Tunisie (+216)", value: "+216" },
  { label: "France (+33)", value: "+33" },
  { label: "Maroc (+212)", value: "+212" },
  { label: "Algérie (+213)", value: "+213" },
  { label: "Belgique (+32)", value: "+32" },
  { label: "Suisse (+41)", value: "+41" },
  { label: "Canada (+1)", value: "+1-ca" },
  { label: "USA (+1)", value: "+1-us" },
];

// Helper function to convert phone code values back to proper format
const getPhoneCode = (value: string): string => {
  switch (value) {
    case '+1-ca':
    case '+1-us':
      return '+1';
    default:
      return value;
  }
};

const formSchema = z.object({
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
  telephone: z
    .string()
    .regex(/^\d{6,14}$/, "Numéro invalide (6 à 14 chiffres)."),
  phoneCountryCode: z.string().min(2, "Veuillez choisir un indicatif pays."),
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
  role: z.string().min(1, "Le rôle est requis."),
  acceptTerms: z
    .boolean()
    .refine(
      (val) => val === true,
      "Vous devez accepter les critères d'acceptation pour continuer.",
    ),
  acceptReglement: z
    .boolean()
    .refine(
      (val) => val === true,
      "Vous devez accepter le règlement pour continuer.",
    ),
});

type RegisterFormData = z.infer<typeof formSchema>;

const STEP_1_FIELDS: (keyof RegisterFormData)[] = [
  "cin",
  "email",
  "firstName",
  "lastName",
  "phoneCountryCode",
  "telephone",
  "country",
  "city",
  "postalCode",
  "addressLine",
  "role",
];

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const [isLoading, setIsLoading] = React.useState(false);
  const [step, setStep] = React.useState<1 | 2 | 3>(1);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cin: "",
      firstName: "",
      lastName: "",
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
      const fullPhone = `${getPhoneCode(data.phoneCountryCode)} ${data.telephone}`;
      await register(
        data.cin,
        "", // mot de passe vide à l'inscription, généré à l'approbation
        data.firstName,
        data.lastName,
        data.email,
        fullPhone,
        "", // pas de département
        fullAddress,
        data.role,
      );
      toast.success(
        "Inscription réussie! Votre compte est en attente d'approbation.",
      );
      // Redirect to login page
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

  const onInvalid = (errors: FieldErrors<RegisterFormData>) => {
    const first = Object.values(errors)[0];
    const msg =
      first && typeof first === "object" && "message" in first
        ? String(first.message)
        : null;
    toast.error(
      msg ?? "Veuillez compléter tous les champs obligatoires et cocher les cases.",
    );
  };

  const goToStep2 = async () => {
    const ok = await form.trigger(STEP_1_FIELDS);
    if (!ok) {
      toast.error("Veuillez corriger les champs du formulaire.");
      return;
    }
    setStep(2);
  };

  const goToStep3 = () => {
    form.setValue("acceptTerms", true, { shouldValidate: false });
    setStep(3);
  };

  const goBackToStep1 = () => {
    form.setValue("acceptTerms", false);
    form.setValue("acceptReglement", false);
    setStep(1);
  };

  const goBackToStep2From3 = () => {
    form.setValue("acceptReglement", false);
    setStep(2);
  };

  const submitFinal = () => {
    form.setValue("acceptReglement", true, { shouldValidate: false });
    void form.handleSubmit(onSubmit, onInvalid)();
  };

  return (
    <div className="min-h-screen flex min-h-full flex-1">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-lg lg:w-2xl">
          <div>
            <a href="/" className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md">
              <SmartSiteLogo size="sm" />
            </a>
            <p className="mt-2 text-xs font-semibold tracking-[0.2em] text-slate-600 uppercase">
              Intelligent construction platform
            </p>
            <h2 className="mt-6 text-2xl font-bold leading-9 tracking-tight text-gray-900">
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
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {([1, 2, 3] as const).map((s) => (
                    <React.Fragment key={s}>
                      {s > 1 && (
                        <span className="text-slate-300 hidden sm:inline">—</span>
                      )}
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          step === s
                            ? "bg-indigo-600 text-white"
                            : step > s
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {s === 1
                          ? "1. Informations"
                          : s === 2
                            ? "2. Critères"
                            : "3. Règlement"}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
                <CardTitle>
                  {step === 1 && "Formulaire d'inscription"}
                  {step === 2 && "Critères d'acceptation"}
                  {step === 3 && "Règlement de la plateforme"}
                </CardTitle>
                <CardDescription>
                  {step === 1 &&
                    "Renseignez vos informations, puis validez pour lire les conditions une par une."}
                  {step === 2 &&
                    "Lisez attentivement les critères. Cliquez sur le bouton lorsque vous les acceptez."}
                  {step === 3 &&
                    "Dernière étape : lisez le règlement puis envoyez votre demande d'inscription."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="space-y-6"
                  noValidate
                >
                  {step === 1 && (
                    <>
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
                            <FieldLabel htmlFor="firstname">
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FieldGroup>
                      <Controller
                        name="phoneCountryCode"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="phoneCountryCode">
                              Pays (indicatif) *
                            </FieldLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger id="phoneCountryCode">
                                <SelectValue placeholder="Indicatif" />
                              </SelectTrigger>
                              <SelectContent>
                                {phoneCountryCodes.map((item) => (
                                  <SelectItem
                                    key={`${item.label}-${item.value}`}
                                    value={item.value}
                                  >
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
                              <FieldLabel htmlFor="telephone">
                                Téléphone *
                              </FieldLabel>
                              <Input
                                {...field}
                                id="telephone"
                                placeholder="12345678"
                                aria-invalid={fieldState.invalid}
                              />
                              <FieldDescription>
                                Saisir uniquement les chiffres, l'indicatif est
                                choisi à gauche.
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
                            <FieldLabel htmlFor="postalCode">
                              Code postal *
                            </FieldLabel>
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
                          <FieldLabel htmlFor="addressLine">
                            Adresse (rue / numéro) *
                          </FieldLabel>
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
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger id="role">
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

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      type="button"
                      onClick={goToStep2}
                      className="flex-1 rounded-md bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                      Continuer vers les critères d'acceptation
                    </Button>
                  </div>
                    </>
                  )}

                  {step === 2 && (
                    <div className="space-y-5">
                      <div className="max-h-[min(420px,55vh)] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700 shadow-inner">
                        <h4 className="font-semibold text-base text-slate-900 mb-3 flex items-center gap-2">
                          <span aria-hidden>📋</span> Critères d&apos;acceptation
                        </h4>
                        <p className="mb-3 text-slate-600">
                          Avant de soumettre votre demande d&apos;inscription,
                          veuillez noter que :
                        </p>
                        <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                          <li>
                            Les informations fournies doivent être exactes et
                            vérifiables
                          </li>
                          <li>
                            Le profil doit correspondre aux exigences du rôle
                            demandé
                          </li>
                          <li>
                            Une vérification sera effectuée par notre équipe
                            administrative
                          </li>
                          <li>
                            Le processus d&apos;approbation peut prendre 24-48
                            heures
                          </li>
                          <li>
                            Un email de confirmation sera envoyé après
                            validation
                          </li>
                        </ul>
                      </div>
                      <p className="text-xs text-slate-500">
                        Faites défiler le texte ci-dessus si besoin, puis
                        confirmez votre accord.
                      </p>
                      <div className="flex flex-col-reverse sm:flex-row gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={goBackToStep1}
                          className="flex-1"
                        >
                          Retour au formulaire
                        </Button>
                        <Button
                          type="button"
                          onClick={goToStep3}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white"
                        >
                          J&apos;ai lu et j&apos;accepte ces critères
                        </Button>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-5">
                      <div className="max-h-[min(420px,55vh)] overflow-y-auto rounded-xl border border-blue-200 bg-blue-50/80 p-5 text-sm text-slate-800 shadow-inner">
                        <h4 className="font-semibold text-base text-blue-950 mb-3 flex items-center gap-2">
                          <span aria-hidden>📜</span> Règlement de la plateforme
                        </h4>
                        <p className="mb-3 text-blue-950/90">
                          En utilisant la plateforme SmartSite, vous vous
                          engagez à respecter :
                        </p>
                        <ul className="list-disc pl-5 space-y-2 leading-relaxed text-blue-950/90">
                          <li>
                            Les politiques de confidentialité et de sécurité
                          </li>
                          <li>Fournir des informations exactes et à jour</li>
                          <li>
                            Utiliser la plateforme à des fins professionnelles
                            uniquement
                          </li>
                          <li>
                            Ne pas partager vos identifiants avec des tiers
                          </li>
                          <li>
                            Respecter les autres utilisateurs et collaborateurs
                          </li>
                          <li>
                            Signaler tout problème ou anomalie rapidement
                          </li>
                          <li>
                            Accepter les décisions administratives finales
                          </li>
                        </ul>
                        <p className="mt-4 font-semibold text-blue-950 border-t border-blue-200 pt-4">
                          Toute violation du règlement peut entraîner la
                          suspension ou la suppression de votre compte.
                        </p>
                      </div>
                      <div className="flex flex-col-reverse sm:flex-row gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={goBackToStep2From3}
                          disabled={isLoading}
                          className="flex-1"
                        >
                          Retour aux critères
                        </Button>
                        <Button
                          type="button"
                          disabled={isLoading}
                          onClick={submitFinal}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white"
                        >
                          {isLoading ? (
                            <>
                              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2 align-middle" />
                              Envoi en cours...
                            </>
                          ) : (
                            "J'accepte le règlement et j'envoie ma demande"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
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
