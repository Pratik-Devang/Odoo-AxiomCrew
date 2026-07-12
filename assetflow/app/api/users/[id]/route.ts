import { Prisma, RecordStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";

const assignableRoleSchema = z.enum(["EMPLOYEE", "DEPARTMENT_HEAD", "ASSET_MANAGER"]);
const updateSchema = z
  .object({
    role: assignableRoleSchema.optional(),
    departmentId: z.number().int().positive().nullable().optional(),
    status: z.nativeEnum(RecordStatus).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, "No changes supplied");

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole([UserRole.ADMIN]);
  if (auth.response) return auth.response;
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid user id" }, { status: 400 });

  try {
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      const requestedRole = parsed.error.issues.find((issue) => issue.path[0] === "role");
      return NextResponse.json(
        { error: requestedRole ? "ADMIN is not an assignable role" : parsed.error.issues[0]?.message },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (existing.role === UserRole.ADMIN && parsed.data.role) {
      return NextResponse.json({ error: "Seeded administrator roles cannot be changed" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") return NextResponse.json({ error: "User not found" }, { status: 404 });
      if (error.code === "P2003") return NextResponse.json({ error: "Selected department does not exist" }, { status: 400 });
    }
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    console.error("User update failed", error);
    return NextResponse.json({ error: "Unable to update user" }, { status: 500 });
  }
}
