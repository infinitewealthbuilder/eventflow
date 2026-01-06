import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema for creating events
const createEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required"),
  startTime: z.string().transform((s) => new Date(s)),
  endTime: z.string().transform((s) => new Date(s)),
  timezone: z.string().default("America/Los_Angeles"),
  location: z.string().optional(),
  isOnline: z.boolean().default(false),
  onlineUrl: z.string().url().optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
  organizationId: z.string(),
});

// GET /api/events - List events for organization
export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID required" },
        { status: 400 }
      );
    }

    // Verify user is a member of the organization
    const member = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const events = await prisma.event.findMany({
      where: { organizationId },
      include: {
        publications: {
          select: {
            id: true,
            platform: true,
            status: true,
            publishedAt: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// POST /api/events - Create new event
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createEventSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const { organizationId, ...eventData } = validatedData.data;

    // Verify user is a member of the organization
    const member = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    // Create the event
    const event = await prisma.event.create({
      data: {
        ...eventData,
        organizationId,
        status: "DRAFT",
      },
      include: {
        publications: true,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
