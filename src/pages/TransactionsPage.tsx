import React, { useEffect, useMemo, useState } from "react";
import { format, subMonths } from "date-fns";
import {
  createTransaction,
  deleteTransaction,
  getCategories,
  getTransactions,
  uploadFile,
} from "../lib/api";
import type { TransactionsQuery } from "../lib/api";
import type { Category, Transaction } from "../types";

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const today = format(new Date(), "yyyy-MM-dd");

type FormState = {
  kind: Transaction["kind"];
  amount: string;
  date: string;
  categoryId: string;
  description: string;
  file?: File | null;
};

const TransactionsPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [filters, setFilters] = useState<TransactionsQuery>({
    month: format(new Date(), "yyyy-MM"),
    kind: "all",
    categoryId: undefined,
  });

  const [form, setForm] = useState<FormState>({
    kind: "expense",
    amount: "",
    date: today,
    categoryId: "",
    description: "",
    file: null,
  });

  const monthOptions = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => {
      const d = subMonths(new Date(), i);
      return format(d, "yyyy-MM");
    });
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getCategories();
        setCategories(res);
      } catch (err: any) {
        console.error(err);
        setError(err?.response?.data?.message || "No se pudieron cargar las categorias");
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getTransactions(filters);
        setTransactions(res);
      } catch (err: any) {
        console.error(err);
        setError(err?.response?.data?.message || "No se pudieron cargar transacciones");
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [filters]);

  const totals = useMemo(() => {
    const incomes = transactions
      .filter((t) => (t.kind || t.type) === "income")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const expenses = transactions
      .filter((t) => (t.kind || t.type) === "expense")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    return { incomes, expenses };
  }, [transactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.amount || !form.date || !form.kind) {
      setError("Faltan datos obligatorios");
      return;
    }

    let file_id: string | number | null | undefined = null;
    try {
      if (form.file) {
        const fd = new FormData();
        fd.append("file", form.file);
        const uploaded = await uploadFile(fd);
        file_id = uploaded?.id || (uploaded as any)?.file_id || null;
      }

      await createTransaction({
        kind: form.kind,
        amount: Number(form.amount),
        date: form.date,
        category_id: form.categoryId ? Number(form.categoryId) : undefined,
        description: form.description || undefined,
        file_id: file_id || undefined,
      });

      setSuccess("Transaccion guardada");
      setForm({
        kind: "expense",
        amount: "",
        date: today,
        categoryId: "",
        description: "",
        file: null,
      });
      setFilters((prev) => ({ ...prev })); // trigger reload
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "No se pudo guardar la transaccion");
    }
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm("?Eliminar esta transaccion?");
    if (!confirmDelete) return;
    try {
      await deleteTransaction(id);
      setFilters((prev) => ({ ...prev })); // reload list
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "No se pudo eliminar");
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 4 }}>Transacciones</h1>
          <p style={{ color: "#9ca3af", margin: 0 }}>Gestiona ingresos y egresos.</p>
        </div>
        <div style={{ textAlign: "right", fontSize: 14, color: "#9ca3af" }}>
          <div>
            <strong>Ingresos:</strong> {currency.format(totals.incomes)}
          </div>
          <div>
            <strong>Gastos:</strong> {currency.format(totals.expenses)}
          </div>
        </div>
      </div>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        <div
          style={{
            background: "#020617",
            borderRadius: 14,
            border: "1px solid #1f2937",
            padding: 14,
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <Select
              label="Mes"
              value={filters.month ?? ""}
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  month: value || undefined,
                }))
              }
              options={monthOptions.map((m) => ({ label: m, value: m }))}
            />
            <Select
              label="Categoria"
              value={filters.categoryId ? String(filters.categoryId) : ""}
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  categoryId: value ? Number(value) : undefined,
                }))
              }
              options={[
                { label: "Todas", value: "" },
                ...categories.map((c) => ({ label: c.name, value: String(c.id) })),
              ]}
            />
            <Select
              label="Tipo"
              value={filters.kind || "all"}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, kind: value as TransactionsQuery["kind"] }))
              }
              options={[
                { label: "Todos", value: "all" },
                { label: "Ingresos", value: "income" },
                { label: "Gastos", value: "expense" },
              ]}
            />
          </div>

          {loading && <div style={{ color: "#9ca3af" }}>Cargando...</div>}
          {error && <div style={{ color: "#f97373" }}>{error}</div>}
          {success && <div style={{ color: "#22c55e" }}>{success}</div>}

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
              <thead>
                <tr style={{ textAlign: "left", color: "#9ca3af", fontSize: 13 }}>
                  <th style={thStyle}>Fecha</th>
                  <th style={thStyle}>Descripcion</th>
                  <th style={thStyle}>Categoria</th>
                  <th style={thStyle}>Tipo</th>
                  <th style={thStyle}>Monto</th>
                  <th style={thStyle}>Adjunto</th>
                  <th style={thStyle}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={7} style={{ color: "#9ca3af", padding: 12 }}>
                      No hay transacciones para el filtro seleccionado.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const categoryName =
                      tx.category?.name ||
                      categories.find((c) => c.id === tx.category_id)?.name ||
                      "Sin categoria";
                    const txKind = tx.kind || tx.type || "expense";
                    return (
                      <tr key={tx.id} style={{ borderBottom: "1px solid #1f2937" }}>
                        <td style={tdStyle}>{tx.date?.slice(0, 10)}</td>
                        <td style={tdStyle}>{tx.description || "-"}</td>
                        <td style={tdStyle}>{categoryName}</td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: 12,
                              border: "1px solid",
                              borderColor: txKind === "income" ? "#4ade80" : "#f97373",
                              color: txKind === "income" ? "#4ade80" : "#f97373",
                              fontSize: 12,
                            }}
                          >
                            {txKind === "income" ? "Ingreso" : "Gasto"}
                          </span>
                        </td>
                        <td style={tdStyle}>{currency.format(tx.amount || 0)}</td>
                        <td style={tdStyle}>
                          {tx.file_id || tx.file ? "Adjunto" : "-"}
                        </td>
                        <td style={tdStyle}>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 10,
                              border: "none",
                              background: "#ef4444",
                              color: "#fee2e2",
                              cursor: "pointer",
                            }}
                          >
                            Borrar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div
          style={{
            background: "#020617",
            borderRadius: 14,
            border: "1px solid #1f2937",
            padding: 14,
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Agregar transaccion</h3>
          <form
            onSubmit={handleSubmit}
            style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}
          >
            <label style={labelStyle}>
              Tipo
              <select
                style={inputStyle}
                value={form.kind}
                onChange={(e) => setForm((prev) => ({ ...prev, kind: e.target.value as Transaction["kind"] }))}
              >
                <option value="income">Ingreso</option>
                <option value="expense">Gasto</option>
              </select>
            </label>
            <label style={labelStyle}>
              Monto
              <input
                style={inputStyle}
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                required
              />
            </label>
            <label style={labelStyle}>
              Fecha
              <input
                style={inputStyle}
                type="date"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                required
              />
            </label>
            <label style={labelStyle}>
              Categoria
              <select
                style={inputStyle}
                value={form.categoryId}
                onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
              >
                <option value="">Sin categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
              Descripcion / nota
              <textarea
                style={{ ...inputStyle, minHeight: 60 }}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Opcional"
              />
            </label>
            <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
              Archivo (png/jpg/pdf)
              <input
                style={inputStyle}
                type="file"
                accept=".png,.jpg,.jpeg,.pdf"
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))
                }
              />
            </label>
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
              <button
                type="submit"
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "none",
                  background: "#22c55e",
                  color: "#022c22",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Guardar
              </button>
              {success && <span style={{ color: "#22c55e" }}>{success}</span>}
            </div>
          </form>
          {error && <div style={{ color: "#f97373", marginTop: 8 }}>{error}</div>}
        </div>
      </section>
    </div>
  );
};

const thStyle: React.CSSProperties = { padding: "8px 6px", borderBottom: "1px solid #1f2937" };
const tdStyle: React.CSSProperties = { padding: "10px 6px", fontSize: 14 };
const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 4,
  padding: "9px 10px",
  borderRadius: 10,
  border: "1px solid #1f2937",
  background: "#0b1225",
  color: "#e5e7eb",
};
const labelStyle: React.CSSProperties = { display: "flex", flexDirection: "column", color: "#9ca3af" };

type SelectOption = { label: string; value: string };
const Select: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
}> = ({ label, value, onChange, options }) => (
  <label style={{ display: "flex", flexDirection: "column", color: "#9ca3af" }}>
    {label}
    <select
      style={{
        ...inputStyle,
        minWidth: 150,
      }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value + opt.label} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </label>
);

export default TransactionsPage;
