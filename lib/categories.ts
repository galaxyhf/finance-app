import { prisma } from "@/lib/prisma";
import { normalizeKeyword } from "@/lib/utils";

export const defaultCategories = [
  { name: "Alimentação", color: "#16a34a", icon: "utensils" },
  { name: "Transporte", color: "#0284c7", icon: "car" },
  { name: "Moradia", color: "#7c3aed", icon: "home" },
  { name: "Lazer", color: "#db2777", icon: "party-popper" },
  { name: "Assinaturas", color: "#f59e0b", icon: "badge-check" },
  { name: "Saúde", color: "#dc2626", icon: "heart-pulse" },
  { name: "Educação", color: "#2563eb", icon: "graduation-cap" },
  { name: "Outros", color: "#64748b", icon: "circle-dot" },
  { name: "Receita", color: "#059669", icon: "wallet" }
] as const;

const staticKeywords: Record<string, string[]> = {
  Alimentação: ["IFOOD", "RESTAURANTE", "PADARIA", "MERCADO", "SUPERMERCADO", "LANCHONETE"],
  Transporte: ["UBER", "99", "METRO", "TAXI", "POSTO", "GASOLINA", "ESTACIONAMENTO"],
  Assinaturas: ["NETFLIX", "SPOTIFY", "AMAZON PRIME", "DISNEY", "GOOGLE", "APPLE"],
  Moradia: ["ALUGUEL", "CONDOMINIO", "ENERGIA", "LUZ", "AGUA", "INTERNET"],
  Saúde: ["FARMACIA", "DROGARIA", "HOSPITAL", "CLINICA", "MEDICO"],
  Educação: ["ESCOLA", "FACULDADE", "CURSO", "LIVRARIA"],
  Lazer: ["CINEMA", "TEATRO", "BAR", "VIAGEM", "HOTEL"],
  Receita: ["SALARIO", "PIX RECEBIDO", "RENDIMENTO", "TRANSFERENCIA RECEBIDA"]
};

export async function ensureDefaultCategories() {
  const categories = await Promise.all(
    defaultCategories.map((category) =>
      prisma.category.upsert({
        where: { name: category.name },
        update: category,
        create: category
      })
    )
  );

  return categories;
}

export async function categorizeTransaction(description: string, type: "income" | "expense", userId: string) {
  const normalizedDescription = normalizeKeyword(description);
  const [categories, rules] = await Promise.all([
    ensureDefaultCategories(),
    prisma.learningRule.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { keyword: "desc" }
    })
  ]);

  const learnedRule = rules.find((rule) => normalizedDescription.includes(normalizeKeyword(rule.keyword)));
  if (learnedRule) {
    return learnedRule.categoryId;
  }

  const categoryName =
    type === "income"
      ? "Receita"
      : Object.entries(staticKeywords).find(([, keywords]) =>
          keywords.some((keyword) => normalizedDescription.includes(keyword))
        )?.[0] ?? "Outros";

  return categories.find((category) => category.name === categoryName)?.id ?? categories[0].id;
}

export async function saveLearningRule(userId: string, description: string, categoryId: string) {
  const words = normalizeKeyword(description).split(" ").filter((word) => word.length > 2);
  const keyword = words.slice(0, 3).join(" ");

  if (!keyword) {
    return null;
  }

  return prisma.learningRule.upsert({
    where: { userId_keyword: { userId, keyword } },
    update: { categoryId },
    create: { userId, keyword, categoryId }
  });
}
