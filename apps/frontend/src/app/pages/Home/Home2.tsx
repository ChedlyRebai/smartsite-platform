import React, { useState } from 'react';
import { SmartSiteLogo } from "@/app/components/branding/SmartSiteLogo";
import { Facebook, Github, Instagram, Twitter, Dribbble, Menu } from "lucide-react";
import { LanguageSelector } from "@/app/components/LanguageSelector";
import { ThemeButton } from "@/app/components/ThemeButton";
import { TextSizeButton } from "@/app/components/TextSizeButton";
import { DemoModal } from "@/app/components/DemoModal";
import { useTranslation } from "@/app/hooks/useTranslation";
import styles from "./Home2.module.css";

const navigationFooter: any = {
  solutions: [
    { name: "Marketing", href: "#" },
    { name: "Analytics", href: "#" },
    { name: "Commerce", href: "#" },
    { name: "Insights", href: "#" },
  ],
  support: [
    { name: "Pricing", href: "#" },
    { name: "Documentation", href: "#" },
    { name: "Guides", href: "#" },
    { name: "API Status", href: "#" },
  ],
  company: [
    { name: "About", href: "#" },
    { name: "Blog", href: "#" },
    { name: "Jobs", href: "#" },
    { name: "Press", href: "#" },
    { name: "Partners", href: "#" },
  ],
  legal: [
    { name: "Claim", href: "#" },
    { name: "Privacy", href: "#" },
    { name: "Terms", href: "#" },
  ],
  social: [
    {
      name: "Facebook",
      href: "#",
      icon: Facebook,
    },
    {
      name: "Instagram",
      href: "#",
      icon: Instagram,
    },
    {
      name: "Twitter",
      href: "#",
      icon: Twitter,
    },
    {
      name: "GitHub",
      href: "#",
      icon: Github,
    },
    {
      name: "Dribbble",
      href: "#",
      icon: Dribbble,
    },
  ],
};

export default function Home2() {
  const { t, language } = useTranslation();

  const stats = [
    { label: t("statsDetail.activeSites"), value: "+150" },
    { label: t("statsDetail.aiAlerts"), value: "12,000+" },
    { label: t("statsDetail.users"), value: "2,500+" },
  ];

  const values = [
    {
      name: t("values.excellence.title"),
      description: t("values.excellence.desc"),
    },
    {
      name: t("values.intelligence.title"),
      description: t("values.intelligence.desc"),
    },
    {
      name: t("values.learning.title"),
      description: t("values.learning.desc"),
    },
    {
      name: t("values.support.title"),
      description: t("values.support.desc"),
    },
    {
      name: t("values.accountability.title"),
      description: t("values.accountability.desc"),
    },
    {
      name: t("values.efficiency.title"),
      description: t("values.efficiency.desc"),
    },
  ];

  const buildSmarterstats = [
    { label: t("buildSmarter.stats.projects"), value: "250+" },
    { label: t("buildSmarter.stats.companies"), value: "120+" },
    { label: t("buildSmarter.stats.costReduction"), value: "30%" },
    { label: t("buildSmarter.stats.timeSaved"), value: "40%" },
  ];

  const insights = [
    { label: t("buildSmarter.stats.projects"), value: "12", trend: "+3 ce mois" },
    { label: t("buildSmarter.stats.companies"), value: "04", trend: "-27%" },
    { label: t("buildSmarter.stats.costReduction"), value: "08", trend: "IA active" },
  ];

  const [isDemoOpen, setIsDemoOpen] = useState(false);

  return (
    <div className={`${styles.heroSection} bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100`}>
      {/* Header */}
      <header className={`${styles.navBar} fixed inset-x-0 top-0 z-50`}>
        <nav
          className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
          aria-label="Global"
        >
          <div className="flex lg:flex-1">
            <a href="/" className="-m-1.5 p-1.5 flex items-center gap-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
              <span className="sr-only">SmartSite</span>
              <SmartSiteLogo size="md" className={`drop-shadow-sm ${styles.logoAnimated}`} />
            </a>
          </div>
          <div className="flex lg:hidden">
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
            {[
              { name: t("nav.product"), href: "#" },
              { name: t("nav.features"), href: "#" },
              { name: t("nav.resources"), href: "#" },
              { name: t("nav.company"), href: "#" },
            ].map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`${styles.navLink} text-sm font-semibold leading-6 text-gray-900`}
              >
                {item.name}
              </a>
            ))}
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-4">
            <TextSizeButton />
            <ThemeButton />
            <LanguageSelector />
            <a
              href="/login"
              className="text-sm font-semibold leading-6 text-gray-900 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {t("nav.login")} <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </nav>
      </header>

      <main
        id="main-content"
        data-app-content
        tabIndex={-1}
        className="isolate outline-none"
      >
        {/* Hero section */}
        <div className="relative isolate -z-10">
          <svg
            className="absolute inset-x-0 top-0 -z-10 h-[64rem] w-full stroke-gray-200 [mask-image:radial-gradient(32rem_32rem_at_center,white,transparent)]"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="1f932ae7-37de-4c0a-a8b0-a6e3b4d44b84"
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
              fill="url(#1f932ae7-37de-4c0a-a8b0-a6e3b4d44b84)"
            />
          </svg>
          <div
            className="absolute left-1/2 right-0 top-0 -z-10 -ml-24 transform-gpu overflow-hidden backdrop-blur-xl lg:ml-24 xl:ml-48"
            aria-hidden="true"
            style={{
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
            }}
          >
            <div
              className="aspect-[801/1036] w-[50.0625rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-40"
              style={{
                clipPath:
                  "polygon(63.1% 29.5%, 100% 17.1%, 76.6% 3%, 48.4% 0%, 44.6% 4.7%, 54.5% 25.3%, 59.8% 49%, 55.2% 57.8%, 44.4% 57.2%, 27.8% 47.9%, 35.1% 81.5%, 0% 97.7%, 39.2% 100%, 35.2% 81.4%, 97.2% 52.8%, 63.1% 29.5%)",
                filter: 'saturate(120%)',
              }}
            />
          </div>

          <div className="overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 pb-32 pt-36 sm:pt-60 lg:px-8 lg:pt-32">
              <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
                <div className="w-full max-w-xl lg:shrink-0 xl:max-w-2xl">
                  <div className="mb-8">
                    <SmartSiteLogo size="lg" className={`mx-auto lg:mx-0 ${styles.logoAnimated}`} />
                    <p className="mt-3 text-center text-xs font-semibold tracking-[0.2em] text-slate-600 uppercase lg:text-left">
                      {t("hero.subtitle")}
                    </p>
                  </div>
                  <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                    {t("hero.title")}
                  </h1>
                  <p className="relative mt-6 text-lg leading-8 text-gray-600 sm:max-w-md lg:max-w-none">
                    {t("hero.description")}
                  </p>
                </div>
                <div className="mt-14 flex justify-end gap-8 sm:-mt-44 sm:justify-start sm:pl-20 lg:mt-0 lg:pl-0">
                  <div className="ml-auto w-44 flex-none space-y-8 pt-32 sm:ml-0 sm:pt-80 lg:order-last lg:pt-36 xl:order-none xl:pt-80">
                    <div className={`${styles.imageShowcase} ${styles.floatingImage}`}>
                      <img
                        src="https://www.openspace.ai/wp-content/uploads/2025/02/BIM-Compare-tablet-on-jobsite-scaled.webp"
                        alt="Site manager using a tablet on site for real-time tracking"
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                    </div>
                  </div>

                  <div className="mr-auto w-44 flex-none space-y-8 sm:mr-0 sm:pt-52 lg:pt-36">
                    <div className={`${styles.imageShowcase} ${styles.floatingImage}`} style={{ animationDelay: '0.2s' }}>
                      <img
                        src="https://www.deltek.com/-/media/deltekblogs/lead-images/2023/construction-supervisor-with-digital-tablet-on-site.ashx"
                        alt="Construction supervisor checking site progress on mobile tablet"
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                    </div>

                    <div className={`${styles.imageShowcase} ${styles.floatingImage}`} style={{ animationDelay: '0.4s' }}>
                      <img
                        src="https://www.deltek.com/-/media/deltekblogs/lead-images/2023/750x500-ae-ipad.ashx"
                        alt="Construction worker capturing photos and data on iPad at construction site"
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                    </div>
                  </div>

                  <div className="w-44 flex-none space-y-8 pt-32 sm:pt-0">
                    <div className={`${styles.imageShowcase} ${styles.floatingImage}`} style={{ animationDelay: '0.6s' }}>
                      <img
                        src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=600&fit=crop&crop=faces"
                        alt="Project planning dashboard with timeline and scheduling tools"
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                    </div>

                    <div className={`${styles.imageShowcase} ${styles.floatingImage}`} style={{ animationDelay: '0.8s' }}>
                      <img
                        src="https://www.openspace.ai/wp-content/uploads/2025/10/Hero.png"
                        alt="Construction site progress dashboard with AI and SmartSite alerts"
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content section */}
        <div className="mx-auto mb-30 mt-12 max-w-7xl px-6 sm:mt-0 lg:px-8 xl:-mt-8">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-none">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {t("mission.title")}
            </h2>
            <div className="mt-6 flex flex-col gap-x-8 gap-y-20 lg:flex-row">
              <div className="lg:w-full lg:max-w-2xl lg:flex-auto">
                <p className="text-xl leading-8 text-gray-600">
                  {t("mission.subtitle")}
                </p>
                <div className="mt-10 max-w-xl text-base leading-7 text-gray-700">
                  <p>
                    {t("mission.description")}
                  </p>
                  <p className="mt-10">
                    {t("mission.footer")}
                  </p>
                </div>
              </div>
              <div className="lg:flex lg:flex-auto lg:justify-center">
                <dl className="w-64 space-y-8 xl:w-80">
                  {stats.map((stat) => (
                    <div key={stat.label} className={`${styles.statCard} flex flex-col-reverse gap-y-4`}>
                      <dt className="text-base leading-7 text-gray-600">
                        {stat.label}
                      </dt>
                      <dd className={`${styles.statValue} text-5xl font-semibold tracking-tight`}>
                        {stat.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className={`${styles.ctaSection} ${styles.glowingBox} relative isolate overflow-hidden bg-gray-900 py-24 sm:py-32`}>
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
                {t("cta.title")}
                <br />
                {t("cta.subtitle")}
              </h2>

              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-300">
                {t("cta.description")}
              </p>

              <div className="mt-10 flex items-center justify-center gap-x-6">
                <a
                  href="#"
                  className={`${styles.btnPrimary} rounded-lg px-8 py-4 text-sm font-semibold text-white`}
                >
                  {t("cta.startTrial")}
                </a>

                <button
                  onClick={() => setIsDemoOpen(true)}
                  className={`${styles.btnSecondary} rounded-lg px-8 py-4 text-sm font-semibold text-white hover:text-indigo-400 transition`}
                >
                  {t("cta.requestDemo")} <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          </div>

          <svg
            viewBox="0 0 1024 1024"
            className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]"
            aria-hidden="true"
          >
            <circle
              cx={512}
              cy={512}
              r={512}
              fill="url(#constructionGradient)"
              fillOpacity="0.3"
            />
            <defs>
              <radialGradient id="constructionGradient">
                <stop stopColor="#FACC15" />
                <stop offset={1} stopColor="#1F2937" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        <div className="mt-32 sm:mt-40 xl:mx-auto xl:max-w-7xl xl:px-8">
          <img
            src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2832&q=80"
            alt=""
            className={`${styles.imageShowcase} aspect-[5/2] w-full object-cover xl:rounded-3xl`}
          />
        </div>

        {/* Values section */}
        <div className="mx-auto mb-32 mt-32 max-w-7xl px-6 sm:mt-40 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {t("values.title")}
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              {t("values.subtitle")}
            </p>
          </div>
          <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 text-base leading-7 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {values.map((value) => (
              <div key={value.name} className={styles.valueCard}>
                <dt className="font-semibold text-gray-900">{value.name}</dt>
                <dd className="mt-1 text-gray-600">{value.description}</dd>
              </div>
            ))}
          </dl>
        </div>

        <section className="relative isolate overflow-hidden bg-gray-900 py-24 sm:py-32">
          <img
            src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=2000&q=80"
            alt="Construction site background"
            className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30"
          />

          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:mx-0">
              <h2 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                {t("buildSmarter.title")}
              </h2>

              <p className="mt-6 text-lg leading-8 text-gray-300">
                {t("buildSmarter.description")}
              </p>

              <div className="mt-8 flex gap-4">
                <button className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg transition">
                  {t("cta.startTrial")}
                </button>

                <button
                  onClick={() => setIsDemoOpen(true)}
                  className="border border-white text-white hover:bg-white hover:text-gray-900 px-6 py-3 rounded-lg transition"
                >
                  {t("cta.requestDemo")}
                </button>
              </div>
            </div>

            <dl className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {buildSmarterstats.map((item) => (
                <div key={item.label} className="flex flex-col-reverse">
                  <dt className="text-base leading-7 text-gray-300">
                    {item.label}
                  </dt>
                  <dd className="text-3xl font-bold tracking-tight text-white">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:max-w-none lg:grid-cols-2">
              <div className="lg:pr-8 lg:pt-4">
                <div className="lg:max-w-lg">
                  <h2 className="text-base font-semibold leading-7 text-indigo-600">
                    {t("features.title")}
                  </h2>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    {t("features.subtitle")}
                  </p>

                  <p className="mt-6 text-lg leading-8 text-gray-600">
                    {t("features.description")}
                  </p>

                  <dl className="mt-10 space-y-8 text-base leading-7 text-gray-600">
                    {[
                      {
                        title: t("features.tracking.title"),
                        desc: t("features.tracking.desc"),
                      },
                      {
                        title: t("features.workforce.title"),
                        desc: t("features.workforce.desc"),
                      },
                      {
                        title: t("features.budget.title"),
                        desc: t("features.budget.desc"),
                      },
                    ].map((feature) => (
                      <div key={feature.title} className="relative pl-9">
                        <dt className="inline font-semibold text-gray-900">
                          <span className="absolute left-1 top-1 text-indigo-500">
                            ✔
                          </span>
                          {feature.title}
                        </dt>
                        <dd className="inline">
                          {" "}
                          {feature.desc}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              <img
                src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2832&q=80"
                alt="Construction dashboard preview"
                className="w-[48rem] max-w-none rounded-xl shadow-xl ring-1 ring-gray-400/10 sm:w-[57rem]"
              />
            </div>
          </div>
        </section>

        <footer className={`${styles.footer} bg-gradient-to-br from-slate-900 via-blue-900 to-slate-950`} aria-labelledby="footer-heading">
          <h2 id="footer-heading" className="sr-only">
            Footer
          </h2>
          <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-20 lg:px-8">
            {/* Logo & Tagline */}
            <div className="mb-12 pb-8 border-b border-blue-800/30">
              <div className="flex items-center gap-3 mb-3">
                <SmartSiteLogo size="sm" className="drop-shadow-lg" />
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
                  SmartSite
                </h2>
              </div>
              <p className="text-gray-400 text-sm max-w-md">
                {t("hero.subtitle")} - Manage your construction sites with artificial intelligence
              </p>
            </div>

            {/* Main Grid */}
            <div className="xl:grid xl:grid-cols-4 xl:gap-8 mb-12">
              {/* Solutions & Support */}
              <div className="grid grid-cols-2 gap-8 xl:col-span-2 mb-8 xl:mb-0">
                <div>
                  <h3 className="text-xs font-bold text-blue-300 tracking-widest uppercase mb-6">
                    {t("footer.solutions")}
                  </h3>
                  <ul role="list" className="space-y-3">
                    {navigationFooter.solutions.map((item: any) => (
                      <li key={item.name}>
                        <a
                          href={item.href}
                          className={`${styles.footerLink} text-sm text-gray-300 hover:text-blue-300 transition-colors duration-200`}
                        >
                          {item.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-blue-300 tracking-widest uppercase mb-6">
                    {t("footer.support")}
                  </h3>
                  <ul role="list" className="space-y-3">
                    {navigationFooter.support.map((item: any) => (
                      <li key={item.name}>
                        <a
                          href={item.href}
                          className={`${styles.footerLink} text-sm text-gray-300 hover:text-blue-300 transition-colors duration-200`}
                        >
                          {item.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Company & Legal */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xs font-bold text-blue-300 tracking-widest uppercase mb-6">
                    {t("footer.company")}
                  </h3>
                  <ul role="list" className="space-y-3">
                    {navigationFooter.company.map((item: any) => (
                      <li key={item.name}>
                        <a
                          href={item.href}
                          className={`${styles.footerLink} text-sm text-gray-300 hover:text-blue-300 transition-colors duration-200`}
                        >
                          {item.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-blue-300 tracking-widest uppercase mb-6">
                    {t("footer.legal")}
                  </h3>
                  <ul role="list" className="space-y-3">
                    {navigationFooter.legal.map((item: any) => (
                      <li key={item.name}>
                        <a
                          href={item.href}
                          className={`${styles.footerLink} text-sm text-gray-300 hover:text-blue-300 transition-colors duration-200`}
                        >
                          {item.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Newsletter */}
              <div className="xl:col-span-1 bg-gradient-to-br from-blue-900/40 to-blue-800/30 rounded-lg p-6 border border-blue-700/40 backdrop-blur-sm">
                <h3 className="text-xs font-bold text-blue-300 tracking-widest uppercase mb-3">
                  {t("footer.newsletter")}
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  {t("footer.newsletterDesc")}
                </p>
                <form className="space-y-3">
                  <label htmlFor="footer-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="footer-email"
                    autoComplete="email"
                    required
                    className="w-full bg-white/10 border border-blue-600/50 rounded-lg py-2 px-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="your@email.com"
                  />
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg py-2 px-4 text-sm font-semibold text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                  >
                    Subscribe
                  </button>
                </form>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-blue-800/30 pt-8 mt-8">
              {/* Social Links & Copyright */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex space-x-5">
                  {navigationFooter.social.map((item: any) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className={`${styles.footerLink} text-gray-400 hover:text-blue-300 transition-colors duration-200`}
                      aria-label={item.name}
                    >
                      <span className="sr-only">{item.name}</span>
                      <item.icon className="h-5 w-5" aria-hidden="true" />
                    </a>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  {t("footer.copyright")}
                </p>
              </div>
            </div>
          </div>
        </footer>
      </main>

      <DemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
    </div>
  );
}
