import { Prisma, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";

const updateAssetSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  location: z.string().trim().min(2).max(160).optional(),
  condition: z.string().trim().min(2).max(80).optional(),
});

const detailSelect = {
  id: true,
  tag: true,
  name: true,
  categoryId: true,
  serialNumber: true,
  acquisitionDate: true,
  acquisitionCost: true,
  condition: true,
  location: true,
  isBookable: true,
  status: true,
  createdAt: true,
  category: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
  currentHolder: { select: { id: true, name: true, email: true, department: { select: { id: true, name: true } } } },
  currentHolderDepartment: { select: { id: true, name: true } },
  allocations: {
    orderBy: { allocatedAt: "desc" },
    include: {
      employee: { select: { id: true, name: true, email: true, department: { select: { id: true, name: true } } } },
      department: { select: { id: true, name: true } },
    },
  },
  maintenanceRequests: {
    orderBy: { raisedAt: "desc" },
    include: {
      raisedBy: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, name: true } },
    },
  },
  lifecycleRequests: {
    orderBy: { createdAt: "desc" },
    include: {
      requestedBy: { select: { id: true, name: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.AssetSelect;

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole(Object.values(UserRole));
  if (auth.response) return auth.response;

  const id = Number(params.id);

  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid asset id" }, { status: 400 });
  }

  const asset = await prisma.asset.findUnique({
    where: { id },
    select: detailSelect,
  });

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  // Scoping checks
  if (auth.user.role === UserRole.DEPARTMENT_HEAD) {
    const isDeptAsset =
      asset.currentHolderDepartment?.id === auth.user.departmentId ||
      (asset.currentHolder?.department && asset.currentHolder.department.id === auth.user.departmentId);
    if (!isDeptAsset) {
      return NextResponse.json({ error: "Access Denied: You do not have access to assets outside your department.", code: "FORBIDDEN" }, { status: 403 });
    }
  } else if (auth.user.role === UserRole.EMPLOYEE) {
    if (asset.currentHolder?.id !== auth.user.id) {
      return NextResponse.json({ error: "Access Denied: You can only view assets allocated to you.", code: "FORBIDDEN" }, { status: 403 });
    }
  }

  return NextResponse.json({ asset }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.ASSET_MANAGER]);
  if (auth.response) return auth.response;

  const id = Number(params.id);

  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid asset id" }, { status: 400 });
  }

  try {
    const parsed = updateAssetSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const asset = await prisma.asset.update({
      where: { id },
      data: parsed.data,
      select: detailSelect,
    });

    return NextResponse.json({ asset });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    console.error("Asset update failed", error);
    return NextResponse.json({ error: "Unable to update asset" }, { status: 500 });
  }
}
