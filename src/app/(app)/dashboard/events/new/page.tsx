"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { EventForm } from "@/components/events/event-form";

export const dynamic = "force-dynamic";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

export default function NewEventPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [orgError, setOrgError] = useState<string | null>(null);
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);

  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const response = await fetch("/api/organizations");
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setOrganizations(data.organizations || []);

        if (data.organizations?.length > 0) {
          const savedOrgId = localStorage.getItem("selectedOrganizationId");
          const validOrg = data.organizations.find(
            (org: Organization) => org.id === savedOrgId
          );
          setSelectedOrgId(validOrg?.id || data.organizations[0].id);
        }
      } catch (err) {
        console.error("Error fetching organizations:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrganizations();
  }, []);

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    setIsCreatingOrg(true);
    setOrgError(null);

    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newOrgName, slug: newOrgSlug }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create organization");
      }

      const { organization } = await response.json();
      setOrganizations((prev) => [...prev, organization]);
      setSelectedOrgId(organization.id);
      localStorage.setItem("selectedOrganizationId", organization.id);
      setNewOrgName("");
      setNewOrgSlug("");
    } catch (err) {
      setOrgError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsCreatingOrg(false);
    }
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    setNewOrgName(name);
    // Auto-generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setNewOrgSlug(slug);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D9B01C] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Create Event</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Organization Selector or Creator */}
        {organizations.length === 0 ? (
          <div className="mb-8 rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900">
              Create Your Organization First
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Before creating events, you need to set up your organization.
            </p>

            <form onSubmit={handleCreateOrg} className="mt-4 space-y-4">
              {orgError && (
                <div className="rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-700">{orgError}</p>
                </div>
              )}
              <div>
                <label
                  htmlFor="orgName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Organization Name
                </label>
                <input
                  type="text"
                  id="orgName"
                  autoComplete="organization"
                  value={newOrgName}
                  onChange={handleNameChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#D9B01C] focus:outline-none focus:ring-1 focus:ring-[#D9B01C]"
                  placeholder="My Company"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="orgSlug"
                  className="block text-sm font-medium text-gray-700"
                >
                  URL Slug
                </label>
                <input
                  type="text"
                  id="orgSlug"
                  autoComplete="off"
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#D9B01C] focus:outline-none focus:ring-1 focus:ring-[#D9B01C]"
                  placeholder="my-company"
                  pattern="^[a-z0-9-]+$"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Lowercase letters, numbers, and hyphens only
                </p>
              </div>
              <button
                type="submit"
                disabled={isCreatingOrg}
                className="inline-flex items-center rounded-md bg-[#D9B01C] px-4 py-2 text-sm font-semibold text-[#090909] shadow-sm hover:bg-[#C49F18] disabled:opacity-50"
              >
                {isCreatingOrg ? "Creating..." : "Create Organization"}
              </button>
            </form>
          </div>
        ) : (
          <>
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
                    localStorage.setItem(
                      "selectedOrganizationId",
                      e.target.value
                    );
                  }}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#D9B01C] focus:outline-none focus:ring-1 focus:ring-[#D9B01C]"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Event Form */}
            <div className="rounded-lg bg-white p-6 shadow">
              {selectedOrgId && (
                <EventForm organizationId={selectedOrgId} mode="create" />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
