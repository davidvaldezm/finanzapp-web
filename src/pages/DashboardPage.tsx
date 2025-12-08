// src/pages/DashboardPage.tsx
import React from "react";
import { useAuth } from "../context/AuthContext";

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      <p style={{ color: "#9ca3af" }}>
        Bienvenido, <strong>{user?.name}</strong>.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginTop: 16,
        }}
      >
        <Card title="Ingresos del mes" value="$0.00" />
        <Card title="Gastos del mes" value="$0.00" />
        <Card title="Balance" value="$0.00" />
      </div>

      <p style={{ marginTop: 24, fontSize: 14, color: "#9ca3af" }}>
        Próximo paso: conectar estos datos con endpoints de resumen de transacciones.
      </p>
    </div>
  );
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
