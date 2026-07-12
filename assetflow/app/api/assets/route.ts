import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireRole(Object.values(UserRole));
  if (auth.response) return auth.response;

  try {
    const assets = await prisma.asset.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        currentHolder: {
          select: {
            id: true,
            name: true,
          },
        },
        currentHolderDepartment: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { tag: "asc" },
    });

    return NextResponse.json(
      { assets },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("Failed to fetch assets:", error);
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
  }
}
