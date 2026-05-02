import * as XLSX from "xlsx";
import { normalizeParsedTransaction, type ParsedTransaction } from "@/lib/parsers/types";

export function parseXlsx(buffer: Buffer): ParsedTransaction[] {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  return rows
    .map((row) => {
      const normalizedKeys = Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""), value])
      );

      return normalizeParsedTransaction({
        date: (normalizedKeys.data ?? normalizedKeys.date ?? normalizedKeys.lancamento) as string | number | Date,
        description: normalizedKeys.descricao ?? normalizedKeys.description ?? normalizedKeys.historico ?? normalizedKeys.memo,
        amount: normalizedKeys.valor ?? normalizedKeys.amount ?? normalizedKeys.value
      });
    })
    .filter((row): row is ParsedTransaction => Boolean(row));
}
