// src/pages/DashboardPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getSummary, getCategories, getTransactions } from "../lib/api";
import type { Category, Transaction } from "../types";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type SummaryState = {
  income: number;
  expense: number;
  balance: number;
};

type CategoryTotals = {
  categoryId: number | null;
  name: string;
  total: number;
  color?: string;
};

const COLORS = [
  "#22c55e",
  "#6366f1",
  "#f97316",
  "#ec4899",
  "#14b8a6",
  "#eab308",
  "#a855f7",
  "#3b82f6",
];

const getCurrentMonth = () => new Date().toISOString().slice(0, 7); // YYYY-MM

export default function DashboardPage() {
  const { user } = useAuth();
  const [month, setMonth] = useState<string>(getCurrentMonth());
  const [summary, setSummary] = useState<SummaryState>({
    income: 0,
    expense: 0,
    balance: 0,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos cuando cambie el mes
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, catsRes, txRes] = await Promise.all([
          getSummary(month),
          getCategories(),
          getTransactions({ month, kind: "all" }),
        ]);

        const income = Number(summaryRes.incomes || 0);
        const expense = Number(summaryRes.expenses || 0);
        const balance =
          summaryRes.balance !== undefined
            ? Number(summaryRes.balance)
            : income - expense;

        setSummary({ income, expense, balance });
        setCategories(catsRes);
        setTransactions(txRes);
      } catch (err) {
        console.error(err);
        setError("Error al cargar los datos del dashboard");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [month]);

  // Datos para gráfica de barras (Ingresos vs Gastos)
  const barData = useMemo(
    () => [
      { name: "Ingresos", monto: summary.income },
      { name: "Gastos", monto: summary.expense },
    ],
    [summary.income, summary.expense]
  );

  // Agrupar gastos por categoría para el pie chart
  const expensesByCategory = useMemo<CategoryTotals[]>(() => {
    const map = new Map<number | null, number>();

    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        // soporta categoryId o category_id
        const catIdRaw: any = (t as any).categoryId ?? (t as any).category_id;
        const catId =
          catIdRaw === undefined || catIdRaw === null
            ? null
            : Number(catIdRaw);

        const prev = map.get(catId) ?? 0;
        map.set(catId, prev + Number(t.amount));
      });

    const items: CategoryTotals[] = Array.from(map.entries()).map(
      ([categoryId, total]) => {
        const cat =
          categoryId === null
            ? undefined
            : categories.find((c) => c.id === categoryId);
        return {
          categoryId,
          name: cat?.name ?? "Sin categoría",
          total,
          color: (cat as any)?.color,
        };
      }
    );

    // quitar categorías con total 0
    return items.filter((i) => i.total > 0);
  }, [transactions, categories]);

  return (
    <div className="px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Bienvenido,{" "}
            <span className="font-semibold text-slate-100">
              {user?.name ?? user?.email ?? "usuario"}
            </span>
            .
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-1">
          <label className="text-sm text-slate-400">Mes</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-slate-800 text-slate-100 rounded-md px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-200 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <p className="text-sm text-slate-400">Ingresos del mes</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-400">
            ${summary.income.toFixed(2)}
          </p>
        </div>

        <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <p className="text-sm text-slate-400">Gastos del mes</p>
          <p className="mt-2 text-2xl font-semibold text-rose-400">
            ${summary.expense.toFixed(2)}
          </p>
        </div>

        <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <p className="text-sm text-slate-400">Balance</p>
          <p
            className={`mt-2 text-2xl font-semibold ${
              summary.balance >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            ${summary.balance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Barra Ingresos vs Gastos */}
        <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            Ingresos vs gastos ({month})
          </h2>
          {loading ? (
            <p className="text-slate-400 text-sm">Cargando...</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      border: "1px solid #1e293b",
                    }}
                    formatter={(value: any) =>
                      `$${Number(value).toFixed(2)}`
                    }
                  />
                  <Bar
                    dataKey="monto"
                    radius={[8, 8, 0, 0]}
                    fill="#22c55e"
                    // color para gastos
                    label={{ position: "top", fill: "#e5e7eb" }}
                  >
                    {barData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={index === 0 ? "#22c55e" : "#f97373"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Pie gastos por categoría */}
        <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            Gastos por categoría ({month})
          </h2>

          {loading ? (
            <p className="text-slate-400 text-sm">Cargando...</p>
          ) : expensesByCategory.length === 0 ? (
            <p className="text-slate-400 text-sm">
              No hay datos de gastos en este mes.
            </p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    dataKey="total"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.categoryId}-${index}`}
                        fill={entry.color || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      border: "1px solid #1e293b",
                    }}
                    formatter={(value: any, _name, item: any) => [
                      `$${Number(value).toFixed(2)}`,
                      item?.payload?.name,
                    ]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{ color: "#e5e7eb", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
