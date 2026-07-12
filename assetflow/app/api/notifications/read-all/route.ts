import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  await prisma.notification.updateMany({
    where: {
      OR: [{ userId: user.id }, { userId: null }],
      isRead: false,
    },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
