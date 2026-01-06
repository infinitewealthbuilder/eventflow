import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema for updating events
const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  startTime: z.string().transform((s) => new Date(s)).optional(),
  endTime: z.string().transform((s) => new Date(s)).optional(),
  timezone: z.string().optional(),
  location: z.string().optional().nullable(),
  isOnline: z.boolean().optional(),
  onlineUrl: z.string().url().optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "CANCELED"]).optional(),
});

// GET /api/events/[id] - Get single event
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        publications: true,
        organization: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if user is a member
    if (event.organization.members.length === 0) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Remove organization members from response
    const { organization, ...eventData } = event;
    return NextResponse.json({
      event: {
        ...eventData,
        organizationId: organization.id,
        organizationName: organization.name,
      },
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id] - Update event
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = updateEventSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    // Get the event and check membership
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      include: {
        organization: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (existingEvent.organization.members.length === 0) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Update the event
    const event = await prisma.event.update({
      where: { id },
      data: validatedData.data,
      include: {
        publications: true,
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - Delete event
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the event and check membership
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      include: {
        organization: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (existingEvent.organization.members.length === 0) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Delete the event (cascades to publications)
    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
