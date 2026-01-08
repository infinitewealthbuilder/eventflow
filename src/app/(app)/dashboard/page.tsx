"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const dynamic = "force-dynamic";

interface Publication {
  id: string;
  platform: string;
  status: string;
}

interface Event {
  id: string;
  title: string;
  startTime: string;
  status: string;
  publications: Publication[];
}

interface Organization {
  id: string;
  name: string;
  slug: string;
}

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch organizations
        const orgResponse = await fetch("/api/organizations");
        if (orgResponse.ok) {
          const orgData = await orgResponse.json();
          setOrganizations(orgData.organizations || []);

          if (orgData.organizations?.length > 0) {
            const savedOrgId = localStorage.getItem("selectedOrganizationId");
            const validOrg = orgData.organizations.find(
              (org: Organization) => org.id === savedOrgId
            );
            const orgId = validOrg?.id || orgData.organizations[0].id;
            setSelectedOrgId(orgId);

            // Fetch events for the selected org
            const eventsResponse = await fetch(
              `/api/events?organizationId=${orgId}`
            );
            if (eventsResponse.ok) {
              const eventsData = await eventsResponse.json();
              setEvents(eventsData.events || []);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Calculate stats
  const totalEvents = events.length;
  const publishedEvents = events.filter((e) => e.status === "PUBLISHED").length;
  const scheduledEvents = events.filter((e) => e.status === "SCHEDULED").length;
  const draftEvents = events.filter((e) => e.status === "DRAFT").length;

  // Get upcoming events (next 5)
  const upcomingEvents = events
    .filter((e) => new Date(e.startTime) > new Date() && e.status !== "CANCELED")
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header variant="dashboard" />

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Organization Selector (if multiple) */}
        {organizations.length > 1 && (
          <div className="mb-6">
            <label
              htmlFor="orgSelect"
              className="block text-sm font-medium text-gray-700"
            >
              Organization
            </label>
            <select
              id="orgSelect"
              value={selectedOrgId || ""}
              onChange={(e) => {
                setSelectedOrgId(e.target.value);
                localStorage.setItem("selectedOrganizationId", e.target.value);
                window.location.reload();
              }}
              className="mt-1 block w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#D9B01C] focus:outline-none focus:ring-1 focus:ring-[#D9B01C]"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Events" value={String(totalEvents)} />
          <StatCard title="Published" value={String(publishedEvents)} />
          <StatCard title="Scheduled" value={String(scheduledEvents)} />
          <StatCard title="Drafts" value={String(draftEvents)} />
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upcoming Events */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Upcoming Events
              </h2>
              <Link
                href="/dashboard/events"
                className="text-sm text-[#D9B01C] hover:text-[#C49F18]"
              >
                View all →
              </Link>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#D9B01C] border-t-transparent" />
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="mt-4 rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
                <svg
                  className="mx-auto h-10 w-10 text-gray-400"
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
                <p className="mt-2 text-sm text-gray-500">No upcoming events</p>
                <Link
                  href="/dashboard/events/new"
                  className="mt-3 inline-flex items-center text-sm text-[#D9B01C] hover:text-[#C49F18]"
                >
                  <svg
                    className="mr-1 h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                  </svg>
                  Create your first event
                </Link>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/dashboard/events/${event.id}`}
                    className="block rounded-lg border p-3 hover:border-[#F5E6A3] hover:bg-[#F5E6A3]/20 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{event.title}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          event.status === "PUBLISHED"
                            ? "bg-green-100 text-green-700"
                            : event.status === "SCHEDULED"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {event.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatDate(event.startTime)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Create Event CTA */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900">
                Quick Actions
              </h2>
              <div className="mt-4 space-y-3">
                <Link
                  href="/dashboard/events/new"
                  className="flex items-center gap-3 rounded-lg border p-4 hover:border-[#F5E6A3] hover:bg-[#F5E6A3]/20 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F5E6A3]">
                    <svg
                      className="h-5 w-5 text-[#D9B01C]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Create Event</p>
                    <p className="text-sm text-gray-500">
                      Start a new event to cross-post
                    </p>
                  </div>
                </Link>
                <Link
                  href="/dashboard/events"
                  className="flex items-center gap-3 rounded-lg border p-4 hover:border-[#F5E6A3] hover:bg-[#F5E6A3]/20 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <svg
                      className="h-5 w-5 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">View All Events</p>
                    <p className="text-sm text-gray-500">
                      Manage your event library
                    </p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Platform Connections */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900">
                Platform Connections
              </h2>
              <div className="mt-4 space-y-3">
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
          </div>
        </div>
      </main>

      <Footer />
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
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <h3 className="text-sm font-medium text-gray-900">{name}</h3>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      {status === "connected" ? (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
          Connected
        </span>
      ) : (
        <button type="button" className="rounded-md bg-[#F5E6A3] px-2.5 py-1 text-xs font-medium text-[#090909] hover:bg-[#D9B01C]">
          Connect
        </button>
      )}
    </div>
  );
}
