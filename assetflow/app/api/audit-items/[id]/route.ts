import { UserRole, AuditVerification, AuditCycleStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";

export const dynamic = "force-dynamic";

const verifyItemSchema = z.object({
  verification: z.nativeEnum(AuditVerification),
  notes: z.string().trim().optional().or(z.literal("")),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(Object.values(UserRole));
  if (auth.response) return auth.response;

  try {
    const itemId = parseInt(params.id, 10);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = verifyItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid fields" },
        { status: 400 }
      );
    }

    const { verification, notes } = parsed.data;

    // Fetch the audit item and its cycle
    const item = await prisma.auditItem.findUnique({
      where: { id: itemId },
      include: {
        auditCycle: {
          include: {
            auditors: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Audit item not found" }, { status: 404 });
    }

    // Check if the audit cycle is open
    if (item.auditCycle.status === AuditCycleStatus.CLOSED) {
      return NextResponse.json(
        { error: "Cannot verify items on a closed audit cycle" },
        { status: 400 }
      );
    }

    // Check if the current user is an assigned auditor or admin
    const isAssignedAuditor = item.auditCycle.auditors.some((a) => a.userId === auth.user.id);
    const isAdmin = auth.user.role === UserRole.ADMIN;

    if (!isAssignedAuditor && !isAdmin) {
      return NextResponse.json(
        { error: "You are not authorized to verify items for this cycle. Only assigned auditors and admins are permitted." },
        { status: 403 }
      );
    }

    // Update the item
    const updatedItem = await prisma.auditItem.update({
      where: { id: itemId },
      data: {
        verification,
        notes: notes || null,
        verifiedById: auth.user.id,
        verifiedAt: new Date(),
      },
    });

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    console.error("Failed to update audit item:", error);
    return NextResponse.json({ error: "Failed to update audit item" }, { status: 500 });
  }
}
