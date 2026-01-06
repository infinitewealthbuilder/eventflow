import Link from "next/link";
import { AuthButton } from "@/components/auth-button";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">EventFlow</h1>
          <div className="flex items-center gap-4">
            <AuthButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Quick Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Events" value="0" />
          <StatCard title="Published" value="0" />
          <StatCard title="Scheduled" value="0" />
          <StatCard title="Platforms Connected" value="1" subtitle="Local Calendar" />
        </div>

        {/* Create Event CTA */}
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No events yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Get started by creating your first event.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/events/new"
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <svg
                className="-ml-0.5 mr-1.5 h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              Create Event
            </Link>
          </div>
        </div>

        {/* Platform Connections */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Platform Connections</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <PlatformCard
              name="Local Calendar"
              icon="📅"
              status="connected"
              description="Export events to .ics format"
            />
            <PlatformCard
              name="Facebook Events"
              icon="📘"
              status="not-connected"
              description="Publish to Facebook Pages"
            />
            <PlatformCard
              name="LinkedIn Events"
              icon="💼"
              status="not-connected"
              description="Share with professional network"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}

function PlatformCard({
  name,
  icon,
  status,
  description,
}: {
  name: string;
  icon: string;
  status: "connected" | "not-connected";
  description: string;
}) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="font-medium text-gray-900">{name}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        {status === "connected" ? (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            Connected
          </span>
        ) : (
          <button className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200">
            Connect
          </button>
        )}
      </div>
    </div>
  );
}
