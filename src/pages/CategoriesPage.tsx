// src/pages/CategoriesPage.tsx
import React, { useEffect, useState } from "react";
import { createCategory, getCategories } from "../lib/api";
import type { Category } from "../types";

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<Category["type"]>("expense");

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCategories();
      setCategories(res);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Error al cargar categorias");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Agrega un nombre de categoria");
      return;
    }

    setError(null);
    setCreating(true);
    try {
      await createCategory({ name: name.trim(), type });
      setName("");
      setType("expense");
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "No se pudo crear la categoria");
    } finally {
      setCreating(false);
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            background: "#020617",
            borderRadius: 14,
            border: "1px solid #1f2937",
            padding: 14,
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 16 }}>Nueva categoria</h3>
          <form
            onSubmit={handleCreate}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            <label style={{ fontSize: 13, color: "#9ca3af" }}>
              Nombre
              <input
                style={inputStyle}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Comida"
              />
            </label>
            <label style={{ fontSize: 13, color: "#9ca3af" }}>
              Tipo
              <select
                style={inputStyle}
                value={type}
                onChange={(e) => setType(e.target.value as Category["type"])}
              >
                <option value="income">Ingreso</option>
                <option value="expense">Gasto</option>
              </select>
            </label>
            <button
              type="submit"
              disabled={creating}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                background: "#22c55e",
                color: "#022c22",
                fontWeight: 700,
              }}
            >
              {creating ? "Guardando..." : "Crear categoria"}
            </button>
          </form>
        </div>

        <div>
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
      </div>

    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 4,
  padding: "9px 10px",
  borderRadius: 10,
  border: "1px solid #1f2937",
  background: "#0b1225",
  color: "#e5e7eb",
};

export default CategoriesPage;
