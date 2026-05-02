import { parseCsv } from "@/lib/parsers/csv";
import { parseOfx } from "@/lib/parsers/ofx";
import { parseXlsx } from "@/lib/parsers/xlsx";
import type { ParsedTransaction } from "@/lib/parsers/types";

export async function parseStatement(file: File): Promise<ParsedTransaction[]> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    return parseCsv(buffer);
  }

  if (extension === "xlsx" || extension === "xls") {
    return parseXlsx(buffer);
  }

  if (extension === "ofx") {
    return parseOfx(buffer);
  }

  throw new Error("Formato não suportado. Envie CSV, XLSX ou OFX.");
}
