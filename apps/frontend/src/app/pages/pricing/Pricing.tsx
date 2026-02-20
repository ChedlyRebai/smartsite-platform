import React from "react";
import Navbar from "../../Navbar";

const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      price: 19,
      description: "Perfect for small construction projects.",
      features: [
        "1 Active Project",
        "Up to 10 Workers",
        "Basic Task Management",
        "Material Tracking",
        "Email Support (48h response)",
      ],
    },
    {
      name: "Professional",
      price: 49,
      popular: true,
      description: "Best for growing construction companies.",
      features: [
        "5 Active Projects",
        "Up to 50 Workers",
        "Advanced Task & Resource Management",
        "Budget Tracking",
        "Analytics Dashboard",
        "Priority Support (24h response)",
      ],
    },
    {
      name: "Enterprise",
      price: 99,
      description: "For large construction firms & multi-site projects.",
      features: [
        "Unlimited Projects",
        "Unlimited Workers",
        "Full Financial & Cost Control",
        "AI Risk Analysis",
        "Custom Reports",
        "Dedicated 1h Support",
      ],
    },
  ];
  return (
    <>
<<<<<<< HEAD
      {/* Background pattern - same as Home */}
      <svg
        className="fixed inset-x-0 top-0 -z-10 h-[64rem] w-full stroke-gray-200 [mask-image:radial-gradient(32rem_32rem_at_center,white,transparent)]"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="pricing-pattern"
            width={200}
            height={200}
            x="50%"
            y={-1}
            patternUnits="userSpaceOnUse"
          >
            <path d="M.5 200V.5H200" fill="none" />
          </pattern>
        </defs>
        <svg x="50%" y={-1} className="overflow-visible fill-gray-50">
          <path
            d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
            strokeWidth={0}
          />
        </svg>
        <rect
          width="100%"
          height="100%"
          strokeWidth={0}
          fill="url(#pricing-pattern)"
        />
      </svg>
      <div
        className="fixed left-1/2 right-0 top-0 -z-10 -ml-24 transform-gpu overflow-hidden blur-3xl lg:ml-24 xl:ml-48"
        aria-hidden="true"
      >
        <div
          className="aspect-[801/1036] w-[50.0625rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30"
          style={{
            clipPath:
              "polygon(63.1% 29.5%, 100% 17.1%, 76.6% 3%, 48.4% 0%, 44.6% 4.7%, 54.5% 25.3%, 59.8% 49%, 55.2% 57.8%, 44.4% 57.2%, 27.8% 47.9%, 35.1% 81.5%, 0% 97.7%, 39.2% 100%, 35.2% 81.4%, 97.2% 52.8%, 63.1% 29.5%)",
          }}
        />
      </div>
=======
>>>>>>> origin/main
      <Navbar />
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto mt-20 px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Choose the Right Plan for Your Construction Business
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Flexible pricing designed for contractors, engineers, and project
              managers.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`rounded-2xl shadow-lg p-8 border ${
                  plan.popular
                    ? "border-indigo-500 scale-105"
                    : "border-gray-200"
                }`}
              >
                {plan.popular && (
                  <span className="bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}

                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  {plan.name}
                </h3>

                <p className="mt-4 text-4xl font-bold text-gray-900">
                  ${plan.price}
                  <span className="text-base font-medium text-gray-500">
                    /month
                  </span>
                </p>

                <p className="mt-3 text-gray-600">{plan.description}</p>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-gray-700"
                    >
                      <span className="text-indigo-500">✔</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button className="mt-8 w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 rounded-lg transition">
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Pricing;
