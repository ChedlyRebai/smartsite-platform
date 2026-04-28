"use client";
import React, { useEffect, useState } from "react";
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

import { useAuthStore } from "@/app/store/authStore";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { SmartSiteLogo } from "@/app/components/branding/SmartSiteLogo";
import WelcomeModal from "./WelcomeModalSimple";
import { useTranslation } from "@/app/hooks/useTranslation";

const formSchema = z.object({
  cin: z
    .string()
    .min(5, "CIN is required and must be at least 5 characters.")
    .max(32, "CIN must be at most 32 characters."),
  password: z
    .string()
    .min(5, "Password is required and must be at least 5 characters.")
    .max(100, "Password must be at most 100 characters."),
});

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [logoAvailable, setLogoAvailable] = useState(true);
  const { user, isFirstLogin } = useAuthStore((state) => state);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showWelcome, setShowWelcome] = React.useState(false);
  const { t } = useTranslation();

  // Debug logging
  useEffect(() => {
    console.log("Login component - user:", user);
    console.log("Login component - isFirstLogin:", isFirstLogin);
    console.log("Login component - showWelcome:", showWelcome);
  }, [user, isFirstLogin, showWelcome]);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cin: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      console.log("Login - Starting login with CIN:", data.cin);
      const userData = await login(data.cin, data.password);
      console.log("Login - Login successful!", userData);

      toast.success("Login successful!");

      // Debug: log permissions
      console.log("Login - User data:", userData);
      console.log("Login - User role:", userData.role);

      if (userData.firstLogin) {
        console.log("Login - First login, showing welcome modal");
        setShowWelcome(true);
        return;
      }

      const userRole = userData.role?.name || userData.role;
      console.log("Login - Redirecting to:", userRole === "project_manager" ? "/project-manager-dashboard" : userRole === "super_admin" ? "/super-admin-projects" : "/dashboard");
      if (userRole === "project_manager") {
        navigate("/project-manager-dashboard");
      } else if (userRole === "super_admin") {
        navigate("/super-admin-projects");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      const isNetworkError =
        error?.message === "Network Error" && !error?.response;
      const message = isNetworkError
        ? "Authentication service is unreachable. Start backend user-authentication on http://localhost:3000 (or set VITE_AUTH_API_URL)."
        : error?.response?.data?.message ||
          error?.message ||
          "Invalid credentials. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };
  const [showPassword, setShowPassword] = useState(false);
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
            backgroundImage: 'url(/digital-twin-use-cases-in-page-digital-engineering.jpg)',
          }}
        >
          {/* Overlay pour meilleure lisibilité du texte */}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Contenu */}
        <div className="relative w-full flex flex-row-reverse">
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
                Build Smarter,<br />Manage Better
              </h2>
              <p className="text-xl text-white/90 mb-10 leading-relaxed drop-shadow-md font-medium">
                The all-in-one construction management platform designed to streamline your projects and boost productivity.
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-400/30 border-2 border-green-300 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-green-200" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white font-semibold text-lg drop-shadow-md">Real-time Project Tracking</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-400/30 border-2 border-green-300 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-green-200" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white font-semibold text-lg drop-shadow-md">Team Collaboration</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-400/30 border-2 border-green-300 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-green-200" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white font-semibold text-lg drop-shadow-md">Advanced Analytics</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panneau droite - Formulaire */}
          <div className="w-full lg:w-2/5 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
            <div className="w-full max-w-2xl">
              {/* Carte premium avec glassmorphism */}
              <div className="bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 px-10 py-12 sm:px-12 lg:px-14">
                {/* Logo et texte d'en-tête */}
                <div className="text-center mb-10">
                  <a href="/" className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg mb-8 transform hover:scale-105 transition-transform">
                    <SmartSiteLogo size="lg" />
                  </a>
                  <p className="text-sm font-bold tracking-widest text-blue-600 uppercase mb-4">
                    {t("nav.login")}
                  </p>
                  <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                    {t("auth.login.title")}
                  </h2>
                  <p className="text-base lg:text-lg text-gray-700 font-medium">
                    {t("auth.login.noAccount")}{" "}
                    <a
                      href="/register"
                      className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {t("auth.login.signUp")}
                    </a>
                  </p>
                </div>

                {/* Formulaire */}
                <div className="mt-10">
                  <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
                    <FieldGroup>
                      <Controller
                        name="cin"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="form-rhf-demo-title" className="text-gray-800 font-bold text-base mb-3 block">
                              CIN
                            </FieldLabel>
                            <Input
                              {...field}
                              id="form-rhf-demo-cin"
                              aria-invalid={fieldState.invalid}
                              placeholder="CIN"
                              autoComplete="off"
                              className="w-full px-5 py-4 text-base rounded-xl border-2 border-gray-300 focus:border-blue-600 focus:ring-3 focus:ring-blue-300 transition-all bg-gray-50 focus:bg-white font-medium"
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
                            <FieldLabel htmlFor="form-rhf-demo-password" className="text-gray-800 font-bold text-base mb-3 block">
                              {t("auth.login.password")}
                            </FieldLabel>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                id="form-rhf-demo-password"
                                aria-invalid={fieldState.invalid}
                                placeholder={t("auth.login.password")}
                                autoComplete="off"
                                className="w-full px-5 py-4 text-base rounded-xl border-2 border-gray-300 focus:border-blue-600 focus:ring-3 focus:ring-blue-300 transition-all bg-gray-50 focus:bg-white pr-14 font-medium"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                              >
                                {showPassword ? (
                                  <EyeOff size={24} />
                                ) : (
                                  <Eye size={24} />
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
                  </form>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    form="form-rhf-demo"
                    className="w-full mt-8 py-4 px-6 text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                        {t("auth.login.signIn")}
                      </span>
                    ) : (
                      t("auth.login.signIn")
                    )}
                  </Button>

                  <div className="mt-6 relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-3 bg-white text-gray-600">ou</span>
                    </div>
                  </div>

                  <p className="mt-8 text-center">
                    <a
                      href="/forgot-password"
                      className="text-base font-bold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {t("auth.login.forgotPassword")}
                    </a>
                  </p>
                </div>
              </div>

              {/* Pieds de page */}
              <p className="mt-10 text-center text-base font-semibold text-white/90 drop-shadow-lg">
                © 2026 SmartSite. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
      {user && (
        <WelcomeModal 
          isOpen={showWelcome}
          onClose={() => setShowWelcome(false)}
          userRole={user.role}
          userName={`${user.firstName} ${user.lastName}`}
        />
      )}
    </>
  );
}
