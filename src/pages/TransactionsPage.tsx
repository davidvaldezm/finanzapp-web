import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createTransaction,
  deleteTransaction,
  getCategories,
  getTransactions,
  uploadFile,
  type TransactionsQuery,
  type TransactionPayload,
} from "../lib/api";
import type { Category, Transaction } from "../types";

const currencyFormatter = (value: number) =>
  value.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const today = new Date().toISOString().slice(0, 10);

const getLastMonths = (count = 12) => {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return d.toISOString().slice(0, 7);
  });
};

type FormState = {
  kind: Transaction["kind"];
  amount: string;
  date: string;
  categoryId: string;
  description: string;
  fileId: string | number | null;
  fileName: string;
};

export default function TransactionsPage() {
  const monthOptions = useMemo(() => getLastMonths(12), []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState<TransactionsQuery>({
    month: monthOptions[0],
    categoryId: undefined,
    kind: "all",
  });

  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const [errorTransactions, setErrorTransactions] = useState<string | null>(null);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    kind: "expense",
    amount: "",
    date: today,
    categoryId: "",
    description: "",
    fileId: null,
    fileName: "",
  });

  const loadCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    setErrorTransactions(null);
    try {
      const res = await getCategories();
      setCategories(res);
    } catch (err: any) {
      console.error(err);
      setErrorTransactions(err?.response?.data?.message || "Error al cargar categorias");
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  const loadTransactions = useCallback(
    async (query: TransactionsQuery) => {
      setIsLoadingTransactions(true);
      setErrorTransactions(null);
      try {
        const res = await getTransactions(query);
        setTransactions(res);
      } catch (err: any) {
        console.error(err);
        setErrorTransactions(err?.response?.data?.message || "Error al cargar transacciones");
      } finally {
        setIsLoadingTransactions(false);
      }
    },
    []
  );

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadTransactions(filters);
  }, [filters, loadTransactions]);

  const totals = useMemo(() => {
    const incomes = transactions
      .filter((t) => (t.kind || t.type) === "income")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const expenses = transactions
      .filter((t) => (t.kind || t.type) === "expense")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    return { incomes, expenses, balance: incomes - expenses };
  }, [transactions]);

  const filteredCategories = useMemo(
    () =>
      categories.filter((c) =>
        form.kind === "income" ? c.type === "income" : c.type === "expense"
      ),
    [categories, form.kind]
  );

  const handleDelete = async (id: number | string) => {
    const confirmed = window.confirm("Eliminar esta transaccion?");
    if (!confirmed) return;
    try {
      await deleteTransaction(id);
      setFilters((prev) => ({ ...prev }));
    } catch (err: any) {
      console.error(err);
      setErrorTransactions(err?.response?.data?.message || "No se pudo eliminar la transaccion");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setForm((prev) => ({ ...prev, fileId: null, fileName: "" }));
      return;
    }
    setIsUploadingFile(true);
    setErrorForm(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploaded = await uploadFile(formData);
      setForm((prev) => ({
        ...prev,
        fileId: uploaded?.id ?? null,
        fileName: file.name,
      }));
    } catch (err: any) {
      console.error(err);
      setErrorForm(err?.response?.data?.message || "No se pudo subir el archivo");
      setForm((prev) => ({ ...prev, fileId: null, fileName: "" }));
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorForm(null);

    if (!form.amount || Number(form.amount) <= 0) {
      setErrorForm("Ingresa un monto valido");
      return;
    }
    if (!form.date) {
      setErrorForm("Selecciona una fecha");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: TransactionPayload = {
        kind: form.kind,
        amount: Number(form.amount),
        date: form.date,
        category_id: form.categoryId ? Number(form.categoryId) : undefined,
        description: form.description.trim() || undefined,
        file_id: form.fileId ?? null,
      };

      await createTransaction(payload);

      setForm((prev) => ({
        ...prev,
        amount: "",
        date: prev.date,
        categoryId: "",
        description: "",
        fileId: null,
        fileName: "",
      }));
      setFilters((prev) => ({ ...prev }));
    } catch (err: any) {
      console.error(err);
      setErrorForm(err?.response?.data?.message || "No se pudo guardar la transaccion");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const getCategoryName = (tx: Transaction) =>
    (tx as any).category_name ||
    tx.category?.name ||
    categories.find((c) => c.id === tx.category_id)?.name ||
    "Sin categoria";

  return (
    <div className="px-8 py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-4xl font-bold text-slate-100">Transacciones</h1>
          <p className="text-slate-400 mt-1">Filtra, revisa y crea tus movimientos.</p>
        </div>
        <div className="flex gap-3 text-sm text-slate-300">
          <div className="bg-slate-900/70 border border-slate-800 px-3 py-2 rounded-lg">
            <span className="text-slate-400">Ingresos:</span>{" "}
            <span className="text-emerald-400 font-semibold">
              {currencyFormatter(totals.incomes)}
            </span>
          </div>
          <div className="bg-slate-900/70 border border-slate-800 px-3 py-2 rounded-lg">
            <span className="text-slate-400">Gastos:</span>{" "}
            <span className="text-rose-400 font-semibold">
              {currencyFormatter(totals.expenses)}
            </span>
          </div>
          <div className="bg-slate-900/70 border border-slate-800 px-3 py-2 rounded-lg">
            <span className="text-slate-400">Balance:</span>{" "}
            <span
              className={`font-semibold ${
                totals.balance >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {currencyFormatter(totals.balance)}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
          <div className="flex flex-col">
            <label className="text-sm text-slate-400 mb-1">Mes</label>
            <select
              className="bg-slate-800 text-slate-100 rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={filters.month ?? ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  month: e.target.value || undefined,
                }))
              }
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-slate-400 mb-1">Categoria</label>
            <select
              className="bg-slate-800 text-slate-100 rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={filters.categoryId ? String(filters.categoryId) : ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  categoryId: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
            >
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-slate-400 mb-1">Tipo</label>
            <select
              className="bg-slate-800 text-slate-100 rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={filters.kind || "all"}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, kind: e.target.value as TransactionsQuery["kind"] }))
              }
            >
              <option value="all">Todos</option>
              <option value="income">Ingresos</option>
              <option value="expense">Gastos</option>
            </select>
          </div>
        </div>

        {isLoadingCategories && (
          <p className="text-sm text-slate-400">Cargando categorias...</p>
        )}
        {errorTransactions && (
          <div className="bg-rose-500/10 border border-rose-500 text-rose-200 px-4 py-2 rounded-lg text-sm">
            {errorTransactions}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <p className="text-sm text-slate-400">Ingresos del mes</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-400">
            {currencyFormatter(totals.incomes)}
          </p>
        </div>
        <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <p className="text-sm text-slate-400">Gastos del mes</p>
          <p className="mt-2 text-2xl font-semibold text-rose-400">
            {currencyFormatter(totals.expenses)}
          </p>
        </div>
        <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <p className="text-sm text-slate-400">Balance del mes</p>
          <p
            className={`mt-2 text-2xl font-semibold ${
              totals.balance >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {currencyFormatter(totals.balance)}
          </p>
        </div>
      </div>

      <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Lista de transacciones</h2>
        </div>

        {isLoadingTransactions ? (
          <p className="text-center text-slate-400 py-10">Cargando transacciones...</p>
        ) : transactions.length === 0 ? (
          <p className="text-center text-slate-400 py-10">
            No hay transacciones para el filtro seleccionado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-slate-200">
              <thead>
                <tr className="text-left text-slate-400 text-xs uppercase tracking-wide">
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Descripcion</th>
                  <th className="py-2 pr-3">Categoria</th>
                  <th className="py-2 pr-3">Tipo</th>
                  <th className="py-2 pr-3">Monto</th>
                  <th className="py-2 pr-3">Adjunto</th>
                  <th className="py-2 pr-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const kind = tx.kind || tx.type || "expense";
                  return (
                    <tr key={tx.id} className="border-t border-slate-800">
                      <td className="py-3 pr-3">{formatDate(tx.date)}</td>
                      <td className="py-3 pr-3">{tx.description || "-"}</td>
                      <td className="py-3 pr-3">{getCategoryName(tx)}</td>
                      <td className="py-3 pr-3">
                        <span
                          className={`px-3 py-1 rounded-full border text-xs ${
                            kind === "income"
                              ? "text-emerald-400 border-emerald-500/50 bg-emerald-500/5"
                              : "text-rose-400 border-rose-500/50 bg-rose-500/5"
                          }`}
                        >
                          {kind === "income" ? "Ingreso" : "Gasto"}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className={kind === "income" ? "text-emerald-300" : "text-rose-300"}>
                          {currencyFormatter(Number(tx.amount || 0))}
                        </span>
                      </td>
                      <td className="py-3 pr-3">{tx.file_id || tx.file ? "Adjunto" : "-"}</td>
                      <td className="py-3 pr-3">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="px-3 py-1 rounded-lg bg-rose-600 text-rose-50 text-xs font-semibold hover:bg-rose-500 transition"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
        <h2 className="text-lg font-semibold text-slate-100 mb-3">Agregar transaccion</h2>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="flex flex-col">
            <label className="text-sm text-slate-400 mb-1">Tipo</label>
            <select
              className="bg-slate-800 text-slate-100 rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={form.kind}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, kind: e.target.value as Transaction["kind"] }))
              }
            >
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-slate-400 mb-1">Monto</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              className="bg-slate-800 text-slate-100 rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-slate-400 mb-1">Fecha</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              className="bg-slate-800 text-slate-100 rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-slate-400 mb-1">Categoria</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
              className="bg-slate-800 text-slate-100 rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Sin categoria</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col md:col-span-2">
            <label className="text-sm text-slate-400 mb-1">Descripcion / nota</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="bg-slate-800 text-slate-100 rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]"
              placeholder="Opcional"
            />
          </div>

          <div className="flex flex-col md:col-span-2">
            <label className="text-sm text-slate-400 mb-1">Archivo (png/jpg/pdf)</label>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              onChange={handleFileChange}
              className="bg-slate-800 text-slate-100 rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={isUploadingFile}
            />
            {form.fileName && (
              <p className="text-xs text-slate-400 mt-1">Archivo listo: {form.fileName}</p>
            )}
            {isUploadingFile && (
              <p className="text-xs text-slate-400 mt-1">Subiendo archivo...</p>
            )}
          </div>

          <div className="md:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting || isUploadingFile}
              className="px-4 py-2 rounded-lg bg-emerald-500 text-emerald-950 font-semibold hover:bg-emerald-400 transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Guardando..." : "Guardar transaccion"}
            </button>
            {errorForm && (
              <span className="text-sm text-rose-300">{errorForm}</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
