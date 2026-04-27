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

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

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

  const data = parsed.data;
  const transaction = await prisma.transaction.create({
    data: {
      userId: session.user.id,
      kind: data.kind,
      category: data.category,
      occurredAt: toOccurredAt(data.date, data.time),
      name: data.name,
      description: data.description || null,
      amount: parseAmount(data.amount),
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

  return NextResponse.json(transaction, { status: 201 });
}
