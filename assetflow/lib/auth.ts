import "server-only";

import type { UserRole } from "@prisma/client";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE } from "@/lib/auth-constants";
import { prisma } from "@/lib/prisma";

export type SessionPayload = JwtPayload & {
  userId: number;
  role: UserRole;
  departmentId: number | null;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
}

export function createSessionToken(payload: Omit<SessionPayload, keyof JwtPayload>) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: AUTH_COOKIE_MAX_AGE });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const payload = jwt.verify(token, getJwtSecret());

    if (
      typeof payload === "string" ||
      typeof payload.userId !== "number" ||
      typeof payload.role !== "string" ||
      !(payload.departmentId === null || typeof payload.departmentId === "number")
    ) {
      return null;
    }

    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: AUTH_COOKIE_MAX_AGE,
};

export function getSession() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function getCurrentUser() {
  const session = getSession();

  if (!session) {
    return null;
  }

  return prisma.user.findFirst({
    where: { id: session.userId, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
      department: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}
