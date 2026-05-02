"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Category, Transaction } from "@/types/finance";

type Props = {
  categories: Category[];
  transaction?: Transaction | null;
  onSaved: () => void;
};

export function TransactionForm({ categories, transaction, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    description: "",
    categoryId: ""
  });

  useEffect(() => {
    if (transaction) {
      setForm({
        type: transaction.type,
        amount: String(transaction.amount),
        date: transaction.date.slice(0, 10),
        description: transaction.description,
        categoryId: transaction.categoryId
      });
    }
  }, [transaction]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const payload = {
      ...form,
      id: transaction?.id,
      amount: Number(form.amount),
      categoryId: form.categoryId || undefined
    };

    await fetch("/api/transactions", {
      method: transaction ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setLoading(false);
    if (!transaction) {
      setForm((current) => ({ ...current, amount: "", description: "" }));
    }
    onSaved();
  }

  return (
    <form className="grid gap-3 md:grid-cols-[140px_160px_160px_1fr_180px_auto]" onSubmit={handleSubmit}>
      <Select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
        <option value="expense">Despesa</option>
        <option value="income">Receita</option>
      </Select>
      <Input
        min="0.01"
        step="0.01"
        type="number"
        placeholder="Valor"
        value={form.amount}
        onChange={(event) => setForm({ ...form, amount: event.target.value })}
        required
      />
      <Input
        type="date"
        value={form.date}
        onChange={(event) => setForm({ ...form, date: event.target.value })}
        required
      />
      <Input
        placeholder="Descrição"
        value={form.description}
        onChange={(event) => setForm({ ...form, description: event.target.value })}
        required
      />
      <Select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
        <option value="">Auto</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>
      <Button disabled={loading} type="submit">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar
      </Button>
    </form>
  );
}
