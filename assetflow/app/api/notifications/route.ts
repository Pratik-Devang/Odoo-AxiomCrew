import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: {
      OR: [{ userId: user.id }, { userId: null }],
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ notifications });
}
