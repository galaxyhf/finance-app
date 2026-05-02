import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { categorizeTransaction, ensureDefaultCategories, saveLearningRule } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/supabase/server";

const createSchema = z.object({
  amount: z.coerce.number().positive(),
  type: z.enum(["income", "expense"]),
  categoryId: z.string().uuid().optional(),
  description: z.string().min(2),
  date: z.coerce.date()
});

const updateSchema = createSchema.partial().extend({
  id: z.string().uuid()
});

function serializeTransaction(transaction: Awaited<ReturnType<typeof prisma.transaction.findMany>>[number]) {
  return {
    ...transaction,
    amount: Number(transaction.amount)
  };
}

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  await ensureDefaultCategories();
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") ?? undefined;
  const month = searchParams.get("month") ?? undefined;
  const year = searchParams.get("year") ?? undefined;
  const sort = searchParams.get("sort") === "amount" ? "amount" : "date";
  const page = Math.max(Number(searchParams.get("page") ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize") ?? 25), 5), 100);

  const startDate =
    month && year ? new Date(Number(year), Number(month) - 1, 1) : year ? new Date(Number(year), 0, 1) : undefined;
  const endDate =
    month && year ? new Date(Number(year), Number(month), 1) : year ? new Date(Number(year) + 1, 0, 1) : undefined;

  const where = {
    userId,
    ...(search ? { description: { contains: search, mode: "insensitive" as const } } : {}),
    ...(startDate && endDate ? { date: { gte: startDate, lt: endDate } } : {})
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { [sort]: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.transaction.count({ where })
  ]);

  return NextResponse.json({
    transactions: transactions.map(serializeTransaction),
    total,
    page,
    pageSize
  });
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const payload = createSchema.parse(await request.json());
  const categoryId = payload.categoryId ?? (await categorizeTransaction(payload.description, payload.type, userId));
  const transaction = await prisma.transaction.create({
    data: {
      userId,
      amount: payload.amount,
      type: payload.type,
      categoryId,
      description: payload.description,
      date: payload.date
    },
    include: { category: true }
  });

  return NextResponse.json({ transaction: serializeTransaction(transaction) }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const payload = updateSchema.parse(await request.json());
  const previous = await prisma.transaction.findFirst({ where: { id: payload.id, userId } });
  if (!previous) {
    return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
  }

  const transaction = await prisma.transaction.update({
    where: { id: payload.id },
    data: {
      amount: payload.amount,
      type: payload.type,
      categoryId: payload.categoryId,
      description: payload.description,
      date: payload.date
    },
    include: { category: true }
  });

  if (payload.categoryId && payload.categoryId !== previous.categoryId) {
    await saveLearningRule(userId, transaction.description, payload.categoryId);
  }

  return NextResponse.json({ transaction: serializeTransaction(transaction) });
}

export async function DELETE(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Informe o id" }, { status: 400 });
  }

  await prisma.transaction.deleteMany({ where: { id, userId } });
  return NextResponse.json({ ok: true });
}
