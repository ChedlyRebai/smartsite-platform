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

import { useAuthStore } from "@/app/store/authStore";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

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
  // const [cin, setcin] = useState("");
  // const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [logoAvailable, setLogoAvailable] = React.useState(true);

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsLoading(true);
  //   try {
  //     await login(cin, password).then((data: any) => {
  //       console.log("Login successful!", data);
  //       toast.success("Login successful!");
  //       navigate("/dashboard");
  //     });
  //     toast.success("Login successful!");
  //     navigate("/dashboard");
  //   } catch (error: any) {
  //     const message =
  //       error?.message ||
  //       error?.response?.data?.message ||
  //       "Invalid credentials. Please try again.";
  //     toast.error(message);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  // <Input
  //id="cin"
  //type="cin"
  //placeholder="your.cin@smartsite.com"
  //value={cin}
  //onChange={(e) => setcin(e.target.value)}
  //required
  //disabled={isLoading}

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
      await login(data.cin, data.password).then((data: any) => {
        console.log("Login successful!", data);
        toast.success("Login successful!");
        navigate("/dashboard");
      });
      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error: any) {
      const message =
        error?.message ||
        error?.response?.data?.message ||
        "Invalid credentials. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };
  const [showPassword, setShowPassword] =React.useState(false);
  return (
    <>
      {/*
        This example requires updating your template:

        ```
        <html class="h-full bg-white">
        <body class="h-full">
        ```
      */}
      <div className="h-screen flex min-h-full flex-1">
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div>
              <img
                src="/logo.png"
                alt="SmartSite"
                className="h-16 w-16 object-contain"
              />
              <h2 className="mt-8 text-2xl font-bold leading-9 tracking-tight text-gray-900">
                Sign in to your account
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Not a member?{" "}
                <a
                  href="#"
                  className="font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  Start a 14 day free trial
                </a>
              </p>
            </div>

            <div className="mt-10">
              <div>
                <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
                  <FieldGroup>
                    <Controller
                      name="cin"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="form-rhf-demo-title">
                            CIN
                          </FieldLabel>
                          <Input
                            {...field}
                            id="form-rhf-demo-cin"
                            aria-invalid={fieldState.invalid}
                            placeholder="Enter your CIN"
                            autoComplete="off"
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
                          <FieldLabel htmlFor="form-rhf-demo-password">
                            Password
                          </FieldLabel>
                          
                          <div className="relative">
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              id="form-rhf-demo-password"
                              aria-invalid={fieldState.invalid}
                              placeholder="Enter your password"
                              autoComplete="off"
                              className="pr-10"
                            />

                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                            >
                              {showPassword ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
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
                  className="flex w-full mt-4 justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Submit
                </Button>
                {/* <form
                  onSubmit={form.handleSubmit(onSubmit)}>
                  <FieldGroup>
                    <Controller
                      name="cin"
                      control={form.control}
                      render={({ field, fieldState }) => {
                        return (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="cin">CIN</FieldLabel>
                            <Input
                              id="cin"
                              placeholder="Enter your CIN"
                              autoComplete="off"
                              {...field}
                              aria-invalid={fieldState.invalid}
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        );
                      }}
                    />
                    <Controller
                      name="password"
                      control={form.control}
                      render={({ field, fieldState: { error } }) => {
                        const isInvalid = !!error;
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor="password">Password</FieldLabel>
                            <Input
                              id="password"
                              type="password"
                              placeholder="Enter your password"
                              className=" resize-none"
                              {...field}
                              aria-invalid={isInvalid}
                            />

                            {isInvalid && (
                              <FieldError
                                errors={
                                  error?.message
                                    ? [{ message: error.message }]
                                    : []
                                }
                              />
                            )}
                          </Field>
                        );
                      }}
                    />
                  </FieldGroup>
                  <Button
                  
                    className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    type="submit"
                    form="bug-report-form"
                  >
                    Submit
                  </Button>
                </form> */}

                {/* <form action="#" method="POST" className="space-y-6">
                  <div>
                    <label
                      htmlFor="cin"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      cin
                    </label>
                    <div className="mt-2">
                      <input
                        id="cin"
                        name="cin"
                        type="string"
                        autoComplete="cin"
                        required
                        value={cin}
                        disabled={isLoading}
                        onChange={(e) => setcin(e.target.value)}
                        className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      Password
                    </label>
                    <div className="mt-2">
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        onChange={(e) => setPassword(e.target.value)}
                        value={password}
                        className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      />
                      <label
                        htmlFor="remember-me"
                        className="ml-3 block text-sm leading-6 text-gray-700"
                      >
                        Remember me
                      </label>
                    </div>

                    <div className="text-sm leading-6">
                      <a
                        href="#"
                        className="font-semibold text-indigo-600 hover:text-indigo-500"
                      >
                        Forgot password?
                      </a>
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Sign in
                    </button>
                  </div>
                </form> */}
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
    </>
  );
}
