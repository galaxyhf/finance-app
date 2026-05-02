import { NextResponse } from "next/server";
import { ensureDefaultCategories } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/supabase/server";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  await ensureDefaultCategories();
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" }
  });

  return NextResponse.json({ categories });
}
