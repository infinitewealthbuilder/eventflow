"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { EventForm } from "@/components/events/event-form";

export const dynamic = "force-dynamic";

interface Publication {
  id: string;
  platform: string;
  status: string;
  publishedAt: string | null;
  platformUrl: string | null;
}

interface Event {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  timezone: string;
  location: string | null;
  isOnline: boolean;
  onlineUrl: string | null;
  coverImageUrl: string | null;
  status: string;
  organizationId: string;
  organizationName: string;
  publications: Publication[];
  createdAt: string;
  updatedAt: string;
}

function formatDateTimeLocal(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(`/api/events/${id}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to fetch event");
        }
        const data = await response.json();
        setEvent(data.event);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvent();
  }, [id]);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete event");
      }
      router.push("/dashboard/events");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsDeleting(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update status");
      }
      const data = await response.json();
      setEvent(data.event);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-700",
      SCHEDULED: "bg-blue-100 text-blue-700",
      PUBLISHED: "bg-green-100 text-green-700",
      CANCELED: "bg-red-100 text-red-700",
    };
    return styles[status] || styles.DRAFT;
  }

  function getPlatformIcon(platform: string) {
    const icons: Record<string, string> = {
      LOCAL_CALENDAR: "📅",
      FACEBOOK_EVENTS: "📘",
      LINKEDIN_EVENTS: "💼",
      EVENTBRITE: "🎟️",
      MEETUP: "🤝",
      INSTAGRAM: "📷",
      TWITTER: "🐦",
      DISCORD: "💬",
      WHATSAPP: "📱",
    };
    return icons[platform] || "📌";
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error || "Event not found"}</p>
          </div>
          <Link
            href="/dashboard/events"
            className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-500"
          >
            ← Back to Events
          </Link>
        </div>
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
              href="/dashboard/events"
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
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? "Edit Event" : event.title}
            </h1>
          </div>
          {!isEditing && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {isEditing ? (
          <div className="rounded-lg bg-white p-6 shadow">
            <EventForm
              organizationId={event.organizationId}
              eventId={event.id}
              mode="edit"
              initialData={{
                title: event.title,
                description: event.description,
                startTime: formatDateTimeLocal(event.startTime),
                endTime: formatDateTimeLocal(event.endTime),
                timezone: event.timezone,
                location: event.location || "",
                isOnline: event.isOnline,
                onlineUrl: event.onlineUrl || "",
                coverImageUrl: event.coverImageUrl || "",
              }}
            />
            <button
              onClick={() => setIsEditing(false)}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel editing
            </button>
          </div>
        ) : (
          <>
            {/* Status Card */}
            <div className="mb-6 rounded-lg bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusBadge(
                      event.status
                    )}`}
                  >
                    {event.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {event.organizationName}
                  </span>
                </div>
                <div className="flex gap-2">
                  {event.status === "DRAFT" && (
                    <button
                      onClick={() => handleStatusChange("PUBLISHED")}
                      className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-500"
                    >
                      Publish
                    </button>
                  )}
                  {event.status === "PUBLISHED" && (
                    <button
                      onClick={() => handleStatusChange("CANCELED")}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500"
                    >
                      Cancel Event
                    </button>
                  )}
                  {event.status === "CANCELED" && (
                    <button
                      onClick={() => handleStatusChange("DRAFT")}
                      className="rounded-md bg-gray-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-500"
                    >
                      Revert to Draft
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-xl font-semibold text-gray-900">
                {event.title}
              </h2>

              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <svg
                    className="mt-0.5 h-5 w-5 text-gray-400"
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
                  <div>
                    <p className="font-medium text-gray-900">
                      {formatDate(event.startTime)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}{" "}
                      ({event.timezone})
                    </p>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-start gap-3">
                    <svg
                      className="mt-0.5 h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <p className="text-gray-700">{event.location}</p>
                  </div>
                )}

                {event.isOnline && event.onlineUrl && (
                  <div className="flex items-start gap-3">
                    <svg
                      className="mt-0.5 h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <a
                      href={event.onlineUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-500"
                    >
                      Join Online
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-6 border-t pt-6">
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-2 whitespace-pre-wrap text-gray-700">
                  {event.description}
                </p>
              </div>

              {event.coverImageUrl && (
                <div className="mt-6 border-t pt-6">
                  <h3 className="text-sm font-medium text-gray-500">
                    Cover Image
                  </h3>
                  <div className="relative mt-2 h-[300px] w-full">
                    <Image
                      src={event.coverImageUrl}
                      alt="Event cover"
                      fill
                      className="rounded-lg object-cover"
                      unoptimized
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Publications */}
            <div className="mt-6 rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900">
                Cross-Post Status
              </h3>
              {event.publications.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">
                  No cross-posts yet. Connect platforms to publish this event.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {event.publications.map((pub) => (
                    <div
                      key={pub.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {getPlatformIcon(pub.platform)}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">
                            {pub.platform.replace(/_/g, " ")}
                          </p>
                          {pub.publishedAt && (
                            <p className="text-xs text-gray-500">
                              Published{" "}
                              {new Date(pub.publishedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            pub.status === "PUBLISHED"
                              ? "bg-green-100 text-green-700"
                              : pub.status === "FAILED"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {pub.status}
                        </span>
                        {pub.platformUrl && (
                          <a
                            href={pub.platformUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-500"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Delete Event</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete &quot;{event.title}&quot;? This
              action cannot be undone and will remove all associated
              publications.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
