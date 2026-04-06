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
    <main
      id="main-content"
      data-app-content
      tabIndex={-1}
      className="min-h-screen bg-white outline-none"
    >
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
    </main>
  );
};

export default Pricing;
