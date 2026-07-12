import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const id = Number(params.id);

  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid notification id" }, { status: 400 });
  }

  const notification = await prisma.notification.findFirst({
    where: {
      id,
      OR: [{ userId: user.id }, { userId: null }],
    },
  });

  if (!notification) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  return NextResponse.json({ notification: updated });
}
