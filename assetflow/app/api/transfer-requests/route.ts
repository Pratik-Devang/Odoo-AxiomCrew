import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { TransferService } from "@/lib/services/transfer-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireRole(Object.values(UserRole));
  if (auth.response) return auth.response;

  try {
    const where: any = {
      status: "REQUESTED",
    };

    if (auth.user.role === UserRole.DEPARTMENT_HEAD) {
      if (auth.user.departmentId === null) {
        return NextResponse.json({ transferRequests: [] }, { headers: { "Cache-Control": "no-store, max-age=0" } });
      }
      where.OR = [
        { asset: { currentHolderDepartmentId: auth.user.departmentId } },
        { asset: { currentHolder: { departmentId: auth.user.departmentId } } },
        { fromEmployee: { departmentId: auth.user.departmentId } },
        { toEmployee: { departmentId: auth.user.departmentId } },
      ];
    } else if (auth.user.role === UserRole.EMPLOYEE) {
      where.OR = [
        { fromEmployeeId: auth.user.id },
        { toEmployeeId: auth.user.id },
      ];
    }

    const transferRequests = await prisma.transferRequest.findMany({
      where,
      include: {
        asset: {
          select: {
            id: true,
            tag: true,
            name: true,
            currentHolderDepartmentId: true,
          },
        },
        fromEmployee: {
          select: {
            id: true,
            name: true,
            department: { select: { name: true } },
          },
        },
        toEmployee: {
          select: {
            id: true,
            name: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: {
        requestedAt: "desc",
      },
    });

    return NextResponse.json({ transferRequests }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Failed to fetch transfer requests:", error);
    return NextResponse.json({ error: "Failed to fetch transfer requests", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireRole(Object.values(UserRole));
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const { assetId, toEmployeeId, reason } = body;

    if (!assetId || !toEmployeeId || !reason) {
      return NextResponse.json(
        { error: "assetId, toEmployeeId, and reason are required", code: "VALIDATION_FAILED" },
        { status: 400 }
      );
    }

    const result = await TransferService.submitTransferRequest(auth.user.id, {
      assetId: Number(assetId),
      toEmployeeId: Number(toEmployeeId),
      reason: String(reason),
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.status }
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request body", code: "VALIDATION_FAILED" }, { status: 400 });
    }
    console.error("Transfer request submission failed:", error);
    return NextResponse.json({ error: "Failed to submit transfer request", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
