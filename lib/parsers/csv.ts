import { parse } from "csv-parse/sync";
import { normalizeParsedTransaction, type ParsedTransaction } from "@/lib/parsers/types";

const candidateColumns = {
  date: ["data", "date", "dt", "lançamento", "lancamento"],
  description: ["descrição", "descricao", "description", "histórico", "historico", "memo", "name"],
  amount: ["valor", "amount", "value", "quantia"]
};

function findColumn(headers: string[], candidates: string[]) {
  return headers.find((header) => candidates.includes(header.toLowerCase().trim()));
}

export function parseCsv(buffer: Buffer): ParsedTransaction[] {
  const content = buffer.toString("utf8");
  const delimiters = [",", ";", "\t", "|"];
  const delimiter = delimiters
    .map((candidate) => ({ candidate, count: (content.split("\n")[0].match(new RegExp(`\\${candidate}`, "g")) ?? []).length }))
    .sort((a, b) => b.count - a.count)[0].candidate;

  const rows = parse(content, {
    columns: true,
    delimiter,
    bom: true,
    skip_empty_lines: true,
    trim: true
  }) as Record<string, string>[];

  if (!rows.length) {
    return [];
  }

  const headers = Object.keys(rows[0]);
  const dateColumn = findColumn(headers, candidateColumns.date);
  const descriptionColumn = findColumn(headers, candidateColumns.description);
  const amountColumn = findColumn(headers, candidateColumns.amount);

  if (!dateColumn || !descriptionColumn || !amountColumn) {
    throw new Error("Não foi possível identificar colunas de data, descrição e valor no CSV.");
  }

  return rows
    .map((row) =>
      normalizeParsedTransaction({
        date: row[dateColumn],
        description: row[descriptionColumn],
        amount: row[amountColumn]
      })
    )
    .filter((row): row is ParsedTransaction => Boolean(row));
}
