import { parse as parseOfxDocument } from "ofx-js";
import { normalizeParsedTransaction, type ParsedTransaction } from "@/lib/parsers/types";

type OfxTransaction = {
  DTPOSTED?: string;
  TRNAMT?: string | number;
  MEMO?: string;
  NAME?: string;
};

function findTransactions(node: unknown): OfxTransaction[] {
  if (!node || typeof node !== "object") {
    return [];
  }

  if (Array.isArray(node)) {
    return node.flatMap(findTransactions);
  }

  const record = node as Record<string, unknown>;
  const current = record.STMTTRN;
  const nested = Object.values(record).flatMap(findTransactions);

  return current ? [...(Array.isArray(current) ? (current as OfxTransaction[]) : [current as OfxTransaction]), ...nested] : nested;
}

function parseOfxDate(value?: string) {
  if (!value) {
    return "";
  }

  const compact = value.slice(0, 8);
  return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
}

export function parseOfx(buffer: Buffer): ParsedTransaction[] {
  const document = parseOfxDocument(buffer.toString("utf8"));
  return findTransactions(document)
    .map((transaction) =>
      normalizeParsedTransaction({
        date: parseOfxDate(transaction.DTPOSTED),
        description: transaction.MEMO ?? transaction.NAME,
        amount: transaction.TRNAMT
      })
    )
    .filter((row): row is ParsedTransaction => Boolean(row));
}
