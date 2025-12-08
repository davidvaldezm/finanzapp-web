// src/pages/CategoriesPage.tsx
import React, { useEffect, useState } from "react";
import api from "../api/client";
import { API_URL } from "../config";

type Category = {
  id: number;
  name: string;
  type: "income" | "expense";
  color?: string;
  icon?: string;
  is_default?: number;
};

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Category[]>(`${API_URL}/categories`);
      setCategories(res.data);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Error al cargar categorias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Categorias</h1>
      <p style={{ color: "#9ca3af", fontSize: 14 }}>
        Lista de categorias (incluye globales y las tuyas).
      </p>

      <button
        onClick={fetchCategories}
        style={{
          padding: "6px 10px",
          borderRadius: 999,
          border: "none",
          background: "#0ea5e9",
          color: "#0b1120",
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: 12,
        }}
      >
        Recargar
      </button>

      {loading && <div>Cargando...</div>}
      {error && <div style={{ color: "#f97373" }}>{error}</div>}

      <div style={{ marginTop: 8 }}>
        {categories.length === 0 && !loading && (
          <div style={{ color: "#9ca3af" }}>Sin categorias todavia.</div>
        )}
        {categories.map((cat) => (
          <div
            key={cat.id}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #1f2937",
              background: "#020617",
              marginBottom: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <strong>{cat.name}</strong>{" "}
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 999,
                  border: "1px solid",
                  borderColor: cat.type === "income" ? "#4ade80" : "#f97373",
                  color: cat.type === "income" ? "#4ade80" : "#f97373",
                  marginLeft: 6,
                }}
              >
                {cat.type === "income" ? "Ingreso" : "Gasto"}
              </span>
              {cat.is_default ? (
                <span
                  style={{
                    fontSize: 10,
                    marginLeft: 6,
                    color: "#9ca3af",
                  }}
                >
                  - default
                </span>
              ) : null}
            </div>
            {cat.color && (
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 999,
                  background: cat.color,
                  border: "1px solid #1f2937",
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoriesPage;
