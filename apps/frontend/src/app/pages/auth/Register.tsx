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
import { useTranslation } from "@/app/hooks/useTranslation";
import type { RoleType } from "@/app/types";
import { countries, getCountryByValue } from "@/app/utils/countriesData";

// Fonction helper pour obtenir le texte display du pays avec drapeau et code
const getCountryDisplay = (country: any) => {
  if (country.display) return country.display;
  // Génère le display dynamiquement si pas présent
  return `${country.label} (${country.code})`;
};

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
    .min(5, "CIN is required and must be at least 5 characters.")
    .max(32, "CIN must not exceed 32 characters."),
  firstName: z
    .string()
    .min(2, "First name is required and must be at least 2 characters.")
    .max(50, "First name must not exceed 50 characters."),
  lastName: z
    .string()
    .min(2, "Name is required and must be at least 2 characters.")
    .max(50, "Name must not exceed 50 characters."),
  email: z
    .string()
    .email("Please enter a valid email address.")
    .min(5, "Email is required."),
  telephone: z
    .string()
    .regex(/^\d{6,14}$/, "Invalid number (6 to 14 digits)."),
  phoneCountryCode: z.string().min(2, "Please select a country code."),
  country: z
    .string()
    .min(2, "Country is required.")
    .max(56, "Country name is too long."),
  city: z
    .string()
    .min(2, "City is required.")
    .max(80, "City name is too long.")
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/, "Invalid city."),
  postalCode: z
    .string()
    .min(3, "Postal code is required.")
    .max(12, "Invalid postal code.")
    .regex(/^[A-Za-z0-9 -]+$/, "Invalid postal code."),
  addressLine: z
    .string()
    .min(5, "Address is required and must be at least 5 characters.")
    .max(200, "Address must not exceed 200 characters."),
  role: z.string().min(1, "Role is required."),
  acceptTerms: z
    .boolean()
    .refine(
      (val) => val === true,
      "You must accept the acceptance criteria to continue.",
    ),
  acceptReglement: z
    .boolean()
    .refine(
      (val) => val === true,
      "You must accept the regulations to continue.",
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
  const { t } = useTranslation();
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
    <>
      <div
        id="main-content"
        data-app-content
        tabIndex={-1}
        className="h-screen flex min-h-full outline-none overflow-hidden"
      >
        {/* Background avec image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/architect-using-digital-tablet-analyzing-building-construction-project-free-photo.jpg)',
          }}
        >
          {/* Overlay pour meilleure lisibilité du texte */}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Contenu */}
        <div className="relative w-full flex">
          {/* Panneau gauche - Infos (hidden on mobile) */}
          <div className="hidden lg:flex lg:w-3/5 flex-col justify-center items-start px-12 xl:px-20">
            <div className="max-w-lg">
              <div className="inline-block">
                <div className="flex items-center gap-4 mb-10">
                  <div className="h-16 w-16 rounded-xl bg-white/30 backdrop-blur-lg flex items-center justify-center border-2 border-white/50 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.5 1.5H3.75A2.25 2.25 0 001.5 3.75v12.5A2.25 2.25 0 003.75 18.5h12.5a2.25 2.25 0 002.25-2.25V9.5m-15-6h12m-12 4h8m-8 3h10m-10 3h8M15 1.5v4m0 0h4m-4 0l4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h1 className="text-5xl font-bold text-white drop-shadow-lg">SmartSite</h1>
                </div>
              </div>

              <h2 className="text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                Join Our Team
              </h2>
              <p className="text-xl text-white/90 mb-10 leading-relaxed drop-shadow-md font-medium">
                Create your account to access SmartSite's powerful construction management tools and join thousands of successful project teams.
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-400/30 border-2 border-green-300 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-green-200" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white font-semibold text-lg drop-shadow-md">Instant Account Activation</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-400/30 border-2 border-green-300 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-green-200" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white font-semibold text-lg drop-shadow-md">24/7 Support Access</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-400/30 border-2 border-green-300 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-green-200" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white font-semibold text-lg drop-shadow-md">Full Feature Access</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panneau droite - Formulaire */}
          <div className="w-full lg:w-2/5 flex flex-col justify-start items-center px-4 sm:px-6 lg:px-8 py-12 overflow-y-auto h-screen">
            <div className="w-full max-w-2xl">
              {/* Carte premium avec glassmorphism */}
              <div className="bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 px-10 py-12 sm:px-12">
                {/* Logo et texte d'en-tête */}
                <div className="text-center mb-8">
                  <a href="/" className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg mb-6 transform hover:scale-105 transition-transform">
                    <SmartSiteLogo size="lg" />
                  </a>
                  <p className="text-sm font-bold tracking-widest text-blue-600 uppercase mb-3">
                    {t("nav.register")}
                  </p>
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3 leading-tight">
                    {t("auth.register.title")}
                  </h2>
                  <p className="text-sm lg:text-base text-gray-600 font-medium">
                    {t("auth.register.haveAccount")}{" "}
                    <a
                      href="/login"
                      className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {t("auth.register.signIn")}
                    </a>
                  </p>
                </div>

                {/* Step indicator */}
                <div className="flex flex-wrap justify-center items-center gap-2 mb-8">
                  {([1, 2, 3] as const).map((s) => (
                    <React.Fragment key={s}>
                      {s > 1 && (
                        <span className="text-gray-300 hidden sm:inline">—</span>
                      )}
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all ${step === s
                          ? "bg-blue-600 text-white"
                          : step > s
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-500"
                          }`}
                      >
                        Step {s}
                      </span>
                    </React.Fragment>
                  ))}
                </div>

                {/* Formulaire */}
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
                                <FieldLabel htmlFor="cin">{t("auth.register.cin")}</FieldLabel>
                                <Input
                                  {...field}
                                  id="cin"
                                  placeholder={t("auth.register.cinPlaceholder")}
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
                                <FieldLabel htmlFor="email">{t("auth.register.email")}</FieldLabel>
                                <Input
                                  {...field}
                                  id="email"
                                  type="email"
                                  placeholder={t("auth.register.emailPlaceholder")}
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
                                  {t("auth.register.firstName")}
                                </FieldLabel>
                                <Input
                                  {...field}
                                  id="firstName"
                                  placeholder={t("auth.register.firstNamePlaceholder")}
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
                                <FieldLabel htmlFor="lastName">{t("auth.register.lastName")}</FieldLabel>
                                <Input
                                  {...field}
                                  id="lastName"
                                  placeholder={t("auth.register.lastNamePlaceholder")}
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
                                  {t("auth.register.countryCode")}
                                </FieldLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <SelectTrigger id="phoneCountryCode">
                                    <SelectValue placeholder={t("auth.register.countryCodePlaceholder")} />
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
                                    {t("auth.register.phone")}
                                  </FieldLabel>
                                  <Input
                                    {...field}
                                    id="telephone"
                                    placeholder={t("auth.register.phonePlaceholder")}
                                    aria-invalid={fieldState.invalid}
                                  />
                                  <FieldDescription>
                                    {t("auth.register.phoneDescription")}
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
                            render={({ field, fieldState }) => {
                              const selectedCountry = getCountryByValue(field.value);
                              return (
                                <Field data-invalid={fieldState.invalid}>
                                  <FieldLabel htmlFor="country">{t("auth.register.country")}</FieldLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <SelectTrigger id="country">
                                      <SelectValue 
                                        placeholder={t("auth.register.countryPlaceholder")}
                                      >
                                        {selectedCountry && getCountryDisplay(selectedCountry)}
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                      {countries.map((country) => (
                                        <SelectItem
                                          key={`${country.code}-${country.value}`}
                                          value={country.value}
                                        >
                                          {getCountryDisplay(country)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                  )}
                                </Field>
                              );
                            }}
                          />
                        </FieldGroup>

                        <FieldGroup>
                          <Controller
                            name="city"
                            control={form.control}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="city">{t("auth.register.city")}</FieldLabel>
                                <Input
                                  {...field}
                                  id="city"
                                  placeholder={t("auth.register.cityPlaceholder")}
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
                                  {t("auth.register.postalCode")}
                                </FieldLabel>
                                <Input
                                  {...field}
                                  id="postalCode"
                                  placeholder={t("auth.register.postalCodePlaceholder")}
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
                                {t("auth.register.address")}
                              </FieldLabel>
                              <Input
                                {...field}
                                id="addressLine"
                                placeholder={t("auth.register.addressPlaceholder")}
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
                              <FieldLabel htmlFor="role">{t("auth.register.role")}</FieldLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <SelectTrigger id="role">
                                  <SelectValue placeholder={t("auth.register.rolePlaceholder")} />
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
                          className="w-full py-3 px-4 text-base bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105"
                        >
                          {t("auth.register.continueButton")}
                        </Button>
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <div className="space-y-5">
                      <div className="max-h-[min(420px,55vh)] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700 shadow-inner">
                        <h4 className="font-semibold text-base text-slate-900 mb-3 flex items-center gap-2">
                          <span aria-hidden>📋</span> {t("auth.register.acceptanceCriteriaTitle")}
                        </h4>
                        <p className="mb-3 text-slate-600">
                          {t("auth.register.acceptanceCriteriaIntro")}
                        </p>
                        <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                          <li>
                            {t("auth.register.acceptanceCriteria1")}
                          </li>
                          <li>
                            {t("auth.register.acceptanceCriteria2")}
                          </li>
                          <li>
                            {t("auth.register.acceptanceCriteria3")}
                          </li>
                          <li>
                            {t("auth.register.acceptanceCriteria4")}
                          </li>
                          <li>
                            {t("auth.register.acceptanceCriteria5")}
                          </li>
                        </ul>
                      </div>
                      <p className="text-xs text-slate-500">
                        {t("auth.register.acceptanceCriteriaScroll")}
                      </p>
                      <div className="flex flex-col-reverse sm:flex-row gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={goBackToStep1}
                          className="flex-1"
                        >
                          {t("auth.register.backToForm")}
                        </Button>
                        <Button
                          type="button"
                          onClick={goToStep3}
                          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {t("auth.register.acceptButton")}
                        </Button>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-5">
                      <div className="max-h-[min(420px,55vh)] overflow-y-auto rounded-xl border border-blue-200 bg-blue-50/80 p-5 text-sm text-slate-800 shadow-inner">
                        <h4 className="font-semibold text-base text-blue-950 mb-3 flex items-center gap-2">
                          <span aria-hidden>📜</span> {t("auth.register.platformRegulationsTitle")}
                        </h4>
                        <p className="mb-3 text-blue-950/90">
                          {t("auth.register.platformRegulationsIntro")}
                        </p>
                        <ul className="list-disc pl-5 space-y-2 leading-relaxed text-blue-950/90">
                          <li>
                            {t("auth.register.regulation1")}
                          </li>
                          <li>
                            {t("auth.register.regulation2")}
                          </li>
                          <li>
                            {t("auth.register.regulation3")}
                          </li>
                          <li>
                            {t("auth.register.regulation4")}
                          </li>
                          <li>
                            {t("auth.register.regulation5")}
                          </li>
                          <li>
                            {t("auth.register.regulation6")}
                          </li>
                          <li>
                            {t("auth.register.regulation7")}
                          </li>
                        </ul>
                        <p className="mt-4 font-semibold text-blue-950 border-t border-blue-200 pt-4">
                          {t("auth.register.regulationWarning")}
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
                          {t("auth.register.backToCriteria")}
                        </Button>
                        <Button
                          type="button"
                          disabled={isLoading}
                          onClick={submitFinal}
                          className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                        >
                          {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              {t("auth.register.sending")}
                            </span>
                          ) : (
                            t("auth.register.acceptRegulationButton")
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </form>

                {/* Pieds de page */}
                <p className="mt-8 text-center text-sm font-semibold text-white/90 drop-shadow-lg">
                  © 2026 SmartSite. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
