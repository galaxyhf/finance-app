"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit2, Plus, Search, Trash2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { UploadZone } from "@/components/transactions/upload-zone";
import { money } from "@/lib/utils";
import type { Category, Transaction } from "@/types/finance";

export function FinanceDashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [sort, setSort] = useState("date");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadCategories = useCallback(async () => {
    const response = await fetch("/api/categories");
    if (response.ok) {
      const payload = await response.json();
      setCategories(payload.categories);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    const params = new URLSearchParams({ search, month, year, sort, page: String(page), pageSize: "25" });
    const response = await fetch(`/api/transactions?${params.toString()}`);
    if (response.ok) {
      const payload = await response.json();
      setTransactions(payload.transactions);
      setTotal(payload.total);
    }
  }, [month, page, search, sort, year]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  const summary = useMemo(() => {
    const income = transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
    const expense = transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const byCategory = useMemo(() => {
    const grouped = new Map<string, { name: string; value: number; color: string }>();
    transactions
      .filter((item) => item.type === "expense")
      .forEach((item) => {
        const current = grouped.get(item.categoryId) ?? {
          name: item.category.name,
          value: 0,
          color: item.category.color
        };
        current.value += item.amount;
        grouped.set(item.categoryId, current);
      });
    return Array.from(grouped.values());
  }, [transactions]);

  const balanceEvolution = useMemo(() => {
    let running = 0;
    return [...transactions]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((item) => {
        running += item.type === "income" ? item.amount : -item.amount;
        return { date: new Date(item.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), saldo: running };
      });
  }, [transactions]);

  async function removeTransaction(id: string) {
    await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
    await loadTransactions();
  }

  function saved() {
    setEditing(null);
    setShowForm(false);
    void loadTransactions();
  }

  return (
    <main className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">Controle financeiro</h1>
            <p className="mt-1 text-sm text-muted-foreground">Transações, extratos e categorias em um fluxo único.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 md:flex">
            <Select value={month} onChange={(event) => setMonth(event.target.value)}>
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index + 1} value={String(index + 1).padStart(2, "0")}>
                  {new Date(2024, index).toLocaleDateString("pt-BR", { month: "long" })}
                </option>
              ))}
            </Select>
            <Input className="w-full md:w-28" value={year} onChange={(event) => setYear(event.target.value)} />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Receitas</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-emerald-600">{money(summary.income)}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Despesas</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-rose-600">{money(summary.expense)}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Saldo atual</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{money(summary.balance)}</CardContent>
          </Card>
        </section>

        {(showForm || editing) && (
          <Card>
            <CardHeader>
              <CardTitle>{editing ? "Editar transação" : "Nova transação"}</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionForm categories={categories} transaction={editing} onSaved={saved} />
            </CardContent>
          </Card>
        )}

        <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle>Gastos por categoria</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie dataKey="value" data={byCategory} outerRadius={96} label={({ name }) => name}>
                    {byCategory.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => money(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Importar extrato</CardTitle>
            </CardHeader>
            <CardContent>
              <UploadZone onUploaded={loadTransactions} />
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Evolução do saldo</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              {balanceEvolution.length > 8 ? (
                <LineChart data={balanceEvolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => money(value)} />
                  <Line type="monotone" dataKey="saldo" stroke="#0f766e" strokeWidth={2} dot={false} />
                </LineChart>
              ) : (
                <BarChart data={balanceEvolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => money(value)} />
                  <Bar dataKey="saldo" fill="#0f766e" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Transações</CardTitle>
            <div className="grid gap-2 md:grid-cols-[260px_140px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Buscar descrição" value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
              <Select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="date">Data</option>
                <option value="amount">Valor</option>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-3">Data</th>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Tipo</th>
                    <th className="text-right">Valor</th>
                    <th className="w-24 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b last:border-0">
                      <td className="py-3">{new Date(transaction.date).toLocaleDateString("pt-BR")}</td>
                      <td className="font-medium">{transaction.description}</td>
                      <td>
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: transaction.category.color }} />
                          {transaction.category.name}
                        </span>
                      </td>
                      <td>{transaction.type === "income" ? "Receita" : "Despesa"}</td>
                      <td className="text-right font-semibold">{money(transaction.amount)}</td>
                      <td className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => setEditing(transaction)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => void removeTransaction(transaction.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>{total} registros</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>
                  Anterior
                </Button>
                <Button size="sm" variant="outline" disabled={page * 25 >= total} onClick={() => setPage((current) => current + 1)}>
                  Próxima
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button
        aria-label="Adicionar transação"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        size="icon"
        onClick={() => {
          setEditing(null);
          setShowForm(true);
        }}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </main>
  );
}
