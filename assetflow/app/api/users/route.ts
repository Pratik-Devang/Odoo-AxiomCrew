import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireRole(Object.values(UserRole));
  if (auth.response) return auth.response;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      departmentId: true,
      department: { select: { id: true, name: true } },
      heldAssets: {
        select: {
          id: true,
          tag: true,
          name: true,
          status: true,
          location: true,
          category: { select: { name: true } },
        },
        orderBy: [{ category: { name: "asc" } }, { tag: "asc" }],
      },
      allocations: {
        take: 5,
        orderBy: { allocatedAt: "desc" },
        select: {
          id: true,
          status: true,
          allocatedAt: true,
          expectedReturnDate: true,
          returnedAt: true,
          asset: { select: { tag: true, name: true, status: true } },
          department: { select: { name: true } },
        },
      },
      bookings: {
        take: 5,
        orderBy: { startTime: "desc" },
        select: {
          id: true,
          status: true,
          startTime: true,
          endTime: true,
          asset: { select: { tag: true, name: true } },
        },
      },
      maintenanceRequestsRaised: {
        take: 5,
        orderBy: { raisedAt: "desc" },
        select: {
          id: true,
          issueDescription: true,
          priority: true,
          status: true,
          raisedAt: true,
          resolvedAt: true,
          asset: { select: { tag: true, name: true } },
        },
      },
      transferRequestsSent: {
        take: 5,
        orderBy: { requestedAt: "desc" },
        select: {
          id: true,
          status: true,
          requestedAt: true,
          asset: { select: { tag: true, name: true } },
          toEmployee: { select: { name: true } },
        },
      },
      transferRequestsReceived: {
        take: 5,
        orderBy: { requestedAt: "desc" },
        select: {
          id: true,
          status: true,
          requestedAt: true,
          asset: { select: { tag: true, name: true } },
          fromEmployee: { select: { name: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ users }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
