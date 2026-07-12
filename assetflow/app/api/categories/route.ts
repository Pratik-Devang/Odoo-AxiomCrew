import { Prisma, RecordStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";

const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  status: z.nativeEnum(RecordStatus).default(RecordStatus.ACTIVE),
});

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireRole(Object.values(UserRole));
  if (auth.response) return auth.response;
  const categories = await prisma.assetCategory.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ categories }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}

export async function POST(request: Request) {
  const auth = await requireRole([UserRole.ADMIN]);
  if (auth.response) return auth.response;
  try {
    const parsed = categorySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    const category = await prisma.assetCategory.create({ data: parsed.data });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "A category with this name already exists" }, { status: 400 });
    }
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    console.error("Category creation failed", error);
    return NextResponse.json({ error: "Unable to create category" }, { status: 500 });
  }
}
