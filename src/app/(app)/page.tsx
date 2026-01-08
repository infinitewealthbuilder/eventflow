import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

// Platform data with accessible labels for emojis
const platforms = [
  { name: "Facebook Events", icon: "📘", iconLabel: "Facebook icon", tier: "Basic" },
  { name: "LinkedIn Events", icon: "💼", iconLabel: "Briefcase icon", tier: "Basic" },
  { name: "Local Calendar", icon: "📅", iconLabel: "Calendar icon", tier: "Free" },
  { name: "Eventbrite", icon: "🎟️", iconLabel: "Ticket icon", tier: "Basic" },
  { name: "Meetup", icon: "👥", iconLabel: "People icon", tier: "Pro" },
  { name: "Instagram", icon: "📷", iconLabel: "Camera icon", tier: "Basic" },
  { name: "X (Twitter)", icon: "🐦", iconLabel: "Bird icon", tier: "Basic" },
  { name: "Discord", icon: "💬", iconLabel: "Chat icon", tier: "Pro" },
  { name: "WhatsApp", icon: "📱", iconLabel: "Phone icon", tier: "Business" },
];

// Pricing tiers
const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    platforms: 2,
    events: "10",
    highlight: false,
  },
  {
    name: "Basic",
    price: "$9.99",
    platforms: 4,
    events: "50",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$19.99",
    platforms: 7,
    events: "200",
    highlight: true,
  },
  {
    name: "Business",
    price: "$49.99",
    platforms: 9,
    events: "Unlimited",
    highlight: false,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#D9B01C] focus:text-[#090909] focus:rounded-md focus:font-medium"
      >
        Skip to main content
      </a>

      <Header variant="default" showAuth={false} />

      {/* Hero Section */}
      <main id="main-content" className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Create events once.
              <br />
              <span className="text-[#D9B01C]">Publish everywhere.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
              Stop copying and pasting event details to multiple platforms.
              EventFlow lets you create an event once and cross-post it to
              Facebook, LinkedIn, Eventbrite, and more with a single click.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/sign-up"
                className="rounded-md bg-[#D9B01C] px-6 py-3 text-lg font-semibold text-[#090909] shadow-sm hover:bg-[#C49F18] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B01C] transition-colors"
              >
                Start Free
              </Link>
              <Link
                href="#platforms"
                className="text-lg font-semibold leading-6 text-gray-900 hover:text-[#D9B01C] transition-colors"
              >
                See Platforms <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          {/* Platform Grid */}
          <section id="platforms" className="mt-24 scroll-mt-24">
            <h2 className="text-center text-3xl font-bold text-gray-900">
              9 Platforms, One Dashboard
            </h2>
            <p className="mt-4 text-center text-gray-600">
              Connect your accounts and publish events everywhere
            </p>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {platforms.map((platform) => (
                <div
                  key={platform.name}
                  className="rounded-lg bg-white p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border border-gray-100"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className="text-3xl"
                      role="img"
                      aria-label={platform.iconLabel}
                    >
                      {platform.icon}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {platform.name}
                      </h3>
                      <span
                        className={`text-sm font-medium ${
                          platform.tier === "Free"
                            ? "text-green-600"
                            : platform.tier === "Basic"
                              ? "text-[#D9B01C]"
                              : platform.tier === "Pro"
                                ? "text-purple-600"
                                : "text-orange-600"
                        }`}
                      >
                        {platform.tier}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pricing Preview */}
          <section id="pricing" className="mt-24 scroll-mt-24">
            <h2 className="text-center text-3xl font-bold text-gray-900">
              Simple Pricing
            </h2>
            <p className="mt-4 text-center text-gray-600">
              Start free, upgrade when you need more
            </p>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`rounded-lg p-8 transition-all duration-200 hover:-translate-y-1 ${
                    tier.highlight
                      ? "bg-[#D9B01C] text-[#090909] shadow-xl ring-2 ring-[#D9B01C] hover:shadow-2xl"
                      : "bg-white shadow-md border border-gray-100 hover:shadow-lg"
                  }`}
                  aria-label={`${tier.name} plan: ${tier.price} per month`}
                >
                  <h3
                    className={`text-lg font-semibold ${tier.highlight ? "text-[#090909]" : "text-gray-900"}`}
                  >
                    {tier.name}
                  </h3>
                  <p className="mt-4">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span
                      className={tier.highlight ? "text-[#090909]/70" : "text-gray-500"}
                    >
                      /month
                    </span>
                  </p>
                  <ul className="mt-6 space-y-3" role="list">
                    <li
                      className={`flex items-center gap-2 text-sm ${tier.highlight ? "text-[#090909]/80" : "text-gray-600"}`}
                    >
                      <span aria-hidden="true">✓</span>
                      <span>{tier.platforms} platforms</span>
                    </li>
                    <li
                      className={`flex items-center gap-2 text-sm ${tier.highlight ? "text-[#090909]/80" : "text-gray-600"}`}
                    >
                      <span aria-hidden="true">✓</span>
                      <span>{tier.events} events/month</span>
                    </li>
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
