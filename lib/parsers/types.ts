export type ParsedTransaction = {
  date: Date;
  description: string;
  amount: number;
  type: "income" | "expense";
};

export function normalizeParsedTransaction(input: {
  date: string | number | Date;
  description: unknown;
  amount: unknown;
}): ParsedTransaction | null {
  const amountNumber = Number(String(input.amount).replace(/\./g, "").replace(",", "."));
  const date =
    input.date instanceof Date ? input.date : typeof input.date === "number" ? new Date(Math.round((input.date - 25569) * 86400 * 1000)) : new Date(input.date);
  const description = String(input.description ?? "").trim();

  if (!description || Number.isNaN(amountNumber) || Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    date,
    description,
    amount: Math.abs(amountNumber),
    type: amountNumber >= 0 ? "income" : "expense"
  };
}
