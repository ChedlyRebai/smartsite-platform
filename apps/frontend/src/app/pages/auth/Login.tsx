import { useState } from "react";
import { data, Link, useNavigate } from "react-router";
import { Building2, Loader2 } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { toast } from "sonner";
export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [cin, setcin] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [logoAvailable, setLogoAvailable] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // const res = await axios.post(`http://localhost:3000/auth/login`, {
      //   cin,
      //   password,
      // });

      // console.log(
      //   `${process.env.LOGIN_API_URL}/login`,
      //   "ppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppp",
      // );
      // if (res.status === 200) {
      //   const expires = new Date(Date.now() + 1000 * 1000 * 1000);

      //   cookieStore.set("session", res.data.token);
      //   return Promise.resolve({ status: res.status, data: res.data.message });
      // }

      await login(cin, password).then((data:any) => {
        console.log("Login successful!",data);
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
  // <Input
  //id="cin"
  //type="cin"
  //placeholder="your.cin@smartsite.com"
  //value={cin}
  //onChange={(e) => setcin(e.target.value)}
  //required
  //disabled={isLoading}

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
                <form action="#" method="POST" className="space-y-6">
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
                </form>
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
