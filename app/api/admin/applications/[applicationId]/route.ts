import { SlotApplicationStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ensureAdminApiAccess } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

type ApplicationUpdateInput = {
  status?: unknown;
};

const statusOptions = Object.values(SlotApplicationStatus);

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isSlotApplicationStatus(value: string): value is SlotApplicationStatus {
  return statusOptions.includes(value as SlotApplicationStatus);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ applicationId: string }> }
) {
  const authorization = await ensureAdminApiAccess(request);
  if (!authorization.ok) {
    return authorization.response;
  }

  let body: ApplicationUpdateInput;
  try {
    body = (await request.json()) as ApplicationUpdateInput;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const statusValue = normalizeText(body.status);
  if (!isSlotApplicationStatus(statusValue)) {
    return NextResponse.json({ error: "状態が不正です。" }, { status: 400 });
  }

  const { applicationId } = await context.params;

  const existingApplication = await prisma.submissionSlot.findUnique({
    where: {
      id: applicationId
    },
    select: {
      id: true
    }
  });

  if (!existingApplication) {
    return NextResponse.json({ error: "応募が見つかりません。" }, { status: 404 });
  }

  const application = await prisma.submissionSlot.update({
    where: {
      id: applicationId
    },
    data: {
      status: statusValue
    },
    select: {
      id: true,
      status: true
    }
  });

  return NextResponse.json({ application });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ applicationId: string }> }
) {
  const authorization = await ensureAdminApiAccess(request);
  if (!authorization.ok) {
    return authorization.response;
  }

  const { applicationId } = await context.params;

  const existingApplication = await prisma.submissionSlot.findUnique({
    where: {
      id: applicationId
    },
    select: {
      id: true
    }
  });

  if (!existingApplication) {
    return NextResponse.json({ error: "応募が見つかりません。" }, { status: 404 });
  }

  await prisma.submissionSlot.delete({
    where: {
      id: applicationId
    }
  });

  return NextResponse.json({ applicationId });
}
