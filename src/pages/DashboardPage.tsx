import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { getCategories, getSummary, getTransactions } from "../lib/api";
import type { Category, Summary, Transaction } from "../types";

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
});

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [chartData, setChartData] = useState<{ name: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const month = useMemo(() => format(new Date(), "yyyy-MM"), []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [cats] = await Promise.all([getCategories().catch(() => [])]);

        // Intentar endpoint de resumen
        const remoteSummary = await getSummary(month).catch(() => null);

        if (remoteSummary) {
          setSummary({
            ...remoteSummary,
            balance:
              remoteSummary.balance ??
              (remoteSummary.incomes || 0) - (remoteSummary.expenses || 0),
          });

          const byCat =
            remoteSummary.byCategory?.map((item) => ({
              name:
                cats.find((c) => `${c.id}` === `${item.categoryId}`)?.name ||
                item.category ||
                "Sin categoria",
              total: item.total,
            })) || [];
          setChartData(byCat);
          return;
        }

        // Fallback: agrupar transacciones del mes
        const transactions = await getTransactions({ month }).catch(() => []);
        const computed = buildSummaryFromTransactions(transactions, cats);
        setSummary(computed.summary);
        setChartData(computed.byCategory);
      } catch (err: any) {
        console.error(err);
        setError(err?.response?.data?.message || "No se pudo cargar el resumen");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [month]);

  const loadingContent = loading ? (
    <div style={{ marginTop: 12, color: "#9ca3af" }}>Cargando...</div>
  ) : null;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      <p style={{ color: "#9ca3af" }}>
        Bienvenido, <strong>{user?.name}</strong>.
      </p>

      {loadingContent}
      {error && (
        <div style={{ color: "#f97373", marginTop: 8 }}>
          {error} - intenta recargar la pagina.
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginTop: 16,
        }}
      >
        <Card title="Ingresos del mes" value={currency.format(summary?.incomes || 0)} />
        <Card title="Gastos del mes" value={currency.format(summary?.expenses || 0)} />
        <Card title="Balance" value={currency.format(summary?.balance || 0)} />
      </div>

      <div
        style={{
          marginTop: 24,
          background: "#020617",
          borderRadius: 16,
          border: "1px solid #1f2937",
          padding: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h3 style={{ margin: 0 }}>Gastos por categoria ({month})</h3>
          {loading && <span style={{ color: "#9ca3af", fontSize: 13 }}>Cargando...</span>}
        </div>
        {chartData.length === 0 && !loading ? (
          <div style={{ color: "#9ca3af", marginTop: 8 }}>
            No hay datos de gastos en este mes.
          </div>
        ) : (
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: "#0b1225", border: "1px solid #1f2937" }}
                  formatter={(value: number) => currency.format(value)}
                />
                <Bar dataKey="total" fill="#22c55e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

const buildSummaryFromTransactions = (transactions: Transaction[], cats: Category[]) => {
  const expenses = transactions
    .filter((t) => (t.kind || t.type) === "expense")
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const incomes = transactions
    .filter((t) => (t.kind || t.type) === "income")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const byCategoryMap: Record<string, number> = {};
  transactions
    .filter((t) => (t.kind || t.type) === "expense")
    .forEach((t) => {
      const key = `${t.category_id || t.category?.id || "sin"}`;
      byCategoryMap[key] = (byCategoryMap[key] || 0) + (t.amount || 0);
    });

  const byCategory = Object.entries(byCategoryMap).map(([key, total]) => {
    const cat = cats.find((c) => `${c.id}` === key);
    return { name: cat?.name || "Sin categoria", total };
  });

  return {
    summary: {
      incomes,
      expenses,
      balance: incomes - expenses,
      byCategory: byCategory.map((item) => ({
        category: item.name,
        total: item.total,
      })),
    },
    byCategory,
  };
};

const Card: React.FC<{ title: string; value: string }> = ({ title, value }) => (
  <div
    style={{
      background: "#020617",
      borderRadius: 16,
      padding: 16,
      border: "1px solid #1f2937",
      boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
    }}
  >
    <div style={{ fontSize: 13, color: "#9ca3af" }}>{title}</div>
    <div style={{ fontSize: 22, marginTop: 6 }}>{value}</div>
  </div>
);

export default DashboardPage;
