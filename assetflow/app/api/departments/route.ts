import { Prisma, RecordStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";

const authenticatedRoles = Object.values(UserRole);

const departmentSchema = z.object({
  name: z.string().trim().min(2).max(100),
  headId: z.number().int().positive().nullable().optional(),
  parentDepartmentId: z.number().int().positive().nullable().optional(),
  status: z.nativeEnum(RecordStatus).default(RecordStatus.ACTIVE),
});

const departmentSelect = {
  id: true,
  name: true,
  headId: true,
  parentDepartmentId: true,
  status: true,
  head: { select: { id: true, name: true, email: true } },
  parentDepartment: { select: { id: true, name: true } },
} satisfies Prisma.DepartmentSelect;

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireRole(authenticatedRoles);
  if (auth.response) return auth.response;

  const departments = await prisma.department.findMany({
    select: departmentSelect,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    { departments },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}

export async function POST(request: Request) {
  const auth = await requireRole([UserRole.ADMIN]);
  if (auth.response) return auth.response;

  try {
    const parsed = departmentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const department = await prisma.department.create({
      data: parsed.data,
      select: departmentSelect,
    });
    return NextResponse.json({ department }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json({ error: "A department with this name already exists" }, { status: 400 });
      }
      if (error.code === "P2003") {
        return NextResponse.json({ error: "Selected head or parent department does not exist" }, { status: 400 });
      }
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    console.error("Department creation failed", error);
    return NextResponse.json({ error: "Unable to create department" }, { status: 500 });
  }
}
