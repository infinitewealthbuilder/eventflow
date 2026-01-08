"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface EventFormData {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  timezone: string;
  location: string;
  isOnline: boolean;
  onlineUrl: string;
  coverImageUrl: string;
}

interface EventFormProps {
  organizationId: string;
  eventId?: string;
  initialData?: Partial<EventFormData>;
  mode: "create" | "edit";
}

const TIMEZONES = [
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
];

export function EventForm({
  organizationId,
  eventId,
  initialData,
  mode,
}: EventFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<EventFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    startTime: initialData?.startTime || "",
    endTime: initialData?.endTime || "",
    timezone: initialData?.timezone || "America/Los_Angeles",
    location: initialData?.location || "",
    isOnline: initialData?.isOnline || false,
    onlineUrl: initialData?.onlineUrl || "",
    coverImageUrl: initialData?.coverImageUrl || "",
  });

  // Set default start time to next hour if creating new event
  useEffect(() => {
    if (mode === "create" && !formData.startTime) {
      const now = new Date();
      now.setHours(now.getHours() + 1, 0, 0, 0);
      const endTime = new Date(now);
      endTime.setHours(endTime.getHours() + 1);

      setFormData((prev) => ({
        ...prev,
        startTime: formatDateTimeLocal(now),
        endTime: formatDateTimeLocal(endTime),
      }));
    }
  }, [mode, formData.startTime]);

  function formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url =
        mode === "create" ? "/api/events" : `/api/events/${eventId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const body = {
        ...formData,
        organizationId: mode === "create" ? organizationId : undefined,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        location: formData.location || null,
        onlineUrl: formData.onlineUrl || null,
        coverImageUrl: formData.coverImageUrl || null,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save event");
      }

      const { event } = await response.json();
      router.push(`/dashboard/events/${event.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Event Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          maxLength={200}
          autoComplete="off"
          value={formData.title}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#D9B01C] focus:outline-none focus:ring-1 focus:ring-[#D9B01C]"
          placeholder="e.g., Annual Client Appreciation Dinner"
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          value={formData.description}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#D9B01C] focus:outline-none focus:ring-1 focus:ring-[#D9B01C]"
          placeholder="Describe your event..."
        />
      </div>

      {/* Date/Time Row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="startTime"
            className="block text-sm font-medium text-gray-700"
          >
            Start Time <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            id="startTime"
            name="startTime"
            required
            value={formData.startTime}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#D9B01C] focus:outline-none focus:ring-1 focus:ring-[#D9B01C]"
          />
        </div>
        <div>
          <label
            htmlFor="endTime"
            className="block text-sm font-medium text-gray-700"
          >
            End Time <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            id="endTime"
            name="endTime"
            required
            value={formData.endTime}
            onChange={handleChange}
            min={formData.startTime}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#D9B01C] focus:outline-none focus:ring-1 focus:ring-[#D9B01C]"
          />
        </div>
      </div>

      {/* Timezone */}
      <div>
        <label
          htmlFor="timezone"
          className="block text-sm font-medium text-gray-700"
        >
          Timezone
        </label>
        <select
          id="timezone"
          name="timezone"
          value={formData.timezone}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#D9B01C] focus:outline-none focus:ring-1 focus:ring-[#D9B01C]"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      {/* Online Event Toggle */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isOnline"
          name="isOnline"
          checked={formData.isOnline}
          onChange={handleChange}
          className="h-4 w-4 rounded border-gray-300 text-[#D9B01C] focus:ring-[#D9B01C]"
        />
        <label htmlFor="isOnline" className="ml-2 text-sm text-gray-700">
          This is an online/virtual event
        </label>
      </div>

      {/* Conditional Location or Online URL */}
      {formData.isOnline ? (
        <div>
          <label
            htmlFor="onlineUrl"
            className="block text-sm font-medium text-gray-700"
          >
            Meeting URL
          </label>
          <input
            type="url"
            id="onlineUrl"
            name="onlineUrl"
            autoComplete="url"
            value={formData.onlineUrl}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#D9B01C] focus:outline-none focus:ring-1 focus:ring-[#D9B01C]"
            placeholder="https://zoom.us/j/..."
          />
        </div>
      ) : (
        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700"
          >
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            autoComplete="street-address"
            value={formData.location}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#D9B01C] focus:outline-none focus:ring-1 focus:ring-[#D9B01C]"
            placeholder="123 Main St, City, State"
          />
        </div>
      )}

      {/* Cover Image URL */}
      <div>
        <label
          htmlFor="coverImageUrl"
          className="block text-sm font-medium text-gray-700"
        >
          Cover Image URL
        </label>
        <input
          type="url"
          id="coverImageUrl"
          name="coverImageUrl"
          autoComplete="url"
          value={formData.coverImageUrl}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#D9B01C] focus:outline-none focus:ring-1 focus:ring-[#D9B01C]"
          placeholder="https://example.com/image.jpg"
        />
        <p className="mt-1 text-xs text-gray-500">
          Recommended: 1200x630px for social media
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#D9B01C] focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-md bg-[#D9B01C] px-4 py-2 text-sm font-semibold text-[#090909] shadow-sm hover:bg-[#C49F18] focus:outline-none focus:ring-2 focus:ring-[#D9B01C] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <svg
                className="-ml-1 mr-2 h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving...
            </>
          ) : mode === "create" ? (
            "Create Event"
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </form>
  );
}
