import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  parseAmount,
  toOccurredAt,
  transactionInputSchema,
} from "@/lib/validation/transaction";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const json = await request.json();
    const parsed = transactionInputSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid transaction",
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ message: "Transaction not found" }, { status: 404 });
    }

    const data = parsed.data;
    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        kind: data.kind,
        category: data.category,
        occurredAt: toOccurredAt(data.date, data.time),
        name: data.name,
        description: data.description || null,
        amount: parseAmount(data.amount),
        paymentMethod: data.paymentMethod,
        isInstallment: data.isInstallment,
        installmentNoExpiry: data.isInstallment ? (data.installmentNoExpiry ?? false) : false,
        installmentMonths: data.isInstallment ? data.installmentMonths : null,
        installmentInterestPercent: data.isInstallment ? data.installmentInterestPercent : null,
      },
    });

    revalidateTag("transactions", "max");
    revalidatePath("/dashboard");
    revalidatePath("/reports/daily");
    revalidatePath("/reports/monthly");

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ message: "Failed to update transaction." }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ message: "Transaction not found" }, { status: 404 });
    }

    await prisma.transaction.delete({
      where: { id },
    });

    revalidateTag("transactions", "max");
    revalidatePath("/dashboard");
    revalidatePath("/reports/daily");
    revalidatePath("/reports/monthly");

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Failed to delete transaction." }, { status: 500 });
  }
}
