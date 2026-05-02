import { NextRequest, NextResponse } from "next/server";
import { categorizeTransaction } from "@/lib/categories";
import { parseStatement } from "@/lib/parsers";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 400 });
  }

  const parsed = await parseStatement(file);
  const prepared = await Promise.all(
    parsed.map(async (transaction) => ({
      userId,
      amount: transaction.amount,
      type: transaction.type,
      categoryId: await categorizeTransaction(transaction.description, transaction.type, userId),
      description: transaction.description,
      date: transaction.date
    }))
  );

  if (!prepared.length) {
    return NextResponse.json({ inserted: 0, transactions: [] });
  }

  await prisma.transaction.createMany({ data: prepared });
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: prepared.length
  });

  return NextResponse.json({
    inserted: prepared.length,
    transactions: transactions.map((transaction) => ({
      ...transaction,
      amount: Number(transaction.amount)
    }))
  });
}
