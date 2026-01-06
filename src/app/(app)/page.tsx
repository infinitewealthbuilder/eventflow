import Link from "next/link";

export default function Home() {

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Header */}
      <header className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between">
          <div className="text-2xl font-bold text-indigo-600">EventFlow</div>
          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Create events once.
            <br />
            <span className="text-indigo-600">Publish everywhere.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Stop copying and pasting event details to multiple platforms.
            EventFlow lets you create an event once and cross-post it to
            Facebook, LinkedIn, Eventbrite, and more with a single click.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/sign-up"
              className="rounded-md bg-indigo-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Start Free
            </Link>
            <Link
              href="#platforms"
              className="text-lg font-semibold leading-6 text-gray-900"
            >
              See Platforms <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Platform Grid */}
        <section id="platforms" className="mt-24">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            9 Platforms, One Dashboard
          </h2>
          <p className="mt-4 text-center text-gray-600">
            Connect your accounts and publish events everywhere
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Facebook Events", icon: "📘", tier: "Basic" },
              { name: "LinkedIn Events", icon: "💼", tier: "Basic" },
              { name: "Local Calendar", icon: "📅", tier: "Free" },
              { name: "Eventbrite", icon: "🎟️", tier: "Basic" },
              { name: "Meetup", icon: "👥", tier: "Pro" },
              { name: "Instagram", icon: "📷", tier: "Basic" },
              { name: "X (Twitter)", icon: "🐦", tier: "Basic" },
              { name: "Discord", icon: "💬", tier: "Pro" },
              { name: "WhatsApp", icon: "📱", tier: "Business" },
            ].map((platform) => (
              <div
                key={platform.name}
                className="rounded-lg bg-white p-6 shadow-md"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{platform.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {platform.name}
                    </h3>
                    <span
                      className={`text-sm ${
                        platform.tier === "Free"
                          ? "text-green-600"
                          : platform.tier === "Basic"
                            ? "text-blue-600"
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
        <section className="mt-24">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Simple Pricing
          </h2>
          <p className="mt-4 text-center text-gray-600">
            Start free, upgrade when you need more
          </p>

          <div className="mt-12 grid gap-8 lg:grid-cols-4">
            {[
              {
                name: "Free",
                price: "$0",
                platforms: 2,
                events: 10,
                highlight: false,
              },
              {
                name: "Basic",
                price: "$9.99",
                platforms: 4,
                events: 50,
                highlight: false,
              },
              {
                name: "Pro",
                price: "$19.99",
                platforms: 7,
                events: 200,
                highlight: true,
              },
              {
                name: "Business",
                price: "$49.99",
                platforms: 9,
                events: "Unlimited",
                highlight: false,
              },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`rounded-lg p-8 ${
                  tier.highlight
                    ? "bg-indigo-600 text-white shadow-xl ring-2 ring-indigo-600"
                    : "bg-white shadow-md"
                }`}
              >
                <h3
                  className={`text-lg font-semibold ${tier.highlight ? "text-white" : "text-gray-900"}`}
                >
                  {tier.name}
                </h3>
                <p className="mt-4">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span
                    className={tier.highlight ? "text-indigo-200" : "text-gray-500"}
                  >
                    /month
                  </span>
                </p>
                <ul className="mt-6 space-y-3">
                  <li
                    className={`flex items-center gap-2 text-sm ${tier.highlight ? "text-indigo-100" : "text-gray-600"}`}
                  >
                    ✓ {tier.platforms} platforms
                  </li>
                  <li
                    className={`flex items-center gap-2 text-sm ${tier.highlight ? "text-indigo-100" : "text-gray-600"}`}
                  >
                    ✓ {tier.events} events/month
                  </li>
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-24 border-t border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500">
          <p>© 2026 EventFlow. Built for event creators.</p>
        </div>
      </footer>
    </div>
  );
}
