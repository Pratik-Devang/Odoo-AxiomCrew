import { Prisma, RecordStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";

const updateSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    status: z.nativeEnum(RecordStatus).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "No changes supplied");

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole([UserRole.ADMIN]);
  if (auth.response) return auth.response;
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
  try {
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    const category = await prisma.assetCategory.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ category });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") return NextResponse.json({ error: "Category not found" }, { status: 404 });
      if (error.code === "P2002") return NextResponse.json({ error: "A category with this name already exists" }, { status: 400 });
    }
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    console.error("Category update failed", error);
    return NextResponse.json({ error: "Unable to update category" }, { status: 500 });
  }
}
