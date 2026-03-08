import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/db";
import { classifyGrievanceAsync } from "@/lib/classify";
import { getSlaHours, addHours } from "@/lib/sla";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { description, location, citizenName, citizenContact, photoUrl } = body as {
      description: string;
      location?: string;
      citizenName?: string;
      citizenContact?: string;
      photoUrl?: string;
    };

    if (!description?.trim()) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    const classification = await classifyGrievanceAsync(description);
    const hours = await getSlaHours(classification.department, classification.category);
    const now = new Date();
    const slaDueAt = addHours(now, hours);

    const ticketId = "GRV-" + uuidv4().slice(0, 8).toUpperCase();

    const grievance = await prisma.grievance.create({
      data: {
        ticketId,
        description: description.trim(),
        category: classification.category,
        department: classification.department,
        location: location?.trim() ?? null,
        urgency: classification.urgency,
        status: "received",
        photoUrl: photoUrl ?? null,
        citizenName: citizenName?.trim() ?? null,
        citizenContact: citizenContact?.trim() ?? null,
        slaDueAt,
      },
    });

    await prisma.grievanceHistory.create({
      data: {
        grievanceId: grievance.id,
        status: "received",
        note: "Complaint submitted and classified",
      },
    });

    return NextResponse.json({
      ticketId: grievance.ticketId,
      id: grievance.id,
      department: grievance.department,
      category: grievance.category,
      urgency: grievance.urgency,
      slaDueAt: grievance.slaDueAt?.toISOString(),
      message: "Grievance registered successfully. Save your ticket ID to track status.",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to submit grievance" }, { status: 500 });
  }
}
