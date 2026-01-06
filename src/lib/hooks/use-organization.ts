"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface UseOrganizationReturn {
  organization: Organization | null;
  organizations: Organization[];
  isLoading: boolean;
  error: string | null;
  selectOrganization: (orgId: string) => void;
}

export function useOrganization(): UseOrganizationReturn {
  const { user, isLoaded } = useUser();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) {
      setIsLoading(false);
      return;
    }

    async function fetchOrganizations() {
      try {
        const response = await fetch("/api/organizations");
        if (!response.ok) {
          throw new Error("Failed to fetch organizations");
        }
        const data = await response.json();
        setOrganizations(data.organizations || []);

        // Auto-select first organization if none selected
        if (data.organizations?.length > 0 && !selectedOrgId) {
          // Check localStorage for previously selected org
          const savedOrgId = localStorage.getItem("selectedOrganizationId");
          const validOrg = data.organizations.find(
            (org: Organization) => org.id === savedOrgId
          );
          setSelectedOrgId(validOrg?.id || data.organizations[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrganizations();
  }, [isLoaded, user, selectedOrgId]);

  function selectOrganization(orgId: string) {
    setSelectedOrgId(orgId);
    localStorage.setItem("selectedOrganizationId", orgId);
  }

  const organization = organizations.find((org) => org.id === selectedOrgId) || null;

  return {
    organization,
    organizations,
    isLoading,
    error,
    selectOrganization,
  };
}
