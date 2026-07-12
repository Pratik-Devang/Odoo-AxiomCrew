import { AssetStatus, Prisma, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";

const authenticatedRoles = Object.values(UserRole);

const createAssetSchema = z.object({
  name: z.string().trim().min(2).max(160),
  categoryId: z.coerce.number().int().positive(),
  serialNumber: z.string().trim().min(1).max(120),
  acquisitionDate: z.coerce.date(),
  acquisitionCost: z.coerce.number().nonnegative(),
  condition: z.string().trim().min(2).max(80),
  location: z.string().trim().min(2).max(160),
  isBookable: z.boolean().default(false),
});

const assetSelect = {
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
  currentHolderDepartmentId: true,
  category: { select: { id: true, name: true } },
  currentHolder: { select: { id: true, name: true, department: { select: { id: true, name: true } } } },
  currentHolderDepartment: { select: { id: true, name: true } },
} satisfies Prisma.AssetSelect;

export const dynamic = "force-dynamic";

function nextAssetTag(existingTags: string[]) {
  const max = existingTags.reduce((highest, tag) => {
    const match = /^AF-(\d+)$/.exec(tag);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);

  return `AF-${String(max + 1).padStart(4, "0")}`;
}

export async function GET(request: Request) {
  const auth = await requireRole(authenticatedRoles);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const categoryId = searchParams.get("categoryId");
  const status = searchParams.get("status");
  const departmentId = searchParams.get("departmentId");

  const where: Prisma.AssetWhereInput = {};
  const andFilters: Prisma.AssetWhereInput[] = [];

  if (search) {
    andFilters.push({
      OR: [
        { tag: { contains: search, mode: "insensitive" } },
        { serialNumber: { contains: search, mode: "insensitive" } },
        // QR codes are not modeled yet; for this screen, the asset tag doubles as the QR lookup token.
        { tag: { equals: search, mode: "insensitive" } },
      ],
    });
  }

  if (categoryId && categoryId !== "all") {
    where.categoryId = Number(categoryId);
  }

  if (status && status !== "all" && Object.values(AssetStatus).includes(status as AssetStatus)) {
    where.status = status as AssetStatus;
  }

  if (departmentId && departmentId !== "all") {
    const parsedDepartmentId = Number(departmentId);
    andFilters.push({
      OR: [{ currentHolderDepartmentId: parsedDepartmentId }, { currentHolder: { departmentId: parsedDepartmentId } }],
    });
  }

  if (andFilters.length > 0) {
    where.AND = andFilters;
  }

  const assets = await prisma.asset.findMany({
    where,
    select: assetSelect,
    orderBy: { tag: "asc" },
  });

  return NextResponse.json({ assets }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}

export async function POST(request: Request) {
  const auth = await requireRole([UserRole.ADMIN, UserRole.ASSET_MANAGER]);
  if (auth.response) return auth.response;

  try {
    const parsed = createAssetSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const existingTags = await prisma.asset.findMany({ select: { tag: true } });
    const asset = await prisma.asset.create({
      data: {
        ...parsed.data,
        tag: nextAssetTag(existingTags.map((item) => item.tag)),
        acquisitionCost: new Prisma.Decimal(parsed.data.acquisitionCost),
        status: AssetStatus.AVAILABLE,
      },
      select: assetSelect,
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json({ error: "Selected category does not exist" }, { status: 400 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    console.error("Asset creation failed", error);
    return NextResponse.json({ error: "Unable to create asset" }, { status: 500 });
  }
}
